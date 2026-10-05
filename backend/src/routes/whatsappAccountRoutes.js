// const express = require("express");

// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");

// const {
//   getWhatsAppAccounts,
//   getWhatsAppAccountById,
//   createWhatsAppAccount,
//   disconnectWhatsAppAccount,
//   testWhatsAppConnection,
//   embeddedSignup,
//   getCoexistenceStatus,
// } = require("../controllers/whatsappAccountController");

// router.use(authMiddleware);

// // IMPORTANT:
// // Specific routes must come before /:id

// // Get all WhatsApp accounts
// router.get("/", getWhatsAppAccounts);

// // Test WhatsApp connection
// router.get("/test-connection", testWhatsAppConnection);

// // Meta Embedded Signup (handles standard signup AND Coexistence)
// router.post("/embedded-signup", embeddedSignup);

// // Coexistence sync status (contacts + chat history sync progress)
// router.get("/:id/coexistence-status", getCoexistenceStatus);

// // Get WhatsApp account by ID
// router.get("/:id", getWhatsAppAccountById);

// // Create WhatsApp account
// router.post("/", createWhatsAppAccount);

// // Disconnect WhatsApp account
// router.put("/:id/disconnect", disconnectWhatsAppAccount);

// module.exports = router;

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");

const {
  getWhatsAppAccounts,
  getWhatsAppAccountById,
  createWhatsAppAccount,
  disconnectWhatsAppAccount,
  testWhatsAppConnection,
  embeddedSignup,
  getCoexistenceStatus,
} = require("../controllers/whatsappAccountController");

router.use(authMiddleware);

// IMPORTANT:
// Specific routes must come before /:id

// ---------------------------------------------
// READ-ONLY routes: admin AND employee (USER)
// ---------------------------------------------

// Get all WhatsApp accounts (token is never returned)
router.get("/", getWhatsAppAccounts);

// Test WhatsApp connection
router.get("/test-connection", testWhatsAppConnection);

// Coexistence sync status (contacts + chat history sync progress)
router.get("/:id/coexistence-status", getCoexistenceStatus);

// Get WhatsApp account by ID
router.get("/:id", getWhatsAppAccountById);

// ---------------------------------------------
// WRITE routes: ADMIN only
// ---------------------------------------------

// Meta Embedded Signup (handles standard signup AND Coexistence)
router.post("/embedded-signup", adminOnly, embeddedSignup);

// Create WhatsApp account (manual)
router.post("/", adminOnly, createWhatsAppAccount);

// Disconnect WhatsApp account
router.put("/:id/disconnect", adminOnly, disconnectWhatsAppAccount);

module.exports = router;