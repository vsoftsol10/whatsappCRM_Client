// const express = require("express");

// const {
//   createBackup,
//   getBackups,
//   getBackupById,
//   downloadBackupExcel,
// } = require("../controllers/backupController");

// // Change this path to your actual authentication middleware
// const authMiddleware = require("../middleware/authMiddleware");
// const adminOnly = require("../middleware/adminOnly");

// const router = express.Router();

// //////////////////////////////////////////////////////
// // BACKUP ROUTES
// //////////////////////////////////////////////////////

// // Create manual backup
// router.post("/", authMiddleware, adminOnly, createBackup);

// // List company backups
// router.get("/", authMiddleware, adminOnly, getBackups);

// // Get one backup
// router.get("/:id", authMiddleware, adminOnly, getBackupById);

// // Download backup (Excel only)
// router.get(
//   "/:id/download/excel",
//   authMiddleware,
//   adminOnly,
//   downloadBackupExcel
// );

// module.exports = router;

const express = require("express");

const {
  createBackup,
  getBackups,
  getBackupById,
  downloadBackupExcel,
} = require("../controllers/backupController");

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// POST /api/backups  -> create manual backup
router.post("/", authMiddleware, adminOnly, createBackup);

// GET /api/backups  -> list company backups
router.get("/", authMiddleware, adminOnly, getBackups);

// GET /api/backups/:id  -> one backup
router.get("/:id", authMiddleware, adminOnly, getBackupById);

// GET /api/backups/:id/download/excel  -> download
router.get("/:id/download/excel", authMiddleware, adminOnly, downloadBackupExcel);

module.exports = router;