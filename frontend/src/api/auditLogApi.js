import apiClient from "./apiClient";

// ==========================================
// GET AUDIT LOGS (with filters + pagination)
// ==========================================
export const getAuditLogs = async (params = {}) => {
  const response = await apiClient.get("/api/audit-logs", {
    params,
  });

  return response.data;
};

// ==========================================
// GET SINGLE AUDIT LOG BY ID
// ==========================================
export const getAuditLogById = async (id) => {
  const response = await apiClient.get(`/api/audit-logs/${id}`);

  return response.data;
};