// const prisma = require("../config/prisma");

// const getDashboardStats = async (req, res) => {
//   try {
//     const {
//   userId,
//   role,
//   companyId,
// } = req.user;

//     // ===========================
//     // General Statistics (Optimized)
//     // ===========================

// const [
//   totalCustomers,
//   totalEmployees,
//   totalConversations,
//   unreadConversations,
//   totalLeads,
//   totalCampaigns,
//   totalTemplates,
// ] = await Promise.all([
//   prisma.customer.count({
//     where: {
//       companyId,
//     },
//   }),

//   prisma.user.count({
//     where: {
//       companyId,
//       role: "USER",
//     },
//   }),

//   prisma.conversation.count({
//     where: {
//       customer: {
//         companyId,
//       },
//     },
//   }),

//   prisma.conversation.count({
//     where: {
//       unreadCount: {
//         gt: 0,
//       },
//       customer: {
//         companyId,
//       },
//     },
//   }),

//   prisma.lead.count({
//     where: {
//       companyId,
//     },
//   }),

//   prisma.campaign.count({
//     where: {
//       companyId,
//     },
//   }),

//   prisma.template.count({
//     where: {
//       companyId,
//     },
//   }),
// ]);

//     // ===========================
//     // Lead Growth (Last 6 Months)
//     // ===========================

//     const leadGrowthRaw = await prisma.$queryRaw`
//       SELECT
//         TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS month,
//         COUNT(*)::int AS leads
// FROM "Lead"
// WHERE "companyId" = ${companyId}
// AND "createdAt" >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
//       GROUP BY DATE_TRUNC('month', "createdAt")
//       ORDER BY DATE_TRUNC('month', "createdAt");
//     `;

//     // ===========================
//     // Fill Missing Months
//     // ===========================

//     const monthNames = [
//       "Jan",
//       "Feb",
//       "Mar",
//       "Apr",
//       "May",
//       "Jun",
//       "Jul",
//       "Aug",
//       "Sep",
//       "Oct",
//       "Nov",
//       "Dec",
//     ];

//     const currentMonth = new Date().getMonth();

//     const lastSixMonths = [];

//     for (let i = 5; i >= 0; i--) {
//       const monthIndex = (currentMonth - i + 12) % 12;

//       lastSixMonths.push({
//         month: monthNames[monthIndex],
//         leads: 0,
//       });
//     }

//     leadGrowthRaw.forEach((item) => {
//       const month = lastSixMonths.find(
//         (m) => m.month === item.month
//       );

//       if (month) {
//         month.leads = Number(item.leads);
//       }
//     });

//     // ===========================
//     // Task Statistics
//     // ===========================

// const taskFilter =
//   role === "ADMIN"
//     ? {
//         companyId,
//       }
//     : {
//         companyId,
//         assignedToId: userId,
//       };

//         const [
//       totalTasks,
//       todoTasks,
//       inProgressTasks,
//       reviewTasks,
//       completedTasks,
//     ] = await Promise.all([
//       prisma.task.count({
//         where: taskFilter,
//       }),

//       prisma.task.count({
//         where: {
//           ...taskFilter,
//           status: "TODO",
//         },
//       }),

//       prisma.task.count({
//         where: {
//           ...taskFilter,
//           status: "IN_PROGRESS",
//         },
//       }),

//       prisma.task.count({
//         where: {
//           ...taskFilter,
//           status: "REVIEW",
//         },
//       }),

//       prisma.task.count({
//         where: {
//           ...taskFilter,
//           status: "COMPLETED",
//         },
//       }),
//     ]);

//     // ===========================
//     // Ticket Statistics
//     // ===========================

// const ticketFilter =
//   role === "ADMIN"
//     ? {
//         companyId,
//       }
//     : {
//         companyId,
//         assignedToId: userId,
//       };

//     const [
//       totalTickets,
//       openTickets,
//       ticketsInProgress,
//       resolvedTickets,
//       closedTickets,
//     ] = await Promise.all([
//       prisma.ticket.count({
//         where: ticketFilter,
//       }),

//       prisma.ticket.count({
//         where: {
//           ...ticketFilter,
//           status: "OPEN",
//         },
//       }),

//       prisma.ticket.count({
//         where: {
//           ...ticketFilter,
//           status: "IN_PROGRESS",
//         },
//       }),

//       prisma.ticket.count({
//         where: {
//           ...ticketFilter,
//           status: "RESOLVED",
//         },
//       }),

//       prisma.ticket.count({
//         where: {
//           ...ticketFilter,
//           status: "CLOSED",
//         },
//       }),
//     ]);

//     // ===========================
//     // Response
//     // ===========================

//     return res.status(200).json({
//       success: true,
//       data: {
//         totalCustomers,
//         totalEmployees,
//         totalConversations,
//         unreadConversations,
//         totalLeads,
//         totalCampaigns,
//         totalTemplates,

