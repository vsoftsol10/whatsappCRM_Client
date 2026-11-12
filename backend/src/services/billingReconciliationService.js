const Razorpay = require("razorpay");

const prisma = require("../config/prisma");
const { handlePaid } = require("../controllers/billingWebhookController");

// ======================================================
// BILLING RECONCILIATION
//
// Makes sure every plan payment matches a subscription.
// Runs from jobs/billingReconcileScheduler.js (and can be called by hand).
//
//  1) MISSED PAYMENTS (Razorpay -> our DB)  [FIXED]
//     A payment captured in Razorpay that we have no Payment row for
//     (browser closed AND webhook missed). The plan is activated using
//     the same logic as the webhook.
//
//  2) PAYMENT <-> SUBSCRIPTION (our DB)
//     - PAID payment not linked to a subscription ........ [FIXED]
//     - ACTIVE subscription still PENDING/FAILED although
//       its newest payment is PAID ........................ [FIXED]
//     - payment points to a missing subscription ......... [REPORTED]
//     - company plan / expiry differs from the subscription [REPORTED]
//     - payment refunded in Razorpay but still PAID here .. [REPORTED]
//
// "Reported" = a notification to the Super Admin (once per 24 hours per
// issue). Nothing is changed automatically for those.
//
// Separate from the customer Razorpay / Stripe integrations.
// ======================================================

const LOOKBACK_HOURS =
  Number(process.env.BILLING_RECONCILE_LOOKBACK_HOURS) || 72;

// Payments newer than this are left alone: the browser callback or the
// webhook is probably still processing them.
const GRACE_MINUTES = 10;

// DB checks look at payments made in the last N days
const DB_CHECK_DAYS = 7;

const REPORT_AGAIN_AFTER_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 100;
const MAX_PAGES = 20; // 2000 payments per run is more than enough

// In-memory, so the same problem is not reported every run.
// (Resets when the server restarts - at worst one repeat notification.)
const reported = new Map();
const unresolved = new Map();

const recently = (map, key) => {
  const at = map.get(key);
  return at && Date.now() - at < REPORT_AGAIN_AFTER_MS;
};

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) return null;

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// Same rule as billingController
const findCurrentSubscription = async (companyId) => {
  const active = await prisma.subscription.findFirst({
    where: { companyId, status: { in: ["ACTIVE", "TRIAL"] } },
    orderBy: { expiryDate: "desc" },
  });

  if (active) return active;

  return prisma.subscription.findFirst({
    where: { companyId },
    orderBy: { expiryDate: "desc" },
  });
};

// Notify the Super Admin once per issue (never throws)
const report = async (key, title, message, stats) => {
  if (recently(reported, key)) return;
  reported.set(key, Date.now());

  stats.flagged += 1;
  console.warn(`BILLING RECONCILE FLAG: ${title} - ${message}`);

  try {
    const superAdmin = await prisma.superAdmin.findFirst({
      select: { id: true },
    });

    if (!superAdmin) return;

    await prisma.notification.create({
      data: { superAdminId: superAdmin.id, title, message },
    });
  } catch (error) {
    console.error("BILLING RECONCILE NOTIFY ERROR:", error.message);
  }
};

// ------------------------------------------------------
// 1) Razorpay -> DB
// ------------------------------------------------------
const reconcileWithRazorpay = async (stats) => {
  const razorpay = getRazorpay();

  if (!razorpay) {
    console.warn("BILLING RECONCILE: Razorpay keys missing, skipping gateway check.");
    return;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const from = nowSec - LOOKBACK_HOURS * 3600;
  const to = nowSec - GRACE_MINUTES * 60;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await razorpay.payments.all({
      from,
      to,
      count: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    });

    const items = result?.items || [];

    for (const p of items) {
      if (!p?.id || !p.order_id) continue;

      try {
        const existing = await prisma.payment.findUnique({
          where: { razorpayPaymentId: p.id },
        });

        // Refunded in Razorpay but still PAID here -> report only
        if (
          existing &&
          existing.paymentStatus === "PAID" &&
          (p.status === "refunded" || Number(p.amount_refunded) > 0)
        ) {
          await report(
            `refund:${p.id}`,
            "Refunded payment needs review",
            `Razorpay payment ${p.id} (${existing.companyName}) was refunded in Razorpay but is still PAID here. Please check the subscription.`,
            stats
          );
          continue;
        }

        if (p.status !== "captured") continue;

        stats.checked += 1;

        if (existing) continue;
        if (recently(unresolved, p.id)) continue;

        // Captured in Razorpay, missing here: activate it
        await handlePaid(p, null, "reconciliation");

        const created = await prisma.payment.findUnique({
          where: { razorpayPaymentId: p.id },
          select: { id: true },
        });

        if (created) {
          stats.recovered += 1;
          console.log(`BILLING RECONCILE: recovered payment ${p.id}`);
        } else {
          // Not one of our plan orders, or already flagged for review by
          // handlePaid. Do not look at it again for 24 hours.
          unresolved.set(p.id, Date.now());
        }
      } catch (error) {
        // One bad payment must not stop the rest
        console.error(`BILLING RECONCILE: payment ${p.id} failed:`, error.message);
      }
    }

    if (items.length < PAGE_SIZE) break;
  }
};

