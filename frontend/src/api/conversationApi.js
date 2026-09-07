import apiClient from "./apiClient";

// ===============================
// GET ALL CONVERSATIONS
// ===============================
export const getConversations = async () => {
  const response = await apiClient.get("/api/conversations");
  return response.data;
};

// ===============================
// GET CONVERSATION BY ID
// ===============================
export const getConversationById = async (id) => {
  const response = await apiClient.get(
    `/api/conversations/${id}`
  );
  return response.data;
};

// ===============================
// CREATE CONVERSATION
// ===============================
export const createConversation = async (conversationData) => {
  const response = await apiClient.post(
    "/api/conversations",
    conversationData
  );
  return response.data;
};

// ===============================
// UPDATE CONVERSATION STATUS
// ===============================
export const updateConversationStatus = async (
  id,
  status
) => {
  const response = await apiClient.patch(
    `/api/conversations/${id}`,
    {
      status,
    }
  );

  return response.data;
};

// ===============================
// TOGGLE BOT (AI AUTO-REPLY)
// ===============================
export const toggleConversationBot = async (id, botEnabled) => {
  const response = await apiClient.patch(
    `/api/conversations/${id}/bot-toggle`,
    {
      botEnabled,
    }
  );

  return response.data;
};

// ===============================
// MARK CONVERSATION AS READ
// ===============================
export const markConversationAsRead = async (id) => {
  const response = await apiClient.patch(
    `/api/conversations/${id}/read`
  );

  return response.data;
};

// ===============================
// MARK CONVERSATION AS UNREAD
// ===============================
export const markConversationAsUnread = async (id) => {
  const response = await apiClient.patch(
    `/api/conversations/${id}/unread`
  );

  return response.data;
};

// ===============================
// CLEAR CHAT (delete all messages)
// ===============================
export const clearConversationMessages = async (id) => {
  const response = await apiClient.delete(
    `/api/conversations/${id}/messages`
  );

  return response.data;
};

// ===============================
// DELETE CONVERSATION
// ===============================
export const deleteConversation = async (id) => {
  const response = await apiClient.delete(
    `/api/conversations/${id}`
  );

  return response.data;
};