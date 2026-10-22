
// import { useEffect, useRef, useState } from "react";
// import {
//   FaEllipsisH,
//   FaPen,
//   FaTrash,
//   FaRegCopy,
//   FaFileAlt,
// } from "react-icons/fa";
// import useMessageStore from "../../../store/messageStore";
// import ConfirmModal from "../../common/ConfirmModal";
// import LinkifiedText from "../LinkifiedText";
// import SocialAvatar from "./SocialAvatar";
// import { getContactName, formatDayLabel } from "./socialTheme";

// const isAgent = (message) => message.sender?.toUpperCase() === "AGENT";

// const sameDay = (a, b) => {
//   const x = new Date(a);
//   const y = new Date(b);
//   return (
//     x.getFullYear() === y.getFullYear() &&
//     x.getMonth() === y.getMonth() &&
//     x.getDate() === y.getDate()
//   );
// };

// const statusText = (status) => {
//   if (status === "READ") return "Seen";
//   if (status === "DELIVERED") return "Delivered";
//   return "Sent";
// };

// function Bubble({ message, theme, showAvatar, conversation, groupStart, showStatus }) {
//   const sender = isAgent(message);

//   const [showMenu, setShowMenu] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [editText, setEditText] = useState(message.content || "");
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const menuRef = useRef(null);

//   const updateMessage = useMessageStore((state) => state.updateMessage);
//   const removeMessage = useMessageStore((state) => state.removeMessage);

//   useEffect(() => {
//     const handleClickOutside = (e) => {
//       if (menuRef.current && !menuRef.current.contains(e.target)) {
//         setShowMenu(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () =>
//       document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleEditSave = () => {
//     const trimmed = editText.trim();
//     if (!trimmed || trimmed === message.content) {
//       setIsEditing(false);
//       return;
//     }
//     updateMessage(message.id, trimmed);
//     setIsEditing(false);
//   };

//   const time = new Date(message.createdAt).toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//   });

//   const hasMedia = !!message.imageUrl;
//   const isDocument = hasMedia && message.messageType === "DOCUMENT";
//   const showText = !!message.content && !isDocument;

//   return (
//     <>
//       <div
//         className={`group flex items-end gap-2 ${
//           sender ? "justify-end" : "justify-start"
//         } ${groupStart ? "mt-3" : "mt-0.5"}`}
//       >
//         {/* Received avatar (last bubble of a group) */}
//         {!sender && (
//           <div className="w-7 shrink-0">
//             {showAvatar && (
//               <SocialAvatar conversation={conversation} theme={theme} size={28} />
//             )}
//           </div>
//         )}

//         {/* Hover menu (agent messages only) */}
//         {sender && !isEditing && (
//           <div ref={menuRef} className="relative order-first self-center">
//             <button
//               onClick={() => setShowMenu((prev) => !prev)}
//               className="rounded-full p-1.5 text-[#65676B] opacity-0 transition hover:bg-black/5 group-hover:opacity-100"
//             >
//               <FaEllipsisH size={13} />
//             </button>

//             {showMenu && (
//               <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
//                 <button
//                   onClick={() => {
//                     navigator.clipboard.writeText(message.content || "");
//                     setShowMenu(false);
//                   }}
//                   className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
//                 >
//                   <FaRegCopy size={12} /> Copy
//                 </button>
//                 {message.content && (
//                   <button
//                     onClick={() => {
//                       setEditText(message.content || "");
//                       setIsEditing(true);
//                       setShowMenu(false);
//                     }}
//                     className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
//                   >
//                     <FaPen size={12} /> Edit
//                   </button>
//                 )}
//                 <button
//                   onClick={() => {
//                     setShowMenu(false);
//                     setShowDeleteConfirm(true);
//                   }}
//                   className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
//                 >
//                   <FaTrash size={12} /> Delete
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         <div className={`flex max-w-[78%] flex-col sm:max-w-[65%] ${sender ? "items-end" : "items-start"}`}>
//           <div
//             title={time}
//             className={`overflow-hidden ${theme.bubbleRadius} ${
//               sender ? theme.sentBubble : theme.receivedBubble
//             }`}
//           >
//             {hasMedia &&
//               (message.messageType === "AUDIO" ? (
//                 <div className="px-3 pt-3">
//                   <audio src={message.imageUrl} controls className="w-full min-w-[220px]" />
//                 </div>
//               ) : message.messageType === "VIDEO" ? (
//                 <video src={message.imageUrl} controls className="block w-full" />
//               ) : isDocument ? (
//                 <a
//                   href={message.imageUrl}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="m-2 flex items-center gap-3 rounded-lg bg-black/10 px-3 py-3"
//                 >
//                   <FaFileAlt className="shrink-0 text-xl" />
//                   <span className="min-w-0 break-all text-sm">
//                     {message.content || "Document"}
//                   </span>
//                 </a>
//               ) : (
//                 <img
//                   src={message.imageUrl}
//                   alt="Attachment"
//                   className="block w-full object-cover"
//                 />
//               ))}

