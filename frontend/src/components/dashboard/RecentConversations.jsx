// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { MessageCircle, ChevronRight, MessageSquareDashed } from "lucide-react";

// import useDashboardStore from "../../store/dashboardStore";

// const POLL_INTERVAL_MS = 10000; // 10s — catches new WhatsApp messages without a manual refresh

// // Turns a timestamp into "2 min ago", "Yesterday", etc.
// function timeAgo(dateString) {
//   if (!dateString) return "";

//   const diffMs = Date.now() - new Date(dateString).getTime();
//   const diffSec = Math.floor(diffMs / 1000);
//   const diffMin = Math.floor(diffSec / 60);
//   const diffHr = Math.floor(diffMin / 60);
//   const diffDay = Math.floor(diffHr / 24);

//   if (diffSec < 60) return "Just now";
//   if (diffMin < 60) return `${diffMin} min ago`;
//   if (diffHr < 24) return `${diffHr} hr ago`;
//   if (diffDay === 1) return "Yesterday";
//   if (diffDay < 7) return `${diffDay} days ago`;

//   return new Date(dateString).toLocaleDateString();
// }

// export default function RecentConversations() {
//   const navigate = useNavigate();

//   const {
//     recentConversations,
//     isConversationsLoading,
//     conversationsError,
//     fetchRecentConversations,
//   } = useDashboardStore();

//   useEffect(() => {
//     fetchRecentConversations(5);

//     // Poll so new inbound WhatsApp messages (which arrive via webhook,
//     // not a user click) show up here without the user refreshing the page.
//     const interval = setInterval(() => {
//       fetchRecentConversations(5);
//     }, POLL_INTERVAL_MS);

//     return () => clearInterval(interval);
//   }, [fetchRecentConversations]);

//   const hasConversations = recentConversations.length > 0;

//   return (
//     <div className="h-full w-full flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
//       {/* Header */}
//       <div className="flex shrink-0 items-center justify-between mb-6">
//         <div>
//           <h2 className="text-xl font-bold text-gray-900">
//             Recent Conversations
//           </h2>

//           <p className="text-sm text-gray-500 mt-1">
//             Latest customer interactions
//           </p>
//         </div>

//         <button
//           onClick={() => navigate("/conversations")}
//           className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
//         >
//           View All
//           <ChevronRight size={16} />
//         </button>
//       </div>

//       {/* Error state */}
//       {conversationsError && (
//         <p className="text-sm text-red-600">{conversationsError}</p>
//       )}

//       {/* Loading state (first load only) */}
//       {isConversationsLoading && (
//         <div className="flex-1 space-y-4">
//           {[...Array(3)].map((_, i) => (
//             <div
//               key={i}
//               className="h-20 rounded-xl bg-gray-100 animate-pulse"
//             />
//           ))}
//         </div>
//       )}

//       {/* Empty state — fills remaining card height instead of hugging the top */}
//       {!isConversationsLoading && !conversationsError && !hasConversations && (
//         <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
//           <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
//             <MessageSquareDashed size={26} className="text-blue-400" />
//           </div>

//           <div>
//             <p className="font-semibold text-gray-900">
//               No conversations yet
//             </p>
//             <p className="mt-1 text-sm text-gray-500">
//               New WhatsApp chats will show up here automatically.
//             </p>
//           </div>

//           <button
//             onClick={() => navigate("/conversations")}
//             className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
//           >
//             Go to Conversations
//           </button>
//         </div>
//       )}

//       {/* Conversation List */}
//       {!isConversationsLoading && hasConversations && (
//         <div className="space-y-4">
//           {recentConversations.map((chat) => {
//             const displayName =
//               chat.customer?.name ||
//               chat.contactName ||
//               chat.phone ||
//               "Unknown";

//             return (
//               <div
//                 key={chat.id}
//                 onClick={() => navigate(`/conversations?conversationId=${chat.id}`)}
//                 className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-md cursor-pointer"
//               >
//                 {/* Left */}
//                 <div className="flex items-center gap-4 min-w-0">
//                   {/* Avatar */}
//                   <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
//                     {displayName.charAt(0).toUpperCase()}
//                   </div>

