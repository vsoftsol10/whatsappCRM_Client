

// const prisma = require("../config/prisma");

// const {
//   notifyUser,
//   NotificationType,
// } = require("../services/notificationService");

// // ======================================================
// // COMMON INCLUDE
// // ======================================================

// const ticketInclude = {
//   customer: {
//     select: {
//       id: true,
//       name: true,
//       phone: true,
//       email: true,
//     },
//   },
//   createdBy: {
//     select: {
//       id: true,
//       name: true,
//       email: true,
//     },
//   },
//   assignedTo: {
//     select: {
//       id: true,
//       name: true,
//       email: true,
//     },
//   },
// };

// // ======================================================
// // CREATE TICKET
// // ======================================================

// const createTicket = async (req, res) => {
//   try {
//     // Only Admin can create tickets
//     if (req.user.role !== "ADMIN") {
//       return res.status(403).json({
//         success: false,
//         message: "Only admin can create tickets",
//       });
//     }

//     const {
//       title,
//       description,
//       priority,
//       customerId,
//       assignedToId,
//     } = req.body;

//     // Required fields
//     if (!title || !customerId) {
//       return res.status(400).json({
//         success: false,
//         message: "Title and customer are required",
//       });
//     }

//     // Check customer
//     const customer = await prisma.customer.findFirst({
//       where: {
//         id: customerId,
//         companyId: req.user.companyId,
//       },
//     });

//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     // Check assigned employee (optional)
//     if (assignedToId) {
//       const employee = await prisma.user.findFirst({
//         where: {
//           id: assignedToId,
//           companyId: req.user.companyId,
//           role: "USER",
//         },
//       });

//       if (!employee) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid employee selected",
//         });
//       }
//     }

//     const ticket = await prisma.ticket.create({
//       data: {
//         title,
//         description,
//         priority,

//         customer: {
//           connect: {
//             id: customerId,
//           },
//         },

//         createdBy: {
//           connect: {
//             id: req.user.userId,
//           },
//         },

//         company: {
//           connect: {
//             id: req.user.companyId,
//           },
//         },

//         ...(assignedToId && {
//           assignedTo: {
//             connect: {
//               id: assignedToId,
//             },
//           },
//         }),
//       },

//       include: ticketInclude,
//     });

//     // ================= CREATE NOTIFICATION =================
//     if (assignedToId) {
//       try {
//         await notifyUser({
//           employeeId: assignedToId,
//           title: "New Ticket Assigned",
//           message: `You have been assigned a new ticket: "${ticket.title}".`,
//           type: NotificationType.TICKET,
//         });
//       } catch (notificationError) {
//         console.error(
//           "Ticket notification failed:",
//           notificationError
//         );
//       }
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Ticket created successfully",
//       data: ticket,
//     });

//   } catch (error) {
//     console.error("Create Ticket Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create ticket",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // GET ALL TICKETS
// // ======================================================

// const getTickets = async (req, res) => {
//   try {
//     let tickets;

//     if (req.user.role === "ADMIN") {
//       // Admin can view all tickets
//       tickets = await prisma.ticket.findMany({
//         where: {
//           customer: {
//             companyId: req.user.companyId,
//           },
//         },
//         include: ticketInclude,
//         orderBy: {
//           createdAt: "desc",
//         },
//       });
//     } else {
//       // Employees can only view tickets assigned to them
//       tickets = await prisma.ticket.findMany({
//         where: {
//           assignedToId: req.user.userId,
//           customer: {
//             companyId: req.user.companyId,
//           },
//         },
//         include: ticketInclude,
//         orderBy: {
//           createdAt: "desc",
//         },
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       count: tickets.length,
//       data: tickets,
//     });
//   } catch (error) {
//     console.error("Get Tickets Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch tickets",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // GET SINGLE TICKET
// // ======================================================

// const getTicketById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const ticket = await prisma.ticket.findFirst({
//       where: {
//         id,
//         customer: {
//           companyId: req.user.companyId,
//         },
//       },
//       include: ticketInclude,
//     });

//     if (!ticket) {
//       return res.status(404).json({
//         success: false,
//         message: "Ticket not found",
//       });
//     }

//     // Employee can only view assigned tickets
//     if (
//       req.user.role !== "ADMIN" &&
//       ticket.assignedToId !== req.user.userId
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: ticket,
//     });

//   } catch (error) {
//     console.error("Get Ticket Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch ticket",
//       error: error.message,
//     });
//   }
// };



// // ======================================================
// // UPDATE TICKET
// // ======================================================

