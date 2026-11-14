
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requireFeature");
const allowWriteAccess = require("../middleware/allowWriteAccess");

const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  updateTicketStatus,
} = require("../controllers/ticketController");

const {
  getTicketWorkNotes,
  createTicketWorkNote,
  updateTicketWorkNote,
  deleteTicketWorkNote,
} = require("../controllers/ticketworknoteController");

// Apply authentication to all routes
router.use(authMiddleware, requireFeature("tickets"));

/////////////////////////////////////////////////
// READ ROUTES (Allowed for everyone)
/////////////////////////////////////////////////

// Get All Tickets
router.get("/", getTickets);

// Get Single Ticket
router.get("/:id", getTicketById);

// Get Work Notes
router.get("/:id/work-notes", getTicketWorkNotes);

/////////////////////////////////////////////////
// WRITE ROUTES (Only ACTIVE / TRIAL companies)
/////////////////////////////////////////////////

// Create Ticket
router.post(
  "/",
  allowWriteAccess,
  createTicket
);

// Update Ticket
router.put(
  "/:id",
  allowWriteAccess,
  updateTicket
);

// Delete Ticket
router.delete(
  "/:id",
  allowWriteAccess,
  deleteTicket
);

// Update Ticket Status
router.patch(
  "/:id/status",
  allowWriteAccess,
  updateTicketStatus
);

// Add Work Note
router.post(
  "/:id/work-notes",
  allowWriteAccess,
  createTicketWorkNote
);

// Update Work Note
router.put(
  "/work-notes/:noteId",
  allowWriteAccess,
  updateTicketWorkNote
);

// Delete Work Note
router.delete(
  "/work-notes/:noteId",
  allowWriteAccess,
  deleteTicketWorkNote
);

module.exports = router;