

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requireFeature");
const allowWriteAccess = require("../middleware/allowWriteAccess");

const {
  createLead,
  getLeads,
  updateLead,
  updateLeadStatus,
  convertLeadToCustomer,
  deleteLead,
  bulkDeleteLeads,
} = require("../controllers/leadController");

const {
  getLeadWorkNotes,
  createLeadWorkNote,
  updateLeadWorkNote,
  deleteLeadWorkNote,
} = require("../controllers/leadworknoteController");

// Apply authentication to all routes
router.use(authMiddleware, requireFeature("leads"));

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

// Bulk Delete Leads
router.post(
  "/bulk-delete",
  allowWriteAccess,
  bulkDeleteLeads
);

// Delete Lead
router.delete(
  "/:id",
  allowWriteAccess,
  deleteLead
);

module.exports = router;