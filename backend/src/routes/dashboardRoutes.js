const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getRecentConversations,
} = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");

router.get("/stats", authMiddleware, getDashboardStats);
router.get(
  "/recent-conversations",
  authMiddleware,
  getRecentConversations
);

module.exports = router;