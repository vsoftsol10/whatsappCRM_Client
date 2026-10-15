const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");
const {
  getInstagramAuthUrl,
  instagramCallback,
} = require("../controllers/instagramController");

// PUBLIC: Instagram redirects the customer's browser here after login.
// No login header exists on this request - the signed `state` proves who
// started it (see instagramService.verifyState).
router.get("/callback", instagramCallback);

// ADMIN: get the Instagram login URL to open
router.get("/auth-url", authMiddleware, adminOnly, getInstagramAuthUrl);

module.exports = router;
