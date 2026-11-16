const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");
const allowWriteAccess = require("../middleware/allowWriteAccess");

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
router.post("/connect", adminOnly, allowWriteAccess, connectFacebookPages);

// Disconnect a Page
router.put("/pages/:id/disconnect", adminOnly, allowWriteAccess, disconnectFacebookPage);

module.exports = router;