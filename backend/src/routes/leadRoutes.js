// const authMiddleware = require("../middleware/authMiddleware");
// const express = require("express");

// const {
//   createLead,
//   getLeads,
//   updateLead,
//   updateLeadStatus,
//   convertLeadToCustomer,
//   deleteLead,
// } = require("../controllers/leadController");

// const {
//   getLeadWorkNotes,
//   createLeadWorkNote,
//   updateLeadWorkNote,
//   deleteLeadWorkNote,
// } = require("../controllers/leadworknoteController");

// const router = express.Router();

// router.use(authMiddleware);

// // Create Lead
// router.post("/", createLead);

// // Get All Leads
// router.get("/", getLeads);

// // Update Lead
// router.put("/:id", updateLead);

// // Update Lead Status
// router.patch("/:id/status", updateLeadStatus);

// // Convert Lead to Customer
// router.post("/:id/convert", convertLeadToCustomer);

// // ================= WORK NOTES =================

// // Get Work Notes for a Lead
// router.get("/:id/work-notes", getLeadWorkNotes);

// // Add Work Note to a Lead
// router.post("/:id/work-notes", createLeadWorkNote);

// // Update a Work Note
// router.put("/work-notes/:noteId", updateLeadWorkNote);

// // Delete a Work Note
// router.delete("/work-notes/:noteId", deleteLeadWorkNote);

// // Delete Lead
// router.delete("/:id", deleteLead);

// module.exports = router;

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowWriteAccess = require("../middleware/allowWriteAccess");

const {
  createLead,
  getLeads,
  updateLead,
  updateLeadStatus,
  convertLeadToCustomer,
  deleteLead,
} = require("../controllers/leadController");

const {
  getLeadWorkNotes,
  createLeadWorkNote,
  updateLeadWorkNote,
  deleteLeadWorkNote,
} = require("../controllers/leadworknoteController");

// Apply authentication to all routes
router.use(authMiddleware);

/////////////////////////////////////////////////
// READ ROUTES (Allowed for everyone)
/////////////////////////////////////////////////

// Get All Leads
router.get("/", getLeads);

// Get Work Notes
router.get("/:id/work-notes", getLeadWorkNotes);

/////////////////////////////////////////////////
// WRITE ROUTES (Only ACTIVE / TRIAL companies)
/////////////////////////////////////////////////

// Create Lead
router.post(
  "/",
  allowWriteAccess,
  createLead
);

// Update Lead
router.put(
  "/:id",
  allowWriteAccess,
  updateLead
);

// Update Lead Status
router.patch(
  "/:id/status",
  allowWriteAccess,
  updateLeadStatus
);

// Convert Lead to Customer
router.post(
  "/:id/convert",
  allowWriteAccess,
  convertLeadToCustomer
);

// Add Work Note
router.post(
  "/:id/work-notes",
  allowWriteAccess,
  createLeadWorkNote
);

// Update Work Note
router.put(
  "/work-notes/:noteId",
  allowWriteAccess,
  updateLeadWorkNote
);

// Delete Work Note
router.delete(
  "/work-notes/:noteId",
  allowWriteAccess,
  deleteLeadWorkNote
);

// Delete Lead
router.delete(
  "/:id",
  allowWriteAccess,
  deleteLead
);

module.exports = router;