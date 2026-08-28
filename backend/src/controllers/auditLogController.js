const prisma = require("../config/prisma");

// GET /api/audit-logs
// Query params: module, action, userId, startDate, endDate, page, limit
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

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 25, 1), 100);

    const [logs, total] = await Promise.all([
      prisma.crmAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
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