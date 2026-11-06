// import { useState } from "react";
// import { FaSearch } from "react-icons/fa";
// import SocialAvatar from "./SocialAvatar";
// import { getContactName, formatListTime } from "./socialTheme";

// function SocialThreadList({
//   theme,
//   conversations = [],
//   selectedConversation,
//   onSelect,
// }) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filter, setFilter] = useState("ALL");
//   const Icon = theme.Icon;
//   const isFacebook = theme.variant === "facebook";

//   const filtered = conversations
//     .filter((conversation) =>
//       getContactName(conversation)
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase())
//     )
//     .filter((conversation) =>
//       filter === "UNREAD" ? conversation.unreadCount > 0 : true
//     );

//   return (
//     <div className="flex h-full min-h-0 w-full flex-col bg-white">
//       {/* Header */}
//       <div className="px-4 pb-2 pt-4">
//         <div className="flex items-center justify-between">
//           <h1
//             className={`text-[24px] font-bold text-[#050505] ${
//               isFacebook ? "" : "tracking-tight"
//             }`}
//           >
//             {theme.listTitle}
//           </h1>

//           <span
//             className={`flex h-9 w-9 items-center justify-center rounded-full ${
//               isFacebook ? "bg-[#F0F2F5]" : "bg-transparent"
//             } ${theme.accentText}`}
//           >
//             <Icon size={isFacebook ? 18 : 24} />
//           </span>
//         </div>

//         {/* Search */}
//         <div
//           className={`mt-3 flex items-center gap-2 rounded-full px-3 py-2 ${theme.searchBg}`}
//         >
//           <FaSearch size={14} className="text-[#65676B]" />
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder={theme.searchPlaceholder}
//             className="min-w-0 flex-1 bg-transparent text-[15px] text-[#050505] outline-none placeholder:text-[#65676B]"
//           />
//         </div>

//         {/* Filters */}
//         <div className="mt-3 flex gap-2">
//           {[
//             { id: "ALL", label: "All" },
//             { id: "UNREAD", label: "Unread" },
//           ].map((item) => (
//             <button
//               key={item.id}
//               onClick={() => setFilter(item.id)}
//               className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
//                 filter === item.id ? theme.pillActive : theme.pillIdle
//               }`}
//             >
//               {item.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* List */}
//       <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
//         {filtered.length === 0 ? (
//           <div className="flex h-full items-center justify-center p-6">
//             <p className="text-center text-sm text-[#65676B]">
//               No conversations found.
//             </p>
//           </div>
//         ) : (
//           filtered.map((conversation) => {
//             const unread = conversation.unreadCount > 0;
//             const selected = selectedConversation?.id === conversation.id;

//             return (
//               <button
//                 key={conversation.id}
//                 onClick={() => onSelect(conversation)}
//                 className={`flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition ${
//                   selected ? theme.selectedRow : theme.hoverRow
//                 }`}
//               >
//                 <SocialAvatar
//                   conversation={conversation}
//                   theme={theme}
//                   size={56}
//                   ring={theme.ringOnUnread && unread}
//                 />

//                 <div className="min-w-0 flex-1">
//                   <h3
//                     className={`truncate text-[15px] text-[#050505] ${
//                       unread ? "font-bold" : "font-medium"
//                     }`}
//                   >
//                     {getContactName(conversation)}
//                   </h3>

//                   <p
//                     className={`flex items-center gap-1 text-[13px] ${
//                       unread ? "font-semibold text-[#050505]" : "text-[#65676B]"
//                     }`}
//                   >
//                     <span className="truncate">
//                       {conversation.lastMessage || "No messages yet"}
//                     </span>
//                     <span className="shrink-0">
//                       · {formatListTime(conversation.updatedAt)}
//                     </span>
//                   </p>
//                 </div>

//                 {unread && (
//                   <span
//                     className={`h-3 w-3 shrink-0 rounded-full ${theme.accentBg}`}
//                     title={`${conversation.unreadCount} unread`}
//                   />
//                 )}
//               </button>
//             );
//           })
//         )}
//       </div>
//     </div>
//   );
// }

// export default SocialThreadList;


