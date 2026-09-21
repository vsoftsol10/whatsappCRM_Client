// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");

// const {
//   sendMessage,
//   getMessagesByConversation,
//   editMessage,
//   deleteMessage,
// } = require("../controllers/messageController");

// // SEND MESSAGE
// router.post(
//   "/",
//   authMiddleware,
//   sendMessage
// );

// // GET MESSAGES
// router.get(
//   "/:conversationId",
//   authMiddleware,
//   getMessagesByConversation
// );

// // EDIT MESSAGE
// router.put(
//   "/:id",
//   authMiddleware,
//   editMessage
// );

// // DELETE MESSAGE
// router.delete(
//   "/:id",
//   authMiddleware,
//   deleteMessage
// );

// module.exports = router;


const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  sendMessage,
  getMessagesByConversation,
  editMessage,
  deleteMessage,
} = require("../controllers/messageController");

router.post("/", authMiddleware, sendMessage);

router.get(
  "/:conversationId",
  authMiddleware,
  getMessagesByConversation
);

router.put("/:id", authMiddleware, editMessage);

router.delete("/:id", authMiddleware, deleteMessage);

module.exports = router;