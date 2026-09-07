import apiClient from "./apiClient";

// ==========================================
// GET AI SETTINGS (Grok config)
// ==========================================
export const getAiSettings = async () => {
  const response = await apiClient.get("/api/ai-settings");
  return response.data;
};

// ==========================================
// UPDATE AI SETTINGS (Grok config)
// ==========================================
export const updateAiSettings = async (settingsData) => {
  const response = await apiClient.patch("/api/ai-settings", settingsData);
  return response.data;
};