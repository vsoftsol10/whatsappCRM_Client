

// const express = require("express");

// const router = express.Router();

// const {
//   createIntegration,
//   getIntegrations,
//   getIntegrationById,
//   updateIntegrationStatus,
//   deleteIntegration,
// } = require("../controllers/integrationController");

// const {
//   getIntegrationEvents,
// } = require("../controllers/integrationEventController");

// const authMiddleware = require("../middleware/authMiddleware");

// // ==========================================
// // GET ALL INTEGRATIONS
// // ==========================================

// router.get(
//   "/",
//   authMiddleware,
//   getIntegrations
// );

// // ==========================================
// // GET INTEGRATION EVENTS
// // IMPORTANT: Keep this BEFORE /:id
// // ==========================================

// router.get(
//   "/:id/events",
//   authMiddleware,
//   getIntegrationEvents
// );

// // ==========================================
// // GET SINGLE INTEGRATION
// // ==========================================

// router.get(
//   "/:id",
//   authMiddleware,
//   getIntegrationById
// );

// // ==========================================
// // CREATE INTEGRATION
// // ==========================================

// router.post(
//   "/",
//   authMiddleware,
//   createIntegration
// );

// // ==========================================
// // UPDATE INTEGRATION STATUS
// // ==========================================

// router.put(
//   "/:id/status",
//   authMiddleware,
//   updateIntegrationStatus
// );

// // ==========================================
// // DELETE INTEGRATION
// // ==========================================

// router.delete(
//   "/:id",
//   authMiddleware,
//   deleteIntegration
// );

// module.exports = router;


const express = require("express");

const router = express.Router();

const {
  createIntegration,
  getIntegrations,
  getIntegrationById,
  updateIntegrationStatus,
  deleteIntegration,
} = require("../controllers/integrationController");

const {
  getIntegrationEvents,
} = require("../controllers/integrationEventController");

const {
  receiveIntegrationWebhook,
} = require("../controllers/integrationWebhookController");

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// GET ALL INTEGRATIONS
// ==========================================

router.get(
  "/",
  authMiddleware,
  getIntegrations
);

// ==========================================
// GET INTEGRATION EVENTS
// IMPORTANT: Keep this BEFORE /:id
// ==========================================

router.get(
  "/:id/events",
  authMiddleware,
  getIntegrationEvents
);

// ==========================================
// GET SINGLE INTEGRATION
// ==========================================

router.get(
  "/:id",
  authMiddleware,
  getIntegrationById
);

// ==========================================
// CREATE INTEGRATION
// ==========================================

router.post(
  "/",
  authMiddleware,
  createIntegration
);

// ==========================================
// UPDATE INTEGRATION STATUS
// ==========================================

router.put(
  "/:id/status",
  authMiddleware,
  updateIntegrationStatus
);

// ==========================================
// DELETE INTEGRATION
// ==========================================

router.delete(
  "/:id",
  authMiddleware,
  deleteIntegration
);

// ==========================================
// EXTERNAL WEBHOOK
// IMPORTANT:
// - NO authMiddleware here
// - External billing/e-commerce system calls this
// - webhookKey identifies the integration
// ==========================================

router.post(
  "/webhook/:webhookKey",
  receiveIntegrationWebhook
);

module.exports = router;