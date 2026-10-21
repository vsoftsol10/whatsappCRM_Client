// import { useEffect, useMemo, useState } from "react";
// import { toast } from "react-hot-toast";
// import useConversationStore from "../../../store/conversationStore";
// import useMessageStore from "../../../store/messageStore";
// import SocialThreadList from "./SocialThreadList";
// import SocialChatHeader from "./SocialChatHeader";
// import SocialMessageList from "./SocialMessageList";
// import SocialMessageInput from "./SocialMessageInput";
// import SocialContactInfo from "./SocialContactInfo";
// import { SOCIAL_THEMES } from "./socialTheme";

// // One inbox screen used by both the Facebook and the Instagram pages.
// // variant = "facebook" | "instagram"
// function SocialInbox({ variant = "facebook" }) {
//   const theme = SOCIAL_THEMES[variant] || SOCIAL_THEMES.facebook;
//   const Icon = theme.Icon;

//   const [showChat, setShowChat] = useState(false);
//   const [showInfo, setShowInfo] = useState(false);

//   const {
//     conversations,
//     selectedConversation,
//     setSelectedConversation,
//     fetchConversations,
//     markAsRead,
//   } = useConversationStore();

//   const {
//     messages,
//     messagesConversationId,
//     fetchMessages,
//     addMessage,
//     addMediaMessage,
//     clearMessages,
//     appendMessage,
//     loading: messagesLoading,
//   } = useMessageStore();

//   // Only this channel's conversations
//   const channelConversations = useMemo(
//     () =>
//       (conversations || []).filter(
//         (conversation) => conversation.channel === theme.channel
//       ),
//     [conversations, theme.channel]
//   );

//   // Load conversations when the page opens. The selected chat is shared
//   // between pages, so drop it if it belongs to another channel.
//   useEffect(() => {
//     fetchConversations();

//     const { selectedConversation: current } =
//       useConversationStore.getState();

//     if (current && current.channel !== theme.channel) {
//       setSelectedConversation(null);
//       clearMessages();
//     }
//   }, []);

//   // Load messages whenever a conversation is selected
//   useEffect(() => {
//     if (selectedConversation) {
//       fetchMessages(selectedConversation.id);
//       markAsRead(selectedConversation.id);
//       setShowChat(true);
//     }
//   }, [selectedConversation]);

//   const handleSendMessage = async (content) => {
//     if (!selectedConversation) return;

//     const response = await addMessage({
//       conversationId: selectedConversation.id,
//       content,
//       sender: "AGENT",
//       messageType: "TEXT",
//       status: "SENT",
//     });

//     // Show the sent message at once; reload only if the API gave none back
//     if (response?.data) {
//       appendMessage(response.data);
//     } else {
//       await fetchMessages(selectedConversation.id);
//     }

//     // Refresh the list in the background (does not block the chat)
//     fetchConversations();
//   };

//   const handleSendMedia = async (file, caption = "") => {
//     if (!selectedConversation) return false;

//     const result = await addMediaMessage({
//       conversationId: selectedConversation.id,
//       file,
//       caption,
//     });

//     if (!result.success) {
//       toast.error(result.message);
//       return false;
//     }

//     if (result.data) {
//       appendMessage(result.data);
//     } else {
//       await fetchMessages(selectedConversation.id);
//     }

//     // Refresh the list in the background (does not block the chat)
//     fetchConversations();
//     return true;
//   };

//   return (
//     <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col bg-white xl:min-h-full xl:flex-row">
//       {/* Chat list */}
//       <div
//         className={`
//           ${showChat ? "hidden" : "flex"}
//           min-h-0 flex-1 bg-white
//           xl:flex xl:min-w-[300px] ${theme.listWidth}
//           xl:flex-none xl:border-r xl:border-[#DBDBDB]
//         `}
//       >
//         <SocialThreadList
//           theme={theme}
//           conversations={channelConversations}
//           selectedConversation={selectedConversation}
//           onSelect={setSelectedConversation}
//         />
//       </div>

//       {/* Conversation */}
//       <div
//         className={`
//           ${showChat ? "flex" : "hidden"}
//           min-h-[520px] min-w-0 flex-1 flex-col bg-white
//           xl:flex xl:min-h-0
//         `}
//       >
//         {selectedConversation ? (
//           <>
//             <SocialChatHeader
//               theme={theme}
//               selectedConversation={selectedConversation}
//               setShowChat={setShowChat}
//               setShowInfo={setShowInfo}
//             />

//             <div className="min-h-0 flex-1">
//               <SocialMessageList
//                 theme={theme}
//                 conversation={selectedConversation}
//                 messages={
//                   messagesConversationId === selectedConversation.id
//                     ? messages
//                     : []
//                 }
//                 loading={
//                   messagesLoading ||
//                   messagesConversationId !== selectedConversation.id
//                 }
//               />
//             </div>

//             <SocialMessageInput
//               theme={theme}
//               onSendMessage={handleSendMessage}
//               onSendMedia={handleSendMedia}
//               disabled={!selectedConversation}
//             />
//           </>
//         ) : (
//           <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
//             <span
//               className={`flex h-20 w-20 items-center justify-center rounded-full border-2 ${theme.accentText} border-current`}
//             >
//               <Icon size={36} />
//             </span>
//             <h2 className="mt-4 text-xl font-semibold text-[#050505]">
//               {theme.emptyTitle}
//             </h2>
//             <p className="mt-1 max-w-xs text-sm text-[#65676B]">
//               {theme.emptyText}
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Contact details (desktop panel + mobile overlay) */}
//       <div className="bg-white xl:w-[320px] xl:min-w-[280px] xl:border-l xl:border-[#DBDBDB]">
//         <SocialContactInfo
//           theme={theme}
//           conversation={selectedConversation}
//           showInfo={showInfo}
//           setShowInfo={setShowInfo}
//         />
//       </div>
//     </div>
//   );
// }

