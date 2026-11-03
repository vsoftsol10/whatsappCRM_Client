
// const prisma = require("../config/prisma");
// const { validateCustomer } = require("../validations/customerValidation");
// const { normalizeIndianPhone } = require("../utils/phoneUtils");
// const { logAction } = require("../services/auditLogService");
// const customerImportService = require("../services/customerImportService");
// const {
//   customerServiceInclude,
//   withServices,
//   resolveServiceIds,
// } = require("../utils/serviceHelper");

// const createCustomer = async (req, res) => {
//   try {
//     const validation = validateCustomer(req.body);

//     if (!validation.isValid) {
//       return res.status(400).json({
//         success: false,
//         message: validation.message,
//       });
//     }

//     const { name, phone, email, company, source, requirements, status, serviceIds } = req.body;

//     //console.log("req.user:", req.user);

//     const normalizedPhone = normalizeIndianPhone(phone);

//     if (!normalizedPhone) {
//       return res.status(400).json({
//         success: false,
//         message: "Please enter a valid Indian mobile number.",
//       });
//     }

//     const { userId, companyId } = req.user;

//     // Services are OPTIONAL. Empty / missing = customer without services.
//     let validServiceIds = [];

//     try {
//       validServiceIds = await resolveServiceIds(companyId, serviceIds);
//     } catch (serviceError) {
//       return res.status(serviceError.statusCode || 400).json({
//         success: false,
//         message: serviceError.message,
//       });
//     }

//     const customer = await prisma.customer.create({
//       data: {
//         name,
//         phone: normalizedPhone,
//         email,
//         companyName: company,
//         source,
//         requirements,
//         status,

//         userId,
//         companyId,

//         ...(validServiceIds.length > 0
//           ? {
//               customerServices: {
//                 create: validServiceIds.map((serviceId) => ({ serviceId })),
//               },
//             }
//           : {}),
//       },
//       include: customerServiceInclude,
//     });

//     logAction({
//       req,
//       action: "CREATE",
//       module: "CUSTOMER",
//       entityId: customer.id,
//       entityName: customer.name,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Customer created successfully",
//       customer: withServices(customer),
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//       error,
//     });
//   }
// };

// const previewCustomerImport = async (req, res) => {
//   try {
//     const result = await customerImportService.previewImport(
//       req.file,
//       req.user
//     );

//     return res.status(200).json(result);
//   } catch (error) {
//     console.error(
//       "❌ Customer import preview error:",
//       error
//     );

//     return res.status(error.statusCode || 500).json({
//       success: false,
//       message:
//         error.message ||
//         "Failed to preview customer import.",
//     });
//   }
// };

// const importCustomers = async (req, res) => {
//   try {
//     console.log("🔥 IMPORT BODY:", req.body);
//     console.log("🔥 IMPORT USER:", req.user);

//     const { rows } = req.body || {};

//     if (!Array.isArray(rows) || rows.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No customer rows received for import.",
//       });
//     }

//     const result =
//       await customerImportService.importCustomers(
//         rows,
//         req.user
//       );

//     return res.status(201).json(result);
//   } catch (error) {
//     console.error(
//       "❌ Customer import error:",
//       error
//     );

//     return res.status(error.statusCode || 500).json({
//       success: false,
//       message:
//         error.message ||
//         "Failed to import customers.",
//     });
//   }
// };

// const getCustomers = async (req, res) => {
//   try {
//     const { status, search, serviceId } = req.query;

//     const where = {
//       companyId: req.user.companyId
//     }

//     // Filter by status
//     if (status) {
//       where.status = status;
//     }

//     // Filter by service ("NONE" = customers without any service)
//     if (serviceId === "NONE") {
//       where.customerServices = { none: {} };
//     } else if (serviceId) {
//       where.customerServices = { some: { serviceId: String(serviceId) } };
//     }

//     // Search by name, phone, or email
//     if (search) {
//       where.OR = [
//         {
//           name: {
//             contains: search,
//             mode: "insensitive",
//           },
//         },
//         {
//           phone: {
//             contains: search,
//           },
//         },
//         {
//           email: {
//             contains: search,
//             mode: "insensitive",
//           },
//         },
//       ];
//     }

//     const customers = await prisma.customer.findMany({
//       where,
//       orderBy: {
//         createdAt: "desc",
//       },
//       include: customerServiceInclude,
//     });

