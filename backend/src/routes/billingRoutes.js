const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");

const {
  createOrder,
  verifyPayment,
} = require("../controllers/billingController");

const router = express.Router();

// POST /api/billing/create-order
router.post("/create-order", authMiddleware, adminOnly, createOrder);

// POST /api/billing/verify-payment
router.post("/verify-payment", authMiddleware, adminOnly, verifyPayment);

module.exports = router;