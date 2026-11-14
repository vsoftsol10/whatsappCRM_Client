

const prisma = require("../config/prisma");
const {
  getCompanyFeatureContext,
  clearPlanFeatureCache,
} = require("../services/planFeatureService");
const { getIntegrationLimitContext } = require("../services/integrationLimitService");

// ==============================
// GET LOGGED-IN COMPANY SUBSCRIPTION
// ==============================
const getMySubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        status: {
          in: ["ACTIVE", "TRIAL"],
        },
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            ownerName: true,
            email: true,
            phone: true,
            status: true,
            plan: true,
            expiryDate: true,
          },
        },
        plan: {
          select: {
            id: true,
            planName: true,
            price: true,
            durationDays: true,
            maxUsers: true,
            maxCustomers: true,
            maxCampaigns: true,
            maxTemplates: true,
            features: true,
            isTrial: true,
            status: true,
          },
        },
      },
      orderBy: {
        expiryDate: "desc",
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found.",
      });
    }

    const today = new Date();

    const remainingDays = Math.max(
      0,
      Math.ceil(
        (new Date(subscription.expiryDate) - today) /
          (1000 * 60 * 60 * 24)
      )
    );

    return res.status(200).json({
      success: true,
      data: {
        company: subscription.company,
        plan: subscription.plan,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          paymentStatus: subscription.paymentStatus,
          startDate: subscription.startDate,
          expiryDate: subscription.expiryDate,
          remainingDays,
        },
      },
    });
  } catch (error) {
    console.error("GET SUBSCRIPTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// GET ALL ACTIVE PLANS
// ==============================
const getPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        price: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch plans.",
    });
  }
};

// ==============================
// UPGRADE PLAN
// ==============================
const upgradePlan = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required.",
      });
    }

    // Check selected plan
    const selectedPlan = await prisma.subscriptionPlan.findUnique({
      where: {
        id: Number(planId),
      },
    });

    if (!selectedPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found.",
      });
    }

    // Get current subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        status: {
          in: ["ACTIVE", "TRIAL"],
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found.",
      });
    }

    const startDate = new Date();

    const expiryDate = new Date();
    expiryDate.setDate(
      expiryDate.getDate() + selectedPlan.durationDays
    );

    const updatedSubscription =
      await prisma.subscription.update({
        where: {
          id: subscription.id,
        },
        data: {
          planId: selectedPlan.id,
          startDate,
          expiryDate,
          status: "ACTIVE",
        },
        include: {
          plan: true,
        },
      });

    // Update company plan also
    await prisma.company.update({
      where: {
        id: companyId,
      },
      data: {
        plan: selectedPlan.planName,
        expiryDate,
      },
    });

    // plan changed -> next feature check must read the new plan
    clearPlanFeatureCache(companyId);

    return res.status(200).json({
      success: true,
      message: "Plan upgraded successfully.",
      data: updatedSubscription,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ==============================
// PLAN FEATURES + USAGE (Super Admin switches and limits)
// ==============================
const getMyFeatures = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const ctx = await getCompanyFeatureContext(companyId, { fresh: true });

    const [users, customers, campaigns, templates] = await Promise.all([
      prisma.user.count({ where: { companyId } }),
      prisma.customer.count({ where: { companyId } }),
      prisma.campaign.count({ where: { companyId } }),
      prisma.template.count({ where: { companyId } }),
    ]);

    let integrations = {};

    try {
      const limitCtx = await getIntegrationLimitContext(companyId);
      if (limitCtx.ok) integrations = limitCtx.used;
    } catch (error) {
      console.error("Usage (integrations) error:", error.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        hasPlan: ctx.hasPlan,
        planName: ctx.planName,
        isTrial: ctx.isTrial,
        isCustom: ctx.isCustom,
        features: ctx.config,
        usage: {
          users,
          customers,
          campaigns,
          templates,
          facebook: integrations.facebook ?? 0,
          instagram: integrations.instagram ?? 0,
          websiteIntegration: integrations.website ?? 0,
          appIntegration: integrations.app ?? 0,
        },
      },
    });
  } catch (error) {
    console.error("GET FEATURES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load plan features.",
    });
  }
};

module.exports = {
  getMySubscription,
  getPlans,
  upgradePlan,
  getMyFeatures,
};