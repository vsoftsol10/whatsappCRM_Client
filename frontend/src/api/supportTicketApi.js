import apiClient from "./apiClient";

// Create a support ticket
export const createSupportTicket = async (ticketData) => {
  const response = await apiClient.post(
    "/api/support-tickets",
    ticketData
  );

  return response.data;
};

// Get tickets raised by the current company
export const getMySupportTickets = async () => {
  const response = await apiClient.get(
    "/api/support-tickets"
  );

  return response.data;
};

// Get a single support ticket
export const getMySupportTicketById = async (id) => {
  const response = await apiClient.get(
    `/api/support-tickets/${id}`
  );

  return response.data;
};