//             {isEditing ? (
//               <div className="min-w-[200px] bg-white p-2">
//                 <textarea
//                   value={editText}
//                   onChange={(e) => setEditText(e.target.value)}
//                   rows={3}
//                   autoFocus
//                   className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm text-gray-800 outline-none"
//                 />
//                 <div className="mt-1 flex justify-end gap-3 text-xs">
//                   <button
//                     onClick={() => {
//                       setEditText(message.content || "");
//                       setIsEditing(false);
//                     }}
//                     className="text-gray-500 hover:underline"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleEditSave}
//                     className={`font-semibold hover:underline ${theme.accentText}`}
//                   >
//                     Save
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               showText && (
//                 <p className="whitespace-pre-wrap break-words px-3.5 py-2 text-[15px] leading-snug">
//                   <LinkifiedText text={message.content} />
//                 </p>
//               )
//             )}
//           </div>

//           {message.isEdited && !isEditing && (
//             <span className="mt-0.5 px-1 text-[11px] italic text-[#65676B]">
//               Edited
//             </span>
//           )}

//           {sender && showStatus && (
//             <span className="mt-0.5 px-1 text-[11px] text-[#65676B]">
//               {statusText(message.status)} · {time}
//             </span>
//           )}
//         </div>
//       </div>

//       <ConfirmModal
//         isOpen={showDeleteConfirm}
//         title="Delete Message"
//         message="Delete this message? This cannot be undone."
//         confirmText="Delete"
//         cancelText="Cancel"
//         variant="danger"
//         onConfirm={() => {
//           setShowDeleteConfirm(false);
//           removeMessage(message.id);
//         }}
//         onCancel={() => setShowDeleteConfirm(false)}
//       />
//     </>
//   );
// }

// function SocialMessageList({ theme, conversation, messages = [], loading = false }) {
//   const bottomRef = useRef(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   const lastAgentIndex = (() => {
//     for (let i = messages.length - 1; i >= 0; i -= 1) {
//       if (isAgent(messages[i])) return i;
//     }
//     return -1;
//   })();

//   return (
//     <div className="flex h-full flex-col overflow-y-auto bg-white px-3 py-4 sm:px-5">
//       {/* Profile intro, like the top of a real Messenger / Instagram thread */}
//       {conversation && (
//         <div className="flex flex-col items-center pb-4 pt-2">
//           <SocialAvatar conversation={conversation} theme={theme} size={80} />
//           <h3 className="mt-3 text-lg font-semibold text-[#050505]">
//             {getContactName(conversation)}
//           </h3>
//           <p className="text-sm text-[#65676B]">{theme.label}</p>
//         </div>
//       )}

//       {messages.length === 0 && (
//         <p className="py-6 text-center text-sm text-[#65676B]">
//           {loading ? "Loading messages..." : "No messages yet"}
//         </p>
//       )}

//       {messages.map((message, index) => {
//         const prev = messages[index - 1];
//         const next = messages[index + 1];

//         const newDay = !prev || !sameDay(prev.createdAt, message.createdAt);
//         const groupStart =
//           newDay || isAgent(prev) !== isAgent(message);
//         const groupEnd =
//           !next ||
//           isAgent(next) !== isAgent(message) ||
//           !sameDay(next.createdAt, message.createdAt);

//         return (
//           <div key={message.id}>
//             {newDay && (
//               <p className="my-3 text-center text-xs font-medium text-[#65676B]">
//                 {formatDayLabel(message.createdAt)}
//               </p>
//             )}
//             <Bubble
//               message={message}
//               theme={theme}
//               conversation={conversation}
//               groupStart={groupStart}
//               showAvatar={groupEnd}
//               showStatus={index === lastAgentIndex}
//             />
//           </div>
//         );
//       })}

//       <div ref={bottomRef} />
//     </div>
//   );
// }

// export default SocialMessageList;



import { useEffect, useRef, useState } from "react";
import {
  FaEllipsisH,
  FaPen,
  FaTrash,
  FaRegCopy,
  FaFileAlt,
} from "react-icons/fa";
import useMessageStore from "../../../store/messageStore";
import ConfirmModal from "../../common/ConfirmModal";
import LinkifiedText from "../LinkifiedText";
import SocialAvatar from "./SocialAvatar";
import { getContactName, formatDayLabel } from "./socialTheme";

// NEW: our side = a human agent OR the AI bot. Both show on the RIGHT.
const isAgent = (message) =>
  ["AGENT", "BOT"].includes(message.sender?.toUpperCase());

// Only a human agent's messages can be edited / deleted (not the bot's).
const isHumanAgent = (message) => message.sender?.toUpperCase() === "AGENT";

const sameDay = (a, b) => {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
};

const statusText = (status) => {
  if (status === "READ") return "Seen";
  if (status === "DELIVERED") return "Delivered";
  return "Sent";
};

function Bubble({ message, theme, showAvatar, conversation, groupStart, showStatus }) {
  const sender = isAgent(message);

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const menuRef = useRef(null);

  const updateMessage = useMessageStore((state) => state.updateMessage);
  const removeMessage = useMessageStore((state) => state.removeMessage);

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

  const handleEditSave = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      return;
    }
    updateMessage(message.id, trimmed);
    setIsEditing(false);
  };

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const hasMedia = !!message.imageUrl;
  const isDocument = hasMedia && message.messageType === "DOCUMENT";
  const showText = !!message.content && !isDocument;

  return (
    <>
      <div
        className={`group flex items-end gap-2 ${
          sender ? "justify-end" : "justify-start"
        } ${groupStart ? "mt-3" : "mt-0.5"}`}
      >
        {/* Received avatar (last bubble of a group) */}
        {!sender && (
          <div className="w-7 shrink-0">
            {showAvatar && (
              <SocialAvatar conversation={conversation} theme={theme} size={28} />
            )}
          </div>
        )}

        {/* Hover menu (agent messages only) */}
        {sender && isHumanAgent(message) && !isEditing && (
          <div ref={menuRef} className="relative order-first self-center">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className="rounded-full p-1.5 text-[#65676B] opacity-0 transition hover:bg-black/5 group-hover:opacity-100"
            >
              <FaEllipsisH size={13} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(message.content || "");
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FaRegCopy size={12} /> Copy
                </button>
                {message.content && (
                  <button
                    onClick={() => {
                      setEditText(message.content || "");
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FaPen size={12} /> Edit
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                >
                  <FaTrash size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        )}

        <div className={`flex max-w-[78%] flex-col sm:max-w-[65%] ${sender ? "items-end" : "items-start"}`}>
          <div
            title={time}
            className={`overflow-hidden ${theme.bubbleRadius} ${
              sender ? theme.sentBubble : theme.receivedBubble
            }`}
          >
            {hasMedia &&
              (message.messageType === "AUDIO" ? (
                <div className="px-3 pt-3">
                  <audio src={message.imageUrl} controls className="w-full min-w-[220px]" />
                </div>
              ) : message.messageType === "VIDEO" ? (
                <video src={message.imageUrl} controls className="block w-full" />
              ) : isDocument ? (
                <a
                  href={message.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="m-2 flex items-center gap-3 rounded-lg bg-black/10 px-3 py-3"
                >
                  <FaFileAlt className="shrink-0 text-xl" />
                  <span className="min-w-0 break-all text-sm">
                    {message.content || "Document"}
                  </span>
                </a>
              ) : (
                <img
                  src={message.imageUrl}
                  alt="Attachment"
                  className="block w-full object-cover"
                />
              ))}

            {isEditing ? (
              <div className="min-w-[200px] bg-white p-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  autoFocus
                  className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm text-gray-800 outline-none"
                />
                <div className="mt-1 flex justify-end gap-3 text-xs">
                  <button
                    onClick={() => {
                      setEditText(message.content || "");
                      setIsEditing(false);
                    }}
                    className="text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSave}
                    className={`font-semibold hover:underline ${theme.accentText}`}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              showText && (
                <p className="whitespace-pre-wrap break-words px-3.5 py-2 text-[15px] leading-snug">
                  <LinkifiedText text={message.content} />
                </p>
              )
            )}
          </div>

          {message.isEdited && !isEditing && (
            <span className="mt-0.5 px-1 text-[11px] italic text-[#65676B]">
              Edited
            </span>
          )}

          {sender && showStatus && (
            <span className="mt-0.5 px-1 text-[11px] text-[#65676B]">
              {statusText(message.status)} · {time}
            </span>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Message"
        message="Delete this message? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          removeMessage(message.id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

function SocialMessageList({ theme, conversation, messages = [], loading = false }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const lastAgentIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (isAgent(messages[i])) return i;
    }
    return -1;
  })();

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white px-3 py-4 sm:px-5">
      {/* Profile intro, like the top of a real Messenger / Instagram thread */}
      {conversation && (
        <div className="flex flex-col items-center pb-4 pt-2">
          <SocialAvatar conversation={conversation} theme={theme} size={80} />
          <h3 className="mt-3 text-lg font-semibold text-[#050505]">
            {getContactName(conversation)}
          </h3>
          <p className="text-sm text-[#65676B]">{theme.label}</p>
        </div>
      )}

      {messages.length === 0 && (
        <p className="py-6 text-center text-sm text-[#65676B]">
          {loading ? "Loading messages..." : "No messages yet"}
        </p>
      )}

      {messages.map((message, index) => {
        const prev = messages[index - 1];
        const next = messages[index + 1];

        const newDay = !prev || !sameDay(prev.createdAt, message.createdAt);
        const groupStart =
          newDay || isAgent(prev) !== isAgent(message);
        const groupEnd =
          !next ||
          isAgent(next) !== isAgent(message) ||
          !sameDay(next.createdAt, message.createdAt);

        return (
          <div key={message.id}>
            {newDay && (
              <p className="my-3 text-center text-xs font-medium text-[#65676B]">
                {formatDayLabel(message.createdAt)}
              </p>
            )}
            <Bubble
              message={message}
              theme={theme}
              conversation={conversation}
              groupStart={groupStart}
              showAvatar={groupEnd}
              showStatus={index === lastAgentIndex}
            />
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}

export default SocialMessageList;
