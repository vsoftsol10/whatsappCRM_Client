

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowWriteAccess = require("../middleware/allowWriteAccess");
const { handleMediaUpload } = require("../middleware/mediaUploadMiddleware");

const {
  sendMessage,
  sendMediaMessage,
  getMessagesByConversation,
  editMessage,
  deleteMessage,
} = require("../controllers/messageController");

// Expired / inactive companies cannot send, edit or delete messages (view-only).
router.post("/", authMiddleware, allowWriteAccess, sendMessage);

// Image / voice (audio) / video / document attachments (multipart, field "file").
router.post(
  "/media",
  authMiddleware,
  allowWriteAccess,
  handleMediaUpload,
  sendMediaMessage
);

router.get(
  "/:conversationId",
  authMiddleware,
  getMessagesByConversation
);

router.put("/:id", authMiddleware, allowWriteAccess, editMessage);

router.delete("/:id", authMiddleware, allowWriteAccess, deleteMessage);

module.exports = router;