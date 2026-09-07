const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  getAiSettings,
  updateAiSettings,
} = require("../controllers/aiSettingsController");

const router = express.Router();

router.get("/", authMiddleware, getAiSettings);
router.patch("/", authMiddleware, updateAiSettings);

module.exports = router;