// import apiClient from "./apiClient";

// const FACEBOOK_BASE_URL = "/api/facebook";

// // List this company's connected Facebook Pages
// export const getFacebookPages = async () => {
//   const response = await apiClient.get(`${FACEBOOK_BASE_URL}/pages`);
//   return response.data;
// };

// // Send the result of FB.login() to the backend (admin only).
// // Pass { accessToken } (normal case) or { code }.
// export const connectFacebookPages = async ({ accessToken, code }) => {
//   const response = await apiClient.post(`${FACEBOOK_BASE_URL}/connect`, {
//     accessToken,
//     code,
//   });
//   return response.data;
// };

// // Disconnect one Page (admin only)
// export const disconnectFacebookPage = async (id) => {
//   const response = await apiClient.put(
//     `${FACEBOOK_BASE_URL}/pages/${id}/disconnect`
//   );
//   return response.data;
// };

import apiClient from "./apiClient";

const FACEBOOK_BASE_URL = "/api/facebook";

// List this company's connected Facebook Pages
export const getFacebookPages = async () => {
  const response = await apiClient.get(`${FACEBOOK_BASE_URL}/pages`);
  return response.data;
};

// Send the result of FB.login() to the backend (admin only).
// Pass { accessToken } (normal case) or { code }.
export const connectFacebookPages = async ({ accessToken, code }) => {
  const response = await apiClient.post(`${FACEBOOK_BASE_URL}/connect`, {
    accessToken,
    code,
  });
  return response.data;
};

// Instagram connected directly (no Facebook needed). Returns { url } -
// send the browser there; Instagram brings the admin back to Settings.
export const getInstagramAuthUrl = async () => {
  const response = await apiClient.get("/api/instagram/auth-url");
  return response.data;
};

// Disconnect one Page (admin only)
export const disconnectFacebookPage = async (id) => {
  const response = await apiClient.put(
    `${FACEBOOK_BASE_URL}/pages/${id}/disconnect`
  );
  return response.data;
};