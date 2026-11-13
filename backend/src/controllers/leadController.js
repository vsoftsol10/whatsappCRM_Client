
// const prisma = require("../config/prisma");

// const {
//   notifyUser,
//   NotificationType,
// } = require("../services/notificationService");

// const { logAction } = require("../services/auditLogService");
// const { normalizeIndianPhone } = require("../utils/phoneUtils");

// // Which lead the caller may work on: an admin - any lead of the company;
// // an employee - only a lead assigned to them (the same leads they can see).
// const leadScope = (req, id) => ({
//   id: Number(id),
//   companyId: req.user.companyId,
//   ...(req.user.role === "ADMIN" ? {} : { assignedToId: req.user.userId }),
// });

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
//       const employee = await prisma.user.findFirst({
//         where: {
//           id: assignedToId,
//           companyId: req.user.companyId,
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

//     logAction({
//       req,
//       action: "CREATE",
//       module: "LEAD",
//       entityId: lead.id,
//       entityName: lead.name,
//     });

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
//       where: leadScope(req, id),
//     });

//     if (!existingLead) {
//       return res.status(404).json({
//         success: false,
//         message: "Lead not found",
//       });
//     }

//     // Validate assigned employee (optional)
//     if (assignedToId) {
//       const employee = await prisma.user.findFirst({
//         where: {
//           id: assignedToId,
//           companyId: req.user.companyId,
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
//         // NEW: an empty phone / email / requirements is saved as null
//         // (not as an empty text), e.g. for Facebook / Instagram leads.
//         // Not sent at all (undefined) = left unchanged, as before.
//         phone: phone === undefined ? undefined : phone?.trim() || null,
//         email: email === undefined ? undefined : email?.trim() || null,
//         companyName: company,
//         source,
//         requirements:
//           requirements === undefined ? undefined : requirements?.trim() || null,
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

//     // ================= PREVIOUS ASSIGNEE NOTIFICATION =================
//     // When a lead is taken away from an employee (reassigned to someone
//     // else, or unassigned), that previous employee is notified too.
//     const previousAssigneeId = existingLead.assignedToId;
//     const currentAssigneeId = updatedLead.assignedToId || null;

//     if (
//       previousAssigneeId &&
//       previousAssigneeId !== currentAssigneeId &&
//       previousAssigneeId !== req.user.userId
//     ) {
//       try {
//         await notifyUser({
//           userId: previousAssigneeId,
//           title: "Lead Reassigned",
//           message: updatedLead.assignedTo?.name
//             ? `The lead "${updatedLead.name}" has been reassigned from you to ${updatedLead.assignedTo.name}.`
//             : `The lead "${updatedLead.name}" has been unassigned from you.`,
//           type: NotificationType.LEAD,
//         });
//       } catch (notificationError) {
//         console.error(
//           "Lead previous-assignee notification failed:",
//           notificationError
//         );
//       }
//     }

//     logAction({
//       req,
//       action: "UPDATE",
//       module: "LEAD",
//       entityId: updatedLead.id,
//       entityName: updatedLead.name,
//       changes: {
//         before: { status: existingLead.status, assignedToId: existingLead.assignedToId },
//         after: { status: updatedLead.status, assignedToId: updatedLead.assignedToId },
//       },
//     });

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
//       where: leadScope(req, id),
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

//     logAction({
//       req,
//       action: "STATUS_CHANGE",
//       module: "LEAD",
//       entityId: lead.id,
//       entityName: lead.name,
//       changes: {
//         before: { status: existingLead.status },
//         after: { status: normalizedStatus },
//       },
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
//       where: leadScope(req, id),
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

//     // NEW: a customer needs a phone number. Facebook / Instagram leads may
//     // not have one yet, so give a clear message instead of a server error.
//     if (!lead.phone || !lead.phone.trim()) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Add a phone number to this lead (Edit Lead) before converting it to a customer.",
//       });
//     }

//     console.log("Lead to convert:", lead);

//     const conditions = [];

//     if (lead.email) {
//       conditions.push({ email: lead.email });
//     }

//     // Leads keep 10-digit numbers; customers are stored as 91XXXXXXXXXX.
//     const customerPhone = normalizeIndianPhone(lead.phone) || lead.phone;

//     if (lead.phone) {
//       conditions.push({ phone: lead.phone });
//       if (customerPhone !== lead.phone) conditions.push({ phone: customerPhone });
//     }

//     console.log("Search Conditions:", conditions);

