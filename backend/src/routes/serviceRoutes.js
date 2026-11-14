const express = require("express");

const router = express.Router();

const {
  getServices,
  createService,
  updateService,
  deleteService,
  getServiceCustomers,
  setServiceCustomers,
} = require("../controllers/serviceController");

const authMiddleware = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requireFeature");
const allowWriteAccess = require("../middleware/allowWriteAccess");
const adminOnly = require("../middleware/adminOnly");

// ===============================
// READ (everyone logged in)
// ===============================
router.get("/", authMiddleware, getServices);

router.get("/:id/customers", authMiddleware, requireFeature("services"), getServiceCustomers);

// ===============================
// WRITE
// Only ACTIVE / TRIAL companies
// Create / edit / delete a service = ADMIN only
// ===============================
router.post("/", authMiddleware, requireFeature("services"), allowWriteAccess, adminOnly, createService);

router.put("/:id", authMiddleware, requireFeature("services"), allowWriteAccess, adminOnly, updateService);

router.delete(
  "/:id",
  authMiddleware, requireFeature("services"),
  allowWriteAccess,
  adminOnly,
  deleteService
);

// Assigning customers to a service = any user who can edit customers
router.put(
  "/:id/customers",
  authMiddleware, requireFeature("services"),
  allowWriteAccess,
  setServiceCustomers
);

module.exports = router;
