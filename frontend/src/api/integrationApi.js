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