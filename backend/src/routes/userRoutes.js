const express = require("express");
const { createEmployee } = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");
const allowWriteAccess = require("../middleware/allowWriteAccess");

const router = express.Router();

// Previously this route was public (no login). Now only a logged-in
// ADMIN can call it. Controller logic is unchanged.
router.post("/create-employee", authMiddleware, adminOnly, allowWriteAccess, createEmployee);

module.exports = router;