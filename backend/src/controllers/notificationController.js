const prisma = require("../config/prisma");

// =========================
// GET ALL NOTIFICATIONS (paginated)
// =========================
exports.getNotifications = async (req, res) => {
  try {
    // Defensive bounds — a bad/huge ?limit= from the client shouldn't
    // let someone force one query to pull the entire table.
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    // ?filter= is one of: "ALL" (default), "UNREAD", or a specific
    // NotificationType value (LEAD, TASK, TICKET, CUSTOMER,
    // CAMPAIGN, SYSTEM) — matches the chips in the dropdown UI.
    const { filter } = req.query;

    const baseWhere = { userId: req.user.userId };

    const listWhere =
      filter === "UNREAD"
        ? { ...baseWhere, isRead: false }
        : filter && filter !== "ALL"
        ? { ...baseWhere, type: filter }
        : baseWhere;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: listWhere,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: listWhere,
      }),
      // Unread count is intentionally computed across ALL of the
      // user's notifications regardless of the active filter — the
      // bell badge always reflects the true unread total, even while
      // the customer is looking at a filtered/type-specific view.
      prisma.notification.count({
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
    console.error("Get Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
      error: error.message,
    });
  }
};

// =========================
// MARK SINGLE NOTIFICATION AS READ
// =========================
exports.markAsRead = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    const updatedNotification = await prisma.notification.update({
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
    console.error("Mark Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notification.",
      error: error.message,
    });
  }
};

// =========================
// MARK ALL NOTIFICATIONS AS READ
// =========================
exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.userId,
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
    console.error("Mark All Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update notifications.",
      error: error.message,
    });
  }
};

// =========================
// DELETE ALL NOTIFICATIONS (of the logged-in user)
// =========================
exports.deleteAllNotifications = async (req, res) => {
  try {
    const result = await prisma.notification.deleteMany({
      where: {
        userId: req.user.userId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "All notifications deleted successfully.",
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Delete All Notifications Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notifications.",
      error: error.message,
    });
  }
};

// =========================
// DELETE NOTIFICATION
// =========================
exports.deleteNotification = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    await prisma.notification.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
      error: error.message,
    });
  }
};