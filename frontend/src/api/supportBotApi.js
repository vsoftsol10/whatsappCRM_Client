import apiClient from "./apiClient";

// Is the chatbot available for my company? Also returns the welcome text,
// suggested questions and the bot name.
export const getSupportBotStatus = async () => {
  const response = await apiClient.get("/api/support-bot/status");
  return response.data;
};

// Re-open my most recent chat (if it is less than 7 days old)
export const getLatestSupportChat = async () => {
  const response = await apiClient.get("/api/support-bot/conversations/latest");
  return response.data;
};

// payload: { message, conversationId?, page? }
export const sendSupportBotMessage = async (payload) => {
  const response = await apiClient.post("/api/support-bot/chat", payload);
  return response.data;
};

// value: 1 (helpful) or -1 (not helpful)
export const sendSupportBotFeedback = async (messageId, value) => {
  const response = await apiClient.post("/api/support-bot/feedback", {
    messageId,
    value,
  });
  return response.data;
};