// const express = require("express");
// const authMiddleware = require("../middleware/authMiddleware");

// const {
//   getAiSettings,
//   updateAiSettings,
//   testAiSettings,
// } = require("../controllers/aiSettingsController");

// const router = express.Router();

// // Per-company AI auto-reply configuration (ADMIN only, checked in controller)
// router.get("/", authMiddleware, getAiSettings);
// router.patch("/", authMiddleware, updateAiSettings);
// router.post("/test", authMiddleware, testAiSettings);

// module.exports = router;


const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { requireFeature } = require("../middleware/requireFeature");

const {
  getAiSettings,
  updateAiSettings,
  testAiSettings,
} = require("../controllers/aiSettingsController");

const router = express.Router();

// Per-company AI auto-reply configuration (ADMIN only, checked in controller)
router.get("/", authMiddleware, requireFeature("aiAutoReply"), getAiSettings);
router.patch("/", authMiddleware, requireFeature("aiAutoReply"), updateAiSettings);
router.post("/test", authMiddleware, requireFeature("aiAutoReply"), testAiSettings);

module.exports = router;
