const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getCompanySettings,
  updateCompanySettings,
} = require("../controllers/companyController");

const router = express.Router();

// Runs the multer upload but turns upload problems (wrong file type,
// file too large, etc.) into a logged JSON response. Without this,
// multer errors bypass the controller entirely — nothing is printed
// in the backend console and the UI only sees a generic failure.
const handleLogoUpload = (req, res, next) => {
  upload.single("logo")(req, res, (err) => {
    if (err) {
      console.error("COMPANY LOGO UPLOAD ERROR:", err.message);

      return res.status(400).json({
        success: false,
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Logo is too large. Maximum size is 15 MB."
            : err.message || "Logo upload failed",
      });
    }

    next();
  });
};

// Any authenticated CRM user (admin or employee) can read the
// company's branding — needed to render the sidebar logo/name.
router.get("/settings", authMiddleware, getCompanySettings);

// Only the company ADMIN can update it (enforced in the controller,
// so employees get a clean 403 with a proper message).
router.put(
  "/settings",
  authMiddleware,
  handleLogoUpload,
  updateCompanySettings
);

module.exports = router;