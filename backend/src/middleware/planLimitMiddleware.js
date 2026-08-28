// const prisma = require("../config/prisma");

// /**
//  * Get the active subscription and plan for a company
//  */
// const getCompanyPlan = async (companyId) => {
//   const company = await prisma.company.findUnique({
//     where: {
//       id: companyId,
//     },
//     include: {
//       subscriptions: {
//         where: {
//           status: "ACTIVE",
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//         take: 1,
//         include: {
//           plan: true,
//         },
//       },
//     },
//   });

//   if (!company) {
//     return {
//       success: false,
//       message: "Company not found.",
//     };
//   }

//   // Only ACTIVE companies can create new records
//   if (company.status !== "ACTIVE") {
//     return {
//       success: false,
//       message: `Your company is ${company.status.toLowerCase()}. You cannot create new records.`,
//     };
//   }

//   const subscription = company.subscriptions[0];

//   if (!subscription || !subscription.plan) {
//     return {
//       success: false,
//       message: "No active subscription plan found.",
//     };
//   }

//   return {
//     success: true,
//     company,
//     subscription,
//     plan: subscription.plan,
//   };
// };

// /**
//  * Check maximum users
//  */
// const checkUserLimit = async (req, res, next) => {
//   try {
//     const companyId = req.user?.companyId;

//     if (!companyId) {
//       return res.status(401).json({
//         success: false,
//         message: "Company information not found in authentication.",
//       });
//     }

//     const result = await getCompanyPlan(companyId);

//     if (!result.success) {
//       return res.status(403).json({
//         success: false,
//         message: result.message,
//       });
//     }

//     const { plan, subscription } = result;

//     // Count all current users
//     // Admin + Employees
//     const currentUsers = await prisma.user.count({
//       where: {
//         companyId: companyId,
//       },
//     });

//     console.log("========== USER COUNT DEBUG ==========");
// console.log("Plan:", plan.planName);
// console.log("Max Users:", plan.maxUsers);
// console.log("Users At Subscription Start:", subscription.usersAtSubscriptionStart);
// console.log("Current Users:", currentUsers);
// console.log(
//   "New Users:",
//   currentUsers - subscription.usersAtSubscriptionStart
// );
// console.log("======================================");

//     // Users that existed when this subscription started
//     const usersAtSubscriptionStart =
//       subscription.usersAtSubscriptionStart || 0;

//     // Users added after the current plan started
//     const newUsers = currentUsers - usersAtSubscriptionStart;

//     // Current plan allows this many NEW users
//     const maxNewUsers = plan.maxUsers;

//     // New-user limit reached
//     if (newUsers >= maxNewUsers) {
//       return res.status(403).json({
//         success: false,
//         message: `Your ${plan.planName} plan allows ${maxNewUsers} new users. You have already added ${newUsers} users in this plan.`,
//         limitType: "users",
//         currentUsers,
//         usersAtSubscriptionStart,
//         newUsers,
//         maxAllowed: maxNewUsers,
//         planName: plan.planName,
//       });
//     }

//     next();

//   } catch (error) {
//     console.error("User limit middleware error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to check user plan limit.",
//     });
//   }
// };

// /**
//  * Check maximum customers
//  */
// const checkCustomerLimit = async (req, res, next) => {
//   try {
//     const companyId = req.user?.companyId;

//     if (!companyId) {
//       return res.status(401).json({
//         success: false,
//         message: "Company information not found in authentication.",
//       });
//     }

//     const result = await getCompanyPlan(companyId);

//     if (!result.success) {
//       return res.status(403).json({
//         success: false,
//         message: result.message,
//       });
//     }

//     const { plan } = result;

//     const currentCustomers = await prisma.customer.count({
//       where: {
//         companyId: companyId,
//       },
//     });

//     const maxCustomers = plan.maxContacts;

//     if (
//       maxCustomers !== null &&
//       maxCustomers !== undefined &&
//       currentCustomers >= maxCustomers
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: `Your ${plan.planName} plan allows only ${maxCustomers} customers. Please upgrade your plan to add more customers.`,
//         limitType: "customers",
//         currentCount: currentCustomers,
//         maxAllowed: maxCustomers,
//         planName: plan.planName,
//       });
//     }

//     next();
//   } catch (error) {
//     console.error("Customer limit middleware error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to check customer plan limit.",
//     });
//   }
// };