import { useState, useRef, useEffect } from "react";
import { FaSearch, FaChevronDown, FaCheck } from "react-icons/fa";
import SocialAvatar from "./SocialAvatar";
import {
  getContactName,
  formatListTime,
  getAccountLabel,
  getAccountColor,
} from "./socialTheme";

function SocialThreadList({
  theme,
  conversations = [],
  selectedConversation,
  onSelect,
  accounts = [],
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [accountFilter, setAccountFilter] = useState("ALL");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);
  const Icon = theme.Icon;
  const isFacebook = theme.variant === "facebook";

  // Account chips / labels only make sense when there are 2 or more accounts
  const hasManyAccounts = accounts.length > 1;

  // If the chosen account disappears, fall back to "All"
  const activeAccount = accounts.some((account) => account.id === accountFilter)
    ? accountFilter
    : "ALL";

  const selectedAccount =
    accounts.find((account) => account.id === activeAccount) || null;

  // Close the account dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target)
      ) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectAccount = (value) => {
    setAccountFilter(value);
    setShowAccountMenu(false);
  };

  const totalUnread = conversations.reduce(
    (sum, conversation) => sum + (conversation.unreadCount || 0),
    0
  );

  const unreadByAccount = (accountId) =>
    conversations
      .filter((conversation) => conversation.facebookPage?.id === accountId)
      .reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0);

  const filtered = conversations
    .filter((conversation) =>
      getContactName(conversation)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .filter((conversation) =>
      filter === "UNREAD" ? conversation.unreadCount > 0 : true
    )
    .filter((conversation) =>
      !hasManyAccounts || activeAccount === "ALL"
        ? true
        : conversation.facebookPage?.id === activeAccount
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

        {/* Filters + account dropdown (same line) */}
        <div className="mt-3 flex items-center gap-2">
          {[
            { id: "ALL", label: "All" },
            { id: "UNREAD", label: "Unread" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                filter === item.id ? theme.pillActive : theme.pillIdle
              }`}
            >
              {item.label}
            </button>
          ))}

          {/* Account dropdown (only when 2 or more accounts have chats) */}
          {hasManyAccounts && (
            <div ref={accountMenuRef} className="relative ml-auto min-w-0">
              <button
                onClick={() => setShowAccountMenu((prev) => !prev)}
                className={`flex max-w-[200px] items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  selectedAccount ? theme.pillActive : theme.pillIdle
                }`}
              >
                {selectedAccount && (
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      getAccountColor(selectedAccount.id, accounts).dot
                    }`}
                  />
                )}
                <span className="truncate">
                  {selectedAccount ? selectedAccount.label : "All accounts"}
                </span>
                <FaChevronDown
                  size={10}
                  className={`shrink-0 transition ${
                    showAccountMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={() => selectAccount("ALL")}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#262626] hover:bg-gray-100"
                  >
                    <span className="flex-1 truncate font-medium">
                      All accounts
                    </span>
                    {totalUnread > 0 && (
                      <span className="rounded-full bg-[#ED4956] px-1.5 text-[11px] font-bold leading-4 text-white">
                        {totalUnread}
                      </span>
                    )}
                    {activeAccount === "ALL" && (
                      <FaCheck size={12} className={theme.accentText} />
                    )}
                  </button>

                  {accounts.map((account) => {
                    const color = getAccountColor(account.id, accounts);
                    const unread = unreadByAccount(account.id);

                    return (
                      <button
                        key={account.id}
                        onClick={() => selectAccount(account.id)}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[#262626] hover:bg-gray-100"
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${color.dot}`}
                        />
                        <span className="flex-1 truncate font-medium">
                          {account.label}
                        </span>
                        {unread > 0 && (
                          <span className="rounded-full bg-[#ED4956] px-1.5 text-[11px] font-bold leading-4 text-white">
                            {unread}
                          </span>
                        )}
                        {activeAccount === account.id && (
                          <FaCheck size={12} className={theme.accentText} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
            const accountLabel = getAccountLabel(conversation, theme.variant);
            const accountColor = getAccountColor(
              conversation.facebookPage?.id,
              accounts
            );

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

                  {/* Which account received this chat */}
                  {hasManyAccounts && accountLabel && (
                    <p
                      className={`mt-0.5 inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${accountColor.chip}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${accountColor.dot}`}
                      />
                      <span className="truncate">{accountLabel}</span>
                    </p>
                  )}

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
