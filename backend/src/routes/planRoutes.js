const express = require("express");
const { getPlans } = require("../controllers/planController");

const router = express.Router();

// ========================================
// GET ALL ACTIVE SUBSCRIPTION PLANS
// GET /api/subscriptions/plans
// ========================================
router.get("/plans", getPlans);

module.exports = router;