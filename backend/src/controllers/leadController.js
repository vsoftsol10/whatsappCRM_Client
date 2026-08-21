
// const prisma = require("../config/prisma");

// const {
//   notifyUser,
//   NotificationType,
// } = require("../services/notificationService");

// // ======================================================
// // COMMON INCLUDE
// // ======================================================

// const leadInclude = {
//   assignedTo: {
//     select: {
//       id: true,
//       name: true,
//       email: true,
//     },
//   },
// };

// // ================= CREATE LEAD =================
// const createLead = async (req, res) => {
//   try {
//     const {
//       name,
//       phone,
//       email,
//       company,
//       source,
//       requirements,
//       status,
//       assignedToId,
//     } = req.body;

//     if (!name || !name.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Name is required",
//       });
//     }

//     const validStatuses = [
//       "NEW",
//       "CONTACTED",
//       "QUALIFIED",
//       "WON",
//     ];

//     const leadStatus = validStatuses.includes(
//       status?.toUpperCase()
//     )
//       ? status.toUpperCase()
//       : "NEW";

//     // Validate assigned employee (optional)
//     if (assignedToId) {
//       const employee = await prisma.user.findUnique({
//         where: {
//           id: assignedToId,
//         },
//       });

//       if (!employee || employee.role !== "USER") {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid employee selected",
//         });
//       }
//     }

//     const lead = await prisma.lead.create({
//       data: {
//         name: name.trim(),
//         phone: phone?.trim() || null,
//         email: email?.trim() || null,
//         companyName: company?.trim() || null,
//         source: source?.trim() || null,
//         requirements: requirements?.trim() || null,
//         status: leadStatus,

//         companyId: req.user.companyId,

//         assignedToId: assignedToId || null,
//       },
//       include: leadInclude,
//     });

//     // ================= CREATE NOTIFICATION =================
//     if (assignedToId) {
//       try {
//         await notifyUser({
//           userId: assignedToId,
//           title: "New Lead Assigned",
//           message: `You have been assigned a new lead: "${lead.name}".`,
//           type: NotificationType.LEAD,
//         });
//       } catch (notificationError) {
//         console.error(
//           "Lead notification failed:",
//           notificationError
//         );
//       }
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Lead created successfully",
//       data: lead,
//     });
//   } catch (error) {
//     console.error("Create Lead Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create lead",
//       error: error.message,
//     });
//   }
// };

// // ================= GET ALL LEADS =================
// const getLeads = async (req, res) => {
//   try {
//     let leads;

//     if (req.user.role === "ADMIN") {

//       leads = await prisma.lead.findMany({

//         where: {
//           companyId: req.user.companyId
//         },

//         include: leadInclude,

//         orderBy: {
//           createdAt: "desc"
//         }

//       });
//     } else {
//       // Employees can only view leads assigned to them
//       leads = await prisma.lead.findMany({
//         where: {
//           assignedToId: req.user.userId,
//           companyId: req.user.companyId
//         },
//         include: leadInclude,
//         orderBy: {
//           createdAt: "desc",
//         },
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       count: leads.length,
//       data: leads,
//     });
//   } catch (error) {
//     console.error("Get Leads Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch leads",
//       error: error.message,
//     });
//   }
// };

// // ================= UPDATE LEAD =================
// const updateLead = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const {
//       name,
//       phone,
//       email,
//       companyName: company,
//       source,
//       requirements,
//       status,
//       assignedToId,
//     } = req.body;

//     const existingLead = await prisma.lead.findFirst({
//       where: {
//         id: Number(id),
//         companyId: req.user.companyId
//       }
//     });

//     if (!existingLead) {
//       return res.status(404).json({
//         success: false,
//         message: "Lead not found",
//       });
//     }

//     // Validate assigned employee (optional)
//     if (assignedToId) {
//       const employee = await prisma.user.findUnique({
//         where: {
//           id: assignedToId,
//         },
//       });

//       if (!employee || employee.role !== "USER") {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid employee selected",
//         });
//       }
//     }

//     const updatedLead = await prisma.lead.update({
//       where: {
//         id: Number(id),
//       },
//       data: {
//         name,
//         phone,
//         email,
//         companyName: company,
//         source,
//         requirements,
//         status: existingLead.isConverted
//           ? existingLead.status
//           : status,
//         assignedToId:
//           assignedToId === undefined
//             ? existingLead.assignedToId
//             : assignedToId || null,
//       },
//       include: leadInclude,
//     });

//     // ================= REASSIGNMENT NOTIFICATION =================
//     if (
//       assignedToId &&
//       assignedToId !== existingLead.assignedToId
//     ) {
//       try {
//         await notifyUser({
//           userId: assignedToId,
//           title: "Lead Assigned",
//           message: `A lead has been assigned to you: "${updatedLead.name}".`,
//           type: NotificationType.LEAD,
//         });
//       } catch (notificationError) {
//         console.error(
//           "Lead reassignment notification failed:",
//           notificationError
//         );
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Lead updated successfully",
//       data: updatedLead,
//     });
//   } catch (error) {
//     console.error("Update Lead Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update lead",
//       error: error.message,
//     });
//   }
// };



