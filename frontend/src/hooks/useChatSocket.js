import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "../api/socketClient";
import useConversationStore from "../store/conversationStore";
import useMessageStore from "../store/messageStore";

// Live chat updates. Mount once (AppLayout) so it works on every page.
// Handlers read the stores with getState(), so they never hold stale data.
export default function useChatSocket() {
  useEffect(() => {
    if (!localStorage.getItem("token")) return undefined;

    const socket = connectSocket();

    // Several events can arrive together (e.g. a burst of images) —
    // refresh the conversation list once, not once per message.
    let refreshTimer = null;
    const refreshConversations = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        useConversationStore.getState().fetchConversations();
      }, 400);
    };

    const handleNewMessage = ({ conversationId, message } = {}) => {
      if (!conversationId || !message) return;

      const { selectedConversation, markAsRead } =
        useConversationStore.getState();

      if (selectedConversation?.id === conversationId) {
        useMessageStore.getState().appendMessage(message);

        // The agent is looking at this chat, so it counts as read.
        if (message.sender === "CUSTOMER") {
          markAsRead(conversationId);
        }
      }

      refreshConversations();
    };

    const handleStatus = (payload) => {
      useMessageStore.getState().applyStatus(payload);
    };

    // After a dropped connection we may have missed events: resync.
    let hasConnectedBefore = false;
    const handleConnect = () => {
      if (hasConnectedBefore) {
        const { selectedConversation } = useConversationStore.getState();
        if (selectedConversation?.id) {
          useMessageStore.getState().fetchMessages(selectedConversation.id);
        }
        refreshConversations();
      }
      hasConnectedBefore = true;
    };

    socket.on("connect", handleConnect);
    socket.on("message:new", handleNewMessage);
    socket.on("message:status", handleStatus);

    return () => {
      clearTimeout(refreshTimer);
      socket.off("connect", handleConnect);
      socket.off("message:new", handleNewMessage);
      socket.off("message:status", handleStatus);
      disconnectSocket();
    };
  }, []);
}
