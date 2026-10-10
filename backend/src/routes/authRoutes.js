
const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// NOTE: public "/register" route removed for security.
// Employees are created by an admin through POST /api/employees.

// Login user
router.post("/login", loginUser);

// Get logged-in user (Protected route)
router.get("/me", authMiddleware, getMe);

// Update MY OWN profile (Protected — admin or employee, self only)
router.put(
  "/update-profile",
  authMiddleware,
  upload.single("profileImage"),
  updateProfile
);

router.post("/change-password", authMiddleware, changePassword);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

module.exports = router;