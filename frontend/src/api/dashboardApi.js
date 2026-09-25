import apiClient from "./apiClient";

export const getDashboardStats = async () => {
  const response = await apiClient.get("/api/dashboard/stats");

  return response.data;
};

export const getRecentConversations = async (limit = 5) => {
  const response = await apiClient.get(
    `/api/dashboard/recent-conversations?limit=${limit}`
  );

  return response.data;
};