// // ================= UPDATE LEAD STATUS =================
// const updateLeadStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const validStatuses = [
//       "NEW",
//       "CONTACTED",
//       "QUALIFIED",
//       "WON",
//     ];

//     const normalizedStatus = status?.trim().toUpperCase();

//     if (!validStatuses.includes(normalizedStatus)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status",
//       });
//     }

//     const existingLead = await prisma.lead.findFirst({
//       where: {
//         id: Number(id),
//         companyId: req.user.companyId
//       }
//     });

//     if (!existingLead) {
//       return res.status(404).json({
//         success: false,
//         message: "Lead not found",
//       });
//     }

//     // Prevent status changes after conversion
//     if (existingLead.isConverted) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Converted leads cannot change status.",
//       });
//     }

//     const lead = await prisma.lead.update({
//       where: {
//         id: Number(id),
//       },
//       data: {
//         status: normalizedStatus,
//       },
//       include: leadInclude,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Lead status updated successfully",
//       data: lead,
//     });
//   } catch (error) {
//     console.error("Update Status Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update status",
//       error: error.message,
//     });
//   }
// };

// // ================= CONVERT LEAD TO CUSTOMER =================
// const convertLeadToCustomer = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const lead = await prisma.lead.findFirst({
//       where: {
//         id: Number(id),
//         companyId: req.user.companyId
//       }
//     });

//     if (!lead) {
//       return res.status(404).json({
//         success: false,
//         message: "Lead not found",
//       });
//     }

//     if (lead.status !== "WON") {
//       return res.status(400).json({
//         success: false,
//         message: "Only WON leads can be converted",
//       });
//     }

//     if (lead.isConverted) {
//       return res.status(400).json({
//         success: false,
//         message: "Lead already converted",
//       });
//     }

//     console.log("Lead to convert:", lead);

//     const conditions = [];

//     if (lead.email) {
//       conditions.push({ email: lead.email });
//     }

//     if (lead.phone) {
//       conditions.push({ phone: lead.phone });
//     }

//     console.log("Search Conditions:", conditions);

//     const existingCustomer =
//       conditions.length > 0
//         ? await prisma.customer.findFirst({
//           where: {
//             OR: conditions,
//           },
//         })
//         : null;

//     console.log("Matched Customer:", existingCustomer);

//     if (existingCustomer) {
//       return res.status(400).json({
//         success: false,
//         message: "Customer already exists",
//       });
//     }

//     console.log("req.user:", req.user);

//     const customer = await prisma.customer.create({
//       data: {
//         name: lead.name,
//         phone: lead.phone,
//         email: lead.email,

//         companyName: lead.companyName,

//         source: lead.source,
//         requirements: lead.requirements,

//         userId: req.user.userId,
//         companyId: req.user.companyId
//       }
//     });

//     await prisma.lead.update({
//       where: {
//         id: Number(id),
//       },
//       data: {
//         isConverted: true,
//       },
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Lead converted successfully",
//       data: customer,
//     });
//   } catch (error) {
//     console.error("Convert Lead Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to convert lead",
//       error: error.message,
//     });
//   }
// };

// // ================= DELETE LEAD =================
// const deleteLead = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const lead = await prisma.lead.findFirst({
//       where: {
//         id: Number(id),
//         companyId: req.user.companyId
//       }
//     });

//     if (!lead) {
//       return res.status(404).json({
//         message: "Lead not found"
//       });
//     }

//     await prisma.lead.delete({
//       where: {
//         id: Number(id)
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Lead deleted successfully",
//     });
//   } catch (error) {
//     console.error("Delete Lead Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete lead",
//       error: error.message,
//     });
//   }
// };

// module.exports = {
//   createLead,
//   getLeads,
//   updateLead,
//   updateLeadStatus,
//   convertLeadToCustomer,
//   deleteLead,
// };


const prisma = require("../config/prisma");

const {
  notifyUser,
  NotificationType,
} = require("../services/notificationService");

// ======================================================
// COMMON INCLUDE
// ======================================================

const leadInclude = {
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

// ================= CREATE LEAD =================
const createLead = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      company,
      source,
      requirements,
      status,
      assignedToId,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    const validStatuses = [
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "WON",
    ];

    const leadStatus = validStatuses.includes(
      status?.toUpperCase()
    )
      ? status.toUpperCase()
      : "NEW";

    // Validate assigned employee (optional)
    if (assignedToId) {
      const employee = await prisma.user.findUnique({
        where: {
          id: assignedToId,
        },
      });

      if (!employee || employee.role !== "USER") {
        return res.status(400).json({
          success: false,
          message: "Invalid employee selected",
        });
      }
    }

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        companyName: company?.trim() || null,
        source: source?.trim() || null,
        requirements: requirements?.trim() || null,
        status: leadStatus,

        companyId: req.user.companyId,

        assignedToId: assignedToId || null,
      },
      include: leadInclude,
    });

    // ================= CREATE NOTIFICATION =================
    if (assignedToId) {
      try {
        await notifyUser({
          userId: assignedToId,
          title: "New Lead Assigned",
          message: `You have been assigned a new lead: "${lead.name}".`,
          type: NotificationType.LEAD,
        });
      } catch (notificationError) {
        console.error(
          "Lead notification failed:",
          notificationError
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Create Lead Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create lead",
      error: error.message,
    });
  }
};

