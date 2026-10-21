// const multer = require("multer");

// // ============================================================
// // CHAT MEDIA UPLOAD (image / audio / video / document)
// // ============================================================
// // Separate from uploadMiddleware.js (which stays image-only for
// // campaigns/templates). Limits follow WhatsApp Cloud API rules:
// //   image    JPEG / PNG                      5 MB
// //   audio    AAC, AMR, MP3, M4A, OGG(opus)   16 MB
// //   video    MP4, 3GP                        16 MB
// //   document PDF, Office files, TXT          100 MB at Meta; capped at
// //            25 MB here because files are buffered in memory.
// // ============================================================

// const MB = 1024 * 1024;

// const MEDIA_RULES = {
//   image: {
//     maxBytes: 5 * MB,
//     cloudinaryResourceType: "image",
//     mimeTypes: ["image/jpeg", "image/png"],
//   },
//   audio: {
//     maxBytes: 16 * MB,
//     cloudinaryResourceType: "video", // Cloudinary stores audio under "video"
//     mimeTypes: [
//       "audio/aac",
//       "audio/mp4",
//       "audio/mpeg",
//       "audio/amr",
//       "audio/ogg",
//     ],
//   },
//   video: {
//     maxBytes: 16 * MB,
//     cloudinaryResourceType: "video",
//     mimeTypes: ["video/mp4", "video/3gpp"],
//   },
//   document: {
//     maxBytes: 25 * MB,
//     cloudinaryResourceType: "raw",
//     mimeTypes: [
//       "application/pdf",
//       "application/msword",
//       "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       "application/vnd.ms-excel",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       "application/vnd.ms-powerpoint",
//       "application/vnd.openxmlformats-officedocument.presentationml.presentation",
//       "text/plain",
//     ],
//   },
// };

// // Browsers report a few formats under non-standard names.
// const MIME_ALIASES = {
//   "audio/x-m4a": "audio/mp4",
//   "audio/m4a": "audio/mp4",
//   "audio/mp3": "audio/mpeg",
//   "audio/x-aac": "audio/aac",
//   "audio/opus": "audio/ogg",
//   "image/jpg": "image/jpeg",
// };

// const normalizeMime = (mimetype = "") => {
//   const base = String(mimetype).split(";")[0].trim().toLowerCase();
//   return MIME_ALIASES[base] || base;
// };

// // Returns { type, mime, maxBytes, cloudinaryResourceType } or null.
// const classifyMedia = (mimetype) => {
//   const mime = normalizeMime(mimetype);

//   for (const [type, rule] of Object.entries(MEDIA_RULES)) {
//     if (rule.mimeTypes.includes(mime)) {
//       return {
//         type,
//         mime,
//         maxBytes: rule.maxBytes,
//         cloudinaryResourceType: rule.cloudinaryResourceType,
//       };
//     }
//   }

//   return null;
// };

// const uploadMedia = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 25 * MB },
//   fileFilter: (req, file, cb) => {
//     if (classifyMedia(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(
//         new Error(
//           "Unsupported file type. Send JPG/PNG images, MP3/M4A/AAC/AMR/OGG audio, MP4 video, or PDF/Word/Excel/PowerPoint/TXT documents."
//         ),
//         false
//       );
//     }
//   },
// });

// // Wraps multer so upload problems come back as JSON 400s instead of
// // falling through to Express's default HTML error page.
// const handleMediaUpload = (req, res, next) => {
//   uploadMedia.single("file")(req, res, (err) => {
//     if (err) {
//       return res.status(400).json({
//         success: false,
//         message:
//           err.code === "LIMIT_FILE_SIZE"
//             ? "File is too large (maximum 25 MB)."
//             : err.message || "File upload failed",
//       });
//     }
//     next();
//   });
// };

// module.exports = { handleMediaUpload, classifyMedia, MEDIA_RULES };


const multer = require("multer");

// ============================================================
// CHAT MEDIA UPLOAD (image / audio / video / document)
// ============================================================
// Separate from uploadMiddleware.js (which stays image-only for
// campaigns/templates). Limits follow WhatsApp Cloud API rules:
//   image    JPEG / PNG                      5 MB
//   audio    AAC, AMR, MP3, M4A, OGG(opus)   16 MB
//   video    MP4, 3GP                        16 MB
//   document PDF, Office files, TXT          100 MB at Meta; capped at
//            25 MB here because files are buffered in memory.
// ============================================================

const MB = 1024 * 1024;

const MEDIA_RULES = {
  image: {
    maxBytes: 5 * MB,
    cloudinaryResourceType: "image",
    mimeTypes: ["image/jpeg", "image/png"],
  },
  audio: {
    maxBytes: 16 * MB,
    cloudinaryResourceType: "video", // Cloudinary stores audio under "video"
    mimeTypes: [
      "audio/aac",
      "audio/mp4",
      "audio/mpeg",
      "audio/amr",
      "audio/ogg",
      // Recorded by the CRM voice button in Chrome/Edge. It is converted to
      // OGG/Opus by voiceNoteMiddleware before it is sent to WhatsApp.
      "audio/webm",
    ],
  },
  video: {
    maxBytes: 16 * MB,
    cloudinaryResourceType: "video",
    mimeTypes: ["video/mp4", "video/3gpp"],
  },
  document: {
    maxBytes: 25 * MB,
    cloudinaryResourceType: "raw",
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ],
  },
};

// Browsers report a few formats under non-standard names.
const MIME_ALIASES = {
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/mp3": "audio/mpeg",
  "audio/x-aac": "audio/aac",
  "audio/opus": "audio/ogg",
  "image/jpg": "image/jpeg",
};

const normalizeMime = (mimetype = "") => {
  const base = String(mimetype).split(";")[0].trim().toLowerCase();
  return MIME_ALIASES[base] || base;
};

// Returns { type, mime, maxBytes, cloudinaryResourceType } or null.
const classifyMedia = (mimetype) => {
  const mime = normalizeMime(mimetype);

  for (const [type, rule] of Object.entries(MEDIA_RULES)) {
    if (rule.mimeTypes.includes(mime)) {
      return {
        type,
        mime,
        maxBytes: rule.maxBytes,
        cloudinaryResourceType: rule.cloudinaryResourceType,
      };
    }
  }

  return null;
};

const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * MB },
  fileFilter: (req, file, cb) => {
    if (classifyMedia(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Unsupported file type. Send JPG/PNG images, MP3/M4A/AAC/AMR/OGG audio, MP4 video, or PDF/Word/Excel/PowerPoint/TXT documents."
        ),
        false
      );
    }
  },
});

// Wraps multer so upload problems come back as JSON 400s instead of
// falling through to Express's default HTML error page.
const handleMediaUpload = (req, res, next) => {
  uploadMedia.single("file")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "File is too large (maximum 25 MB)."
            : err.message || "File upload failed",
      });
    }
    next();
  });
};

module.exports = { handleMediaUpload, classifyMedia, MEDIA_RULES };