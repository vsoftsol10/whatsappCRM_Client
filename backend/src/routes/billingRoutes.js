const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");

const {
  createOrder,
  verifyPayment,
} = require("../controllers/billingController");

const {
  razorpayWebhook,
} = require("../controllers/billingWebhookController");

const router = express.Router();

// POST /api/billing/create-order
router.post("/create-order", authMiddleware, adminOnly, createOrder);

// POST /api/billing/verify-payment
router.post("/verify-payment", authMiddleware, adminOnly, verifyPayment);

// POST /api/billing/webhook
// Called by Razorpay (no login). Protected by the webhook signature.
router.post("/webhook", razorpayWebhook);

module.exports = router;