import { useState, useRef, useEffect } from "react";
import {
  FaCheck,
  FaCheckDouble,
  FaEllipsisV,
  FaRegCopy,
  FaFileAlt,
} from "react-icons/fa";
import LinkifiedText from "./LinkifiedText";
// 👈 NEW: shows the template buttons (call / website / quick reply / copy code)
import { TemplateButtonsPreview } from "../templates/TemplateButtonsEditor";

function MessageBubble({ message }) {
  const isSender = message.sender?.toUpperCase() === "AGENT";

  // NEW: messages sent from OUR side (a human agent, a campaign, or the AI bot)
  // show on the RIGHT. Only CUSTOMER messages show on the LEFT.
  // isSender (AGENT only) is used for the three-dot menu (Copy).
  // Edit / Delete were removed: WhatsApp cannot edit or delete a message
  // that was already sent, so the customer would still see the original.
  const isOutgoing = ["AGENT", "BOT"].includes(message.sender?.toUpperCase());

  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef(null);

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

  const renderStatusIcon = () => {
    switch (message.status) {
      case "READ":
        return <FaCheckDouble className="text-blue-500 text-xs" />;

      case "DELIVERED":
        return <FaCheckDouble className="text-gray-400 text-xs" />;

      default:
        return <FaCheck className="text-gray-400 text-xs" />;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
    setShowMenu(false);
  };

  return (
    <>
    <div
      className={`group mb-2 flex ${
        isOutgoing ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`relative max-w-[88%] rounded-2xl shadow-sm sm:max-w-[72%] ${
          isOutgoing
            ? "rounded-br-md bg-[#DCF8C6] text-[#111827]"
            : "rounded-bl-md bg-white text-gray-800"
        }`}
      >
        {/* Three-dot menu — only on your own (AGENT) messages */}
        {isSender && (
          <div
            ref={menuRef}
            className="absolute right-1 top-1 z-10"
          >
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="rounded-full p-1 text-gray-500 opacity-0 transition hover:bg-black/5 group-hover:opacity-100"
            >
              <FaEllipsisV size={13} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-7 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={handleCopy}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaRegCopy size={12} />
                  Copy
                </button>
              </div>
            )}
          </div>
        )}

        {/* Attachment (image by default; audio / video / document by type) */}
        {message.imageUrl &&
          (message.messageType === "AUDIO" ? (
            <div className="px-3 pt-3">
              <audio
                src={message.imageUrl}
                controls
                className="w-full min-w-[220px]"
              />
            </div>
          ) : message.messageType === "VIDEO" ? (
            <video
              src={message.imageUrl}
              controls
              className="block w-full"
            />
          ) : message.messageType === "DOCUMENT" ? (
            <a
              href={message.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-3 mt-3 flex items-center gap-3 rounded-lg bg-black/5 px-3 py-3 hover:bg-black/10"
            >
              <FaFileAlt className="shrink-0 text-xl text-[#128C7E]" />
              <span className="min-w-0 break-all text-sm text-gray-700">
                {message.content || "Document"}
              </span>
            </a>
          ) : (
            <img
              src={message.imageUrl}
              alt="Campaign"
              className="block w-full object-cover"
            />
          ))}

        {/* Message + Time */}
        <div className="px-4 py-2">
          {message.content &&
            !(message.imageUrl && message.messageType === "DOCUMENT") && (
              <p className="break-words text-sm leading-relaxed whitespace-pre-wrap">
                <LinkifiedText text={message.content} linkClassName="text-blue-600" />
              </p>
            )}

          {/* 👈 NEW: template buttons (only on template / campaign messages) */}
          <TemplateButtonsPreview buttons={message.buttons} />

          <div
            className={`mt-2 flex items-center justify-end gap-1 text-[11px] ${
              isOutgoing ? "text-[#6B7280]" : "text-gray-500"
            }`}
          >
            {message.isEdited && (
              <span className="italic">Edited</span>
            )}

            <span>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {isOutgoing && renderStatusIcon()}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default MessageBubble;