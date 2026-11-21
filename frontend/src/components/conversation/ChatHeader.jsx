import { useState, useRef, useEffect, useMemo } from "react";
import {
  FaEllipsisV,
  FaArrowLeft,
  FaInfoCircle,
  FaEnvelopeOpen,
  FaTrashAlt,
  FaUser,
} from "react-icons/fa";
import useConversationStore from "../../store/conversationStore";
import useMessageStore from "../../store/messageStore";
import ConfirmModal from "../common/ConfirmModal";
import {
  avatarColor,
  getConversationName,
  getInitial,
} from "../../utils/conversationDisplay";

const ACTIVE_NOW_MS = 5 * 60 * 1000;
const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;

const formatTime = (d) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const getCustomerActivity = (lastAt, now) => {
  if (!lastAt) {
    return { label: "No messages from customer yet", active: false, windowClosed: false };
  }

  const diff = Math.max(0, now - lastAt);
  const windowClosed = diff > REPLY_WINDOW_MS;
  const date = new Date(lastAt);

  if (diff < ACTIVE_NOW_MS) {
    return { label: "Active now", active: true, windowClosed };
  }

  const mins = Math.floor(diff / 60000);
  if (mins < 60) {
    return { label: `Active ${mins} min ago`, active: false, windowClosed };
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = startOfToday.getTime() - 24 * 60 * 60 * 1000;

  let label;
  if (lastAt >= startOfToday.getTime()) {
    label = `Last message today at ${formatTime(date)}`;
  } else if (lastAt >= startOfYesterday) {
    label = `Last message yesterday at ${formatTime(date)}`;
  } else {
    label = `Last message ${date.toLocaleDateString()} ${formatTime(date)}`;
  }

  return { label, active: false, windowClosed };
};

function ChatHeader({
  selectedConversation,
  setShowChat,
  showCustomerDetails = false,
  setShowCustomerDetails,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const menuRef = useRef(null);

  const markAsUnread = useConversationStore((state) => state.markAsUnread);
  const clearChat = useConversationStore((state) => state.clearChat);
  const toggleBot = useConversationStore((state) => state.toggleBot);
  const clearMessages = useMessageStore((state) => state.clearMessages);
  const [botLoading, setBotLoading] = useState(false);

  // Live data: messages of the open chat (updated by the socket)
  const messages = useMessageStore((state) => state.messages);
  const messagesConversationId = useMessageStore(
    (state) => state.messagesConversationId
  );

  // Re-render every 30s so "Active 3 min ago" keeps moving
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const lastCustomerMessageAt = useMemo(() => {
    if (!selectedConversation) return null;
    if (messagesConversationId !== selectedConversation.id) return null;

    let latest = null;
    for (const m of messages) {
      if (String(m.sender || "").toUpperCase() !== "CUSTOMER") continue;
      const t = new Date(m.createdAt).getTime();
      if (!Number.isNaN(t) && (latest === null || t > latest)) latest = t;
    }
    return latest;
  }, [messages, messagesConversationId, selectedConversation]);

  const activity = getCustomerActivity(lastCustomerMessageAt, now);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selectedConversation) return null;

  const name = getConversationName(selectedConversation);
  const botOn = !!selectedConversation.botEnabled;

  const handleMarkUnread = () => {
    setShowMenu(false);
    markAsUnread(selectedConversation.id);
  };

  const handleClearChat = () => {
    setShowMenu(false);
    setShowClearChatConfirm(true);
  };

  const confirmClearChat = () => {
    setShowClearChatConfirm(false);
    clearChat(selectedConversation.id);
    clearMessages();
  };

  const handleToggleBot = async () => {
    if (botLoading) return;
    setBotLoading(true);
    await toggleBot(selectedConversation.id, !botOn);
    setBotLoading(false);
  };

  return (
    <>
      <div className="flex min-h-[72px] items-center justify-between gap-3 border-b border-gray-200 bg-white px-4">
        {/* Left: back (mobile) + avatar + name. Clicking the name opens the profile. */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowChat(false)}
            aria-label="Back to chats"
            className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 xl:hidden"
          >
            <FaArrowLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowCustomerDetails(true)}
            aria-label={`Open profile of ${name}`}
            className="group flex min-w-0 items-center gap-3 rounded-xl py-1 pr-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]/60"
          >
            <span className="relative shrink-0">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold text-white ${avatarColor(name)}`}
              >
                {getInitial(name)}
              </span>

              {activity.active && selectedConversation.status !== "CLOSED" && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#22C55E]" />
              )}
            </span>

            <span className="min-w-0">
              <span className="block truncate font-semibold text-gray-900 group-hover:underline">
                {name}
              </span>

              {selectedConversation.status === "CLOSED" ? (
                <span className="block text-sm font-medium text-red-500">Closed</span>
              ) : (
                <span
                  className={`block truncate text-sm font-medium ${
                    activity.active ? "text-[#16A34A]" : "text-gray-500"
                  }`}
                >
                  {activity.label}
                  {activity.windowClosed && (
                    <span
                      className="ml-2 text-xs font-normal text-amber-600"
                      title="WhatsApp allows free-form replies only within 24 hours of the customer's last message. Use a template."
                    >
                      · 24h window closed
                    </span>
                  )}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Right: AI auto-reply switch, info, menu */}
        <div className="flex shrink-0 items-center gap-3 text-gray-600 sm:gap-4">
          <button
            type="button"
            role="switch"
            aria-checked={botOn}
            onClick={handleToggleBot}
            disabled={botLoading}
            title={
              botOn
                ? "AI auto-reply is ON. Click to turn it off."
                : "AI auto-reply is OFF. Click to turn it on."
            }
            className="flex items-center gap-2 rounded-full py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]/60 disabled:opacity-60"
          >
            <span className="hidden text-sm font-medium text-gray-700 sm:inline">
              AI auto-reply
            </span>
            <span
              className={`relative h-6 w-11 rounded-full transition-colors ${
                botOn ? "bg-[#22C55E]" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${
                  botOn ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowCustomerDetails(!showCustomerDetails)}
            aria-label="Customer info"
            aria-pressed={showCustomerDetails}
            className={`rounded-full p-1.5 transition hover:text-[#16A34A] ${
              showCustomerDetails ? "text-[#16A34A]" : ""
            }`}
          >
            <FaInfoCircle size={19} />
          </button>

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowMenu((prev) => !prev)}
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={showMenu}
              className="rounded-full p-2 transition hover:text-[#16A34A]"
            >
              <FaEllipsisV size={17} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 z-50 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    setShowCustomerDetails(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaUser size={13} />
                  View profile
                </button>

                <button
                  type="button"
                  onClick={handleMarkUnread}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaEnvelopeOpen size={13} />
                  Mark as Unread
                </button>

                <button
                  type="button"
                  onClick={handleClearChat}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaTrashAlt size={13} />
                  Clear Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showClearChatConfirm}
        title="Clear Chat"
        message="Clear all messages in this chat? This cannot be undone."
        confirmText="Clear"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmClearChat}
        onCancel={() => setShowClearChatConfirm(false)}
      />
    </>
  );
}

export default ChatHeader;