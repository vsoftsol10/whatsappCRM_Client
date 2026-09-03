

// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");
// const allowWriteAccess = require("../middleware/allowWriteAccess");
// const {
//   checkTemplateLimit,
// } = require("../middleware/planLimitMiddleware");

// const {
//   createTemplate,
//   getTemplates,
//   getTemplateById,
//   updateTemplate,
//   deleteTemplate,
//   sendTemplate,
//   getTemplateRecipients,
//   generateTemplateWithAI,
// } = require("../controllers/templateController");

// // Apply authentication to all routes
// router.use(authMiddleware);

// /////////////////////////////////////////////////
// // READ ROUTES (Allowed for everyone)
// /////////////////////////////////////////////////

// // Get All Templates
// router.get("/", getTemplates);

// // Get Template Recipients
// router.get("/:id/recipients", getTemplateRecipients);

// // Get Single Template
// router.get("/:id", getTemplateById);

// /////////////////////////////////////////////////
// // WRITE ROUTES (Only ACTIVE / TRIAL companies)
// /////////////////////////////////////////////////

// // Create Template
// router.post(
//   "/",
//   allowWriteAccess,
//   checkTemplateLimit,
//   createTemplate
// );

// // Generate Template with AI
// router.post(
//   "/generate",
//   allowWriteAccess,
//   generateTemplateWithAI
// );

// // Update Template
// router.put(
//   "/:id",
//   allowWriteAccess,
//   updateTemplate
// );

// // Delete Template
// router.delete(
//   "/:id",
//   allowWriteAccess,
//   deleteTemplate
// );

// // Send Template
// router.post(
//   "/send",
//   allowWriteAccess,
//   sendTemplate
// );

// module.exports = router;


const express = require("express");

const router = express.Router();

// ============================================================
// MIDDLEWARE
// ============================================================

const authMiddleware = require("../middleware/authMiddleware");
const allowWriteAccess = require("../middleware/allowWriteAccess");
const {
  checkTemplateLimit,
} = require("../middleware/planLimitMiddleware");

// ============================================================
// CONTROLLER
// ============================================================

const {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  sendTemplate,
  getTemplateRecipients,
  generateTemplateWithAI,
  submitTemplateForApproval,
} = require("../controllers/templateController");

// ============================================================
// AUTHENTICATION
// ============================================================
//
// Every template route requires a logged-in user.
//

router.use(authMiddleware);

// ============================================================
// READ ROUTES
// ============================================================
//
// These routes are available to authenticated users.
// Company isolation is handled inside the controller using
// req.user.companyId.
//

// GET /api/templates
// Get all templates
router.get("/", getTemplates);

// GET /api/templates/:id/recipients
// Get recipients / delivery history for a template
//
// IMPORTANT:
// This route must come BEFORE /:id.
// Otherwise Express could interpret "recipients" as a template ID.
router.get(
  "/:id/recipients",
  getTemplateRecipients
);

// GET /api/templates/:id
// Get one template
router.get(
  "/:id",
  getTemplateById
);

router.post(
  "/:id/submit",
  allowWriteAccess,
  submitTemplateForApproval
);

router.post(
  "/",
  allowWriteAccess,
  checkTemplateLimit,
  createTemplate
);

// ============================================================
// AI TEMPLATE GENERATOR
// ============================================================
//
// POST /api/templates/generate
//
// This only generates content.
// It does NOT create a Meta template.
//

router.post(
  "/generate",
  allowWriteAccess,
  generateTemplateWithAI
);

// ============================================================
// UPDATE TEMPLATE
// ============================================================
//
// PUT /api/templates/:id
//
// Approved Meta templates should not be edited directly.
// Your controller already handles this validation.
//

router.put(
  "/:id",
  allowWriteAccess,
  updateTemplate
);

// ============================================================
// DELETE TEMPLATE
// ============================================================
//
// DELETE /api/templates/:id
//

router.delete(
  "/:id",
  allowWriteAccess,
  deleteTemplate
);

// ============================================================
// SEND TEMPLATE
// ============================================================
//
// POST /api/templates/send
//
// Your controller already checks:
//
// template.status === "APPROVED"
//
// So DRAFT / PENDING / REJECTED templates cannot be sent.
//

router.post(
  "/send",
  allowWriteAccess,
  sendTemplate
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;