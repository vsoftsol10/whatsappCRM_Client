import { create } from "zustand";
import {
  getConversations,
  getConversationById,
  createConversation,
  updateConversationStatus,
  toggleConversationBot,
  markConversationAsRead,
  markConversationAsUnread,
  clearConversationMessages,
  deleteConversation,
} from "../api/conversationApi";

// Id of the newest fetchConversations() call (older answers are ignored)
let latestListFetchId = 0;

const useConversationStore = create((set) => ({
  conversations: [],
  conversation: null,
  loading: false,

  // ADD THESE
  selectedConversation: null,

  setSelectedConversation: (conversation) => {
    set({
      selectedConversation: conversation,
    });
  },

  loading: false,


  // GET ALL CONVERSATIONS
  fetchConversations: async () => {
    const requestId = ++latestListFetchId;

    try {
      set({ loading: true });

      const data = await getConversations();

      // A newer request was started meanwhile - ignore this old answer
      if (requestId !== latestListFetchId) return;

      set({
        conversations: data.conversations,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      if (requestId === latestListFetchId) set({ loading: false });
    }
  },

  // REAL-TIME: a message arrived for a conversation we already have in the
  // list. Update that ONE row (preview, time, unread) and move it to the
  // top, instead of downloading the whole list again.
  // Returns false when the conversation is not in the list yet (new chat),
  // so the caller can load the list.
  applyIncomingMessage: (conversationId, message) => {
    let found = false;

    set((state) => {
      const existing = state.conversations.find(
        (conversation) => conversation.id === conversationId
      );

      if (!existing) return state;

      found = true;

      const isOpen = state.selectedConversation?.id === conversationId;

      const updated = {
        ...existing,
        lastMessage: message.content,
        updatedAt: message.createdAt || new Date().toISOString(),
        unreadCount:
          message.sender === "CUSTOMER" && !isOpen
            ? (existing.unreadCount || 0) + 1
            : existing.unreadCount,
      };

      return {
        conversations: [
          updated,
          ...state.conversations.filter(
            (conversation) => conversation.id !== conversationId
          ),
        ],
      };
    });

    return found;
  },

  // GET CONVERSATION BY ID
  fetchConversationById: async (id) => {
    try {
      set({ loading: true });

      const data = await getConversationById(id);

      set({
        conversation: data.conversation,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
  },

  // CREATE CONVERSATION
  addConversation: async (conversationData) => {
    try {
      const data = await createConversation(conversationData);

      // set((state) => ({
      //   conversations: [...state.conversations, data.conversation],
      //}));
      return data.conversation;
    } catch (error) {
      console.error(error);
    }
  },

  // UPDATE STATUS
  editConversationStatus: async (id, status) => {
    try {
      await updateConversationStatus(id, status);

      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === id
            ? { ...conversation, status }
            : conversation
        ),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  // TOGGLE BOT (AI AUTO-REPLY)
  toggleBot: async (id, botEnabled) => {
    try {
      const data = await toggleConversationBot(id, botEnabled);

      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === id
            ? { ...conversation, botEnabled }
            : conversation
        ),
        selectedConversation:
          state.selectedConversation?.id === id
            ? { ...state.selectedConversation, botEnabled }
            : state.selectedConversation,
      }));

      return data.conversation;
    } catch (error) {
      console.error(error);
    }
  },

  // MARK AS READ
  markAsRead: async (id) => {
    try {
      await markConversationAsRead(id);

      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === id
            ? {
                ...conversation,
                unreadCount: 0,
              }
            : conversation
        ),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  // MARK AS UNREAD
  markAsUnread: async (id) => {
    try {
      await markConversationAsUnread(id);

      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === id
            ? {
                ...conversation,
                unreadCount: 1,
              }
            : conversation
        ),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  // CLEAR CHAT
  clearChat: async (id) => {
    try {
      await clearConversationMessages(id);

      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === id
            ? { ...conversation, lastMessage: "" }
            : conversation
        ),
      }));
    } catch (error) {
      console.error(error);
    }
  },

  // DELETE
  removeConversation: async (id) => {
    try {
      await deleteConversation(id);

      set((state) => ({
        conversations: state.conversations.filter(
          (conversation) => conversation.id !== id
        ),
      }));
    } catch (error) {
      console.error(error);
    }
  },
}));

export default useConversationStore;