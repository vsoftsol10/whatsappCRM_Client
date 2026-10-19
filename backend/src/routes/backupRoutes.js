const express = require("express");

const {
  createBackup,
  getBackups,
  getBackupById,
  downloadBackup,
  downloadBackupExcel,
} = require("../controllers/backupController");

// Change this path to your actual authentication middleware
const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

//////////////////////////////////////////////////////
// BACKUP ROUTES
//////////////////////////////////////////////////////

// Create manual backup
router.post("/", authMiddleware, adminOnly, createBackup);

// List company backups
router.get("/", authMiddleware, adminOnly, getBackups);

// Get one backup
router.get("/:id", authMiddleware, adminOnly, getBackupById);

// Download backup (ZIP with JSON - technical / restore)
router.get("/:id/download", authMiddleware, adminOnly, downloadBackup);

// Download backup as Excel (readable for normal users)
router.get(
  "/:id/download/excel",
  authMiddleware,
  adminOnly,
  downloadBackupExcel
);

module.exports = router;