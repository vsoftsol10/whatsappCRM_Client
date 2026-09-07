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
    try {
      set({ loading: true });

      const data = await getConversations();

      console.log("API Response:", data);
      console.log("Conversations:", data.conversations);

      set({
        conversations: data.conversations,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
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