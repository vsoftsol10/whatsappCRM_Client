// ======================================================
// src/services/integrationLimitService.js
//
// Plan limits for integrations:
//   facebook  -> Facebook Pages
//   instagram -> Instagram accounts (linked to a Page OR connected directly)
//   website   -> Website integrations (Integration.provider = "WEBSITE")
//   app       -> App integrations (every other Integration provider)
//
// Limit values come from SubscriptionPlan (managed in Super Admin):
//   -1            = unlimited
//   0             = not included in the plan
//   N             = at most N
//   null/undefined = no limit configured -> not enforced
//
// Disconnected / deleted items free their slot.
// ======================================================
const prisma = require("../config/prisma");

const KINDS = {
  facebook: {
    field: "maxFacebookPages",
    singular: "Facebook Page",
    plural: "Facebook Pages",
    limitType: "facebook_pages",
  },
  instagram: {
    field: "maxInstagramAccounts",
    singular: "Instagram account",
    plural: "Instagram accounts",
    limitType: "instagram_accounts",
  },
  website: {
    field: "maxWebsiteIntegrations",
    singular: "website integration",
    plural: "website integrations",
    limitType: "website_integrations",
  },
  app: {
    field: "maxAppIntegrations",
    singular: "app integration",
    plural: "app integrations",
    limitType: "app_integrations",
  },
};

/**
 * Loads the company's active plan, its limits and current usage.
 * Returns { ok:false, message } when the company cannot add anything.
 */
const getIntegrationLimitContext = async (companyId) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      subscriptions: {
        where: { status: { in: ["ACTIVE", "TRIAL"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: true },
      },
    },
  });

  if (!company) {
    return { ok: false, message: "Company not found." };
  }

  if (company.status !== "ACTIVE") {
    return {
      ok: false,
      message: `Your company is ${String(company.status).toLowerCase()}. You cannot add new integrations.`,
    };
  }

  const subscription = company.subscriptions[0];

  if (!subscription || !subscription.plan) {
    return { ok: false, message: "No active subscription plan found." };
  }

  const plan = subscription.plan;

  const [facebook, instagram, website, app] = await Promise.all([
    prisma.facebookPage.count({
      where: {
        companyId,
        connectionType: "FACEBOOK_LOGIN",
        status: { not: "DISCONNECTED" },
      },
    }),
    prisma.facebookPage.count({
      where: {
        companyId,
        instagramAccountId: { not: null },
        status: { not: "DISCONNECTED" },
      },
    }),
    prisma.integration.count({
      where: { companyId, provider: "WEBSITE" },
    }),
    prisma.integration.count({
      where: {
        companyId,
        OR: [{ provider: null }, { provider: { not: "WEBSITE" } }],
      },
    }),
  ]);

  return {
    ok: true,
    plan,
    limits: {
      facebook: plan.maxFacebookPages,
      instagram: plan.maxInstagramAccounts,
      website: plan.maxWebsiteIntegrations,
      app: plan.maxAppIntegrations,
    },
    used: { facebook, instagram, website, app },
  };
};

/**
 * true when `used` has already reached the plan limit for this kind.
 * `used` can be overridden (e.g. a counter that grows while connecting
 * several Pages in one request).
 */
const isLimitReached = (ctx, kind, used) => {
  const max = ctx.limits[kind];

  if (max === null || max === undefined || max < 0) return false; // not enforced / unlimited

  const current = used === undefined ? ctx.used[kind] : used;
  return current >= max;
};

const limitMessage = (ctx, kind) => {
  const cfg = KINDS[kind];
  const max = ctx.limits[kind];

  if (max === 0) {
    return `Your ${ctx.plan.planName} plan does not include ${cfg.plural}. Please upgrade your plan to use this feature.`;
  }

  return `Your ${ctx.plan.planName} plan allows only ${max} ${
    max === 1 ? cfg.singular : cfg.plural
  }. Please upgrade your plan to add more.`;
};

/**
 * Single-add convenience check.
 * { allowed:true } or { allowed:false, message, limitType, currentCount, maxAllowed, planName }
 */
const checkIntegrationLimit = async (companyId, kind) => {
  try {
    const ctx = await getIntegrationLimitContext(companyId);

    if (!ctx.ok) {
      return { allowed: false, message: ctx.message };
    }

    if (isLimitReached(ctx, kind)) {
      return {
        allowed: false,
        message: limitMessage(ctx, kind),
        limitType: KINDS[kind].limitType,
        currentCount: ctx.used[kind],
        maxAllowed: ctx.limits[kind],
        planName: ctx.plan.planName,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Integration limit check error:", error);
    return { allowed: false, message: "Failed to check integration plan limit." };
  }
};

module.exports = {
  getIntegrationLimitContext,
  isLimitReached,
  limitMessage,
  checkIntegrationLimit,
};
