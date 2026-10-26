import apiClient from "./apiClient";

export const getServices = async (params = {}) => {
  const response = await apiClient.get("/api/services", { params });
  return response.data;
};

export const createService = async (serviceData) => {
  const response = await apiClient.post("/api/services", serviceData);
  return response.data;
};

export const updateService = async (id, serviceData) => {
  const response = await apiClient.put(`/api/services/${id}`, serviceData);
  return response.data;
};

export const deleteService = async (id) => {
  const response = await apiClient.delete(`/api/services/${id}`);
  return response.data;
};

// Returns { customerIds: [...] } for one service
export const getServiceCustomers = async (id) => {
  const response = await apiClient.get(`/api/services/${id}/customers`);
  return response.data;
};

// Replaces the customers of ONE service
export const setServiceCustomers = async (id, customerIds) => {
  const response = await apiClient.put(`/api/services/${id}/customers`, {
    customerIds,
  });
  return response.data;
};
