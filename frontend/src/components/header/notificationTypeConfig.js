import {
  FaBullseye,
  FaClipboardList,
  FaTicketAlt,
  FaUser,
  FaBullhorn,
  FaCog,
  FaBell,
  FaHandshake,
  FaCrown,
} from "react-icons/fa";

// One entry per Prisma NotificationType value. Used by
// NotificationDropdown.jsx for both the per-notification icon and the
// filter chips row, so the two stay visually consistent.
export const NOTIFICATION_TYPE_CONFIG = {
  LEAD: {
    label: "Lead",
    icon: FaBullseye,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  TASK: {
    label: "Task",
    icon: FaClipboardList,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  TICKET: {
    label: "Ticket",
    icon: FaTicketAlt,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  CUSTOMER: {
    label: "Customer",
    icon: FaUser,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  DEAL: {
    label: "Deal",
    icon: FaHandshake,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  SUBSCRIPTION: {
    label: "Subscription",
    icon: FaCrown,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  CAMPAIGN: {
    label: "Campaign",
    icon: FaBullhorn,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  SYSTEM: {
    label: "System",
    icon: FaCog,
    iconBg: "bg-gray-200",
    iconColor: "text-gray-600",
  },
};

// Fallback for any type not in the map above (defensive — keeps the
// UI from breaking if a new enum value is added on the backend before
// the frontend is updated to match).
export const DEFAULT_NOTIFICATION_TYPE_CONFIG = {
  label: "Notification",
  icon: FaBell,
  iconBg: "bg-gray-200",
  iconColor: "text-gray-600",
};

export const getNotificationTypeConfig = (type) =>
  NOTIFICATION_TYPE_CONFIG[type] || DEFAULT_NOTIFICATION_TYPE_CONFIG;

// Filter chips shown at the top of the dropdown, in display order.
export const NOTIFICATION_FILTERS = [
  { key: "ALL", label: "All" },
  { key: "UNREAD", label: "Unread" },
  { key: "LEAD", label: "Lead" },
  { key: "TASK", label: "Task" },
  { key: "TICKET", label: "Ticket" },
  { key: "CUSTOMER", label: "Customer" },
  { key: "DEAL", label: "Deal" },
  { key: "CAMPAIGN", label: "Campaign" },
  { key: "SUBSCRIPTION", label: "Subscription" },
  { key: "SYSTEM", label: "System" },
];