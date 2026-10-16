import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import SocialAvatar from "./SocialAvatar";
import { getContactName, formatListTime } from "./socialTheme";

function SocialThreadList({
  theme,
  conversations = [],
  selectedConversation,
  onSelect,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");
  const Icon = theme.Icon;
  const isFacebook = theme.variant === "facebook";

  const filtered = conversations
    .filter((conversation) =>
      getContactName(conversation)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .filter((conversation) =>
      filter === "UNREAD" ? conversation.unreadCount > 0 : true
    );

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white">
      {/* Header */}
      <div className="px-4 pb-2 pt-4">
        <div className="flex items-center justify-between">
          <h1
            className={`text-[24px] font-bold text-[#050505] ${
              isFacebook ? "" : "tracking-tight"
            }`}
          >
            {theme.listTitle}
          </h1>

          <span
            className={`flex h-9 w-9 items-center justify-center rounded-full ${
              isFacebook ? "bg-[#F0F2F5]" : "bg-transparent"
            } ${theme.accentText}`}
          >
            <Icon size={isFacebook ? 18 : 24} />
          </span>
        </div>

        {/* Search */}
        <div
          className={`mt-3 flex items-center gap-2 rounded-full px-3 py-2 ${theme.searchBg}`}
        >
          <FaSearch size={14} className="text-[#65676B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={theme.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[#050505] outline-none placeholder:text-[#65676B]"
          />
        </div>

        {/* Filters */}
        <div className="mt-3 flex gap-2">
          {[
            { id: "ALL", label: "All" },
            { id: "UNREAD", label: "Unread" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                filter === item.id ? theme.pillActive : theme.pillIdle
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6">
            <p className="text-center text-sm text-[#65676B]">
              No conversations found.
            </p>
          </div>
        ) : (
          filtered.map((conversation) => {
            const unread = conversation.unreadCount > 0;
            const selected = selectedConversation?.id === conversation.id;

            return (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation)}
                className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition ${
                  selected ? theme.selectedRow : theme.hoverRow
                }`}
              >
                <SocialAvatar
                  conversation={conversation}
                  theme={theme}
                  size={56}
                  ring={theme.ringOnUnread && unread}
                />

                <div className="min-w-0 flex-1">
                  <h3
                    className={`truncate text-[15px] text-[#050505] ${
                      unread ? "font-bold" : "font-medium"
                    }`}
                  >
                    {getContactName(conversation)}
                  </h3>

                  <p
                    className={`flex items-center gap-1 text-[13px] ${
                      unread ? "font-semibold text-[#050505]" : "text-[#65676B]"
                    }`}
                  >
                    <span className="truncate">
                      {conversation.lastMessage || "No messages yet"}
                    </span>
                    <span className="shrink-0">
                      · {formatListTime(conversation.updatedAt)}
                    </span>
                  </p>
                </div>

                {unread && (
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full ${theme.accentBg}`}
                    title={`${conversation.unreadCount} unread`}
                  />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default SocialThreadList;
