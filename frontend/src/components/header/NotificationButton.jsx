// import { useEffect, useMemo, useRef, useState } from "react";
// import { FaBell } from "react-icons/fa";

// import {
//   getNotifications,
//   markNotificationAsRead,
//   markAllNotificationsAsRead,
//   deleteNotification,
// } from "../../api/notificationApi";

// import NotificationDropdown from "./NotificationDropdown";

// function NotificationButton() {
//   const [notifications, setNotifications] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isOpen, setIsOpen] = useState(false);

//   const wrapperRef = useRef(null);

//   // ================= FETCH NOTIFICATIONS =================
//   const fetchNotifications = async () => {
//     try {
//       setLoading(true);

//       const response = await getNotifications();

//       setNotifications(response.data || []);
//     } catch (error) {
//       console.error("Fetch Notifications Error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ================= INITIAL LOAD =================
//   useEffect(() => {
//     fetchNotifications();
//   }, []);

//   // ================= CLOSE DROPDOWN ON OUTSIDE CLICK =================
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         wrapperRef.current &&
//         !wrapperRef.current.contains(event.target)
//       ) {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);

//     return () => {
//       document.removeEventListener(
//         "mousedown",
//         handleClickOutside
//       );
//     };
//   }, []);

//   // ================= UNREAD COUNT =================
//   const unreadCount = useMemo(() => {
//     return notifications.filter(
//       (notification) => !notification.isRead
//     ).length;
//   }, [notifications]);

//   // ================= TOGGLE DROPDOWN =================
//   const handleToggleDropdown = () => {
//     setIsOpen((prev) => !prev);
//   };

//   // ================= MARK SINGLE AS READ =================
//   const handleMarkAsRead = async (id) => {
//     try {
//       await markNotificationAsRead(id);

//       setNotifications((prev) =>
//         prev.map((notification) =>
//           notification.id === id
//             ? {
//                 ...notification,
//                 isRead: true,
//               }
//             : notification
//         )
//       );
//     } catch (error) {
//       console.error("Mark Notification Error:", error);
//     }
//   };

//   // ================= MARK ALL AS READ =================
//   const handleMarkAllAsRead = async () => {
//     try {
//       await markAllNotificationsAsRead();

//       setNotifications((prev) =>
//         prev.map((notification) => ({
//           ...notification,
//           isRead: true,
//         }))
//       );
//     } catch (error) {
//       console.error("Mark All Notifications Error:", error);
//     }
//   };

//   // ================= DELETE NOTIFICATION =================
//   const handleDeleteNotification = async (id) => {
//     try {
//       await deleteNotification(id);

//       setNotifications((prev) =>
//         prev.filter(
//           (notification) => notification.id !== id
//         )
//       );
//     } catch (error) {
//       console.error("Delete Notification Error:", error);
//     }
//   };

//   return (
//     <div className="relative" ref={wrapperRef}>
//       <button
//         onClick={handleToggleDropdown}
//         className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white transition hover:border-[#25D366] hover:bg-[#DCF8C6]"
//       >
//         <FaBell size={18} className="text-gray-700" />

//         {unreadCount > 0 && (
//           <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
//             {unreadCount > 99 ? "99+" : unreadCount}
//           </span>
//         )}
//       </button>

//       {isOpen && (
//         <NotificationDropdown
//           loading={loading}
//           notifications={notifications}
//           onMarkAsRead={handleMarkAsRead}
//           onMarkAllAsRead={handleMarkAllAsRead}
//           onDelete={handleDeleteNotification}
//         />
//       )}
//     </div>
//   );
// }

// export default NotificationButton;


import { useEffect, useMemo, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";
import toast from "react-hot-toast";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../api/notificationApi";

import { connectSocket } from "../../api/socketClient";

import NotificationDropdown from "./NotificationDropdown";

function NotificationButton() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const wrapperRef = useRef(null);

  // ================= FETCH NOTIFICATIONS =================
  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await getNotifications();

      setNotifications(response.data || []);
    } catch (error) {
      console.error("Fetch Notifications Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ================= INITIAL LOAD =================
  useEffect(() => {
    fetchNotifications();
  }, []);

  // ================= LIVE NOTIFICATIONS =================
  // The server pushes "notification:new" the moment something is
  // assigned to this user (e.g. a lead), so no page refresh is needed.
  useEffect(() => {
    if (!localStorage.getItem("token")) return undefined;

    const socket = connectSocket();

    const handleNew = (notification) => {
      if (!notification?.id) return;

      setNotifications((prev) =>
        prev.some((n) => n.id === notification.id)
          ? prev
          : [notification, ...prev]
      );

      toast(`${notification.title}\n${notification.message}`, {
        icon: "🔔",
        duration: 5000,
      });
    };

    // After a dropped connection, quietly catch up on anything missed
    let hasConnectedBefore = false;
    const handleConnect = async () => {
      if (hasConnectedBefore) {
        try {
          const response = await getNotifications();
          setNotifications(response.data || []);
        } catch (error) {
          console.error("Refresh Notifications Error:", error);
        }
      }
      hasConnectedBefore = true;
    };

    socket.on("connect", handleConnect);
    socket.on("notification:new", handleNew);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("notification:new", handleNew);
    };
  }, []);

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

  // ================= UNREAD COUNT =================
  const unreadCount = useMemo(() => {
    return notifications.filter(
      (notification) => !notification.isRead
    ).length;
  }, [notifications]);

  // ================= TOGGLE DROPDOWN =================
  const handleToggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  // ================= MARK SINGLE AS READ =================
  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error("Mark Notification Error:", error);
    }
  };

  // ================= MARK ALL AS READ =================
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error("Mark All Notifications Error:", error);
    }
  };

  // ================= DELETE NOTIFICATION =================
  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);

      setNotifications((prev) =>
        prev.filter(
          (notification) => notification.id !== id
        )
      );
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
        <NotificationDropdown
          loading={loading}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDeleteNotification}
        />
      )}
    </div>
  );
}

export default NotificationButton;
