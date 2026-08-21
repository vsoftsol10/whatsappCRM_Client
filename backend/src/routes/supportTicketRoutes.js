const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createSupportTicket,
  getMySupportTickets,
} = require("../controllers/supportTicketController");

// ============================================
// CREATE SUPPORT TICKET
// ============================================

router.post(
  "/",
  authMiddleware,
  createSupportTicket
);
router.get(
  "/",
  authMiddleware,
  getMySupportTickets
);

module.exports = router;