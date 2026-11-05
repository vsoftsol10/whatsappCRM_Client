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
const allowWriteAccess = require("../middleware/allowWriteAccess");

// READ (everyone logged in)
router.get("/", authMiddleware, getProposals);
router.get("/:id", authMiddleware, getProposalById);
router.get("/:id/pdf", authMiddleware, downloadProposalPdf);

// WRITE (only ACTIVE / TRIAL companies)
router.post("/", authMiddleware, allowWriteAccess, createProposal);
router.put("/:id", authMiddleware, allowWriteAccess, updateProposal);
router.delete("/:id", authMiddleware, allowWriteAccess, deleteProposal);
router.post(
  "/:id/send-whatsapp",
  authMiddleware,
  allowWriteAccess,
  sendProposalOnWhatsApp
);

module.exports = router;