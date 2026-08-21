// const express = require("express");
// const router = express.Router();

// const {
//   createTicket,
//   getTickets,
//   getTicketById,
//   updateTicket,
//   deleteTicket,
//   updateTicketStatus,
// } = require("../controllers/ticketController");

// const {
//   getTicketWorkNotes,
//   createTicketWorkNote,
//   updateTicketWorkNote,
//   deleteTicketWorkNote,
// } = require("../controllers/ticketworknoteController");

// const authMiddleware = require("../middleware/authMiddleware");

// // ===================== CREATE =====================
// router.post("/", authMiddleware, createTicket);

// // ===================== GET ALL =====================
// router.get("/", authMiddleware, getTickets);

// // ===================== GET SINGLE =====================
// router.get("/:id", authMiddleware, getTicketById);

// // ===================== UPDATE =====================
// router.put("/:id", authMiddleware, updateTicket);

// // ===================== DELETE =====================
// router.delete("/:id", authMiddleware, deleteTicket);

// // ===================== UPDATE STATUS =====================
// router.patch("/:id/status", authMiddleware, updateTicketStatus);

// // ===================== WORK NOTES =====================
// router.get("/:id/work-notes", authMiddleware, getTicketWorkNotes);

// router.post("/:id/work-notes", authMiddleware, createTicketWorkNote);

// router.put("/work-notes/:noteId", authMiddleware, updateTicketWorkNote);

// router.delete("/work-notes/:noteId", authMiddleware, deleteTicketWorkNote);

// module.exports = router;

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
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
router.use(authMiddleware);

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