const prisma = require("../config/prisma");

const checkUserLimit = async (companyId) => {
  try {
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

    // Company not found
    if (!company) {
      return {
        allowed: false,
        message: "Company not found",
      };
    }

    // Company must be ACTIVE
    if (company.status !== "ACTIVE") {
      return {
        allowed: false,
        message: `Your company is ${company.status.toLowerCase()}. You cannot add users.`,
      };
    }

    // Get active subscription
    const subscription = company.subscriptions[0];

    if (!subscription || !subscription.plan) {
      return {
        allowed: false,
        message: "No active subscription plan found.",
      };
    }

    const plan = subscription.plan;

    // Count only employees
    const currentEmployees = await prisma.user.count({
      where: {
        companyId: companyId,
        role: "USER",
      },
    });

    /*
     * maxUsers includes the Company Admin.
     *
     * Example:
     * maxUsers = 3
     *
     * Company Admin = 1
     * Employees     = 2
     *
     * Therefore:
     * Maximum employees = 3 - 1 = 2
     */
    const maxUsers = plan.maxUsers;

    const maxEmployees = Math.max(maxUsers - 1, 0);

    // Employee limit reached
    if (currentEmployees >= maxEmployees) {
      return {
        allowed: false,
        message: `Your ${plan.planName} plan allows only ${maxEmployees} employees. Please upgrade your plan to add more employees.`,
        currentEmployees,
        maxEmployees,
        maxUsers,
        planName: plan.planName,
      };
    }

    // Employee can be created
    return {
      allowed: true,
      currentEmployees,
      maxEmployees,
      maxUsers,
      planName: plan.planName,
    };
  } catch (error) {
    console.error("Check User Limit Error:", error);

    return {
      allowed: false,
      message: "Failed to check user plan limit.",
    };
  }
};

module.exports = {
  checkUserLimit,
};