const express = require("express");
const { createEmployee } = require("../controllers/userController");

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// Previously this route was public (no login). Now only a logged-in
// ADMIN can call it. Controller logic is unchanged.
router.post("/create-employee", authMiddleware, adminOnly, createEmployee);

module.exports = router;