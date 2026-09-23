// import apiClient from "./apiClient";

// const INTEGRATION_BASE_URL = "/api/integrations";

// export const getIntegrations = async () => {
//   const response = await apiClient.get(INTEGRATION_BASE_URL);
//   return response.data;
// };

// export const getIntegrationById = async (id) => {
//   const response = await apiClient.get(`${INTEGRATION_BASE_URL}/${id}`);
//   return response.data;
// };

// export const createIntegration = async (data) => {
//   const response = await apiClient.post(INTEGRATION_BASE_URL, data);
//   return response.data;
// };

// export const updateIntegrationStatus = async (id, status) => {
//   const response = await apiClient.put(
//     `${INTEGRATION_BASE_URL}/${id}/status`,
//     { status }
//   );
//   return response.data;
// };

// export const deleteIntegration = async (id) => {
//   const response = await apiClient.delete(
//     `${INTEGRATION_BASE_URL}/${id}`
//   );
//   return response.data;
// };

// export const getIntegrationEvents = async (id) => {
//   const response = await apiClient.get(
//     `${INTEGRATION_BASE_URL}/${id}/events`
//   );
//   return response.data;
// };


import apiClient from "./apiClient";

const INTEGRATION_BASE_URL = "/api/integrations";

export const getIntegrations = async () => {
  const response = await apiClient.get(INTEGRATION_BASE_URL);
  return response.data;
};

export const getIntegrationById = async (id) => {
  const response = await apiClient.get(`${INTEGRATION_BASE_URL}/${id}`);
  return response.data;
};

export const createIntegration = async (data) => {
  const response = await apiClient.post(INTEGRATION_BASE_URL, data);
  return response.data;
};

export const updateIntegrationStatus = async (id, status) => {
  const response = await apiClient.put(
    `${INTEGRATION_BASE_URL}/${id}/status`,
    { status }
  );
  return response.data;
};

// Paste the provider's real signing secret (from Stripe/Razorpay
// dashboard) to replace the auto-generated one from creation.
export const updateIntegrationSecret = async (id, webhookSecret) => {
  const response = await apiClient.put(
    `${INTEGRATION_BASE_URL}/${id}/secret`,
    { webhookSecret }
  );
  return response.data;
};
 
// NEW: update an integration's automation settings
// (e.g. autoCreateCustomer, autoCreatePurchase).
// Used by IntegrationDetailsModal's settings form.
export const updateIntegrationSettings = async (id, settings) => {
  const response = await apiClient.put(
    `${INTEGRATION_BASE_URL}/${id}/settings`,
    { settings }
  );
  return response.data;
};

export const deleteIntegration = async (id) => {
  const response = await apiClient.delete(
    `${INTEGRATION_BASE_URL}/${id}`
  );
  return response.data;
};

export const getIntegrationEvents = async (id) => {
  const response = await apiClient.get(
    `${INTEGRATION_BASE_URL}/${id}/events`
  );
  return response.data;
};

// List of providers that have a real adapter on the backend
// (see backend/src/integrations/adapters/index.js).
// Used to populate the Provider dropdown so a user can never
// pick a name that doesn't match a working adapter.
export const getSupportedProviders = async () => {
  const response = await apiClient.get(
    `${INTEGRATION_BASE_URL}/providers`
  );
  return response.data;
};