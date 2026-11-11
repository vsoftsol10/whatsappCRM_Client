const multer = require("multer");
const { MAX_FILE_BYTES } = require("../services/kbImportService");

// Knowledge base import: one CSV / Excel file, kept in memory (max 5 MB).
const ALLOWED_FILE = /\.(csv|xlsx|xls)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 5 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE.test(file.originalname || "")) return cb(null, true);
    return cb(new Error("Please upload a .csv or .xlsx file."));
  },
});

// Turns upload problems into a normal JSON 400 (same style as the rest of the API)
const kbImportUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "The file is too large. Keep it under 5 MB."
        : error.message || "File upload failed.";

    return res.status(400).json({ success: false, message });
  });
};

module.exports = kbImportUpload;