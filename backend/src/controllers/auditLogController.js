const prisma = require("../config/prisma");

const MODULE_VALUES = [
  "CUSTOMER",
  "EMPLOYEE",
  "LEAD",
  "DEAL",
  "TASK",
  "TICKET",
  "CAMPAIGN",
  "TEMPLATE",
  "USER",
  "COMPANY",
  "BACKUP",
];

const ACTION_VALUES = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "STATUS_CHANGE",
  "ASSIGN",
  "RESTORE",
];

const SORT_OPTIONS = {
  newest: [{ createdAt: "desc" }],
  oldest: [{ createdAt: "asc" }],
  user: [{ userName: "asc" }, { createdAt: "desc" }],
  module: [{ module: "asc" }, { createdAt: "desc" }],
  action: [{ action: "asc" }, { createdAt: "desc" }],
};

// GET /api/audit-logs
// Query params: module, action, userId, startDate, endDate, search, sort, page, limit
//   search -> matches user name, record name, module or action
//   sort   -> newest (default) | oldest | user | module | action
const getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view audit logs",
      });
    }

    const {
      module,
      action,
      userId,
      startDate,
      endDate,
      search,
      sort,
      page = 1,
      limit = 25,
    } = req.query;

    const where = {
      companyId: req.user.companyId,
    };

    if (module) where.module = module;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Free-text search (user name, record name, module, action)
    const searchText = typeof search === "string" ? search.trim() : "";

    if (searchText) {
      const normalized = searchText.toUpperCase().replace(/[\s-]+/g, "_");

      const or = [
        { userName: { contains: searchText, mode: "insensitive" } },
        { entityName: { contains: searchText, mode: "insensitive" } },
      ];

      const matchedModules = MODULE_VALUES.filter((m) =>
        m.includes(normalized)
      );
      const matchedActions = ACTION_VALUES.filter((a) =>
        a.includes(normalized)
      );

      if (matchedModules.length) or.push({ module: { in: matchedModules } });
      if (matchedActions.length) or.push({ action: { in: matchedActions } });

      where.OR = or;
    }

    const orderBy = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);

    const [logs, total] = await Promise.all([
      prisma.crmAuditLog.findMany({
        where,
        orderBy,
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
      prisma.crmAuditLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("getAuditLogs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

// GET /api/audit-logs/:id
const getAuditLogById = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view audit logs",
      });
    }

    const { id } = req.params;

    const log = await prisma.crmAuditLog.findFirst({
      where: {
        id: parseInt(id, 10),
        companyId: req.user.companyId,
      },
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Audit log not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("getAuditLogById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit log",
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
};