import apiClient from "./apiClient";

// ===============================
// SEND MESSAGE
// ===============================
export const sendMessage = async (messageData) => {
  const response = await apiClient.post(
    "/api/messages",
    messageData
  );

  return response.data;
};

// ===============================
// GET MESSAGES BY CONVERSATION ID
// ===============================
export const getMessagesByConversation = async (
  conversationId
) => {
  const response = await apiClient.get(
    `/api/messages/${conversationId}`
  );

  return response.data;
};

// ===============================
// EDIT MESSAGE
// ===============================
export const editMessage = async (id, content) => {
  const response = await apiClient.put(
    `/api/messages/${id}`,
    { content }
  );

  return response.data;
};

// ===============================
// DELETE MESSAGE
// ===============================
export const deleteMessage = async (id) => {
  const response = await apiClient.delete(
    `/api/messages/${id}`
  );

  return response.data;
};

// ===============================
// SEND MEDIA MESSAGE (image / voice / video / document)
// ===============================
export const sendMediaMessage = async ({
  conversationId,
  file,
  caption = "",
}) => {
  const formData = new FormData();

  formData.append("conversationId", conversationId);
  formData.append("file", file);

  if (caption) {
    formData.append("caption", caption);
  }

  const response = await apiClient.post(
    "/api/messages/media",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};
