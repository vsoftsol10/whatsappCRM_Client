import apiClient from "./apiClient";

// ================= GET ALL NOTIFICATIONS (paginated, filterable) =================
// filter: "ALL" (default), "UNREAD", or a NotificationType value
// (LEAD/TASK/TICKET/CUSTOMER/CAMPAIGN/SYSTEM).
export const getNotifications = async (page = 1, limit = 20, filter = "ALL") => {
  const response = await apiClient.get(
    "/api/user-notifications",
    { params: { page, limit, filter } }
  );

  return response.data;
};

// ================= MARK SINGLE NOTIFICATION AS READ =================
export const markNotificationAsRead = async (
  id
) => {
  const response = await apiClient.patch(
    `/api/user-notifications/${id}/read`
  );

  return response.data;
};

// ================= MARK ALL NOTIFICATIONS AS READ =================
export const markAllNotificationsAsRead =
  async () => {
    const response = await apiClient.patch(
      "/api/user-notifications/read-all"
    );

    return response.data;
  };

// ================= DELETE NOTIFICATION =================
export const deleteNotification = async (
  id
) => {
  const response = await apiClient.delete(
    `/api/user-notifications/${id}`
  );

  return response.data;
};

// ================= DELETE ALL NOTIFICATIONS =================
export const deleteAllNotifications = async () => {
  const response = await apiClient.delete("/api/user-notifications");

  return response.data;
};