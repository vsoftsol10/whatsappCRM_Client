// import apiClient from "./apiClient";

// // ==========================================
// // GET AI SETTINGS + list of supported providers
// // Response: { settings, providers }
// // ==========================================
// export const getAiSettings = async () => {
//   const response = await apiClient.get("/api/ai-settings");
//   return response.data;
// };

// // ==========================================
// // UPDATE AI SETTINGS
// // payload: { isEnabled, provider, model, baseUrl, systemPrompt,
// //            historyLimit, apiKey?, removeKeyFor? }
// // ==========================================
// export const updateAiSettings = async (payload) => {
//   const response = await apiClient.patch("/api/ai-settings", payload);
//   return response.data;
// };

// // ==========================================
// // TEST CONNECTION (works with unsaved form values)
// // payload: { message, provider, model, baseUrl, apiKey?, systemPrompt }
// // Response: { reply, latencyMs, provider, model }
// // ==========================================
// export const testAiSettings = async (payload) => {
//   const response = await apiClient.post("/api/ai-settings/test", payload);
//   return response.data;
// };



import apiClient from "./apiClient";

// ==========================================
// GET AI SETTINGS
// Response: { settings, companyName }
// settings.aiAvailable = platform AI is configured
// ==========================================
export const getAiSettings = async () => {
  const response = await apiClient.get("/api/ai-settings");
  return response.data;
};

// ==========================================
// UPDATE AI SETTINGS
// payload: { isEnabled, businessProfile, systemPrompt, historyLimit }
// (systemPrompt = optional extra instructions)
// ==========================================
export const updateAiSettings = async (payload) => {
  const response = await apiClient.patch("/api/ai-settings", payload);
  return response.data;
};

// ==========================================
// TEST (works with unsaved values)
// payload: { message, businessProfile, systemPrompt }
// Response: { reply, latencyMs }
// ==========================================
export const testAiSettings = async (payload) => {
  const response = await apiClient.post("/api/ai-settings/test", payload);
  return response.data;
};