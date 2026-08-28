

const prisma = require("../config/prisma");

// ========================================
// GET ALL ACTIVE SUBSCRIPTION PLANS
// GET /api/subscriptions/plans
// ========================================
exports.getPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        price: "asc",
      },
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
    });

    return res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Get Plans Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plans.",
      error: error.message,
    });
  }
};