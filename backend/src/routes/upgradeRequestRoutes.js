const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  createUpgradeRequest,
  getMyUpgradeRequest,
} = require("../controllers/upgradeRequestController");

const router = express.Router();

// ==========================================
// CREATE UPGRADE REQUEST
// POST /api/upgrade-requests
// ==========================================
router.post(
  "/",
  authMiddleware,
  createUpgradeRequest
);

// ==========================================
// GET MY UPGRADE REQUEST
// GET /api/upgrade-requests/me
// ==========================================
router.get(
  "/me",
  authMiddleware,
  getMyUpgradeRequest
);

module.exports = router;