// // const prisma = require("../config/prisma");

// // // ==============================
// // // GET LOGGED-IN COMPANY SUBSCRIPTION
// // // ==============================
// // const getMySubscription = async (req, res) => {
// //   try {
// //     const companyId = req.user.companyId;

// //     const subscription = await prisma.subscription.findFirst({
// //       where: {
// //         companyId,
// //         status: {
// //           in: ["ACTIVE", "TRIAL"],
// //         },
// //       },
// //       include: {
// //         company: {
// //           select: {
// //             id: true,
// //             companyName: true,
// //             ownerName: true,
// //             email: true,
// //             phone: true,
// //             status: true,
// //             plan: true,
// //             expiryDate: true,
// //           },
// //         },
// //         plan: {
// //           select: {
// //             id: true,
// //             planName: true,
// //             price: true,
// //             durationDays: true,
// //             maxUsers: true,
// //             maxContacts: true,
// //             maxCampaigns: true,
// //             maxBots: true,
// //             features: true,
// //             isTrial: true,
// //             status: true,
// //           },
// //         },
// //       },
// //       orderBy: {
// //         expiryDate: "desc",
// //       },
// //     });

// //     if (!subscription) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "No active subscription found.",
// //       });
// //     }

// //     const today = new Date();

// //     const remainingDays = Math.max(
// //       0,
// //       Math.ceil(
// //         (new Date(subscription.expiryDate) - today) /
// //           (1000 * 60 * 60 * 24)
// //       )
// //     );

// //     return res.status(200).json({
// //       success: true,
// //       data: {
// //         company: subscription.company,
// //         plan: subscription.plan,
// //         subscription: {
// //           id: subscription.id,
// //           status: subscription.status,
// //           paymentStatus: subscription.paymentStatus,
// //           startDate: subscription.startDate,
// //           expiryDate: subscription.expiryDate,
// //           remainingDays,
// //         },
// //       },
// //     });
// //   } catch (error) {
// //     console.error("GET SUBSCRIPTION ERROR:", error);

// //     return res.status(500).json({
// //       success: false,
// //       message: error.message,
// //     });
// //   }
// // };

// // // ==============================
// // // GET ALL ACTIVE PLANS
// // // ==============================
// // const getPlans = async (req, res) => {
// //   try {
// //     const plans = await prisma.subscriptionPlan.findMany({
// //       where: {
// //         status: "ACTIVE",
// //       },
// //       orderBy: {
// //         price: "asc",
// //       },
// //     });

// //     return res.status(200).json({
// //       success: true,
// //       data: plans,
// //     });
// //   } catch (error) {
// //     console.error(error);

// //     return res.status(500).json({
// //       success: false,
// //       message: "Failed to fetch plans.",
// //     });
// //   }
// // };

// // // ==============================
// // // UPGRADE PLAN
// // // ==============================
// // const upgradePlan = async (req, res) => {
// //   try {
// //     const companyId = req.user.companyId;
// //     const { planId } = req.body;

// //     if (!planId) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Plan ID is required.",
// //       });
// //     }

// //     // Check selected plan
// //     const selectedPlan = await prisma.subscriptionPlan.findUnique({
// //       where: {
// //         id: Number(planId),
// //       },
// //     });

// //     if (!selectedPlan) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Plan not found.",
// //       });
// //     }

// //     // Get current subscription
// //     const subscription = await prisma.subscription.findFirst({
// //       where: {
// //         companyId,
// //         status: {
// //           in: ["ACTIVE", "TRIAL"],
// //         },
// //       },
// //     });

// //     if (!subscription) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Subscription not found.",
// //       });
// //     }

// //     const startDate = new Date();

// //     const expiryDate = new Date();
// //     expiryDate.setDate(
// //       expiryDate.getDate() + selectedPlan.durationDays
// //     );

// //     const updatedSubscription =
// //       await prisma.subscription.update({
// //         where: {
// //           id: subscription.id,
// //         },
// //         data: {
// //           planId: selectedPlan.id,
// //           startDate,
// //           expiryDate,
// //           status: "ACTIVE",
// //         },
// //         include: {
// //           plan: true,
// //         },
// //       });

// //     // Update company plan also
// //     await prisma.company.update({
// //       where: {
// //         id: companyId,
// //       },
// //       data: {
// //         plan: selectedPlan.planName,
// //         expiryDate,
// //       },
// //     });

