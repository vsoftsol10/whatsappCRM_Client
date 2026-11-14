// ======================================================
// src/middleware/requireFeature.js
//
// Blocks a route when the company's plan (Super Admin) has this
// feature switched off.
//
// Use it AFTER authMiddleware:
//   router.use(authMiddleware, requireFeature("leads"));
// ======================================================
const { CATALOG_BY_KEY } = require("../config/featureCatalog");
const {
  getCompanyFeatureContext,
  isEnabledInConfig,
} = require("../services/planFeatureService");

const requireFeature = (key) => async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;

    // authMiddleware already rejects requests without a company
    if (!companyId) return next();

    const ctx = await getCompanyFeatureContext(companyId);

    if (isEnabledInConfig(ctx.config, key)) return next();

    const label = CATALOG_BY_KEY[key]?.label || key;
    const planPart = ctx.planName ? ` ${ctx.planName}` : "";

    return res.status(403).json({
      success: false,
      code: "FEATURE_NOT_IN_PLAN",
      feature: key,
      planName: ctx.planName,
      message: `${label} is not included in your${planPart} plan. Please upgrade your plan to use it.`,
    });
  } catch (error) {
    console.error("requireFeature error:", error);
    return next(); // never lock a company out because of a lookup problem
  }
};

module.exports = { requireFeature };
