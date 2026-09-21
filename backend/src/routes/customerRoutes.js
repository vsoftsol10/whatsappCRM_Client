
const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  checkCustomerLimit,
} = require("../middleware/planLimitMiddleware");

const {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  previewCustomerImport,
  importCustomers,
} = require("../controllers/customerController");

const authMiddleware = require("../middleware/authMiddleware");
const allowWriteAccess = require("../middleware/allowWriteAccess");

// ===============================
// MULTER - CUSTOMER IMPORT
// ===============================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase();

    const allowedFile = /\.(xlsx|xls|csv)$/.test(fileName);

    if (allowedFile) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only Excel (.xlsx, .xls) or CSV files are allowed."
        )
      );
    }
  },
});

const handleCustomerImportUpload = (req, res, next) => {
  console.log("🔥 MULTER STARTED");

  upload.any()(req, res, (error) => {
    console.log("🔥 MULTER CALLBACK");

    if (error) {
      console.error("❌ MULTER ERROR:", error);

      return res.status(400).json({
        success: false,
        message: error.message || "File upload failed.",
      });
    }

    console.log("🔥 FILES RECEIVED:", req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No file received.",
      });
    }

    console.log("🔥 FIELD NAME:", req.files[0].fieldname);
    console.log("🔥 FILE NAME:", req.files[0].originalname);

    req.file = req.files[0];

    next();
  });
};

// ===============================
// READ (Allowed for everyone)
// ===============================

router.get(
  "/",
  authMiddleware,
  getCustomers
);

// ===============================
// CUSTOMER IMPORT PREVIEW
// ===============================

router.post(
  "/import/preview",
  authMiddleware,
  allowWriteAccess,
  (req, res, next) => {
    console.log("🔥 IMPORT ROUTE HIT");
    console.log("🔥 AUTH USER:", req.user);
    next();
  },
  handleCustomerImportUpload,
  (req, res, next) => {
    console.log("🔥 UPLOAD MIDDLEWARE PASSED");
    next();
  },
  previewCustomerImport
);


router.post(
  "/import",
  authMiddleware,
  allowWriteAccess,
  importCustomers
);

// ===============================
// GET CUSTOMER BY ID
// ===============================

router.get(
  "/:id",
  authMiddleware,
  getCustomerById
);

// ===============================
// WRITE
// Only ACTIVE / TRIAL companies
// ===============================

router.post(
  "/",
  authMiddleware,
  allowWriteAccess,
  checkCustomerLimit,
  createCustomer
);

router.put(
  "/:id",
  authMiddleware,
  allowWriteAccess,
  updateCustomer
);

router.delete(
  "/:id",
  authMiddleware,
  allowWriteAccess,
  deleteCustomer
);

module.exports = router;