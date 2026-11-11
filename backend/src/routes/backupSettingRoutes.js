// backend/src/routes/backupSettingRoutes.js  (NEW FILE)
//
// Mounted at /api/backup-settings (see server.js).
// Admin only, same protection as the existing /api/backups routes.

const express = require("express");

const {
  getBackupSetting,
  saveBackupSetting,
} = require("../controllers/backupSettingController");

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.get("/", authMiddleware, adminOnly, getBackupSetting);
router.put("/", authMiddleware, adminOnly, saveBackupSetting);

module.exports = router;