//     return res.status(200).json({
//       success: true,
//       customers: customers.map(withServices),
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// const getCustomerById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const customer = await prisma.customer.findFirst({
//       where: {
//         id,
//         companyId: req.user.companyId
//       },
//       include: customerServiceInclude,
//     });

//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       customer: withServices(customer),
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// const updateCustomer = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const validation = validateCustomer(req.body);

//     if (!validation.isValid) {
//       return res.status(400).json({
//         success: false,
//         message: validation.message,
//       });
//     }

//     const existingCustomer = await prisma.customer.findFirst({
//       where: {
//         id,
//         companyId: req.user.companyId
//       }
//     });

//     if (!existingCustomer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     const { name, phone, email, company, source, requirements, status, serviceIds } = req.body;

//     const updateData = {
//       name,
//       phone,
//       email,
//       companyName: company,
//       source,
//       requirements,
//       status,
//     };

//     // Services are OPTIONAL. Only when `serviceIds` is sent as an array do we
//     // replace the customer's services (empty array = remove all services).
//     // If it is not sent, existing services stay exactly as they are.
//     if (Array.isArray(serviceIds)) {
//       let validServiceIds = [];

//       try {
//         validServiceIds = await resolveServiceIds(
//           req.user.companyId,
//           serviceIds
//         );
//       } catch (serviceError) {
//         return res.status(serviceError.statusCode || 400).json({
//           success: false,
//           message: serviceError.message,
//         });
//       }

//       updateData.customerServices = {
//         deleteMany: {},
//         create: validServiceIds.map((serviceId) => ({ serviceId })),
//       };
//     }

//     const updatedCustomer = await prisma.customer.update({
//       where: {
//         id,
//       },
//       data: updateData,
//       include: customerServiceInclude,
//     });

//     logAction({
//       req,
//       action: "UPDATE",
//       module: "CUSTOMER",
//       entityId: updatedCustomer.id,
//       entityName: updatedCustomer.name,
//       changes: {
//         before: {
//           name: existingCustomer.name,
//           phone: existingCustomer.phone,
//           email: existingCustomer.email,
//           status: existingCustomer.status,
//         },
//         after: {
//           name: updatedCustomer.name,
//           phone: updatedCustomer.phone,
//           email: updatedCustomer.email,
//           status: updatedCustomer.status,
//         },
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Customer updated successfully",
//       customer: withServices(updatedCustomer),
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// const deleteCustomer = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Check customer exists
//     const existingCustomer = await prisma.customer.findFirst({
//       where: {
//         id,
//         companyId: req.user.companyId
//       }
//     });

//     if (!existingCustomer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     // Check if customer has any tickets
//     const ticket = await prisma.ticket.findFirst({
//       where: {
//         customerId: id,
//       },
//     });

//     if (ticket) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Cannot delete customer. Delete associated tickets first.",
//       });
//     }

//     // Find customer's conversation
//     const conversation = await prisma.conversation.findUnique({
//       where: {
//         customerId: id,
//       },
//     });

//     // Delete messages first, then conversation
//     if (conversation) {
//       await prisma.message.deleteMany({
//         where: {
//           conversationId: conversation.id,
//         },
//       });

//       await prisma.conversation.delete({
//         where: {
//           id: conversation.id,
//         },
//       });
//     }

//     // Delete customer
//     await prisma.customer.delete({
//       where: {
//         id,
//       },
//     });

//     logAction({
//       req,
//       action: "DELETE",
//       module: "CUSTOMER",
//       entityId: existingCustomer.id,
//       entityName: existingCustomer.name,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Customer deleted successfully",
//     });
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// module.exports = {
//   createCustomer,
//   getCustomers,
//   getCustomerById,
//   updateCustomer,
//   deleteCustomer,
//   previewCustomerImport,
//   importCustomers,
// };





const prisma = require("../config/prisma");
const { validateCustomer } = require("../validations/customerValidation");
const { normalizeIndianPhone } = require("../utils/phoneUtils");
const { logAction } = require("../services/auditLogService");
const customerImportService = require("../services/customerImportService");
const {
  customerServiceInclude,
  withServices,
  resolveServiceIds,
} = require("../utils/serviceHelper");

