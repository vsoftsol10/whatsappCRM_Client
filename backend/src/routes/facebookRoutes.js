const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");

const {
  getFacebookPages,
  connectFacebookPages,
  disconnectFacebookPage,
} = require("../controllers/facebookController");

router.use(authMiddleware);

// ---------------------------------------------
// READ-ONLY: admin AND employee
// ---------------------------------------------

// List this company's connected Facebook Pages (tokens are never returned)
router.get("/pages", getFacebookPages);

// ---------------------------------------------
// WRITE: ADMIN only
// ---------------------------------------------

// Connect Pages after the Facebook login popup
router.post("/connect", adminOnly, connectFacebookPages);

// Disconnect a Page
router.put("/pages/:id/disconnect", adminOnly, disconnectFacebookPage);

module.exports = router;
