

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowWriteAccess = require("../middleware/allowWriteAccess");
const {
  checkTemplateLimit,
} = require("../middleware/planLimitMiddleware");

const {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  sendTemplate,
  getTemplateRecipients,
  generateTemplateWithAI,
} = require("../controllers/templateController");

// Apply authentication to all routes
router.use(authMiddleware);

/////////////////////////////////////////////////
// READ ROUTES (Allowed for everyone)
/////////////////////////////////////////////////

// Get All Templates
router.get("/", getTemplates);

// Get Template Recipients
router.get("/:id/recipients", getTemplateRecipients);

// Get Single Template
router.get("/:id", getTemplateById);

/////////////////////////////////////////////////
// WRITE ROUTES (Only ACTIVE / TRIAL companies)
/////////////////////////////////////////////////

// Create Template
router.post(
  "/",
  allowWriteAccess,
  checkTemplateLimit,
  createTemplate
);

// Generate Template with AI
router.post(
  "/generate",
  allowWriteAccess,
  generateTemplateWithAI
);

// Update Template
router.put(
  "/:id",
  allowWriteAccess,
  updateTemplate
);

// Delete Template
router.delete(
  "/:id",
  allowWriteAccess,
  deleteTemplate
);

// Send Template
router.post(
  "/send",
  allowWriteAccess,
  sendTemplate
);

module.exports = router;