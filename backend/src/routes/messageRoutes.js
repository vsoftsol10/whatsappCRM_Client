// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");

// const {
//   sendMessage,
//   getMessagesByConversation,
//   editMessage,
//   deleteMessage,
// } = require("../controllers/messageController");

// router.post("/", authMiddleware, sendMessage);

// router.get(
//   "/:conversationId",
//   authMiddleware,
//   getMessagesByConversation
// );

// router.put("/:id", authMiddleware, editMessage);

// router.delete("/:id", authMiddleware, deleteMessage);

// module.exports = router;





const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowWriteAccess = require("../middleware/allowWriteAccess");

const {
  sendMessage,
  getMessagesByConversation,
  editMessage,
  deleteMessage,
} = require("../controllers/messageController");

// Expired / inactive companies cannot send, edit or delete messages (view-only).
router.post("/", authMiddleware, allowWriteAccess, sendMessage);

router.get(
  "/:conversationId",
  authMiddleware,
  getMessagesByConversation
);

router.put("/:id", authMiddleware, allowWriteAccess, editMessage);

router.delete("/:id", authMiddleware, allowWriteAccess, deleteMessage);

module.exports = router;