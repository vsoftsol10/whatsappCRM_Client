// import apiClient from "./apiClient";

// // FORGOT PASSWORD
// export const forgotPassword = async (email) => {
//   const response = await apiClient.post(
//     "/api/auth/forgot-password",
//     { email }
//   );

//   return response.data;
// };

// // RESET PASSWORD
// export const resetPassword = async (
//   token,
//   password
// ) => {
//   const response = await apiClient.post(
//     `/api/auth/reset-password/${token}`,
//     { password }
//   );

//   return response.data;
// };

// // CHANGE PASSWORD
// export const changePassword = async (passwordData) => {
//   const response = await apiClient.post(
//     "/api/auth/change-password",
//     passwordData
//   );

//   return response.data;
// };

import apiClient from "./apiClient";

// FORGOT PASSWORD
export const forgotPassword = async (email) => {
  const response = await apiClient.post(
    "/api/auth/forgot-password",
    { email }
  );

  return response.data;
};

// RESET PASSWORD
export const resetPassword = async (
  token,
  password
) => {
  const response = await apiClient.post(
    `/api/auth/reset-password/${token}`,
    { password }
  );

  return response.data;
};

// CHANGE PASSWORD
export const changePassword = async (passwordData) => {
  const response = await apiClient.post(
    "/api/auth/change-password",
    passwordData
  );

  return response.data;
};

// UPDATE MY PROFILE (self-service — admin or employee, own profile only)
export const updateProfile = async (profileData) => {
  const formData = new FormData();

  Object.entries(profileData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  const response = await apiClient.put(
    "/api/auth/update-profile",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};