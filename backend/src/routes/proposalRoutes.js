// ======================================================
// backend/src/routes/proposalRoutes.js   (NEW FILE)
// ======================================================
const express = require("express");

const router = express.Router();

const {
  getProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
  downloadProposalPdf,
  sendProposalOnWhatsApp,
} = require("../controllers/proposalController");

const authMiddleware = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requireFeature");
const allowWriteAccess = require("../middleware/allowWriteAccess");

// READ (everyone logged in)
router.get("/", authMiddleware, requireFeature("proposals"), getProposals);
router.get("/:id", authMiddleware, requireFeature("proposals"), getProposalById);
router.get("/:id/pdf", authMiddleware, requireFeature("proposals"), downloadProposalPdf);

// WRITE (only ACTIVE / TRIAL companies)
router.post("/", authMiddleware, requireFeature("proposals"), allowWriteAccess, createProposal);
router.put("/:id", authMiddleware, requireFeature("proposals"), allowWriteAccess, updateProposal);
router.delete("/:id", authMiddleware, requireFeature("proposals"), allowWriteAccess, deleteProposal);
router.post(
  "/:id/send-whatsapp",
  authMiddleware, requireFeature("proposals"),
  allowWriteAccess,
  sendProposalOnWhatsApp
);

module.exports = router;