// export default SocialInbox;


import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import useConversationStore from "../../../store/conversationStore";
import useMessageStore from "../../../store/messageStore";
import SocialThreadList from "./SocialThreadList";
import SocialChatHeader from "./SocialChatHeader";
import SocialMessageList from "./SocialMessageList";
import SocialMessageInput from "./SocialMessageInput";
import SocialContactInfo from "./SocialContactInfo";
import { SOCIAL_THEMES } from "./socialTheme";

// One inbox screen used by both the Facebook and the Instagram pages.
// variant = "facebook" | "instagram"
function SocialInbox({ variant = "facebook" }) {
  const theme = SOCIAL_THEMES[variant] || SOCIAL_THEMES.facebook;
  const Icon = theme.Icon;

  const [showChat, setShowChat] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    fetchConversations,
    markAsRead,
  } = useConversationStore();

  const {
    messages,
    messagesConversationId,
    fetchMessages,
    addMessage,
    addMediaMessage,
    clearMessages,
    appendMessage,
    loading: messagesLoading,
  } = useMessageStore();

  // Only this channel's conversations
  const channelConversations = useMemo(
    () =>
      (conversations || []).filter(
        (conversation) => conversation.channel === theme.channel
      ),
    [conversations, theme.channel]
  );

  // Load conversations when the page opens. The selected chat is shared
  // between pages, so drop it if it belongs to another channel.
  useEffect(() => {
    fetchConversations();

    const { selectedConversation: current } =
      useConversationStore.getState();

    if (current && current.channel !== theme.channel) {
      setSelectedConversation(null);
      clearMessages();
    }
  }, []);

  // Load messages whenever a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
      setShowChat(true);
    }
  }, [selectedConversation]);

  const handleSendMessage = async (content) => {
    if (!selectedConversation) return;

    const response = await addMessage({
      conversationId: selectedConversation.id,
      content,
      sender: "AGENT",
      messageType: "TEXT",
      status: "SENT",
    });

    // Show the sent message at once; reload only if the API gave none back
    if (response?.data) {
      appendMessage(response.data);
    } else {
      await fetchMessages(selectedConversation.id);
    }

    // Refresh the list in the background (does not block the chat)
    fetchConversations();
  };

  const handleSendMedia = async (file, caption = "") => {
    if (!selectedConversation) return false;

    const result = await addMediaMessage({
      conversationId: selectedConversation.id,
      file,
      caption,
    });

    if (!result.success) {
      toast.error(result.message);
      return false;
    }

    if (result.data) {
      appendMessage(result.data);
    } else {
      await fetchMessages(selectedConversation.id);
    }

    // Refresh the list in the background (does not block the chat)
    fetchConversations();
    return true;
  };

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)] flex-col bg-white xl:min-h-full xl:flex-row">
      {/* Chat list */}
      <div
        className={`
          ${showChat ? "hidden" : "flex"}
          min-h-0 flex-1 bg-white
          xl:flex xl:min-w-[300px] ${theme.listWidth}
          xl:flex-none xl:border-r xl:border-[#DBDBDB]
        `}
      >
        <SocialThreadList
          theme={theme}
          conversations={channelConversations}
          selectedConversation={selectedConversation}
          onSelect={setSelectedConversation}
        />
      </div>

      {/* Conversation */}
      <div
        className={`
          ${showChat ? "flex" : "hidden"}
          min-h-[520px] min-w-0 flex-1 flex-col bg-white
          xl:flex xl:min-h-0
        `}
      >
        {selectedConversation ? (
          <>
            <SocialChatHeader
              theme={theme}
              selectedConversation={selectedConversation}
              setShowChat={setShowChat}
              setShowInfo={setShowInfo}
            />

            <div className="min-h-0 flex-1">
              <SocialMessageList
                theme={theme}
                conversation={selectedConversation}
                messages={
                  messagesConversationId === selectedConversation.id
                    ? messages
                    : []
                }
                loading={
                  messagesLoading ||
                  messagesConversationId !== selectedConversation.id
                }
              />
            </div>

            <SocialMessageInput
              theme={theme}
              onSendMessage={handleSendMessage}
              onSendMedia={handleSendMedia}
              conversationKey={selectedConversation?.id}
              disabled={!selectedConversation}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span
              className={`flex h-20 w-20 items-center justify-center rounded-full border-2 ${theme.accentText} border-current`}
            >
              <Icon size={36} />
            </span>
            <h2 className="mt-4 text-xl font-semibold text-[#050505]">
              {theme.emptyTitle}
            </h2>
            <p className="mt-1 max-w-xs text-sm text-[#65676B]">
              {theme.emptyText}
            </p>
          </div>
        )}
      </div>

      {/* Contact details (desktop panel + mobile overlay) */}
      <div className="bg-white xl:w-[320px] xl:min-w-[280px] xl:border-l xl:border-[#DBDBDB]">
        <SocialContactInfo
          theme={theme}
          conversation={selectedConversation}
          showInfo={showInfo}
          setShowInfo={setShowInfo}
        />
      </div>
    </div>
  );
}

export default SocialInbox;

