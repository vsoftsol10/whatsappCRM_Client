// import apiClient from "./apiClient";

// // ================= GET ALL NOTIFICATIONS =================
// export const getNotifications = async () => {
//   const response = await apiClient.get(
//     "/api/notifications"
//   );

//   return response.data;
// };

// // ================= MARK SINGLE NOTIFICATION AS READ =================
// export const markNotificationAsRead = async (
//   id
// ) => {
//   const response = await apiClient.patch(
//     `/api/notifications/${id}/read`
//   );

//   return response.data;
// };

// // ================= MARK ALL NOTIFICATIONS AS READ =================
// export const markAllNotificationsAsRead =
//   async () => {
//     const response = await apiClient.patch(
//       "/api/notifications/read-all"
//     );

//     return response.data;
//   };

// // ================= DELETE NOTIFICATION =================
// export const deleteNotification = async (
//   id
// ) => {
//   const response = await apiClient.delete(
//     `/api/notifications/${id}`
//   );

//   return response.data;
// };

import apiClient from "./apiClient";

// ================= GET USER NOTIFICATIONS =================
export const getNotifications = async () => {
  const response = await apiClient.get("/api/user-notifications");
  return response.data;
};

// ================= MARK SINGLE NOTIFICATION AS READ =================
export const markNotificationAsRead = async (id) => {
  const response = await apiClient.patch(
    `/api/user-notifications/${id}/read`
  );

  return response.data;
};

// ================= MARK ALL NOTIFICATIONS AS READ =================
export const markAllNotificationsAsRead = async () => {
  const response = await apiClient.patch(
    "/api/user-notifications/read-all"
  );

  return response.data;
};

// ================= DELETE NOTIFICATION =================
export const deleteNotification = async (id) => {
  const response = await apiClient.delete(
    `/api/user-notifications/${id}`
  );

  return response.data;
};