// const updateTicket = async (req, res) => {
//   try {
//     if (req.user.role !== "ADMIN") {
//       return res.status(403).json({
//         success: false,
//         message: "Only admin can update tickets",
//       });
//     }

//     const { id } = req.params;

//     const {
//       title,
//       description,
//       priority,
//       status,
//       assignedToId,
//     } = req.body;

//     // Check ticket exists
//     const existingTicket = await prisma.ticket.findFirst({
//       where: {
//         id,
//         customer: {
//           companyId: req.user.companyId,
//         },
//       },
//     });

//     if (!existingTicket) {
//       return res.status(404).json({
//         success: false,
//         message: "Ticket not found",
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

//     const updatedTicket = await prisma.ticket.update({
//       where: {
//         id,
//       },
//       data: {
//         title,
//         description,
//         priority,
//         status,
//         assignedToId: assignedToId || null,
//       },
//       include: ticketInclude,
//     });

//     // ================= REASSIGNMENT NOTIFICATION =================
//     if (
//       assignedToId &&
//       assignedToId !== existingTicket.assignedToId
//     ) {
//       try {
//         await notifyUser({
//           employeeId: assignedToId,
//           title: "Ticket Assigned",
//           message: `A ticket has been assigned to you: "${updatedTicket.title}".`,
//           type: NotificationType.TICKET,
//         });
//       } catch (notificationError) {
//         console.error(
//           "Ticket reassignment notification failed:",
//           notificationError
//         );
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Ticket updated successfully",
//       data: updatedTicket,
//     });

//   } catch (error) {
//     console.error("Update Ticket Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update ticket",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // DELETE TICKET
// // ======================================================

// const deleteTicket = async (req, res) => {
//   try {
//     if (req.user.role !== "ADMIN") {
//       return res.status(403).json({
//         success: false,
//         message: "Only admin can delete tickets",
//       });
//     }

//     const { id } = req.params;

//     const ticket = await prisma.ticket.findFirst({
//       where: {
//         id,
//         customer: {
//           companyId: req.user.companyId,
//         },
//       },
//     });

//     if (!ticket) {
//       return res.status(404).json({
//         success: false,
//         message: "Ticket not found",
//       });
//     }

//     await prisma.ticket.delete({
//       where: {
//         id,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Ticket deleted successfully",
//     });

//   } catch (error) {
//     console.error("Delete Ticket Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete ticket",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // UPDATE TICKET STATUS
// // ======================================================

// const updateTicketStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const ticket = await prisma.ticket.findFirst({
//       where: {
//         id,
//         customer: {
//           companyId: req.user.companyId,
//         },
//       },
//     });

//     if (!ticket) {
//       return res.status(404).json({
//         success: false,
//         message: "Ticket not found",
//       });
//     }

//     // Admin can update any ticket
//     // Employee can update only assigned tickets
//     if (
//       req.user.role !== "ADMIN" &&
//       ticket.assignedToId !== req.user.userId
//     ) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not assigned to this ticket",
//       });
//     }

//     const updatedTicket = await prisma.ticket.update({
//       where: {
//         id,
//       },
//       data: {
//         status,
//       },
//       include: ticketInclude,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Ticket status updated successfully",
//       data: updatedTicket,
//     });

//   } catch (error) {
//     console.error("Update Ticket Status Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update ticket status",
//       error: error.message,
//     });
//   }
// };

// // ======================================================
// // EXPORTS
// // ======================================================

// module.exports = {
//   createTicket,
//   getTickets,
//   getTicketById,
//   updateTicket,
//   deleteTicket,
//   updateTicketStatus,
// };

const prisma = require("../config/prisma");

const {
  notifyUser,
  NotificationType,
} = require("../services/notificationService");

const { logAction } = require("../services/auditLogService");

// ======================================================
// COMMON INCLUDE
// ======================================================

