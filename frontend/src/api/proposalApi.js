// frontend/src/api/proposalApi.js   (NEW FILE)
import apiClient from "./apiClient";

export const getProposals = async (params = {}) => {
  const response = await apiClient.get("/api/proposals", { params });
  return response.data;
};

export const getProposalById = async (id) => {
  const response = await apiClient.get(`/api/proposals/${id}`);
  return response.data;
};

export const createProposal = async (data) => {
  const response = await apiClient.post("/api/proposals", data);
  return response.data;
};

export const updateProposal = async (id, data) => {
  const response = await apiClient.put(`/api/proposals/${id}`, data);
  return response.data;
};

export const deleteProposal = async (id) => {
  const response = await apiClient.delete(`/api/proposals/${id}`);
  return response.data;
};

// Returns the PDF as a Blob
export const downloadProposalPdf = async (id) => {
  const response = await apiClient.get(`/api/proposals/${id}/pdf`, {
    responseType: "blob",
  });
  return response.data;
};

export const sendProposalOnWhatsApp = async (id, message = "") => {
  const response = await apiClient.post(`/api/proposals/${id}/send-whatsapp`, {
    message,
  });
  return response.data;
};