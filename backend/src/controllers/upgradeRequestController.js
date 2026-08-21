const prisma = require("../config/prisma");

// ==========================================
// CREATE SUBSCRIPTION UPGRADE REQUEST
// ==========================================
const createUpgradeRequest = async (req, res) => {
  try {
    // ------------------------------------------
    // Logged-in user/company information
    // ------------------------------------------
    const companyId = req.user.companyId;
    const requestedBy = req.user.userId;

    console.log("REQ.USER:", req.user);
    console.log("COMPANY ID:", companyId);
    console.log("REQUESTED BY:", requestedBy);

    const { requestedPlanId } = req.body;

    // ------------------------------------------
    // Validate requested plan
    // ------------------------------------------
    if (!requestedPlanId) {
      return res.status(400).json({
        success: false,
        message: "Requested plan is required.",
      });
    }

    // ------------------------------------------
    // Validate authenticated user
    // ------------------------------------------
    if (!requestedBy) {
      return res.status(401).json({
        success: false,
        message: "User information not found in token.",
      });
    }

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company information not found in token.",
      });
    }

    // ------------------------------------------
    // Check requested plan exists
    // ------------------------------------------
    const requestedPlan = await prisma.subscriptionPlan.findUnique({
      where: {
        id: Number(requestedPlanId),
      },
    });

    if (!requestedPlan) {
      return res.status(404).json({
        success: false,
        message: "Requested plan not found.",
      });
    }

    // ------------------------------------------
    // Get current active/trial subscription
    // ------------------------------------------
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        status: {
          in: ["ACTIVE", "TRIAL"],
        },
      },
      orderBy: {
        expiryDate: "desc",
      },
    });

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found.",
      });
    }

    // ------------------------------------------
    // Prevent requesting same plan
    // ------------------------------------------
    if (currentSubscription.planId === requestedPlan.id) {
      return res.status(400).json({
        success: false,
        message: "You are already subscribed to this plan.",
      });
    }

    // ------------------------------------------
    // Check existing pending request
    // ------------------------------------------
    const existingRequest =
      await prisma.subscriptionUpgradeRequest.findFirst({
        where: {
          companyId,
          status: "PENDING",
        },
      });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending upgrade request.",
      });
    }

    // ------------------------------------------
    // Create upgrade request
    // ------------------------------------------
    const upgradeRequest =
      await prisma.subscriptionUpgradeRequest.create({
        data: {
          companyId,
          currentPlanId: currentSubscription.planId,
          requestedPlanId: requestedPlan.id,
          requestedBy,
          status: "PENDING",
        },

        include: {
          company: {
            select: {
              id: true,
              companyName: true,
              email: true,
            },
          },

          currentPlan: {
            select: {
              id: true,
              planName: true,
              price: true,
            },
          },

          requestedPlan: {
            select: {
              id: true,
              planName: true,
              price: true,
            },
          },
        },
      });

    // ------------------------------------------
    // Success response
    // ------------------------------------------
    return res.status(201).json({
      success: true,
      message:
        "Upgrade request submitted successfully. Waiting for administrator approval.",
      data: upgradeRequest,
    });
  } catch (error) {
    console.error(
      "CREATE UPGRADE REQUEST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create upgrade request.",
      error: error.message,
    });
  }
};

// ==========================================
// GET MY UPGRADE REQUEST
// ==========================================
const getMyUpgradeRequest = async (req, res) => {
  try {

    const companyId = req.user.companyId;

    const request =
      await prisma.subscriptionUpgradeRequest.findFirst({
        where: {
          companyId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          currentPlan: true,
          requestedPlan: true,
        },
      });


    return res.status(200).json({
      success: true,
      data: request,
    });


  } catch (error) {

    console.error(
      "GET MY UPGRADE REQUEST ERROR:",
      error
    );


    return res.status(500).json({
      success:false,
      message:"Failed to fetch upgrade request.",
      error:error.message,
    });

  }
};

module.exports = {
  createUpgradeRequest,
  getMyUpgradeRequest,
};