const ticketInclude = {
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

// ======================================================
// CREATE TICKET
// ======================================================

const createTicket = async (req, res) => {
  try {
    // Only Admin can create tickets
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admin can create tickets",
      });
    }

    const {
      title,
      description,
      priority,
      customerId,
      assignedToId,
    } = req.body;

    // Required fields
    if (!title || !customerId) {
      return res.status(400).json({
        success: false,
        message: "Title and customer are required",
      });
    }

    // Check customer
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId: req.user.companyId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check assigned employee (optional)
    if (assignedToId) {
      const employee = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          companyId: req.user.companyId,
          role: "USER",
        },
      });

      if (!employee) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee selected",
        });
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority,

        customer: {
          connect: {
            id: customerId,
          },
        },

        createdBy: {
          connect: {
            id: req.user.userId,
          },
        },

        company: {
          connect: {
            id: req.user.companyId,
          },
        },

        ...(assignedToId && {
          assignedTo: {
            connect: {
              id: assignedToId,
            },
          },
        }),
      },

      include: ticketInclude,
    });

    // ================= CREATE NOTIFICATION =================
    if (assignedToId) {
      try {
        await notifyUser({
          userId: assignedToId,
          title: "New Ticket Assigned",
          message: `You have been assigned a new ticket: "${ticket.title}".`,
          type: NotificationType.TICKET,
        });
      } catch (notificationError) {
        console.error(
          "Ticket notification failed:",
          notificationError
        );
      }
    }

    logAction({
      req,
      action: "CREATE",
      module: "TICKET",
      entityId: ticket.id,
      entityName: ticket.title,
    });

    return res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: ticket,
    });

  } catch (error) {
    console.error("Create Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create ticket",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL TICKETS
// ======================================================

const getTickets = async (req, res) => {
  try {
    let tickets;

    if (req.user.role === "ADMIN") {
      // Admin can view all tickets
      tickets = await prisma.ticket.findMany({
        where: {
          customer: {
            companyId: req.user.companyId,
          },
        },
        include: ticketInclude,
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Employees can only view tickets assigned to them
      tickets = await prisma.ticket.findMany({
        where: {
          assignedToId: req.user.userId,
          customer: {
            companyId: req.user.companyId,
          },
        },
        include: ticketInclude,
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error("Get Tickets Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
};

// ======================================================
// GET SINGLE TICKET
// ======================================================

const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        customer: {
          companyId: req.user.companyId,
        },
      },
      include: ticketInclude,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Employee can only view assigned tickets
    if (
      req.user.role !== "ADMIN" &&
      ticket.assignedToId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket,
    });

  } catch (error) {
    console.error("Get Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch ticket",
      error: error.message,
    });
  }
};



// ======================================================
// UPDATE TICKET
// ======================================================

const updateTicket = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update tickets",
      });
    }

    const { id } = req.params;

    const {
      title,
      description,
      priority,
      status,
      assignedToId,
    } = req.body;

    // Check ticket exists
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        id,
        customer: {
          companyId: req.user.companyId,
        },
      },
    });

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
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

    const updatedTicket = await prisma.ticket.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        priority,
        status,
        assignedToId: assignedToId || null,
      },
      include: ticketInclude,
    });

    // ================= REASSIGNMENT NOTIFICATION =================
    if (
      assignedToId &&
      assignedToId !== existingTicket.assignedToId
    ) {
      try {
        await notifyUser({
          userId: assignedToId,
          title: "Ticket Assigned",
          message: `A ticket has been assigned to you: "${updatedTicket.title}".`,
          type: NotificationType.TICKET,
        });
      } catch (notificationError) {
        console.error(
          "Ticket reassignment notification failed:",
          notificationError
        );
      }
    }

    logAction({
      req,
      action: "UPDATE",
      module: "TICKET",
      entityId: updatedTicket.id,
      entityName: updatedTicket.title,
      changes: {
        before: { status: existingTicket.status, priority: existingTicket.priority, assignedToId: existingTicket.assignedToId },
        after: { status: updatedTicket.status, priority: updatedTicket.priority, assignedToId: updatedTicket.assignedToId },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });

  } catch (error) {
    console.error("Update Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update ticket",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE TICKET
// ======================================================

const deleteTicket = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admin can delete tickets",
      });
    }

    const { id } = req.params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        customer: {
          companyId: req.user.companyId,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    await prisma.ticket.delete({
      where: {
        id,
      },
    });

    logAction({
      req,
      action: "DELETE",
      module: "TICKET",
      entityId: ticket.id,
      entityName: ticket.title,
    });

    return res.status(200).json({
      success: true,
      message: "Ticket deleted successfully",
    });

  } catch (error) {
    console.error("Delete Ticket Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete ticket",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE TICKET STATUS
// ======================================================

const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        customer: {
          companyId: req.user.companyId,
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // Admin can update any ticket
    // Employee can update only assigned tickets
    if (
      req.user.role !== "ADMIN" &&
      ticket.assignedToId !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this ticket",
      });
    }

    const updatedTicket = await prisma.ticket.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: ticketInclude,
    });

    logAction({
      req,
      action: "STATUS_CHANGE",
      module: "TICKET",
      entityId: updatedTicket.id,
      entityName: updatedTicket.title,
      changes: {
        before: { status: ticket.status },
        after: { status: updatedTicket.status },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      data: updatedTicket,
    });

  } catch (error) {
    console.error("Update Ticket Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update ticket status",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
};