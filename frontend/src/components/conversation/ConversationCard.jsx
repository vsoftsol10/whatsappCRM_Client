// import {
//   FaCheck,
//   FaCheckDouble,
// } from "react-icons/fa";

// function ConversationCard({
//   conversation,
//   isSelected,
//   onSelect,
// }) {
//   if (!conversation) return null;

//   const getStatusIcon = () => {
//     switch (conversation?.messageStatus) {
//       case "READ":
//         return (
//           <FaCheckDouble className="text-blue-500 text-xs" />
//         );

//       case "DELIVERED":
//         return (
//           <FaCheckDouble className="text-gray-400 text-xs" />
//         );

//       default:
//         return (
//           <FaCheck className="text-gray-400 text-xs" />
//         );
//     }
//   };

//   return (
//     <button
//       type="button"
//       onClick={() => onSelect(conversation)}
//       className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition duration-200
//         ${
//           isSelected
//             ? "border-l-4 border-l-[#25D366] bg-[#DCF8C6]"
//             : "hover:bg-gray-50"
//         }`}
//     >
//       {/* Avatar */}
//       <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-lg font-semibold text-white">
//         {(
//           conversation.customer?.name ||
//           conversation.contactName ||
//           conversation.phone ||
//           "?"
//         ).charAt(0)}
//       </div>

//       {/* Content */}
//       <div className="min-w-0 flex-1">
//         <div className="flex items-center justify-between gap-2">
//           <h3 className="truncate font-semibold text-gray-900">
//             {conversation.customer?.name ||
//               conversation.contactName ||
//               conversation.phone}
//           </h3>

//           <span className="shrink-0 text-xs text-gray-500">
//             {new Date(conversation.updatedAt).toLocaleTimeString([], {
//               hour: "2-digit",
//               minute: "2-digit",
//             })}
//           </span>
//         </div>

//         {conversation.channel === "MESSENGER" && (
//           <span className="mt-0.5 inline-block rounded bg-[#E7F0FF] px-1.5 py-0.5 text-[10px] font-semibold text-[#1877F2]">
//             Messenger
//           </span>
//         )}

//         {conversation.channel === "INSTAGRAM" && (
//           <span className="mt-0.5 inline-block rounded bg-pink-50 px-1.5 py-0.5 text-[10px] font-semibold text-pink-600">
//             Instagram
//           </span>
//         )}

//         <div className="mt-1 flex items-center gap-1">
//           {getStatusIcon()}

//           <p className="truncate text-sm text-gray-500">
//             {conversation.lastMessage || "No messages yet"}
//           </p>
//         </div>
//       </div>

//       {/* Unread Badge */}
//       {conversation.unreadCount > 0 && (
//         <div className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#25D366] px-2 text-xs font-semibold text-white">
//           {conversation.unreadCount}
//         </div>
//       )}
//     </button>
//   );
// }

// export default ConversationCard;


import { FaCheck, FaCheckDouble } from "react-icons/fa";
import {
  avatarColor,
  getConversationName,
  getInitial,
  formatListTime,
} from "../../utils/conversationDisplay";

// Delivery ticks are only shown when the API tells us the status of the
// last message. (Showing a tick on every row was wrong: a message the
// customer sent has no ticks.)
function StatusIcon({ status }) {
  if (status === "READ") {
    return <FaCheckDouble className="shrink-0 text-xs text-blue-500" aria-label="Read" />;
  }
  if (status === "DELIVERED") {
    return <FaCheckDouble className="shrink-0 text-xs text-gray-400" aria-label="Delivered" />;
  }
  if (status === "SENT") {
    return <FaCheck className="shrink-0 text-xs text-gray-400" aria-label="Sent" />;
  }
  return null;
}

function ConversationCard({ conversation, isSelected, onSelect }) {
  if (!conversation) return null;

  const name = getConversationName(conversation);
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation)}
      aria-current={isSelected ? "true" : undefined}
      className={`flex w-full items-center gap-3 border-b border-gray-100 border-l-4 px-4 py-3.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#22C55E]/60 ${
        isSelected
          ? "border-l-[#22C55E] bg-[#DDF6C8]"
          : "border-l-transparent hover:bg-gray-50"
      }`}
    >
      {/* Avatar */}
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white ${avatarColor(name)}`}
      >
        {getInitial(name)}
      </span>

      {/* Name + last message */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-semibold text-gray-900">{name}</h3>

          <span
            className={`shrink-0 text-xs ${
              hasUnread ? "font-semibold text-[#0F7A3A]" : "text-gray-500"
            }`}
          >
            {formatListTime(conversation.updatedAt)}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            <StatusIcon status={conversation.messageStatus} />
            <p className="truncate text-sm text-gray-600">
              {conversation.lastMessage || "No messages yet"}
            </p>
          </div>

          {hasUnread && (
            <span
              className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#22C55E] px-1.5 text-xs font-semibold text-white"
              aria-label={`${conversation.unreadCount} unread`}
            >
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default ConversationCard;