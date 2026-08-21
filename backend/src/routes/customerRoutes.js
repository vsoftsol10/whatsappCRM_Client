

const express = require("express");
const router = express.Router();
const { checkCustomerLimit } = require("../middleware/planLimitMiddleware");

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

const authMiddleware = require("../middleware/authMiddleware");
const allowWriteAccess = require("../middleware/allowWriteAccess");

// ===============================
// READ (Allowed for everyone)
// ===============================

router.get("/", authMiddleware, getCustomers);

router.get("/:id", authMiddleware, getCustomerById);

// ===============================
// WRITE (Only ACTIVE / TRIAL companies)
// ===============================

router.post(
  "/",
  authMiddleware,
  allowWriteAccess,
  checkCustomerLimit,
  createCustomer
);

router.put(
  "/:id",
  authMiddleware,
  allowWriteAccess,
  updateCustomer
);

router.delete(
  "/:id",
  authMiddleware,
  allowWriteAccess,
  deleteCustomer
);

module.exports = router;