//         tasks: {
//           total: totalTasks,
//           todo: todoTasks,
//           inProgress: inProgressTasks,
//           review: reviewTasks,
//           completed: completedTasks,
//         },

//         tickets: {
//           total: totalTickets,
//           open: openTickets,
//           inProgress: ticketsInProgress,
//           resolved: resolvedTickets,
//           closed: closedTickets,
//         },

//         leadGrowth: lastSixMonths,
//       },
//     });
//   } catch (error) {
//     console.error("Dashboard Stats Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch dashboard stats",
//     });
//   }
// };

// module.exports = {
//   getDashboardStats,
// };

const prisma = require("../config/prisma");

const getDashboardStats = async (req, res) => {
  try {
    const {
  userId,
  role,
  companyId,
} = req.user;

    // ===========================
    // General Statistics (Optimized)
    // ===========================

const [
  totalCustomers,
  totalEmployees,
  totalConversations,
  unreadConversations,
  totalLeads,
  totalCampaigns,
  totalTemplates,
] = await Promise.all([
  prisma.customer.count({
    where: {
      companyId,
    },
  }),

  prisma.user.count({
    where: {
      companyId,
      role: "USER",
    },
  }),

  prisma.conversation.count({
    where: {
      customer: {
        companyId,
      },
    },
  }),

  prisma.conversation.count({
    where: {
      unreadCount: {
        gt: 0,
      },
      customer: {
        companyId,
      },
    },
  }),

  prisma.lead.count({
    where: {
      companyId,
    },
  }),

  prisma.campaign.count({
    where: {
      companyId,
    },
  }),

  prisma.template.count({
    where: {
      companyId,
    },
  }),
]);

    // ===========================
    // Lead Growth (Last 6 Months)
    // ===========================

    const leadGrowthRaw = await prisma.$queryRaw`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS month,
        COUNT(*)::int AS leads
FROM "Lead"
WHERE "companyId" = ${companyId}
AND "createdAt" >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt");
    `;

    // ===========================
    // Fill Missing Months
    // ===========================

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentMonth = new Date().getMonth();

    const lastSixMonths = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;

      lastSixMonths.push({
        month: monthNames[monthIndex],
        leads: 0,
      });
    }

    leadGrowthRaw.forEach((item) => {
      const month = lastSixMonths.find(
        (m) => m.month === item.month
      );

      if (month) {
        month.leads = Number(item.leads);
      }
    });

    // ===========================
    // Task Statistics
    // ===========================

const taskFilter =
  role === "ADMIN"
    ? {
        companyId,
      }
    : {
        companyId,
        assignedToId: userId,
      };

        const [
      totalTasks,
      todoTasks,
      inProgressTasks,
      reviewTasks,
      completedTasks,
    ] = await Promise.all([
      prisma.task.count({
        where: taskFilter,
      }),

      prisma.task.count({
        where: {
          ...taskFilter,
          status: "TODO",
        },
      }),

      prisma.task.count({
        where: {
          ...taskFilter,
          status: "IN_PROGRESS",
        },
      }),

      prisma.task.count({
        where: {
          ...taskFilter,
          status: "REVIEW",
        },
      }),

      prisma.task.count({
        where: {
          ...taskFilter,
          status: "COMPLETED",
        },
      }),
    ]);

    // ===========================
    // Ticket Statistics
    // ===========================

const ticketFilter =
  role === "ADMIN"
    ? {
        companyId,
      }
    : {
        companyId,
        assignedToId: userId,
      };

    const [
      totalTickets,
      openTickets,
      ticketsInProgress,
      resolvedTickets,
      closedTickets,
    ] = await Promise.all([
      prisma.ticket.count({
        where: ticketFilter,
      }),

      prisma.ticket.count({
        where: {
          ...ticketFilter,
          status: "OPEN",
        },
      }),

      prisma.ticket.count({
        where: {
          ...ticketFilter,
          status: "IN_PROGRESS",
        },
      }),

      prisma.ticket.count({
        where: {
          ...ticketFilter,
          status: "RESOLVED",
        },
      }),

      prisma.ticket.count({
        where: {
          ...ticketFilter,
          status: "CLOSED",
        },
      }),
    ]);

    // ===========================
    // Response
    // ===========================

    return res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalEmployees,
        totalConversations,
        unreadConversations,
        totalLeads,
        totalCampaigns,
        totalTemplates,

        tasks: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          review: reviewTasks,
          completed: completedTasks,
        },

        tickets: {
          total: totalTickets,
          open: openTickets,
          inProgress: ticketsInProgress,
          resolved: resolvedTickets,
          closed: closedTickets,
        },

        leadGrowth: lastSixMonths,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
    });
  }
};

module.exports = {
  getDashboardStats,
};