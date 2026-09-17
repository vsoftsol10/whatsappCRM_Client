const express = require("express");

const router = express.Router();

const {
  receiveIntegrationWebhook,
} = require("../controllers/integrationWebhookController");

// ==========================================
// RECEIVE EXTERNAL WEBHOOK
// ==========================================

router.post(
  "/webhook",
  receiveIntegrationWebhook
);

module.exports = router;