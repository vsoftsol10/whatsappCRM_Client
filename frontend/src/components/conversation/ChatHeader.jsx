import { useState, useRef, useEffect } from "react";
import {
  FaEllipsisV,
  FaArrowLeft,
  FaInfoCircle,
  FaEnvelopeOpen,
  FaTrashAlt,
} from "react-icons/fa";
import { Bot } from "lucide-react";
import useConversationStore from "../../store/conversationStore";
import useMessageStore from "../../store/messageStore";
import ConfirmModal from "../common/ConfirmModal";

function ChatHeader({
  selectedConversation,
  showChat,
  setShowChat,
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

  // Close menu on outside click
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
      <div className="flex min-h-16 items-center border-b border-gray-200 bg-white px-4 sm:px-6">
        <p className="text-gray-500">
          Select a conversation
        </p>
      </div>
    );
  }

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
    await toggleBot(selectedConversation.id, !selectedConversation.botEnabled);
    setBotLoading(false);
  };

  return (
    <>
    <div className="flex min-h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4">
      {/* Left Section */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile Back Button */}
        <button
          onClick={() => setShowChat(false)}
          className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 lg:hidden"
        >
          <FaArrowLeft size={18} />
        </button>

        {/* Avatar */}
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-lg font-semibold text-white sm:h-12 sm:w-12">
            {selectedConversation.customer?.name?.charAt(0)}
          </div>

          {selectedConversation.isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#25D366]"></span>
          )}
        </div>

        {/* Name + Status */}
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-gray-800">
            {selectedConversation.customer?.name}
          </h2>

          {selectedConversation.status === "CLOSED" ? (
            <p className="text-sm font-medium text-red-500">
              Closed
            </p>
          ) : (
            <p className="text-sm font-medium text-[#25D366]">
              Online
            </p>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex shrink-0 items-center gap-4 text-gray-600">
        {/* Bot Auto-Reply Toggle */}
        <button
          onClick={handleToggleBot}
          disabled={botLoading}
          title={
            selectedConversation.botEnabled
              ? "AI auto-reply is ON — click to turn off"
              : "AI auto-reply is OFF — click to turn on"
          }
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-60 ${
            selectedConversation.botEnabled
              ? "bg-[#25D366]/10 text-[#128C7E]"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          <Bot size={14} />
          <span className="hidden sm:inline">
            Bot {selectedConversation.botEnabled ? "ON" : "OFF"}
          </span>
        </button>

        {/* Customer Details - Mobile */}
        <button
          onClick={() => setShowCustomerDetails(true)}
          className="transition hover:text-[#128C7E] lg:hidden"
        >
          <FaInfoCircle size={18} />
        </button>

        {/* Desktop Icons */}
        <div className="hidden items-center gap-6 lg:flex">
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="transition hover:text-[#128C7E]"
            >
              <FaEllipsisV size={18} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-50 w-52 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={handleMarkUnread}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaEnvelopeOpen size={13} />
                  Mark as Unread
                </button>

                <button
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