// /**
//  * Check maximum campaigns
//  */
// const checkCampaignLimit = async (req, res, next) => {
//   try {
//     const companyId = req.user?.companyId;

//     if (!companyId) {
//       return res.status(401).json({
//         success: false,
//         message: "Company information not found in authentication.",
//       });
//     }

//     const result = await getCompanyPlan(companyId);

//     if (!result.success) {
//       return res.status(403).json({
//         success: false,
//         message: result.message,
//       });
//     }

//     const { plan } = result;

//     const currentCampaigns = await prisma.campaign.count({
//       where: {
//         companyId: companyId,
//       },
//     });

//     const maxCampaigns = plan.maxCampaigns;

//     if (
//       maxCampaigns !== null &&
//       maxCampaigns !== undefined &&
//       currentCampaigns >= maxCampaigns
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: `Your ${plan.planName} plan allows only ${maxCampaigns} campaigns. Please upgrade your plan to add more campaigns.`,
//         limitType: "campaigns",
//         currentCount: currentCampaigns,
//         maxAllowed: maxCampaigns,
//         planName: plan.planName,
//       });
//     }

//     next();
//   } catch (error) {
//     console.error("Campaign limit middleware error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to check campaign plan limit.",
//     });
//   }
// };

// /**
//  * Check maximum templates
//  */
// const checkTemplateLimit = async (req, res, next) => {
//   try {
//     const companyId = req.user?.companyId;

//     if (!companyId) {
//       return res.status(401).json({
//         success: false,
//         message: "Company information not found in authentication.",
//       });
//     }

//     const result = await getCompanyPlan(companyId);

//     if (!result.success) {
//       return res.status(403).json({
//         success: false,
//         message: result.message,
//       });
//     }

//     const { plan } = result;

//     const currentTemplates = await prisma.template.count({
//       where: {
//         companyId: companyId,
//       },
//     });

//     /*
//      * Change this field if your SubscriptionPlan model
//      * uses a different name for template limits.
//      */
//     const maxTemplates = plan.maxTemplates;

//     if (
//       maxTemplates !== null &&
//       maxTemplates !== undefined &&
//       currentTemplates >= maxTemplates
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: `Your ${plan.planName} plan allows only ${maxTemplates} templates. Please upgrade your plan to add more templates.`,
//         limitType: "templates",
//         currentCount: currentTemplates,
//         maxAllowed: maxTemplates,
//         planName: plan.planName,
//       });
//     }

//     next();
//   } catch (error) {
//     console.error("Template limit middleware error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to check template plan limit.",
//     });
//   }
// };

// module.exports = {
//   checkUserLimit,
//   checkCustomerLimit,
//   checkCampaignLimit,
//   checkTemplateLimit,
// };

const prisma = require("../config/prisma");

/**
 * Get the active subscription and plan for a company
 */
const getCompanyPlan = async (companyId) => {
  const company = await prisma.company.findUnique({
    where: {
      id: companyId,
    },
    include: {
      subscriptions: {
        where: {
          status: "ACTIVE",
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          plan: true,
        },
      },
    },
  });

  if (!company) {
    return {
      success: false,
      message: "Company not found.",
    };
  }

  // Only ACTIVE companies can create new records
  if (company.status !== "ACTIVE") {
    return {
      success: false,
      message: `Your company is ${company.status.toLowerCase()}. You cannot create new records.`,
    };
  }

  const subscription = company.subscriptions[0];

  if (!subscription || !subscription.plan) {
    return {
      success: false,
      message: "No active subscription plan found.",
    };
  }

  return {
    success: true,
    company,
    subscription,
    plan: subscription.plan,
  };
};

/**
 * Check maximum users
 */
const checkUserLimit = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company information not found in authentication.",
      });
    }

    const result = await getCompanyPlan(companyId);

    if (!result.success) {
      return res.status(403).json({
        success: false,
        message: result.message,
      });
    }

    const { plan, subscription } = result;

    // Count all current users
    // Admin + Employees
    const currentUsers = await prisma.user.count({
      where: {
        companyId: companyId,
      },
    });

    console.log("========== USER COUNT DEBUG ==========");