//     const existingCustomer =
//       conditions.length > 0
//         ? await prisma.customer.findFirst({
//           where: {
//             // Only look for duplicates inside the caller's OWN company.
//             companyId: req.user.companyId,
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
//         phone: customerPhone,
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

//     logAction({
//       req,
//       action: "UPDATE",
//       module: "LEAD",
//       entityId: lead.id,
//       entityName: lead.name,
//       changes: {
//         before: { isConverted: false },
//         after: { isConverted: true, convertedToCustomerId: customer.id },
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
//       where: leadScope(req, id),
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

//     logAction({
//       req,
//       action: "DELETE",
//       module: "LEAD",
//       entityId: lead.id,
//       entityName: lead.name,
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

// // ================= BULK DELETE LEADS =================
// // Admin: any lead of the company.
// // Employee: only the leads assigned to them (the same leads they can see).
// // There is NO limit on how many leads can be deleted at once.
// // Internally the work is done in batches of 500 so that very large
// // deletes never hit database limits (too many query parameters,
// // time-outs). The user never sees or notices the batches.
// const BULK_DELETE_BATCH_SIZE = 500;

// const splitLeadIdsIntoBatches = (items, size) => {
//   const batches = [];

//   for (let index = 0; index < items.length; index += size) {
//     batches.push(items.slice(index, index + size));
//   }

//   return batches;
// };

// const bulkDeleteLeads = async (req, res) => {
//   try {
//     const { ids } = req.body || {};

//     if (!Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Please select at least one lead.",
//       });
//     }

//     const uniqueIds = [
//       ...new Set(
//         ids
//           .map((id) => Number(id))
//           .filter((id) => Number.isInteger(id) && id > 0)
//       ),
//     ];

//     if (uniqueIds.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "Please select at least one lead.",
//       });
//     }

//     const idBatches = splitLeadIdsIntoBatches(
//       uniqueIds,
//       BULK_DELETE_BATCH_SIZE
//     );

//     // Find every lead this user is allowed to delete
//     const leads = [];

//     for (const batch of idBatches) {
//       const where = {
//         id: { in: batch },
//         companyId: req.user.companyId,
//       };

//       if (req.user.role !== "ADMIN") {
//         where.assignedToId = req.user.userId;
//       }

//       const found = await prisma.lead.findMany({
//         where,
//         select: { id: true, name: true },
//       });

//       leads.push(...found);
//     }

//     if (leads.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Leads not found",
//       });
//     }

//     const deletableIds = leads.map((lead) => lead.id);

//     // Work notes are removed automatically (onDelete: Cascade)
//     for (const batch of splitLeadIdsIntoBatches(
//       deletableIds,
//       BULK_DELETE_BATCH_SIZE
//     )) {
//       await prisma.lead.deleteMany({
//         where: {
//           id: { in: batch },
//           companyId: req.user.companyId,
//         },
//       });
//     }

//     leads.forEach((lead) => {
//       logAction({
//         req,
//         action: "DELETE",
//         module: "LEAD",
//         entityId: lead.id,
//         entityName: lead.name,
//       });
//     });

//     const skippedCount = uniqueIds.length - leads.length;

//     return res.status(200).json({
//       success: true,
//       message:
//         skippedCount > 0
//           ? `${leads.length} deleted, ${skippedCount} skipped`
//           : `${leads.length} lead${
//               leads.length === 1 ? "" : "s"
//             } deleted successfully`,
//       deletedCount: leads.length,
//       deletedIds: deletableIds,
//       skippedCount,
//     });
//   } catch (error) {
//     console.error("Bulk Delete Leads Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete leads",
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
//   bulkDeleteLeads,
// };



const prisma = require("../config/prisma");

const {
  notifyUser,
  NotificationType,
} = require("../services/notificationService");

const { logAction } = require("../services/auditLogService");
const { normalizeIndianPhone } = require("../utils/phoneUtils");

// Which lead the caller may work on: an admin - any lead of the company;
// an employee - only a lead assigned to them (the same leads they can see).
const leadScope = (req, id) => ({
  id: Number(id),
  companyId: req.user.companyId,
  ...(req.user.role === "ADMIN" ? {} : { assignedToId: req.user.userId }),
});

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
      const employee = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          companyId: req.user.companyId,
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

    logAction({
      req,
      action: "CREATE",
      module: "LEAD",
      entityId: lead.id,
      entityName: lead.name,
    });

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

