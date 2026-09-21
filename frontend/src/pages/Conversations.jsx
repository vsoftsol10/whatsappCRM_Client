import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useConversationStore from "../store/conversationStore";
import Sidebar from "../components/conversation/Sidebar";
import ChatHeader from "../components/conversation/ChatHeader";
import MessageList from "../components/conversation/MessageList";
import MessageInput from "../components/conversation/MessageInput";
import CustomerDetails from "../components/conversation/CustomerDetails";


import useMessageStore from "../store/messageStore";

function Conversations() {
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
  } = useMessageStore();

  // Load conversations when page opens
  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    const openCustomerConversation = async () => {
      if (!customerId) return;

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

    await addMessage({
      conversationId: selectedConversation.id,
      content,
      sender: "AGENT",
      messageType: "TEXT",
      status: "SENT",
    });

    await fetchMessages(selectedConversation.id);
    await fetchConversations();
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
          conversations={conversations}
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
            messages={messages}
          />
        </div>

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
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