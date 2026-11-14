// ======================================================
// src/services/planFeatureService.js
//
// Reads the company's plan (managed in Super Admin) and tells the CRM
// which features are switched on and what the limits are.
//
//   featureConfig = { leads: { enabled: true }, customers: { enabled: true, limit: 500 }, ... }
//   limit null    = unlimited
//
// Rules
//  - Custom plans get everything.
//  - Plans saved before featureConfig existed are converted from the old
//    max* columns (same logic as Super Admin).
//  - If the company has no active/trial subscription, or the lookup fails,
//    nothing is hidden (the create-limits still block adding new records,
//    exactly as before). A database hiccup must never lock a company out.
//  - Results are cached for 30 seconds, so a change made in Super Admin
//    shows up in the CRM within about half a minute.
// ======================================================
const prisma = require("../config/prisma");
const {
  CATALOG_BY_KEY,
  normalizeFeatureConfig,
  fullAccessConfig,
} = require("../config/featureCatalog");

const CACHE_MS = 30 * 1000;
const cache = new Map(); // companyId -> { at, value }

const openContext = () => ({
  hasPlan: false,
  planId: null,
  planName: null,
  isTrial: false,
  isCustom: false,
  config: fullAccessConfig(),
});

const loadContext = async (companyId) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      companyId,
      status: { in: ["ACTIVE", "TRIAL"] },
    },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

  if (!subscription || !subscription.plan) return openContext();

  const plan = subscription.plan;

  return {
    hasPlan: true,
    planId: plan.id,
    planName: plan.planName,
    isTrial: Boolean(plan.isTrial),
    isCustom: Boolean(plan.isCustom),
    config: plan.isCustom
      ? fullAccessConfig()
      : normalizeFeatureConfig(plan.featureConfig, plan),
  };
};

/**
 * { hasPlan, planId, planName, isTrial, isCustom, config }
 * Never throws.
 */
const getCompanyFeatureContext = async (companyId, { fresh = false } = {}) => {
  const id = Number(companyId);

  if (!id) return openContext();

  const hit = cache.get(id);

  if (!fresh && hit && Date.now() - hit.at < CACHE_MS) return hit.value;

  try {
    const value = await loadContext(id);
    cache.set(id, { at: Date.now(), value });
    return value;
  } catch (error) {
    console.error("Plan feature lookup failed (nothing blocked):", error.message);
    return openContext();
  }
};

const isEnabledInConfig = (config, key) => {
  if (!CATALOG_BY_KEY[key]) return true; // unknown key -> never block
  return config?.[key]?.enabled !== false;
};

const isFeatureEnabled = async (companyId, key) => {
  const ctx = await getCompanyFeatureContext(companyId);
  return isEnabledInConfig(ctx.config, key);
};

const clearPlanFeatureCache = (companyId) => {
  if (companyId === undefined || companyId === null) cache.clear();
  else cache.delete(Number(companyId));
};

module.exports = {
  getCompanyFeatureContext,
  isEnabledInConfig,
  isFeatureEnabled,
  clearPlanFeatureCache,
};