// ================= GET ALL LEADS =================
const getLeads = async (req, res) => {
  try {
    let leads;

    if (req.user.role === "ADMIN") {

      leads = await prisma.lead.findMany({

        where: {
          companyId: req.user.companyId
        },

        include: leadInclude,

        orderBy: {
          createdAt: "desc"
        }

      });
    } else {
      // Employees can only view leads assigned to them
      leads = await prisma.lead.findMany({
        where: {
          assignedToId: req.user.userId,
          companyId: req.user.companyId
        },
        include: leadInclude,
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    console.error("Get Leads Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
      error: error.message,
    });
  }
};

// ================= UPDATE LEAD =================
const updateLead = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      phone,
      email,
      companyName: company,
      source,
      requirements,
      status,
      assignedToId,
    } = req.body;

    const existingLead = await prisma.lead.findFirst({
      where: {
        id: Number(id),
        companyId: req.user.companyId
      }
    });

    if (!existingLead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Validate assigned employee (optional)
    if (assignedToId) {
      const employee = await prisma.user.findUnique({
        where: {
          id: assignedToId,
        },
      });

      if (!employee || employee.role !== "USER") {
        return res.status(400).json({
          success: false,
          message: "Invalid employee selected",
        });
      }
    }

    const updatedLead = await prisma.lead.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        phone,
        email,
        companyName: company,
        source,
        requirements,
        status: existingLead.isConverted
          ? existingLead.status
          : status,
        assignedToId:
          assignedToId === undefined
            ? existingLead.assignedToId
            : assignedToId || null,
      },
      include: leadInclude,
    });

    // ================= REASSIGNMENT NOTIFICATION =================
    if (
      assignedToId &&
      assignedToId !== existingLead.assignedToId
    ) {
      try {
        await notifyUser({
          userId: assignedToId,
          title: "Lead Assigned",
          message: `A lead has been assigned to you: "${updatedLead.name}".`,
          type: NotificationType.LEAD,
        });
      } catch (notificationError) {
        console.error(
          "Lead reassignment notification failed:",
          notificationError
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: updatedLead,
    });
  } catch (error) {
    console.error("Update Lead Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update lead",
      error: error.message,
    });
  }
};



// ================= UPDATE LEAD STATUS =================
const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "NEW",
      "CONTACTED",
      "QUALIFIED",
      "WON",
    ];

    const normalizedStatus = status?.trim().toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const existingLead = await prisma.lead.findFirst({
      where: {
        id: Number(id),
        companyId: req.user.companyId
      }
    });

    if (!existingLead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Prevent status changes after conversion
    if (existingLead.isConverted) {
      return res.status(400).json({
        success: false,
        message:
          "Converted leads cannot change status.",
      });
    }

    const lead = await prisma.lead.update({
      where: {
        id: Number(id),
      },
      data: {
        status: normalizedStatus,
      },
      include: leadInclude,
    });

    return res.status(200).json({
      success: true,
      message: "Lead status updated successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Update Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update status",
      error: error.message,
    });
  }
};

// ================= CONVERT LEAD TO CUSTOMER =================
const convertLeadToCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: {
        id: Number(id),
        companyId: req.user.companyId
      }
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    if (lead.status !== "WON") {
      return res.status(400).json({
        success: false,
        message: "Only WON leads can be converted",
      });
    }

    if (lead.isConverted) {
      return res.status(400).json({
        success: false,
        message: "Lead already converted",
      });
    }

    console.log("Lead to convert:", lead);

    const conditions = [];

    if (lead.email) {
      conditions.push({ email: lead.email });
    }

    if (lead.phone) {
      conditions.push({ phone: lead.phone });
    }

    console.log("Search Conditions:", conditions);

    const existingCustomer =
      conditions.length > 0
        ? await prisma.customer.findFirst({
          where: {
            OR: conditions,
          },
        })
        : null;

    console.log("Matched Customer:", existingCustomer);

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer already exists",
      });
    }

    console.log("req.user:", req.user);

    const customer = await prisma.customer.create({
      data: {
        name: lead.name,
        phone: lead.phone,
        email: lead.email,

        companyName: lead.companyName,

        source: lead.source,
        requirements: lead.requirements,

        userId: req.user.userId,
        companyId: req.user.companyId
      }
    });

    await prisma.lead.update({
      where: {
        id: Number(id),
      },
      data: {
        isConverted: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Lead converted successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Convert Lead Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to convert lead",
      error: error.message,
    });
  }
};

// ================= DELETE LEAD =================
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: {
        id: Number(id),
        companyId: req.user.companyId
      }
    });

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found"
      });
    }

    await prisma.lead.delete({
      where: {
        id: Number(id)
      }
    });

    return res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Delete Lead Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete lead",
      error: error.message,
    });
  }
};

module.exports = {
  createLead,
  getLeads,
  updateLead,
  updateLeadStatus,
  convertLeadToCustomer,
  deleteLead,
};