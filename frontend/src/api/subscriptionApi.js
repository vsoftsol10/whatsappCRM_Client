import apiClient from "./apiClient";

export const getMySubscription = async () => {
  const response = await apiClient.get("/api/subscriptions/me");
  return response.data;
};

// Plan switches + limits + usage (managed in Super Admin)
export const getMyFeatures = async () => {
  const response = await apiClient.get("/api/subscriptions/features");
  return response.data;
};

export const getPlans = async () => {
  const response = await apiClient.get("/api/subscriptions/plans");
  return response.data;
};

// ==========================================
// CREATE UPGRADE REQUEST
// ==========================================
export const createUpgradeRequest = async (planId) => {
  const response = await apiClient.post(
    "/api/upgrade-requests",
    {
      requestedPlanId: planId,
    }
  );

  return response.data;
};

// ==========================================
// GET MY LATEST UPGRADE REQUEST
// ==========================================
export const getMyUpgradeRequest = async () => {
  const response = await apiClient.get(
    "/api/upgrade-requests/me"
  );

  return response.data;
};