const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const {
  getMySubscription,
  getPlans,
  upgradePlan,
  getMyFeatures,
} = require("../controllers/subscriptionController");

const router = express.Router();

// Current subscription
router.get("/me", authMiddleware, getMySubscription);
router.get("/features", authMiddleware, getMyFeatures);

// Available plans
router.get("/plans", authMiddleware, getPlans);

// Upgrade plan
router.post("/upgrade", authMiddleware, upgradePlan);

module.exports = router;