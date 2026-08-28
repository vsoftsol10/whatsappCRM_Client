const prisma = require("../config/prisma");

/**
 * Records an audit log entry.
 *
 * This is fire-and-forget by design — a failure to write an audit log
 * should never break the actual request (e.g. creating a customer should
 * still succeed even if the audit log insert fails for some reason).
 * Errors are caught and logged to the console only.
 *
 * @param {Object} params
 * @param {Object} params.req - Express request object (used to read req.user, ip, headers)
 * @param {"CREATE"|"UPDATE"|"DELETE"|"STATUS_CHANGE"|"ASSIGN"} params.action
 * @param {"CUSTOMER"|"EMPLOYEE"|"LEAD"|"DEAL"|"TASK"|"TICKET"|"CAMPAIGN"|"TEMPLATE"|"USER"} params.module
 * @param {string|number} [params.entityId] - id of the record affected
 * @param {string} [params.entityName] - human readable name of the record (e.g. customer name)
 * @param {Object} [params.changes] - optional before/after diff, e.g. { before: {...}, after: {...} }
 */
const logAction = async ({
  req,
  action,
  module,
  entityId,
  entityName,
  changes,
}) => {
  try {
    if (!req?.user?.companyId) {
      // No company context (e.g. SuperAdmin actions) — skip silently.
      return;
    }

    // JWT payload only carries userId/companyId/role, so resolve the
    // display name from the DB. Falls back gracefully if lookup fails.
    let userName = "Unknown";
    try {
      if (req.user.userId) {
        const actingUser = await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { name: true, email: true },
        });
        userName = actingUser?.name || actingUser?.email || "Unknown";
      }
    } catch (lookupError) {
      console.error("Audit log: failed to resolve user name:", lookupError.message);
    }

    await prisma.crmAuditLog.create({
      data: {
        companyId: req.user.companyId,

        userId: req.user.userId || null,
        userName,
        userRole: req.user.role || "UNKNOWN",

        action,
        module,

        entityId: entityId !== undefined && entityId !== null ? String(entityId) : null,
        entityName: entityName || null,

        changes: changes || undefined,

        ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
        userAgent: req.headers["user-agent"] || null,
      },
    });
  } catch (error) {
    // Never let audit logging break the actual request.
    console.error("Failed to write audit log:", error.message);
  }
};

/**
 * Same as logAction, but for cases where req.user isn't populated yet
 * (e.g. the login endpoint itself, which runs before authMiddleware).
 * Caller passes companyId/userId/userName/userRole explicitly.
 */
const logDirect = async ({
  req,
  companyId,
  userId,
  userName,
  userRole,
  action,
  module,
  entityId,
  entityName,
  changes,
}) => {
  try {
    if (!companyId) return;

    await prisma.crmAuditLog.create({
      data: {
        companyId,

        userId: userId || null,
        userName: userName || "Unknown",
        userRole: userRole || "UNKNOWN",

        action,
        module,

        entityId: entityId !== undefined && entityId !== null ? String(entityId) : null,
        entityName: entityName || null,

        changes: changes || undefined,

        ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || null,
        userAgent: req?.headers?.["user-agent"] || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error.message);
  }
};

module.exports = { logAction, logDirect };