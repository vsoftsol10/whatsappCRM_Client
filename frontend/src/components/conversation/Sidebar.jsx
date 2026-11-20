// import { useState } from "react";
// import ConversationCard from "./ConversationCard";
// import SearchBar from "./SearchBar";

// function Sidebar({
//   conversations = [],
//   selectedConversation,
//   setSelectedConversation,
// }) {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filter, setFilter] = useState("ALL");

//   // Search
//   let filteredConversations = conversations.filter((conversation) => {
//     const searchValue =
//       conversation.customer?.name ||
//       conversation.phone ||
//       "";

//     return searchValue
//       .toLowerCase()
//       .includes(searchTerm.toLowerCase());
//   });

//   // Filter
//   filteredConversations = filteredConversations.filter((conversation) => {
//     if (filter === "ALL") return true;

//     if (filter === "OPEN") {
//       return conversation.status === "OPEN";
//     }

//     if (filter === "CLOSED") {
//       return conversation.status === "CLOSED";
//     }

//     if (filter === "UNREAD") {
//       return conversation.unreadCount > 0;
//     }

//     return true;
//   });

//   return (
//     <div className="flex h-full min-h-0 w-full flex-col bg-white">
//       {/* Header */}
//       <div className="border-b border-gray-200 bg-white px-4 py-4">
//         <h1 className="text-2xl font-bold text-gray-900">
//           Conversations
//         </h1>

//         <p className="mt-1 text-sm text-gray-500">
//           {filteredConversations.length} Conversation
//           {filteredConversations.length !== 1 ? "s" : ""}
//         </p>
//       </div>

//       {/* Search */}
//       <SearchBar
//         searchTerm={searchTerm}
//         setSearchTerm={setSearchTerm}
//       />

//       {/* Filters */}
//       <div className="flex gap-2 overflow-x-auto border-b border-gray-200 px-4 py-3">
//         <button
//           onClick={() => setFilter("ALL")}
//           className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
//             filter === "ALL"
//               ? "bg-[#25D366] text-white"
//               : "bg-[#DCF8C6] text-[#128C7E] hover:bg-[#25D366] hover:text-white"
//           }`}
//         >
//           All
//         </button>

//         <button
//           onClick={() => setFilter("UNREAD")}
//           className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
//             filter === "UNREAD"
//               ? "bg-[#25D366] text-white"
//               : "bg-[#DCF8C6] text-[#128C7E] hover:bg-[#25D366] hover:text-white"
//           }`}
//         >
//           Unread
//         </button>
//       </div>

//       {/* Conversation List */}
//       <div className="min-h-0 flex-1 overflow-y-auto">
//         {filteredConversations.length > 0 ? (
//           filteredConversations.map((conversation) => (
//             <ConversationCard
//               key={conversation.id}
//               conversation={conversation}
//               isSelected={
//                 selectedConversation?.id === conversation.id
//               }
//               onSelect={setSelectedConversation}
//             />
//           ))
//         ) : (
//           <div className="flex h-full items-center justify-center p-6">
//             <p className="text-center text-sm text-gray-500">
//               No conversations found.
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default Sidebar;


import { useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import ConversationCard from "./ConversationCard";
import SearchBar from "./SearchBar";
import { getConversationName } from "../../utils/conversationDisplay";

const pillBase =
  "whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]/60";

const pillState = (active) =>
  active
    ? "bg-[#22C55E] text-white"
    : "bg-[#DCFCE7] text-[#0F7A3A] hover:bg-[#BBF7D0]";

// The chat list (left column)
function Sidebar({
  title = "Chats",
  conversations = [],
  selectedConversation,
  setSelectedConversation,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");

  const unreadChats = useMemo(
    () => conversations.filter((c) => c.unreadCount > 0).length,
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return conversations.filter((conversation) => {
      if (filter === "UNREAD" && !(conversation.unreadCount > 0)) return false;
      if (!term) return true;

      // Search the name and the phone number
      return (
        getConversationName(conversation).toLowerCase().includes(term) ||
        String(conversation.phone || "").toLowerCase().includes(term) ||
        String(conversation.customer?.phone || "").toLowerCase().includes(term)
      );
    });
  }, [conversations, searchTerm, filter]);

  const count = filteredConversations.length;

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {count} Conversation{count !== 1 ? "s" : ""}
          </p>
        </div>

        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[#22C55E]"
          aria-hidden="true"
        >
          <FaWhatsapp size={22} />
        </span>
      </div>

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto border-b border-gray-200 px-4 pb-4">
        <button
          type="button"
          aria-pressed={filter === "ALL"}
          onClick={() => setFilter("ALL")}
          className={`${pillBase} ${pillState(filter === "ALL")}`}
        >
          All
        </button>

        <button
          type="button"
          aria-pressed={filter === "UNREAD"}
          onClick={() => setFilter("UNREAD")}
          className={`${pillBase} ${pillState(filter === "UNREAD")}`}
        >
          Unread{unreadChats > 0 ? ` ${unreadChats}` : ""}
        </button>
      </div>

      {/* Conversation list */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {count > 0 ? (
          filteredConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversation?.id === conversation.id}
              onSelect={setSelectedConversation}
            />
          ))
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <p className="text-center text-sm text-gray-500">
              {conversations.length === 0
                ? "No conversations yet. New chats will appear here."
                : "No chats match your search."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;