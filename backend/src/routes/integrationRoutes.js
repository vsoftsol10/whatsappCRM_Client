// const express = require("express");

// const router = express.Router();

// const {
//   createIntegration,
//   getIntegrations,
//   getIntegrationById,
//   updateIntegrationStatus,
//   deleteIntegration,
// } = require("../controllers/integrationController");

// // Use the SAME authentication middleware
// // that your existing CRM routes use.
// const authMiddleware = require("../middleware/authMiddleware");

// // ==========================================
// // GET ALL INTEGRATIONS
// // ==========================================

// router.get("/", authMiddleware, getIntegrations);

// // ==========================================
// // GET SINGLE INTEGRATION
// // ==========================================

// router.get("/:id", authMiddleware, getIntegrationById);

// // ==========================================
// // CREATE INTEGRATION
// // ==========================================

// router.post("/", authMiddleware, createIntegration);

// // ==========================================
// // UPDATE INTEGRATION STATUS
// // ==========================================

// router.put("/:id/status", authMiddleware, updateIntegrationStatus);

// // ==========================================
// // DELETE INTEGRATION
// // ==========================================

// router.delete("/:id", authMiddleware, deleteIntegration);

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

module.exports = router;