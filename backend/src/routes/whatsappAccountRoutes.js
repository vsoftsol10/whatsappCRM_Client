const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getWhatsAppAccounts,
  getWhatsAppAccountById,
  createWhatsAppAccount,
  disconnectWhatsAppAccount,
  testWhatsAppConnection,
  embeddedSignup,
} = require("../controllers/whatsappAccountController");

router.use(authMiddleware);

// IMPORTANT:
// Specific routes must come before /:id

// Get all WhatsApp accounts
router.get("/", getWhatsAppAccounts);

// Test WhatsApp connection
router.get("/test-connection", testWhatsAppConnection);

// Meta Embedded Signup
router.post("/embedded-signup", embeddedSignup);

// Get WhatsApp account by ID
router.get("/:id", getWhatsAppAccountById);

// Create WhatsApp account
router.post("/", createWhatsAppAccount);

// Disconnect WhatsApp account
router.put("/:id/disconnect", disconnectWhatsAppAccount);

module.exports = router;