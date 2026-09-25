import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ChevronRight, MessageSquareDashed } from "lucide-react";

import useDashboardStore from "../../store/dashboardStore";

const POLL_INTERVAL_MS = 10000; // 10s — catches new WhatsApp messages without a manual refresh

// Turns a timestamp into "2 min ago", "Yesterday", etc.
function timeAgo(dateString) {
  if (!dateString) return "";

  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSec = Math.floor(diffMs / 1000);
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

    // Poll so new inbound WhatsApp messages (which arrive via webhook,
    // not a user click) show up here without the user refreshing the page.
    const interval = setInterval(() => {
      fetchRecentConversations(5);
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchRecentConversations]);

  const hasConversations = recentConversations.length > 0;

  return (
    <div className="h-full w-full flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Recent Conversations
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Latest customer interactions
          </p>
        </div>

        <button
          onClick={() => navigate("/conversations")}
          className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
        >
          View All
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Error state */}
      {conversationsError && (
        <p className="text-sm text-red-600">{conversationsError}</p>
      )}

      {/* Loading state (first load only) */}
      {isConversationsLoading && (
        <div className="flex-1 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state — fills remaining card height instead of hugging the top */}
      {!isConversationsLoading && !conversationsError && !hasConversations && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <MessageSquareDashed size={26} className="text-blue-400" />
          </div>

          <div>
            <p className="font-semibold text-gray-900">
              No conversations yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              New WhatsApp chats will show up here automatically.
            </p>
          </div>

          <button
            onClick={() => navigate("/conversations")}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Go to Conversations
          </button>
        </div>
      )}

      {/* Conversation List */}
      {!isConversationsLoading && hasConversations && (
        <div className="space-y-4">
          {recentConversations.map((chat) => {
            const displayName =
              chat.customer?.name || chat.phone || "Unknown";

            return (
              <div
                key={chat.id}
                onClick={() => navigate(`/conversations?conversationId=${chat.id}`)}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-md cursor-pointer"
              >
                {/* Left */}
                <div className="flex items-center gap-4 min-w-0">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  {/* Name + Message */}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {displayName}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <div className="flex shrink-0 flex-col items-end gap-2 pl-3">
                  <span className="text-xs text-gray-400">
                    {timeAgo(chat.updatedAt)}
                  </span>

                  {chat.unreadCount > 0 ? (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
                      {chat.unreadCount}
                    </span>
                  ) : (
                    <MessageCircle size={18} className="text-gray-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
