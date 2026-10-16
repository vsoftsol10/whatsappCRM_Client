import { FaFacebookMessenger, FaInstagram } from "react-icons/fa";

// Look & feel for each channel. Every class is written out in full so
// Tailwind can find it.
export const SOCIAL_THEMES = {
  facebook: {
    variant: "facebook",
    channel: "MESSENGER",
    label: "Messenger",
    Icon: FaFacebookMessenger,
    listTitle: "Chats",
    searchPlaceholder: "Search Messenger",
    inputPlaceholder: "Aa",
    emptyTitle: "Select a chat",
    emptyText: "Choose a Messenger chat from the list to start messaging.",
    listWidth: "xl:w-[360px]",
    accentText: "text-[#0084FF]",
    accentBg: "bg-[#0084FF]",
    accentHover: "hover:bg-[#0073E6]",
    softBg: "bg-[#E7F3FF]",
    avatarBg: "bg-gradient-to-br from-[#0084FF] to-[#00C6FF]",
    selectedRow: "bg-[#EBF5FF]",
    hoverRow: "hover:bg-[#F2F3F5]",
    searchBg: "bg-[#F0F2F5]",
    pillActive: "bg-[#E7F3FF] text-[#0866FF]",
    pillIdle: "bg-transparent text-[#65676B] hover:bg-[#F2F3F5]",
    sentBubble: "bg-[#0084FF] text-white",
    receivedBubble: "bg-[#F0F0F0] text-[#050505]",
    bubbleRadius: "rounded-[18px]",
    ringOnUnread: false,
  },
  instagram: {
    variant: "instagram",
    channel: "INSTAGRAM",
    label: "Instagram",
    Icon: FaInstagram,
    listTitle: "Messages",
    searchPlaceholder: "Search",
    inputPlaceholder: "Message...",
    emptyTitle: "Your messages",
    emptyText: "Select a conversation to send a direct message.",
    listWidth: "xl:w-[390px]",
    accentText: "text-[#0095F6]",
    accentBg: "bg-[#0095F6]",
    accentHover: "hover:bg-[#1877F2]",
    softBg: "bg-[#EFEFEF]",
    avatarBg: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
    selectedRow: "bg-[#EFEFEF]",
    hoverRow: "hover:bg-[#FAFAFA]",
    searchBg: "bg-[#EFEFEF]",
    pillActive: "bg-[#262626] text-white",
    pillIdle: "bg-[#EFEFEF] text-[#262626] hover:bg-[#DBDBDB]",
    sentBubble: "bg-gradient-to-br from-[#7638FA] via-[#D300C5] to-[#FF0069] text-white",
    receivedBubble: "bg-[#EFEFEF] text-[#262626]",
    bubbleRadius: "rounded-[22px]",
    ringOnUnread: true,
  },
};

export const getContactName = (conversation) =>
  conversation?.customer?.name ||
  conversation?.contactName ||
  conversation?.phone ||
  "Unknown";

export const getInitial = (conversation) =>
  getContactName(conversation).charAt(0).toUpperCase();

// Chat list time: today -> 10:42 AM, this week -> Mon, older -> 12 Oct
export const formatListTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  if (date.getTime() >= startOfToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (date.getTime() >= startOfToday - 6 * dayMs) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
};

export const formatDayLabel = (value) => {
  const date = new Date(value);
  const now = new Date();
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (sameDay(date, now)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";
  return date.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
