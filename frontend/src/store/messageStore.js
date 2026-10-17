import { create } from "zustand";
import {
  sendMessage,
  sendMediaMessage,
  getMessagesByConversation,
  editMessage,
  deleteMessage,
} from "../api/messageApi";

// Id of the newest fetchMessages() call. A slower, older response must never
// overwrite the messages of the chat the agent opened last.
let latestFetchId = 0;

const useMessageStore = create((set, get) => ({
  messages: [],
  // Which conversation the `messages` above belong to
  messagesConversationId: null,
  loading: false,

  // GET MESSAGES
  fetchMessages: async (conversationId) => {
    const requestId = ++latestFetchId;

    try {
      // Opening a DIFFERENT chat: drop the old chat's messages right away,
      // so they are never shown inside the new chat while it loads.
      if (get().messagesConversationId !== conversationId) {
        set({
          messages: [],
          messagesConversationId: conversationId,
          loading: true,
        });
      } else {
        set({ loading: true });
      }

      const data = await getMessagesByConversation(conversationId);

      // A newer request was started meanwhile - ignore this old answer
      if (requestId !== latestFetchId) return;

      set({
        messages: data.messages,
        messagesConversationId: conversationId,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      if (requestId === latestFetchId) set({ loading: false });
    }
  },

  // SEND MESSAGE
  // Now also returns the API response, so the caller can show the sent
  // message at once (no extra reload).
  addMessage: async (messageData) => {
    try {
      return await sendMessage(messageData);
    } catch (error) {
      console.error(error);
      return null;
    }
  },

  // SEND MEDIA (image / voice / video / document)
  // Returns { success, message } so the UI can show the real error.
  addMediaMessage: async (mediaData) => {
    try {
      const response = await sendMediaMessage(mediaData);
      return { success: true, data: response?.data };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to send file",
      };
    }
  },

  // EDIT MESSAGE
  updateMessage: async (id, content) => {
    try {
      const result = await editMessage(id, content);

      set((state) => ({
        messages: state.messages.map((message) =>
          message.id === id ? result.data : message
        ),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  // DELETE MESSAGE
  removeMessage: async (id) => {
    try {
      await deleteMessage(id);

      set((state) => ({
        messages: state.messages.filter(
          (message) => message.id !== id
        ),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  // CLEAR ALL MESSAGES (local state only — used after clearing chat on the server)
  clearMessages: () => {
    latestFetchId += 1; // cancel any request still in flight
    set({ messages: [], messagesConversationId: null });
  },

  // REAL-TIME: add a message pushed by the server (ignored if already shown)
  appendMessage: (message) => {
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) {
        return state;
      }

      // Never put a message into a chat it does not belong to
      if (
        state.messagesConversationId &&
        message.conversationId &&
        message.conversationId !== state.messagesConversationId
      ) {
        return state;
      }

      return { messages: [...state.messages, message] };
    });
  },

  // REAL-TIME: a message changed on the server (e.g. its media link was
  // moved to permanent storage)
  applyUpdate: (message) => {
    if (!message?.id) return;

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === message.id ? { ...m, ...message } : m
      ),
    }));
  },

  // REAL-TIME: delivery / read / failed update for a sent message.
  // Never moves a status backwards (a late "delivered" after "read").
  applyStatus: ({ metaMessageId, status, failureReason } = {}) => {
    if (!metaMessageId || !status) return;

    const rank = { SENT: 1, DELIVERED: 2, READ: 3 };

    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.metaMessageId !== metaMessageId) return m;

        const keep =
          status !== "FAILED" &&
          (rank[m.status] || 0) > (rank[status] || 0);

        return keep
          ? m
          : { ...m, status, failureReason: failureReason ?? m.failureReason };
      }),
    }));
  },
}));

export default useMessageStore;