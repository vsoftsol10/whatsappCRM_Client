// const express = require("express");

// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");

// const {
//   createConversation,
//   getConversations,
//   getConversationByCustomerId,
//   getConversationById,
//   updateConversationStatus,
//   toggleConversationBot,
//   markConversationAsRead,
//   markConversationAsUnread,
//   clearConversationMessages,
//   deleteConversation,
// } = require("../controllers/conversationController");

// // CREATE CONVERSATION
// router.post(
//   "/",
//   authMiddleware,
//   createConversation
// );

// // GET ALL CONVERSATIONS
// router.get(
//   "/",
//   authMiddleware,
//   getConversations
// );

// // GET CONVERSATION BY CUSTOMER ID
// // IMPORTANT: Keep this before /:id
// router.get(
//   "/customer/:customerId",
//   authMiddleware,
//   getConversationByCustomerId
// );

// // GET CONVERSATION BY ID
// router.get(
//   "/:id",
//   authMiddleware,
//   getConversationById
// );

// // UPDATE CONVERSATION STATUS
// router.patch(
//   "/:id",
//   authMiddleware,
//   updateConversationStatus
// );

// // TOGGLE BOT
// router.patch(
//   "/:id/bot-toggle",
//   authMiddleware,
//   toggleConversationBot
// );

// // MARK AS READ
// router.patch(
//   "/:id/read",
//   authMiddleware,
//   markConversationAsRead
// );

// // MARK AS UNREAD
// router.patch(
//   "/:id/unread",
//   authMiddleware,
//   markConversationAsUnread
// );

// // CLEAR CHAT
// router.delete(
//   "/:id/messages",
//   authMiddleware,
//   clearConversationMessages
// );

// // DELETE CONVERSATION
// router.delete(
//   "/:id",
//   authMiddleware,
//   deleteConversation
// );

// module.exports = router;



const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const allowWriteAccess = require("../middleware/allowWriteAccess");

const {
  createConversation,
  getConversations,
  getConversationByCustomerId,
  getConversationById,
  updateConversationStatus,
  toggleConversationBot,
  markConversationAsRead,
  markConversationAsUnread,
  clearConversationMessages,
  deleteConversation,
} = require("../controllers/conversationController");

// CREATE CONVERSATION
router.post(
  "/",
  authMiddleware,
  allowWriteAccess,
  createConversation
);

// GET ALL CONVERSATIONS
router.get(
  "/",
  authMiddleware,
  getConversations
);

// GET CONVERSATION BY CUSTOMER ID
// IMPORTANT: Keep this before /:id
router.get(
  "/customer/:customerId",
  authMiddleware,
  getConversationByCustomerId
);

// GET CONVERSATION BY ID
router.get(
  "/:id",
  authMiddleware,
  getConversationById
);

// UPDATE CONVERSATION STATUS
router.patch(
  "/:id",
  authMiddleware,
  allowWriteAccess,
  updateConversationStatus
);

// TOGGLE BOT
router.patch(
  "/:id/bot-toggle",
  authMiddleware,
  allowWriteAccess,
  toggleConversationBot
);

// MARK AS READ  (left open on purpose: viewing chats must keep working)
router.patch(
  "/:id/read",
  authMiddleware,
  markConversationAsRead
);

// MARK AS UNREAD  (left open on purpose)
router.patch(
  "/:id/unread",
  authMiddleware,
  markConversationAsUnread
);

// CLEAR CHAT
router.delete(
  "/:id/messages",
  authMiddleware,
  allowWriteAccess,
  clearConversationMessages
);

// DELETE CONVERSATION
router.delete(
  "/:id",
  authMiddleware,
  allowWriteAccess,
  deleteConversation
);

module.exports = router;