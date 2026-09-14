const express = require("express");

const {
  createBackup,
  getBackups,
  getBackupById,
  downloadBackup,
} = require("../controllers/backupController");

// Change this path to your actual authentication middleware
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

//////////////////////////////////////////////////////
// BACKUP ROUTES
//////////////////////////////////////////////////////

// Create manual backup
router.post("/", authMiddleware, createBackup);

// List company backups
router.get("/", authMiddleware, getBackups);

// Get one backup
router.get("/:id", authMiddleware, getBackupById);

// Download backup
router.get("/:id/download", authMiddleware, downloadBackup);

module.exports = router;