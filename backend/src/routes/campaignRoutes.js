

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowWriteAccess = require("../middleware/allowWriteAccess");
const upload = require("../middleware/uploadMiddleware");
const {
  checkCampaignLimit,
} = require("../middleware/planLimitMiddleware");

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

// Apply authentication to all routes
router.use(authMiddleware);

/////////////////////////////////////////////////
// READ ROUTES (Allowed for everyone)
/////////////////////////////////////////////////

// Get All Campaigns
router.get(
  "/",
  getCampaigns
);

// Get Campaign Recipients
router.get(
  "/:id/recipients",
  getCampaignRecipients
);

// Get Single Campaign
router.get(
  "/:id",
  getCampaignById
);

/////////////////////////////////////////////////
// WRITE ROUTES (Only ACTIVE / TRIAL companies)
/////////////////////////////////////////////////

// Create Campaign
router.post(
  "/",
  allowWriteAccess,
  checkCampaignLimit,
  upload.single("image"),
  createCampaign
);

// Generate AI Campaign
router.post(
  "/generate-ai",
  allowWriteAccess,
  generateAICampaign
);

// Send Campaign
router.post(
  "/send",
  allowWriteAccess,
  sendCampaign
);

// Update Campaign
router.put(
  "/:id",
  allowWriteAccess,
  upload.single("image"),
  updateCampaign
);

// Delete Campaign
router.delete(
  "/:id",
  allowWriteAccess,
  deleteCampaign
);

module.exports = router;