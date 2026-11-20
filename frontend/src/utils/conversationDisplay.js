// Small helpers shared by the Conversations screens.

// Avatar colours, picked from the name so each person keeps the same colour
const AVATAR_COLORS = [
  "bg-[#22C55E]",
  "bg-blue-600",
  "bg-violet-600",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-600",
];

export const avatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

// Name shown for a conversation: customer name, then the contact's own
// name, then the phone number.
export const getConversationName = (conversation) =>
  conversation?.customer?.name ||
  conversation?.contactName ||
  conversation?.phone ||
  "Unknown";

export const getInitial = (name = "") => {
  const first = String(name).trim().charAt(0);
  return first ? first.toUpperCase() : "?";
};

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Chat list time: "10:05" today, "Yesterday", "Mon" this week, then the date
export function formatListTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const daysAgo = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / DAY_MS
  );

  if (daysAgo <= 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return date.toLocaleDateString([], { weekday: "short" });

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}