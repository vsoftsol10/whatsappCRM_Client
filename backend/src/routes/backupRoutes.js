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

const {
  previewBackupRestore,
  restoreBackupData,
  getRestoreHistory,
} = require("../controllers/backupRestoreController");

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");
const allowWriteAccess = require("../middleware/allowWriteAccess");

const router = express.Router();

// POST /api/backups  -> create manual backup
router.post("/", authMiddleware, adminOnly, createBackup);

// GET /api/backups  -> list company backups
router.get("/", authMiddleware, adminOnly, getBackups);

// GET /api/backups/restores  -> restore history (must stay above "/:id")
router.get("/restores", authMiddleware, adminOnly, getRestoreHistory);

// GET /api/backups/:id/restore-preview  -> what a restore would do (changes nothing)
router.get(
  "/:id/restore-preview",
  authMiddleware,
  adminOnly,
  previewBackupRestore
);

// POST /api/backups/:id/restore  -> restore (needs the preview's confirmation token)
// allowWriteAccess: a restore is a write, so expired companies cannot do it.
router.post(
  "/:id/restore",
  authMiddleware,
  adminOnly,
  allowWriteAccess,
  restoreBackupData
);

// GET /api/backups/:id  -> one backup
router.get("/:id", authMiddleware, adminOnly, getBackupById);

// GET /api/backups/:id/download/excel  -> download
router.get("/:id/download/excel", authMiddleware, adminOnly, downloadBackupExcel);

module.exports = router;