//                   {/* Name + Message */}
//                   <div className="min-w-0">
//                     <h3 className="font-semibold text-gray-900 truncate">
//                       {displayName}
//                     </h3>

//                     <p className="mt-1 text-sm text-gray-500 truncate">
//                       {chat.lastMessage || "No messages yet"}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Right */}
//                 <div className="flex shrink-0 flex-col items-end gap-2 pl-3">
//                   <span className="text-xs text-gray-400">
//                     {timeAgo(chat.updatedAt)}
//                   </span>

//                   {chat.unreadCount > 0 ? (
//                     <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
//                       {chat.unreadCount}
//                     </span>
//                   ) : (
//                     <MessageCircle size={18} className="text-gray-400" />
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }


import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, MessageSquareDashed } from "lucide-react";

import useDashboardStore from "../../store/dashboardStore";

const POLL_INTERVAL_MS = 10000; // 10s — catches new messages without a manual refresh

// Where each channel's inbox lives
const CHANNELS = {
  WHATSAPP: { label: "WhatsApp", path: "/conversations" },
  MESSENGER: { label: "Messenger", path: "/facebook-conversations" },
  INSTAGRAM: { label: "Instagram", path: "/instagram-conversations" },
};

// Avatar colours, picked from the name so each person keeps the same colour
const AVATAR_COLORS = [
  "bg-[#159A4B]",
  "bg-blue-600",
  "bg-violet-600",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-600",
];

const colorFor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

// Turns a timestamp into "2 min ago", "Yesterday", etc.
function timeAgo(dateString) {
  if (!dateString) return "";

  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;

  return new Date(dateString).toLocaleDateString();
}

export default function RecentConversations() {
  const navigate = useNavigate();

  const {
    recentConversations,
    isConversationsLoading,
    conversationsError,
    fetchRecentConversations,
  } = useDashboardStore();

  useEffect(() => {
    fetchRecentConversations(5);

    // New inbound messages arrive via webhook, not a click, so poll for them.
    const interval = setInterval(() => {
      fetchRecentConversations(5);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchRecentConversations]);

  const hasConversations = recentConversations.length > 0;

  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex shrink-0 items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Recent Conversations</h2>
          <p className="mt-1 text-sm text-slate-600">Latest customer messages</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/conversations")}
          className="flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-[#159A4B] transition hover:text-[#0F7A3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A4B]/50"
        >
          View all
          <ChevronRight size={16} />
        </button>
      </div>

      {conversationsError && (
        <p className="text-sm text-red-600">{conversationsError}</p>
      )}

      {/* Loading (first load only) */}
      {isConversationsLoading && (
        <div className="flex-1 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isConversationsLoading && !conversationsError && !hasConversations && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#159A4B]/10">
            <MessageSquareDashed size={26} className="text-[#159A4B]" />
          </div>

          <div>
            <p className="font-semibold text-slate-900">No conversations yet</p>
            <p className="mt-1 text-sm text-slate-600">
              New chats will show up here automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/conversations")}
            className="mt-2 rounded-full bg-[#159A4B] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#0F7A3A]"
          >
            Go to Conversations
          </button>
        </div>
      )}

      {/* List */}
      {!isConversationsLoading && hasConversations && (
        <ul className="space-y-3">
          {recentConversations.map((chat) => {
            const displayName =
              chat.customer?.name || chat.contactName || chat.phone || "Unknown";
            const channel = CHANNELS[chat.channel] || CHANNELS.WHATSAPP;
            const time = timeAgo(chat.updatedAt);

            return (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => navigate(channel.path)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-[#159A4B]/40 hover:bg-[#159A4B]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A4B]/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white ${colorFor(displayName)}`}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{displayName}</p>
                      <p className="truncate text-sm text-slate-600">
                        {chat.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      {chat.unreadCount > 0 && (
                        <span className="rounded-full bg-[#159A4B] px-2.5 py-0.5 text-xs font-semibold text-white">
                          {chat.unreadCount} new
                        </span>
                      )}
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {channel.label}
                      </span>
                    </div>
                    {time && <span className="text-xs text-slate-500">{time}</span>}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}