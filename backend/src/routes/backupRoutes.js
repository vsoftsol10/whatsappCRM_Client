const express = require("express");

const {
  createBackup,
  getBackups,
  getBackupById,
  downloadBackup,
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

// Download backup
router.get("/:id/download", authMiddleware, adminOnly, downloadBackup);

module.exports = router;