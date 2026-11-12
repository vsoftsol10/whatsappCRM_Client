const crypto = require("crypto");
const Razorpay = require("razorpay");

const prisma = require("../config/prisma");
const { notifyUser, NotificationType } = require("../services/notificationService");

// ======================================================
// PLATFORM BILLING WEBHOOK (Razorpay -> our server)
//
// POST /api/billing/webhook
//
// This is for OUR plan payments only (our own Razorpay keys).
// It is completely separate from the customer Razorpay / Stripe
// integrations (integrationWebhookController + adapters).
//
// Events handled:
//   order.paid / payment.captured -> activate the plan (if the
//                                    browser did not already do it)
//   payment.failed                -> save a FAILED payment and alert
//                                    the company admins + super admin
// ======================================================

const ALLOWED_CYCLES = [1, 3, 6, 12];

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) return null;

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// Proves the request really came from Razorpay.
// Signature = HMAC-SHA256(rawBody, webhookSecret)
const isValidSignature = (req) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  if (!secret || !signature || !req.rawBody) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  const given = Buffer.from(String(signature));
  const wanted = Buffer.from(expected);

  return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
};

// Same rules as billingController (kept here so that file is untouched)
const findCurrentSubscription = async (client, companyId) => {
  const active = await client.subscription.findFirst({
    where: { companyId, status: { in: ["ACTIVE", "TRIAL"] } },
    orderBy: { expiryDate: "desc" },
  });

  if (active) return active;

  return client.subscription.findFirst({
    where: { companyId },
    orderBy: { expiryDate: "desc" },
  });
};

const calcDates = (subscription, plan, cycles = 1) => {
  const now = new Date();

  const isRenew = subscription.planId === plan.id;

  const stillRunning =
    isRenew &&
    subscription.status === "ACTIVE" &&
    new Date(subscription.expiryDate) > now;

  const startDate = stillRunning ? subscription.startDate : now;

  const expiryDate = new Date(stillRunning ? subscription.expiryDate : now);
  expiryDate.setDate(expiryDate.getDate() + plan.durationDays * cycles);

  return {
    type: isRenew ? "RENEW" : "SWITCH",
    startDate,
    expiryDate,
  };
};

// Order notes are written by createOrder: { companyId, planId, cycles, type }
// Returns null when the order is not one of our plan purchases.
const getOrderNotes = async (orderId, orderFromPayload) => {
  let order = orderFromPayload;

  if (!order || !order.notes) {
    const razorpay = getRazorpay();
    if (!razorpay || !orderId) return null;
    order = await razorpay.orders.fetch(orderId);
  }

  const notes = order?.notes || {};

  if (!notes.companyId || !notes.planId) return null;

  return { order, notes };
};

// Tell the Super Admin something needs a look (never throws)
const notifySuperAdmin = async (title, message) => {
  try {
    const superAdmin = await prisma.superAdmin.findFirst({
      select: { id: true },
    });

    if (!superAdmin) return;

    await prisma.notification.create({
      data: { superAdminId: superAdmin.id, title, message },
    });
  } catch (error) {
    console.error("BILLING WEBHOOK SUPERADMIN NOTIFY ERROR:", error.message);
  }
};

