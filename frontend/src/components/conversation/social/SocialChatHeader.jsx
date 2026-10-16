import { useState, useRef, useEffect } from "react";
import {
  FaEllipsisV,
  FaArrowLeft,
  FaInfoCircle,
  FaEnvelopeOpen,
  FaTrashAlt,
} from "react-icons/fa";
import { Bot } from "lucide-react";
import useConversationStore from "../../../store/conversationStore";
import useMessageStore from "../../../store/messageStore";
import ConfirmModal from "../../common/ConfirmModal";
import SocialAvatar from "./SocialAvatar";
import { getContactName } from "./socialTheme";

function SocialChatHeader({
  theme,
  selectedConversation,
  setShowChat,
  setShowInfo,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [botLoading, setBotLoading] = useState(false);
  const menuRef = useRef(null);

  const markAsUnread = useConversationStore((state) => state.markAsUnread);
  const clearChat = useConversationStore((state) => state.clearChat);
  const toggleBot = useConversationStore((state) => state.toggleBot);
  const clearMessages = useMessageStore((state) => state.clearMessages);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!selectedConversation) {
    return (
      <div className="flex min-h-[60px] items-center border-b border-[#DBDBDB] bg-white px-4">
        <p className="text-[#65676B]">Select a conversation</p>
      </div>
    );
  }

  const isFacebook = theme.variant === "facebook";
  const Icon = theme.Icon;

  const handleMarkUnread = () => {
    setShowMenu(false);
    markAsUnread(selectedConversation.id);
  };

  const confirmClearChat = () => {
    setShowClearChatConfirm(false);
    clearChat(selectedConversation.id);
    clearMessages();
  };

  const handleToggleBot = async () => {
    if (botLoading) return;
    setBotLoading(true);
    await toggleBot(selectedConversation.id, !selectedConversation.botEnabled);
    setBotLoading(false);
  };

  return (
    <>
      <div
        className={`flex min-h-[60px] items-center justify-between gap-3 bg-white px-3 sm:px-4 ${
          isFacebook
            ? "border-b border-[#CED0D4] shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            : "border-b border-[#DBDBDB]"
        }`}
      >
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setShowChat(false)}
            className={`rounded-full p-2 transition hover:bg-[#F0F2F5] xl:hidden ${theme.accentText}`}
          >
            <FaArrowLeft size={18} />
          </button>

          <SocialAvatar
            conversation={selectedConversation}
            theme={theme}
            size={isFacebook ? 40 : 44}
          />

          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-semibold text-[#050505]">
              {getContactName(selectedConversation)}
            </h2>
            <p className="flex items-center gap-1 text-[12px] text-[#65676B]">
              {selectedConversation.status === "CLOSED" ? (
                <span className="font-medium text-red-500">Closed</span>
              ) : (
                <>
                  <Icon size={11} className={theme.accentText} />
                  {theme.label}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex shrink-0 items-center gap-2 text-[#65676B] sm:gap-3">
          <button
            onClick={handleToggleBot}
            disabled={botLoading}
            title={
              selectedConversation.botEnabled
                ? "AI auto-reply is ON - click to turn off"
                : "AI auto-reply is OFF - click to turn on"
            }
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
              selectedConversation.botEnabled
                ? `${theme.softBg} ${theme.accentText}`
                : "bg-[#F0F2F5] text-[#65676B]"
            }`}
          >
            <Bot size={14} />
            <span className="hidden sm:inline">
              Bot {selectedConversation.botEnabled ? "ON" : "OFF"}
            </span>
          </button>

          <button
            onClick={() => setShowInfo(true)}
            className={`rounded-full p-2 transition hover:bg-[#F0F2F5] xl:hidden ${theme.accentText}`}
          >
            <FaInfoCircle size={18} />
          </button>

          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className={`rounded-full p-2 transition hover:bg-[#F0F2F5] ${theme.accentText}`}
            >
              <FaEllipsisV size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={handleMarkUnread}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaEnvelopeOpen size={13} />
                  Mark as Unread
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowClearChatConfirm(true);
                  }}
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

export default SocialChatHeader;