console.log("Plan:", plan.planName);
console.log("Max Users:", plan.maxUsers);
console.log("Users At Subscription Start:", subscription.usersAtSubscriptionStart);
console.log("Current Users:", currentUsers);
console.log(
  "New Users:",
  currentUsers - subscription.usersAtSubscriptionStart
);
console.log("======================================");

    // Users that existed when this subscription started
    const usersAtSubscriptionStart =
      subscription.usersAtSubscriptionStart || 0;

    // Users added after the current plan started
    const newUsers = currentUsers - usersAtSubscriptionStart;

    // Current plan allows this many NEW users
    const maxNewUsers = plan.maxUsers;

    // New-user limit reached
    if (newUsers >= maxNewUsers) {
      return res.status(403).json({
        success: false,
        message: `Your ${plan.planName} plan allows ${maxNewUsers} new users. You have already added ${newUsers} users in this plan.`,
        limitType: "users",
        currentUsers,
        usersAtSubscriptionStart,
        newUsers,
        maxAllowed: maxNewUsers,
        planName: plan.planName,
      });
    }

    next();

  } catch (error) {
    console.error("User limit middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check user plan limit.",
    });
  }
};

/**
 * Check maximum customers
 */
const checkCustomerLimit = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company information not found in authentication.",
      });
    }

    const result = await getCompanyPlan(companyId);

    if (!result.success) {
      return res.status(403).json({
        success: false,
        message: result.message,
      });
    }

    const { plan } = result;

    const currentCustomers = await prisma.customer.count({
      where: {
        companyId: companyId,
      },
    });

    const maxCustomers = plan.maxCustomers;

    if (
      maxCustomers !== null &&
      maxCustomers !== undefined &&
      currentCustomers >= maxCustomers
    ) {
      return res.status(403).json({
        success: false,
        message: `Your ${plan.planName} plan allows only ${maxCustomers} customers. Please upgrade your plan to add more customers.`,
        limitType: "customers",
        currentCount: currentCustomers,
        maxAllowed: maxCustomers,
        planName: plan.planName,
      });
    }

    next();
  } catch (error) {
    console.error("Customer limit middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check customer plan limit.",
    });
  }
};

/**
 * Check maximum campaigns
 */
const checkCampaignLimit = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company information not found in authentication.",
      });
    }

    const result = await getCompanyPlan(companyId);

    if (!result.success) {
      return res.status(403).json({
        success: false,
        message: result.message,
      });
    }

    const { plan } = result;

    const currentCampaigns = await prisma.campaign.count({
      where: {
        companyId: companyId,
      },
    });

    const maxCampaigns = plan.maxCampaigns;

    if (
      maxCampaigns !== null &&
      maxCampaigns !== undefined &&
      currentCampaigns >= maxCampaigns
    ) {
      return res.status(403).json({
        success: false,
        message: `Your ${plan.planName} plan allows only ${maxCampaigns} campaigns. Please upgrade your plan to add more campaigns.`,
        limitType: "campaigns",
        currentCount: currentCampaigns,
        maxAllowed: maxCampaigns,
        planName: plan.planName,
      });
    }

    next();
  } catch (error) {
    console.error("Campaign limit middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check campaign plan limit.",
    });
  }
};

/**
 * Check maximum templates
 */
const checkTemplateLimit = async (req, res, next) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company information not found in authentication.",
      });
    }

    const result = await getCompanyPlan(companyId);

    if (!result.success) {
      return res.status(403).json({
        success: false,
        message: result.message,
      });
    }

    const { plan } = result;

    const currentTemplates = await prisma.template.count({
      where: {
        companyId: companyId,
      },
    });

    /*
     * Change this field if your SubscriptionPlan model
     * uses a different name for template limits.
     */
    const maxTemplates = plan.maxTemplates;

    if (
      maxTemplates !== null &&
      maxTemplates !== undefined &&
      currentTemplates >= maxTemplates
    ) {
      return res.status(403).json({
        success: false,
        message: `Your ${plan.planName} plan allows only ${maxTemplates} templates. Please upgrade your plan to add more templates.`,
        limitType: "templates",
        currentCount: currentTemplates,
        maxAllowed: maxTemplates,
        planName: plan.planName,
      });
    }

    next();
  } catch (error) {
    console.error("Template limit middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check template plan limit.",
    });
  }
};

module.exports = {
  checkUserLimit,
  checkCustomerLimit,
  checkCampaignLimit,
  checkTemplateLimit,
};