const express = require("express");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  getStatus,
  chat,
  latestConversation,
  feedback,
} = require("../controllers/supportBotController");

// Each question costs money -> limit per logged-in user (authMiddleware runs
// first, so req.user is always set here).
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 12,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `support-bot:${req.user.userId}`,
  message: {
    success: false,
    message: "You are asking too fast. Please wait a moment.",
  },
});

// Intentionally NOT behind allowWriteAccess: even a company whose plan has
// expired should be able to ask how to renew / contact support.
router.use(authMiddleware);

router.get("/status", getStatus);
router.get("/conversations/latest", latestConversation);
router.post("/chat", chatLimiter, chat);
router.post("/feedback", feedback);

module.exports = router;