// ================= GET ALL LEADS (SERVER SIDE) =================
//
// Query params (all optional):
//   page     - page number, default 1
//   limit    - items per page, default 10, max 100
//   search   - matches name / email / phone
//   status   - ALL | NEW | CONTACTED | QUALIFIED | WON | CONVERTED
//   idsOnly  - "true" => returns only the ids of EVERY lead that matches
//              the search + status (used by "Select all N")
//
// Response:
//   { success, count, data, pagination: { total, page, limit, totalPages },
//     stats: { total, new, contacted, qualified, won } }
//
// `stats` always covers the caller's whole lead list (not affected by
// search / status filter), exactly like the old client-side counters.

const LEAD_FILTER_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "WON"];
const MAX_LEADS_PAGE_SIZE = 100;

const parsePositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getLeads = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(
      parsePositiveInt(req.query.limit, 10),
      MAX_LEADS_PAGE_SIZE
    );

    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "ALL")
      .trim()
      .toUpperCase();

    // Stat-card counters are only calculated when the page asks for them
    // (first load, and after add / edit / delete / status change).
    // Plain page / search / filter changes skip that extra query.
    const withStats = req.query.withStats === "true";

    // Admin: every lead of the company.
    // Employee: only leads assigned to them.
    const scope = {
      companyId: req.user.companyId,
      ...(req.user.role === "ADMIN"
        ? {}
        : { assignedToId: req.user.userId }),
    };

    const where = { ...scope };

    // ---------- STATUS FILTER ----------
    // ALL        -> not converted
    // CONVERTED  -> converted only
    // NEW ... WON -> that status and not converted
    if (status === "CONVERTED") {
      where.isConverted = true;
    } else if (LEAD_FILTER_STATUSES.includes(status)) {
      where.status = status;
      where.isConverted = false;
    } else {
      where.isConverted = false;
    }

    // ---------- SEARCH ----------
    // NOTE: `mode: "insensitive"` works on PostgreSQL / MongoDB.
    // If you use MySQL, remove `mode` (MySQL is already case-insensitive).
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // ---------- ONLY IDS (Select all N) ----------
    if (req.query.idsOnly === "true") {
      const rows = await prisma.lead.findMany({
        where,
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        success: true,
        count: rows.length,
        data: rows.map((row) => row.id),
      });
    }

    const [leads, total, statusGroups] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: leadInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.lead.count({ where }),

      // Counters for the stat cards (whole scope, ignores search/filter)
      withStats
        ? prisma.lead.groupBy({
            by: ["status"],
            where: scope,
            _count: { _all: true },
          })
        : Promise.resolve(null),
    ]);

    const stats = {
      total: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      won: 0,
    };

    (statusGroups || []).forEach((group) => {
      const count = group._count._all;

      stats.total += count;

      switch (group.status) {
        case "NEW":
          stats.new = count;
          break;
        case "CONTACTED":
          stats.contacted = count;
          break;
        case "QUALIFIED":
          stats.qualified = count;
          break;
        case "WON":
          stats.won = count;
          break;
        default:
          break;
      }
    });

    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      // null when the page did not ask for stats (it keeps the old ones)
      stats: statusGroups ? stats : null,
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
      where: leadScope(req, id),
    });

    if (!existingLead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Validate assigned employee (optional)
    if (assignedToId) {
      const employee = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          companyId: req.user.companyId,
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
        // NEW: an empty phone / email / requirements is saved as null
        // (not as an empty text), e.g. for Facebook / Instagram leads.
        // Not sent at all (undefined) = left unchanged, as before.
        phone: phone === undefined ? undefined : phone?.trim() || null,
        email: email === undefined ? undefined : email?.trim() || null,
        companyName: company,
        source,
        requirements:
          requirements === undefined ? undefined : requirements?.trim() || null,
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

    // ================= PREVIOUS ASSIGNEE NOTIFICATION =================
    // When a lead is taken away from an employee (reassigned to someone
    // else, or unassigned), that previous employee is notified too.
    const previousAssigneeId = existingLead.assignedToId;
    const currentAssigneeId = updatedLead.assignedToId || null;

    if (
      previousAssigneeId &&
      previousAssigneeId !== currentAssigneeId &&
      previousAssigneeId !== req.user.userId
    ) {
      try {
        await notifyUser({
          userId: previousAssigneeId,
          title: "Lead Reassigned",
          message: updatedLead.assignedTo?.name
            ? `The lead "${updatedLead.name}" has been reassigned from you to ${updatedLead.assignedTo.name}.`
            : `The lead "${updatedLead.name}" has been unassigned from you.`,
          type: NotificationType.LEAD,
        });
      } catch (notificationError) {
        console.error(
          "Lead previous-assignee notification failed:",
          notificationError
        );
      }
    }

    logAction({
      req,
      action: "UPDATE",
      module: "LEAD",
      entityId: updatedLead.id,
      entityName: updatedLead.name,
      changes: {
        before: { status: existingLead.status, assignedToId: existingLead.assignedToId },
        after: { status: updatedLead.status, assignedToId: updatedLead.assignedToId },
      },
    });

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
      where: leadScope(req, id),
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

    logAction({
      req,
      action: "STATUS_CHANGE",
      module: "LEAD",
      entityId: lead.id,
      entityName: lead.name,
      changes: {
        before: { status: existingLead.status },
        after: { status: normalizedStatus },
      },
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
      where: leadScope(req, id),
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

    // NEW: a customer needs a phone number. Facebook / Instagram leads may
    // not have one yet, so give a clear message instead of a server error.
    if (!lead.phone || !lead.phone.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Add a phone number to this lead (Edit Lead) before converting it to a customer.",
      });
    }

    console.log("Lead to convert:", lead);

    const conditions = [];

    if (lead.email) {
      conditions.push({ email: lead.email });
    }

    // Leads keep 10-digit numbers; customers are stored as 91XXXXXXXXXX.
    const customerPhone = normalizeIndianPhone(lead.phone) || lead.phone;

    if (lead.phone) {
      conditions.push({ phone: lead.phone });
      if (customerPhone !== lead.phone) conditions.push({ phone: customerPhone });
    }

    console.log("Search Conditions:", conditions);

    const existingCustomer =
      conditions.length > 0
        ? await prisma.customer.findFirst({
          where: {
            // Only look for duplicates inside the caller's OWN company.
            companyId: req.user.companyId,
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
        phone: customerPhone,
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

    logAction({
      req,
      action: "UPDATE",
      module: "LEAD",
      entityId: lead.id,
      entityName: lead.name,
      changes: {
        before: { isConverted: false },
        after: { isConverted: true, convertedToCustomerId: customer.id },
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
      where: leadScope(req, id),
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

    logAction({
      req,
      action: "DELETE",
      module: "LEAD",
      entityId: lead.id,
      entityName: lead.name,
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

// ================= BULK DELETE LEADS =================
// Admin: any lead of the company.
// Employee: only the leads assigned to them (the same leads they can see).
// There is NO limit on how many leads can be deleted at once.
// Internally the work is done in batches of 500 so that very large
// deletes never hit database limits (too many query parameters,
// time-outs). The user never sees or notices the batches.
const BULK_DELETE_BATCH_SIZE = 500;

const splitLeadIdsIntoBatches = (items, size) => {
  const batches = [];

  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }

  return batches;
};

const bulkDeleteLeads = async (req, res) => {
  try {
    const { ids } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one lead.",
      });
    }

    const uniqueIds = [
      ...new Set(
        ids
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ];

    if (uniqueIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one lead.",
      });
    }

    const idBatches = splitLeadIdsIntoBatches(
      uniqueIds,
      BULK_DELETE_BATCH_SIZE
    );

    // Find every lead this user is allowed to delete
    const leads = [];

    for (const batch of idBatches) {
      const where = {
        id: { in: batch },
        companyId: req.user.companyId,
      };

      if (req.user.role !== "ADMIN") {
        where.assignedToId = req.user.userId;
      }

      const found = await prisma.lead.findMany({
        where,
        select: { id: true, name: true },
      });

      leads.push(...found);
    }

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Leads not found",
      });
    }

    const deletableIds = leads.map((lead) => lead.id);

    // Work notes are removed automatically (onDelete: Cascade)
    for (const batch of splitLeadIdsIntoBatches(
      deletableIds,
      BULK_DELETE_BATCH_SIZE
    )) {
      await prisma.lead.deleteMany({
        where: {
          id: { in: batch },
          companyId: req.user.companyId,
        },
      });
    }

    leads.forEach((lead) => {
      logAction({
        req,
        action: "DELETE",
        module: "LEAD",
        entityId: lead.id,
        entityName: lead.name,
      });
    });

    const skippedCount = uniqueIds.length - leads.length;

    return res.status(200).json({
      success: true,
      message:
        skippedCount > 0
          ? `${leads.length} deleted, ${skippedCount} skipped`
          : `${leads.length} lead${
              leads.length === 1 ? "" : "s"
            } deleted successfully`,
      deletedCount: leads.length,
      deletedIds: deletableIds,
      skippedCount,
    });
  } catch (error) {
    console.error("Bulk Delete Leads Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete leads",
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
  bulkDeleteLeads,
};