const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getAuditLogs,
  getAuditLogById,
} = require("../controllers/auditLogController");

const router = express.Router();

// Audit logs are read-only — entries are only ever created internally
// via auditLogService.logAction(), never through a public write endpoint.
router.get("/", authMiddleware, getAuditLogs);
router.get("/:id", authMiddleware, getAuditLogById);

module.exports = router;