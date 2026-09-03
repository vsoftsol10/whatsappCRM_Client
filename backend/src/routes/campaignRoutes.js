
const express = require("express");

const router = express.Router();


// ============================================================
// MIDDLEWARE
// ============================================================

const authMiddleware = require("../middleware/authMiddleware");

const allowWriteAccess = require("../middleware/allowWriteAccess");

const upload = require("../middleware/uploadMiddleware");

const {
  checkCampaignLimit,
} = require("../middleware/planLimitMiddleware");


// ============================================================
// CONTROLLERS
// ============================================================

const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  generateAICampaign,
  sendCampaign,
  getCampaignRecipients,
} = require("../controllers/campaignController");


// ============================================================
// AUTHENTICATION
// ============================================================
//
// Every campaign route requires a logged-in user.
//

router.use(authMiddleware);


// ============================================================
// READ ROUTES
// ============================================================
//
// These routes only read campaign information.
// They don't modify company data.
//

// ------------------------------------------------------------
// GET ALL CAMPAIGNS
// GET /api/campaigns
// ------------------------------------------------------------

router.get(
  "/",
  getCampaigns
);


// ------------------------------------------------------------
// GET CAMPAIGN RECIPIENTS
// GET /api/campaigns/:id/recipients
// ------------------------------------------------------------
//
// IMPORTANT:
// This must come before "/:id".
//

router.get(
  "/:id/recipients",
  getCampaignRecipients
);


// ------------------------------------------------------------
// GET SINGLE CAMPAIGN
// GET /api/campaigns/:id
// ------------------------------------------------------------

router.get(
  "/:id",
  getCampaignById
);


// ============================================================
// WRITE ROUTES
// ============================================================
//
// Only ACTIVE / TRIAL companies should be allowed
// to create/update/send/delete campaigns.
//

// ============================================================
// CREATE CAMPAIGN
// ============================================================
//
// POST /api/campaigns
//
// Supports:
// - Campaign name
// - Campaign type
// - WhatsApp template
// - Audience
// - Schedule
// - Optional image
//
// checkCampaignLimit is applied here because creating
// a campaign consumes the company's campaign allowance.
//

router.post(
  "/",
  allowWriteAccess,
  checkCampaignLimit,
  upload.single("image"),
  createCampaign
);


// ============================================================
// GENERATE AI CAMPAIGN
// ============================================================
//
// POST /api/campaigns/generate-ai
//
// Generates campaign content using AI.
//
// This route does NOT need image upload.
//

router.post(
  "/generate-ai",
  allowWriteAccess,
  generateAICampaign
);


// ============================================================
// SEND CAMPAIGN
// ============================================================
//
// POST /api/campaigns/send
//
// Sends the selected campaign to its saved recipients.
//
// The new controller gets:
// - campaignId
// - campaign.template
// - campaign.recipients
//
// from the database.
//

router.post(
  "/send",
  allowWriteAccess,
  sendCampaign
);


// ============================================================
// UPDATE CAMPAIGN
// ============================================================
//
// PUT /api/campaigns/:id
//
// Supports:
// - Campaign name
// - Campaign type
// - Template
// - Message content
// - Schedule
// - Status
// - Optional image
//

router.put(
  "/:id",
  allowWriteAccess,
  upload.single("image"),
  updateCampaign
);


// ============================================================
// DELETE CAMPAIGN
// ============================================================
//
// DELETE /api/campaigns/:id
//

router.delete(
  "/:id",
  allowWriteAccess,
  deleteCampaign
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;