// //     return res.status(200).json({
// //       success: true,
// //       message: "Plan upgraded successfully.",
// //       data: updatedSubscription,
// //     });
// //   } catch (error) {
// //     console.error(error);

// //     return res.status(500).json({
// //       success: false,
// //       message: error.message,
// //     });
// //   }
// // };

// // module.exports = {
// //   getMySubscription,
// //   getPlans,
// //   upgradePlan,
// // };

// const prisma = require("../config/prisma");

// // ==============================
// // GET LOGGED-IN COMPANY SUBSCRIPTION
// // ==============================
// const getMySubscription = async (req, res) => {
//   try {
//     const companyId = req.user.companyId;

//     const subscription = await prisma.subscription.findFirst({
//       where: {
//         companyId,
//         status: {
//           in: ["ACTIVE", "TRIAL"],
//         },
//       },
//       include: {
//         company: {
//           select: {
//             id: true,
//             companyName: true,
//             ownerName: true,
//             email: true,
//             phone: true,
//             status: true,
//             plan: true,
//             expiryDate: true,
//           },
//         },
//         plan: {
//           select: {
//             id: true,
//             planName: true,
//             price: true,
//             durationDays: true,
//             maxUsers: true,
//             maxCustomers: true,
//             maxCampaigns: true,
//             maxTemplates: true,
//             features: true,
//             isTrial: true,
//             status: true,
//           },
//         },
//       },
//       orderBy: {
//         expiryDate: "desc",
//       },
//     });

//     if (!subscription) {
//       return res.status(404).json({
//         success: false,
//         message: "No active subscription found.",
//       });
//     }

//     const today = new Date();

//     const remainingDays = Math.max(
//       0,
//       Math.ceil(
//         (new Date(subscription.expiryDate) - today) /
//           (1000 * 60 * 60 * 24)
//       )
//     );

//     return res.status(200).json({
//       success: true,
//       data: {
//         company: subscription.company,
//         plan: subscription.plan,
//         subscription: {
//           id: subscription.id,
//           status: subscription.status,
//           paymentStatus: subscription.paymentStatus,
//           startDate: subscription.startDate,
//           expiryDate: subscription.expiryDate,
//           remainingDays,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("GET SUBSCRIPTION ERROR:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// // ==============================
// // GET ALL ACTIVE PLANS
// // ==============================
// const getPlans = async (req, res) => {
//   try {
//     const plans = await prisma.subscriptionPlan.findMany({
//       where: {
//         status: "ACTIVE",
//       },
//       orderBy: {
//         price: "asc",
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       data: plans,
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch plans.",
//     });
//   }
// };

// // ==============================
// // UPGRADE PLAN
// // ==============================
// const upgradePlan = async (req, res) => {
//   try {
//     const companyId = req.user.companyId;
//     const { planId } = req.body;

//     if (!planId) {
//       return res.status(400).json({
//         success: false,
//         message: "Plan ID is required.",
//       });
//     }

//     // Check selected plan
//     const selectedPlan = await prisma.subscriptionPlan.findUnique({
//       where: {
//         id: Number(planId),
//       },
//     });

//     if (!selectedPlan) {
//       return res.status(404).json({
//         success: false,
//         message: "Plan not found.",
//       });
//     }

//     // Get current subscription
//     const subscription = await prisma.subscription.findFirst({
//       where: {
//         companyId,
//         status: {
//           in: ["ACTIVE", "TRIAL"],
//         },
//       },
//     });

//     if (!subscription) {
//       return res.status(404).json({
//         success: false,
//         message: "Subscription not found.",
//       });
//     }

//     const startDate = new Date();

//     const expiryDate = new Date();
//     expiryDate.setDate(
//       expiryDate.getDate() + selectedPlan.durationDays
//     );

//     const updatedSubscription =
//       await prisma.subscription.update({
//         where: {
//           id: subscription.id,
//         },
//         data: {
//           planId: selectedPlan.id,
//           startDate,
//           expiryDate,
//           status: "ACTIVE",
//         },
//         include: {
//           plan: true,
//         },
//       });

//     // Update company plan also
//     await prisma.company.update({
//       where: {
//         id: companyId,
//       },
//       data: {
//         plan: selectedPlan.planName,
//         expiryDate,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Plan upgraded successfully.",
//       data: updatedSubscription,
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// module.exports = {
//   getMySubscription,
//   getPlans,
//   upgradePlan,
// };

const prisma = require("../config/prisma");

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

module.exports = {
  getMySubscription,
  getPlans,
  upgradePlan,
};