const createCustomer = async (req, res) => {
  try {
    const validation = validateCustomer(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const { name, phone, email, company, source, requirements, status, serviceIds } = req.body;

    //console.log("req.user:", req.user);

    const normalizedPhone = normalizeIndianPhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Indian mobile number.",
      });
    }

    const { userId, companyId } = req.user;

    // Services are OPTIONAL. Empty / missing = customer without services.
    let validServiceIds = [];

    try {
      validServiceIds = await resolveServiceIds(companyId, serviceIds);
    } catch (serviceError) {
      return res.status(serviceError.statusCode || 400).json({
        success: false,
        message: serviceError.message,
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: normalizedPhone,
        email,
        companyName: company,
        source,
        requirements,
        status,

        userId,
        companyId,

        ...(validServiceIds.length > 0
          ? {
              customerServices: {
                create: validServiceIds.map((serviceId) => ({ serviceId })),
              },
            }
          : {}),
      },
      include: customerServiceInclude,
    });

    logAction({
      req,
      action: "CREATE",
      module: "CUSTOMER",
      entityId: customer.id,
      entityName: customer.name,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer: withServices(customer),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

const previewCustomerImport = async (req, res) => {
  try {
    const result = await customerImportService.previewImport(
      req.file,
      req.user
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "❌ Customer import preview error:",
      error
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to preview customer import.",
    });
  }
};

const importCustomers = async (req, res) => {
  try {
    console.log("🔥 IMPORT BODY:", req.body);
    console.log("🔥 IMPORT USER:", req.user);

    const { rows } = req.body || {};

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No customer rows received for import.",
      });
    }

    const result =
      await customerImportService.importCustomers(
        rows,
        req.user
      );

    return res.status(201).json(result);
  } catch (error) {
    console.error(
      "❌ Customer import error:",
      error
    );

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message ||
        "Failed to import customers.",
    });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { status, search, serviceId } = req.query;

    const where = {
      companyId: req.user.companyId
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by service ("NONE" = customers without any service)
    if (serviceId === "NONE") {
      where.customerServices = { none: {} };
    } else if (serviceId) {
      where.customerServices = { some: { serviceId: String(serviceId) } };
    }

    // Search by name, phone, or email
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: customerServiceInclude,
    });

    return res.status(200).json({
      success: true,
      customers: customers.map(withServices),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      },
      include: customerServiceInclude,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      customer: withServices(customer),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const validation = validateCustomer(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const { name, phone, email, company, source, requirements, status, serviceIds } = req.body;

    const updateData = {
      name,
      phone,
      email,
      companyName: company,
      source,
      requirements,
      status,
    };

    // Services are OPTIONAL. Only when `serviceIds` is sent as an array do we
    // replace the customer's services (empty array = remove all services).
    // If it is not sent, existing services stay exactly as they are.
    if (Array.isArray(serviceIds)) {
      let validServiceIds = [];

      try {
        validServiceIds = await resolveServiceIds(
          req.user.companyId,
          serviceIds
        );
      } catch (serviceError) {
        return res.status(serviceError.statusCode || 400).json({
          success: false,
          message: serviceError.message,
        });
      }

      updateData.customerServices = {
        deleteMany: {},
        create: validServiceIds.map((serviceId) => ({ serviceId })),
      };
    }

    const updatedCustomer = await prisma.customer.update({
      where: {
        id,
      },
      data: updateData,
      include: customerServiceInclude,
    });

    logAction({
      req,
      action: "UPDATE",
      module: "CUSTOMER",
      entityId: updatedCustomer.id,
      entityName: updatedCustomer.name,
      changes: {
        before: {
          name: existingCustomer.name,
          phone: existingCustomer.phone,
          email: existingCustomer.email,
          status: existingCustomer.status,
        },
        after: {
          name: updatedCustomer.name,
          phone: updatedCustomer.phone,
          email: updatedCustomer.email,
          status: updatedCustomer.status,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: withServices(updatedCustomer),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check customer exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if customer has any tickets
    const ticket = await prisma.ticket.findFirst({
      where: {
        customerId: id,
      },
    });

    if (ticket) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete customer. Delete associated tickets first.",
      });
    }

    // Find customer's conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        customerId: id,
      },
    });

    // Delete messages first, then conversation
    if (conversation) {
      await prisma.message.deleteMany({
        where: {
          conversationId: conversation.id,
        },
      });

      await prisma.conversation.delete({
        where: {
          id: conversation.id,
        },
      });
    }

    // Delete customer
    await prisma.customer.delete({
      where: {
        id,
      },
    });

    logAction({
      req,
      action: "DELETE",
      module: "CUSTOMER",
      entityId: existingCustomer.id,
      entityName: existingCustomer.name,
    });

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ======================================================
// BULK DELETE CUSTOMERS
// Same rules as deleteCustomer, applied to many customers:
//  - only customers of the logged-in company
//  - customers with tickets (or deals) are skipped, not deleted
//  - conversation + messages are removed together with the customer
// ======================================================
// There is NO limit on how many customers can be deleted at once.
// Internally the work is done in batches of 500 so that very large
// deletes never hit database limits (too many query parameters,
// transaction time-outs). The user never sees or notices the batches.
const BULK_DELETE_BATCH_SIZE = 500;