// ------------------------------------------------------
// 2) Payment <-> Subscription (database only)
// ------------------------------------------------------
const reconcileDatabase = async (stats) => {
  const since = new Date(Date.now() - DB_CHECK_DAYS * 24 * 60 * 60 * 1000);

  const recent = await prisma.payment.findMany({
    where: {
      paymentStatus: "PAID",
      gateway: "RAZORPAY",
      companyId: { not: null },
      paidAt: { gte: since },
    },
    orderBy: { paidAt: "desc" },
    take: 500,
    include: {
      subscription: { include: { plan: true } },
      company: true,
    },
  });

  // Only the NEWEST paid payment of each company decides the current state
  const done = new Set();

  for (const payment of recent) {
    if (done.has(payment.companyId)) continue;
    done.add(payment.companyId);

    try {
      let subscription = payment.subscription;

      // PAID payment that is not linked to a subscription -> link it
      if (!payment.subscriptionId) {
        const current = await findCurrentSubscription(payment.companyId);

        if (!current) {
          await report(
            `nosub:${payment.id}`,
            "Payment has no subscription",
            `Payment ${payment.paymentId} (${payment.companyName}) is PAID but the company has no subscription.`,
            stats
          );
          continue;
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: { subscriptionId: current.id },
        });

        stats.linked += 1;
        console.log(
          `BILLING RECONCILE: linked payment ${payment.paymentId} to subscription ${current.id}`
        );

        subscription = await prisma.subscription.findUnique({
          where: { id: current.id },
          include: { plan: true },
        });
      }

      if (!subscription) {
        await report(
          `missingsub:${payment.id}`,
          "Payment points to a missing subscription",
          `Payment ${payment.paymentId} (${payment.companyName}) refers to a subscription that no longer exists.`,
          stats
        );
        continue;
      }

      // Newest payment is PAID but the active subscription says otherwise
      if (
        subscription.status === "ACTIVE" &&
        ["PENDING", "FAILED"].includes(subscription.paymentStatus)
      ) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { paymentStatus: "PAID" },
        });

        stats.fixed += 1;
        console.log(
          `BILLING RECONCILE: subscription ${subscription.id} marked PAID (payment ${payment.paymentId})`
        );
      }

      // Company record out of step with the subscription -> report only
      // (the Super Admin may have changed it on purpose)
      if (subscription.status === "ACTIVE" && payment.company) {
        const planMismatch =
          subscription.plan &&
          payment.company.plan !== subscription.plan.planName;

        const expiryMismatch =
          payment.company.expiryDate &&
          Math.abs(
            new Date(payment.company.expiryDate).getTime() -
              new Date(subscription.expiryDate).getTime()
          ) > 60 * 1000;

        if (planMismatch || expiryMismatch) {
          await report(
            `drift:${payment.companyId}:${subscription.id}`,
            "Company and subscription do not match",
            `${payment.companyName}: company plan/expiry (${payment.company.plan}, ${
              payment.company.expiryDate
                ? new Date(payment.company.expiryDate).toLocaleDateString("en-IN")
                : "none"
            }) differs from its subscription (${subscription.plan?.planName}, ${new Date(
              subscription.expiryDate
            ).toLocaleDateString("en-IN")}). Latest payment: ${payment.paymentId}.`,
            stats
          );
        }
      }
    } catch (error) {
      console.error(
        `BILLING RECONCILE: company ${payment.companyId} check failed:`,
        error.message
      );
    }
  }
};

// ------------------------------------------------------
// ENTRY POINT
// ------------------------------------------------------
const runBillingReconciliation = async () => {
  const stats = { checked: 0, recovered: 0, linked: 0, fixed: 0, flagged: 0 };

  try {
    await reconcileWithRazorpay(stats);
  } catch (error) {
    console.error("BILLING RECONCILE (gateway) ERROR:", error.message);
  }

  try {
    await reconcileDatabase(stats);
  } catch (error) {
    console.error("BILLING RECONCILE (database) ERROR:", error.message);
  }

  console.log(
    `BILLING RECONCILE done: checked ${stats.checked} Razorpay payments, recovered ${stats.recovered}, linked ${stats.linked}, fixed ${stats.fixed}, flagged ${stats.flagged}.`
  );

  return stats;
};

module.exports = { runBillingReconciliation };