// ------------------------------------------------------
// PAID  (order.paid / payment.captured)
// ------------------------------------------------------
const handlePaid = async (payment, orderFromPayload) => {
  const paymentId = payment.id;
  const orderId = payment.order_id;

  if (!paymentId || !orderId) return;

  // Already processed by verify-payment (or an earlier webhook)?
  const existing = await prisma.payment.findUnique({
    where: { razorpayPaymentId: paymentId },
  });

  if (existing) return;

  const info = await getOrderNotes(orderId, orderFromPayload);

  // Not a plan purchase made through our checkout
  if (!info) return;

  const { order, notes } = info;

  const companyId = Number(notes.companyId);
  const planId = Number(notes.planId);
  const cycles = Number(notes.cycles || 1);

  if (!ALLOWED_CYCLES.includes(cycles) || !companyId || !planId) {
    console.error("BILLING WEBHOOK: bad order notes", notes);
    return;
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!plan || !company) {
    await notifySuperAdmin(
      "Payment needs review",
      `Razorpay payment ${paymentId} (order ${orderId}) was received but the plan or company no longer exists.`
    );
    return;
  }

  // Suspended by Super Admin: same rule as verify-payment
  if (company.status === "INACTIVE") {
    await notifySuperAdmin(
      "Payment needs review",
      `${company.companyName} (${company.companyId}) paid ₹${
        Number(payment.amount) / 100
      } (Payment ID: ${paymentId}) but the account is inactive, so the plan was not activated.`
    );
    return;
  }

  // Price always comes from the database (same as verify-payment)
  const amount = Number(plan.price) * cycles;
  const tax = 0;
  const totalAmount = amount;

  const paidPaise = Number(order?.amount ?? payment.amount);

  if (paidPaise !== Math.round(totalAmount * 100)) {
    await notifySuperAdmin(
      "Payment needs review",
      `${company.companyName} (${company.companyId}) paid ₹${
        paidPaise / 100
      } (Payment ID: ${paymentId}) but the ${plan.planName} plan x${cycles} costs ₹${totalAmount}. Plan was not activated.`
    );
    return;
  }

  // Everything in ONE transaction (same updates as verify-payment)
  const result = await prisma.$transaction(async (tx) => {
    const subscription = await findCurrentSubscription(tx, companyId);

    if (!subscription) {
      throw Object.assign(new Error("No subscription found."), {
        status: 404,
      });
    }

    const { type, startDate, expiryDate } = calcDates(
      subscription,
      plan,
      cycles
    );

    const updatedSubscription = await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: plan.id,
        startDate,
        expiryDate,
        status: "ACTIVE",
        paymentStatus: "PAID",
      },
    });

    await tx.company.update({
      where: { id: companyId },
      data: {
        plan: plan.planName,
        expiryDate,
        status: "ACTIVE",
      },
    });

    const created = await tx.payment.create({
      data: {
        paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        companyId,
        subscriptionId: updatedSubscription.id,
        planId: plan.id,
        companyName: company.companyName,
        ownerName: company.ownerName,
        email: company.email,
        phone: company.phone,
        amount,
        tax,
        discount: 0,
        totalAmount,
        paymentMethod: "RAZORPAY",
        paymentStatus: "PAID",
        gateway: "RAZORPAY",
        transactionId: paymentId,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: null, // signature only exists on the browser callback
        paidAt: new Date(),
      },
    });

    return { type, updatedSubscription, payment: created };
  });

  // Notifications (never block the webhook response)
  try {
    const admins = await prisma.user.findMany({
      where: { companyId, role: "ADMIN" },
      select: { id: true },
    });

    const title = result.type === "RENEW" ? "Plan Renewed" : "Plan Changed";
    const message = `Your ${plan.planName} plan is active until ${new Date(
      result.updatedSubscription.expiryDate
    ).toLocaleDateString("en-IN")}. Payment of ₹${totalAmount} received.`;

    for (const admin of admins) {
      try {
        await notifyUser({
          userId: admin.id,
          title,
          message,
          type: NotificationType.SUBSCRIPTION,
        });
      } catch (e) {
        console.error("BILLING WEBHOOK ADMIN NOTIFY ERROR:", e.message);
      }
    }

    await notifySuperAdmin(
      title,
      `${company.companyName} (${company.companyId}) ${
        result.type === "RENEW" ? "renewed" : "switched to"
      } the ${plan.planName} plan. Payment of ₹${totalAmount} received (confirmed by webhook). Payment ID: ${
        result.payment.paymentId
      }.`
    );
  } catch (notifyError) {
    console.error("BILLING WEBHOOK NOTIFICATION ERROR:", notifyError.message);
  }
};

