import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import useConversationStore from "../store/conversationStore";
import Sidebar from "../components/conversation/Sidebar";
import ChatHeader from "../components/conversation/ChatHeader";
import MessageList from "../components/conversation/MessageList";
import MessageInput from "../components/conversation/MessageInput";
import CustomerDetails from "../components/conversation/CustomerDetails";


import useMessageStore from "../store/messageStore";
import { toast } from "react-hot-toast";

// Which inbox a conversation belongs to.
// Anything that is not MESSENGER / INSTAGRAM is treated as WhatsApp,
// so older conversations keep showing up on the WhatsApp page.
const getConversationChannel = (conversation) => {
  if (conversation?.channel === "MESSENGER") return "MESSENGER";
  if (conversation?.channel === "INSTAGRAM") return "INSTAGRAM";
  return "WHATSAPP";
};

const CHANNEL_TITLES = {
  WHATSAPP: "WhatsApp Conversations",
  MESSENGER: "Facebook Conversations",
  INSTAGRAM: "Instagram Conversations",
};

// channel = "WHATSAPP" (default) | "MESSENGER" | "INSTAGRAM"
function Conversations({ channel = "WHATSAPP" }) {
  const location = useLocation();

  const customerId = location.state?.customerId;

  // Mobile Navigation State
  const [showChat, setShowChat] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  // Conversation Store
  const {
    conversations,
    selectedConversation,
    setSelectedConversation,
    fetchConversations,
    markAsRead,
    addConversation,
  } = useConversationStore();

  // Message Store
  const {
    messages,
    fetchMessages,
    addMessage,
    addMediaMessage,
    clearMessages,
    appendMessage,
    messagesConversationId,
    loading: messagesLoading,
  } = useMessageStore();

  // Only show the conversations of this page's channel
  const channelConversations = useMemo(
    () =>
      (conversations || []).filter(
        (conversation) => getConversationChannel(conversation) === channel
      ),
    [conversations, channel]
  );

  // Load conversations when page opens
  useEffect(() => {
    fetchConversations();

    // The selected chat is shared between pages. If it belongs to another
    // channel (e.g. we came from the WhatsApp page), clear it.
    const { selectedConversation: current } =
      useConversationStore.getState();

    if (current && getConversationChannel(current) !== channel) {
      setSelectedConversation(null);
      clearMessages();
    }
  }, []);

  useEffect(() => {
    const openCustomerConversation = async () => {
      // Opening a customer's chat from the Customers page is WhatsApp only
      if (!customerId || channel !== "WHATSAPP") return;

      try {
        // First load all conversations
        await fetchConversations();

        const store = useConversationStore.getState();

        // Check if this customer already has a conversation
        const existingConversation = store.conversations.find(
          (conversation) =>
            String(conversation.customerId) === String(customerId)
        );

        if (existingConversation) {
          setSelectedConversation(existingConversation);
          setShowChat(true);
          return;
        }

        // No conversation yet.
        // Create one for this customer.
        const newConversation = await addConversation({
          customerId,
          status: "OPEN",
          channel: "WHATSAPP",
          unreadCount: 0,
          lastMessage: "",
        });

        if (newConversation) {
          setSelectedConversation(newConversation);
          setShowChat(true);
        }
      } catch (error) {
        console.error(
          "Failed to open customer conversation:",
          error
        );
      }
    };

    openCustomerConversation();
  }, [customerId]);

  // Load messages whenever a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);

      // Open chat on mobile after selecting a conversation
      setShowChat(true);
    }
  }, [selectedConversation]);

  // Send message
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

  // Send image / voice / video / document
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

      {/* Left Sidebar */}
      <div
        className={`
            ${showChat ? "hidden" : "flex"}
            flex-1 min-h-0 bg-white
            xl:flex xl:w-[350px] xl:min-w-[300px]
            xl:flex-none xl:border-r
          `}
      >
        <Sidebar
          title={CHANNEL_TITLES[channel] || "Conversations"}
          conversations={channelConversations}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
        />
      </div>

      {/* Chat Section */}
      <div
        className={`
          ${showChat ? "flex" : "hidden"}
          min-h-[520px] min-w-0 flex-1 flex-col bg-[#f7f7f7]
          xl:flex xl:min-h-0
        `}
      >
        {/* Chat Header */}
        <ChatHeader
          selectedConversation={selectedConversation}
          showChat={showChat}
          setShowChat={setShowChat}
          setShowCustomerDetails={setShowCustomerDetails}
        />

        {/* Messages */}
        <div className="min-h-0 flex-1">
          <MessageList
            messages={
              selectedConversation &&
              messagesConversationId === selectedConversation.id
                ? messages
                : []
            }
            loading={
              !!selectedConversation &&
              (messagesLoading ||
                messagesConversationId !== selectedConversation.id)
            }
          />
        </div>

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onSendMedia={handleSendMedia}
          disabled={!selectedConversation}
        />
      </div>

      {/* Customer Details */}
      <div className="hidden max-h-[320px] border-t bg-white xl:block xl:max-h-none xl:w-[320px] xl:min-w-[280px] xl:border-l xl:border-t-0">
        <CustomerDetails
          customer={selectedConversation}
          showCustomerDetails={showCustomerDetails}
          setShowCustomerDetails={setShowCustomerDetails}
        />
      </div>

    </div>
  );
}

export default Conversations;