const splitIntoBatches = (items, size) => {
  const batches = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
};

const bulkDeleteCustomers = async (req, res) => {
  try {
    const { ids } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one customer.",
      });
    }

    const uniqueIds = [
      ...new Set(
        ids.filter((id) => typeof id === "string" && id.trim())
      ),
    ];

    if (uniqueIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one customer.",
      });
    }

    const idBatches = splitIntoBatches(
      uniqueIds,
      BULK_DELETE_BATCH_SIZE
    );

    // Only customers that belong to this company
    const customers = [];

    for (const batch of idBatches) {
      const found = await prisma.customer.findMany({
        where: {
          id: { in: batch },
          companyId: req.user.companyId,
        },
        select: { id: true, name: true },
      });

      customers.push(...found);
    }

    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customers not found",
      });
    }

    const foundBatches = splitIntoBatches(
      customers,
      BULK_DELETE_BATCH_SIZE
    );

    const deletable = [];
    const skipped = [];

    for (const batch of foundBatches) {
      const batchIds = batch.map((customer) => customer.id);

      // Customers that still have tickets cannot be deleted
      const tickets = await prisma.ticket.findMany({
        where: { customerId: { in: batchIds } },
        select: { customerId: true },
        distinct: ["customerId"],
      });

      // Customers that still have deals cannot be deleted either
      // (the database does not allow it)
      const deals = await prisma.deal.findMany({
        where: { customerId: { in: batchIds } },
        select: { customerId: true },
        distinct: ["customerId"],
      });

      const blockedByTickets = new Set(
        tickets.map((row) => row.customerId)
      );
      const blockedByDeals = new Set(
        deals.map((row) => row.customerId)
      );

      const batchDeletable = [];

      for (const customer of batch) {
        if (blockedByTickets.has(customer.id)) {
          skipped.push({
            id: customer.id,
            name: customer.name,
            reason: "Has tickets. Delete the tickets first.",
          });
        } else if (blockedByDeals.has(customer.id)) {
          skipped.push({
            id: customer.id,
            name: customer.name,
            reason: "Has deals. Delete the deals first.",
          });
        } else {
          batchDeletable.push(customer);
        }
      }

      if (batchDeletable.length > 0) {
        const deletableIds = batchDeletable.map(
          (customer) => customer.id
        );

        await prisma.$transaction([
          // Messages first, then conversations, then customers
          prisma.message.deleteMany({
            where: {
              conversation: {
                customerId: { in: deletableIds },
              },
            },
          }),
          prisma.conversation.deleteMany({
            where: { customerId: { in: deletableIds } },
          }),
          prisma.customer.deleteMany({
            where: {
              id: { in: deletableIds },
              companyId: req.user.companyId,
            },
          }),
        ]);

        batchDeletable.forEach((customer) => {
          logAction({
            req,
            action: "DELETE",
            module: "CUSTOMER",
            entityId: customer.id,
            entityName: customer.name,
          });
        });

        deletable.push(...batchDeletable);
      }
    }

    const deletedCount = deletable.length;

    let message;

    if (deletedCount > 0 && skipped.length === 0) {
      message = `${deletedCount} customer${
        deletedCount === 1 ? "" : "s"
      } deleted successfully`;
    } else if (deletedCount > 0) {
      message = `${deletedCount} deleted, ${skipped.length} skipped`;
    } else {
      message = "No customers were deleted";
    }

    return res.status(200).json({
      success: deletedCount > 0,
      message,
      deletedCount,
      deletedIds: deletable.map((customer) => customer.id),
      skipped,
    });
  } catch (error) {
    console.error("Bulk delete customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
  previewCustomerImport,
  importCustomers,
};