// ------------------------------------------------------
// FAILED  (payment.failed)
// ------------------------------------------------------
const handleFailed = async (payment) => {
  const paymentId = payment.id;
  const orderId = payment.order_id;

  if (!paymentId || !orderId) return;

  // Razorpay retries webhooks - never alert twice for the same attempt
  const existing = await prisma.payment.findUnique({
    where: { razorpayPaymentId: paymentId },
  });

  if (existing) return;

  const info = await getOrderNotes(orderId, null);

  // Not a plan purchase made through our checkout
  if (!info) return;

  const { notes } = info;

  const companyId = Number(notes.companyId);
  const planId = Number(notes.planId);
  const cycles = Number(notes.cycles || 1);

  if (!companyId || !planId) return;

  // A late "failed" event for an order that was paid afterwards: ignore
  const paidForOrder = await prisma.payment.findFirst({
    where: { razorpayOrderId: orderId, paymentStatus: "PAID" },
    select: { id: true },
  });

  if (paidForOrder) return;

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!plan || !company) return;

  const totalAmount = Number(payment.amount || 0) / 100;
  const reason =
    payment.error_description ||
    payment.error_reason ||
    payment.error_code ||
    "Payment failed";

  // Save the failed attempt.
  // razorpayOrderId is intentionally left empty: it is UNIQUE and the
  // same order can be retried and later paid successfully.
  try {
    await prisma.payment.create({
      data: {
        paymentId: `FAIL-${paymentId}`,
        companyId,
        planId: plan.id,
        companyName: company.companyName,
        ownerName: company.ownerName,
        email: company.email,
        phone: company.phone,
        amount: totalAmount,
        tax: 0,
        discount: 0,
        totalAmount,
        paymentMethod: "RAZORPAY",
        paymentStatus: "FAILED",
        gateway: "RAZORPAY",
        transactionId: paymentId,
        razorpayPaymentId: paymentId,
      },
    });
  } catch (error) {
    // Duplicate delivery of the same event: already saved + alerted
    if (error.code === "P2002") return;
    throw error;
  }

  // Alert the company admins + super admin (never block the response)
  try {
    const admins = await prisma.user.findMany({
      where: { companyId, role: "ADMIN" },
      select: { id: true },
    });

    const message = `Your payment of ₹${totalAmount} for the ${plan.planName} plan${
      cycles > 1 ? ` (${cycles} periods)` : ""
    } failed: ${reason}. Your plan has not changed. Please try again or use a different payment method.`;

    for (const admin of admins) {
      try {
        await notifyUser({
          userId: admin.id,
          title: "Payment Failed",
          message,
          type: NotificationType.SUBSCRIPTION,
        });
      } catch (e) {
        console.error("BILLING WEBHOOK ADMIN NOTIFY ERROR:", e.message);
      }
    }

    await notifySuperAdmin(
      "Payment Failed",
      `${company.companyName} (${company.companyId}) payment of ₹${totalAmount} for the ${plan.planName} plan failed: ${reason}. Payment ID: ${paymentId}.`
    );
  } catch (notifyError) {
    console.error("BILLING WEBHOOK ALERT ERROR:", notifyError.message);
  }
};

// ------------------------------------------------------
// ENTRY POINT
// ------------------------------------------------------
const razorpayWebhook = async (req, res) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error("BILLING WEBHOOK: RAZORPAY_WEBHOOK_SECRET is not set");
    return res.status(503).json({ success: false });
  }

  if (!isValidSignature(req)) {
    return res.status(400).json({
      success: false,
      message: "Invalid webhook signature.",
    });
  }

  try {
    const event = req.body?.event;
    const payment = req.body?.payload?.payment?.entity;
    const order = req.body?.payload?.order?.entity;

    if (payment) {
      if (event === "order.paid" || event === "payment.captured") {
        await handlePaid(payment, order);
      } else if (event === "payment.failed") {
        await handleFailed(payment);
      }
    }

    // Every other event is acknowledged and ignored
    return res.status(200).json({ success: true });
  } catch (error) {
    // Two deliveries (or verify-payment + webhook) at the same moment:
    // the unique payment id already protected us, so it is a success
    if (error.code === "P2002") {
      return res.status(200).json({ success: true });
    }

    console.error("BILLING WEBHOOK ERROR:", error);

    // 5xx makes Razorpay retry later
    return res.status(500).json({ success: false });
  }
};

module.exports = { razorpayWebhook };