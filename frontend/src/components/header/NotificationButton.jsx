import { useEffect, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";

import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../../api/notificationApi";
import { connectSocket } from "../../api/socket";

import NotificationDropdown from "./NotificationDropdown";

function NotificationButton() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // unreadCount comes from the backend's own count query (across ALL
  // of the user's notifications), not from notifications.filter(...)
  // — the dropdown only ever holds one page at a time, so counting
  // locally would under-report once there's more than one page.
  const [unreadCount, setUnreadCount] = useState(0);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // "ALL", "UNREAD", or a specific NotificationType (LEAD/TASK/...).
  const [activeFilter, setActiveFilter] = useState("ALL");

  const wrapperRef = useRef(null);

  // ================= FETCH NOTIFICATIONS =================
  // append=true is used for "Load more" — adds the next page onto the
  // existing list instead of replacing it. Changing the filter always
  // starts over at page 1 (handled by handleFilterChange below).
  // silent=true refreshes the list in the background (no "Loading..."
  // flash) — used when the bell is opened so the latest notifications
  // always show, even if the real-time socket push was missed.
  const fetchNotifications = async (
    pageToLoad = 1,
    append = false,
    filter = activeFilter,
    silent = false
  ) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else if (!silent) {
        setLoading(true);
      }

      const response = await getNotifications(pageToLoad, 20, filter);

      setNotifications((prev) =>
        append ? [...prev, ...(response.data || [])] : response.data || []
      );

      setUnreadCount(response.unreadCount ?? 0);

      setPage(response.pagination?.page ?? pageToLoad);

      setHasMore(Boolean(response.pagination?.hasMore));
    } catch (error) {
      console.error("Fetch Notifications Error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;

    fetchNotifications(page + 1, true);
  };

  const handleFilterChange = (filter) => {
    if (filter === activeFilter) return;

    setActiveFilter(filter);

    fetchNotifications(1, false, filter);
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications(1, false, "ALL");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= REAL-TIME PUSH =================
  // Backend emits notification:new to this user's socket room the
  // moment a Notification row is created — prepend it so the bell
  // badge/dropdown update without waiting for the next poll/refresh.
  // Re-subscribes whenever activeFilter changes so the handler always
  // sees the current filter instead of a stale value from mount time.
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const handleNewNotification = (notification) => {
      // A newly-arrived notification is always unread, so the true
      // server-side unread count also just went up by exactly one —
      // that part is independent of whatever filter is active.
      setUnreadCount((prev) => prev + 1);

      // Only insert it into the visible list if it actually matches
      // the current filter — e.g. don't have a TASK notification pop
      // into a view that's filtered down to "Ticket" only.
      const matchesFilter =
        activeFilter === "ALL" ||
        activeFilter === "UNREAD" ||
        activeFilter === notification.type;

      if (matchesFilter) {
        setNotifications((prev) => [notification, ...prev]);
      }
    };

    socket.on("notification:new", handleNewNotification);

    return () => {
      socket.off("notification:new", handleNewNotification);
    };
  }, [activeFilter]);

  // ================= CLOSE DROPDOWN ON OUTSIDE CLICK =================
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // ================= TOGGLE DROPDOWN =================
  const handleToggleDropdown = () => {
    // Opening the bell -> fetch the latest notifications from the server.
    if (!isOpen) {
      fetchNotifications(1, false, activeFilter, true);
    }

    setIsOpen((prev) => !prev);
  };

  // ================= MARK SINGLE AS READ =================
  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);

      let wasUnread = false;

      setNotifications((prev) =>
        prev.map((notification) => {
          if (notification.id === id && !notification.isRead) {
            wasUnread = true;
          }

          return notification.id === id
            ? { ...notification, isRead: true }
            : notification;
        })
      );

      if (wasUnread) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (error) {
      console.error("Mark Notification Error:", error);
    }
  };

  // ================= DELETE ALL =================
  const handleDeleteAllNotifications = async () => {
    if (!window.confirm("Delete all notifications? This cannot be undone.")) {
      return;
    }

    try {
      await deleteAllNotifications();

      // The backend removes EVERY notification of this user, not just
      // the ones loaded on the current page.
      setNotifications([]);
      setUnreadCount(0);
      setPage(1);
      setHasMore(false);
    } catch (error) {
      console.error("Delete All Notifications Error:", error);
    }
  };

  // ================= DELETE NOTIFICATION =================
  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);

      let wasUnread = false;

      setNotifications((prev) =>
        prev.filter((notification) => {
          if (notification.id === id && !notification.isRead) {
            wasUnread = true;
          }

          return notification.id !== id;
        })
      );

      if (wasUnread) {
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      }
    } catch (error) {
      console.error("Delete Notification Error:", error);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={handleToggleDropdown}
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white transition hover:border-[#25D366] hover:bg-[#DCF8C6]"
      >
        <FaBell size={18} className="text-gray-700" />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
        {/* Phones only: dims the page behind the panel; tap to close */}
        <div
          className="fixed inset-0 z-40 bg-black/30 sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
        <NotificationDropdown
          loading={loading}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onDeleteAll={handleDeleteAllNotifications}
          onDelete={handleDeleteNotification}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
        </>
      )}
    </div>
  );
}

export default NotificationButton;