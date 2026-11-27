
const prisma = require("../config/prisma");

// ==========================================
// GET USER NOTIFICATIONS
// ==========================================
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Pagination: ?page=1&limit=20 (limit is capped so one request can
    // never pull the whole table).
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );
    const skip = (page - 1) * limit;

    // ?filter= "ALL" (default), "UNREAD", or a NotificationType value
    // (LEAD, TASK, TICKET, CUSTOMER, DEAL, CAMPAIGN, SUBSCRIPTION, SYSTEM).
    const { filter } = req.query;

    const baseWhere = { userId };

    const listWhere =
      filter === "UNREAD"
        ? { ...baseWhere, isRead: false }
        : filter && filter !== "ALL"
        ? { ...baseWhere, type: filter }
        : baseWhere;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.userNotification.findMany({
        where: listWhere,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.userNotification.count({ where: listWhere }),
      // Bell badge always shows the true unread total, whatever filter
      // is active.
      prisma.userNotification.count({
        where: { ...baseWhere, isRead: false },
      }),
    ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasMore: skip + notifications.length < total,
      },
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

const deleteAllUserNotifications = async (req, res) => {
  try {
    const result = await prisma.userNotification.deleteMany({
      where: { userId: req.user.userId },
    });

    return res.status(200).json({
      success: true,
      message: "All notifications deleted successfully.",
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("DELETE ALL USER NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notifications.",
      error: error.message,
    });
  }
};

module.exports = {
  getUserNotifications,
  markUserNotificationAsRead,
  markAllUserNotificationsAsRead,
  deleteUserNotification,
  deleteAllUserNotifications,
};