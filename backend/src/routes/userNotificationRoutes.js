// const express = require("express");

// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");

// const {
//   getNotifications,
//   markAsRead,
//   markAllAsRead,
//   deleteNotification,
// } = require("../controllers/notificationController");

// // ==========================================
// // GET ALL NOTIFICATIONS
// // ==========================================
// router.get("/", authMiddleware, getNotifications);

// // ==========================================
// // MARK SINGLE NOTIFICATION AS READ
// // ==========================================
// router.patch("/:id/read", authMiddleware, markAsRead);

// // ==========================================
// // MARK ALL NOTIFICATIONS AS READ
// // ==========================================
// router.patch("/read-all", authMiddleware, markAllAsRead);

// // ==========================================
// // DELETE NOTIFICATION
// // ==========================================
// router.delete("/:id", authMiddleware, deleteNotification);

// module.exports = router;


const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getUserNotifications,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
  deleteUserNotification,
} = require("../controllers/userNotificationController");

// ==========================================
// GET USER NOTIFICATIONS
// GET /api/user-notifications
// ==========================================
router.get(
  "/",
  authMiddleware,
  getUserNotifications
);

// ==========================================
// MARK SINGLE AS READ
// PATCH /api/user-notifications/:id/read
// ==========================================
router.patch(
  "/:id/read",
  authMiddleware,
  markUserNotificationAsRead
);

// ==========================================
// MARK ALL AS READ
// PATCH /api/user-notifications/read-all
// ==========================================
router.patch(
  "/read-all",
  authMiddleware,
  markAllUserNotificationsAsRead
);

// ==========================================
// DELETE NOTIFICATION
// DELETE /api/user-notifications/:id
// ==========================================
router.delete(
  "/:id",
  authMiddleware,
  deleteUserNotification
);

module.exports = router;