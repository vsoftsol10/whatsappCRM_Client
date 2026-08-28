
const prisma = require("../config/prisma");

// ==========================================
// GET USER NOTIFICATIONS
// ==========================================
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    const notifications = await prisma.userNotification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    console.error("GET USER NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// ==========================================
// MARK SINGLE NOTIFICATION AS READ
// ==========================================
const markUserNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification =
      await prisma.userNotification.findFirst({
        where: {
          id,
          userId,
        },
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const updatedNotification =
      await prisma.userNotification.update({
        where: {
          id,
        },
        data: {
          isRead: true,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: updatedNotification,
    });
  } catch (error) {
    console.error(
      "MARK USER NOTIFICATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update notification.",
      error: error.message,
    });
  }
};

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================
const markAllUserNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.userNotification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "MARK ALL USER NOTIFICATIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE NOTIFICATION
// ==========================================
const deleteUserNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID.",
      });
    }

    const notification =
      await prisma.userNotification.findFirst({
        where: {
          id,
          userId,
        },
      });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    await prisma.userNotification.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE USER NOTIFICATION ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
      error: error.message,
    });
  }
};

module.exports = {
  getUserNotifications,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
  deleteUserNotification,
};