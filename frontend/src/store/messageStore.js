// import { create } from "zustand";
// import {
//   sendMessage,
//   sendMediaMessage,
//   getMessagesByConversation,
//   editMessage,
//   deleteMessage,
// } from "../api/messageApi";

// const useMessageStore = create((set) => ({
//   messages: [],
//   loading: false,

//   // GET MESSAGES
//   fetchMessages: async (conversationId) => {
//     try {
//       set({ loading: true });

//       const data = await getMessagesByConversation(conversationId);

//       set({
//         messages: data.messages,
//         loading: false,
//       });
//     } catch (error) {
//       console.error(error);
//       set({ loading: false });
//     }
//   },

//   // SEND MESSAGE
//   addMessage: async (messageData) => {
//     try {
//       await sendMessage(messageData);
//     } catch (error) {
//       console.error(error);
//     }
//   },

//   // SEND MEDIA (image / voice / video / document)
//   // Returns { success, message } so the UI can show the real error.
//   addMediaMessage: async (mediaData) => {
//     try {
//       await sendMediaMessage(mediaData);
//       return { success: true };
//     } catch (error) {
//       console.error(error);

//       return {
//         success: false,
//         message:
//           error.response?.data?.message ||
//           error.message ||
//           "Failed to send file",
//       };
//     }
//   },

//   // EDIT MESSAGE
//   updateMessage: async (id, content) => {
//     try {
//       const result = await editMessage(id, content);

//       set((state) => ({
//         messages: state.messages.map((message) =>
//           message.id === id ? result.data : message
//         ),
//       }));
//     } catch (error) {
//       console.error(error);
//     }
//   },

//   // DELETE MESSAGE
//   removeMessage: async (id) => {
//     try {
//       await deleteMessage(id);

//       set((state) => ({
//         messages: state.messages.filter(
//           (message) => message.id !== id
//         ),
//       }));
//     } catch (error) {
//       console.error(error);
//     }
//   },

//   // CLEAR ALL MESSAGES (local state only — used after clearing chat on the server)
//   clearMessages: () => {
//     set({ messages: [] });
//   },
// }));

// export default useMessageStore;


import { create } from "zustand";
import {
  sendMessage,
  sendMediaMessage,
  getMessagesByConversation,
  editMessage,
  deleteMessage,
} from "../api/messageApi";

const useMessageStore = create((set) => ({
  messages: [],
  loading: false,

  // GET MESSAGES
  fetchMessages: async (conversationId) => {
    try {
      set({ loading: true });

      const data = await getMessagesByConversation(conversationId);

      set({
        messages: data.messages,
        loading: false,
      });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
  },

  // SEND MESSAGE
  addMessage: async (messageData) => {
    try {
      await sendMessage(messageData);
    } catch (error) {
      console.error(error);
    }
  },

  // SEND MEDIA (image / voice / video / document)
  // Returns { success, message } so the UI can show the real error.
  addMediaMessage: async (mediaData) => {
    try {
      await sendMediaMessage(mediaData);
      return { success: true };
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
    set({ messages: [] });
  },

  // REAL-TIME: add a message pushed by the server (ignored if already shown)
  appendMessage: (message) => {
    set((state) => {
      if (state.messages.some((m) => m.id === message.id)) {
        return state;
      }

      return { messages: [...state.messages, message] };
    });
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