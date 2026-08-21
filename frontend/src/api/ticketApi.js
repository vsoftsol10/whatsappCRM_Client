

import apiClient from "./apiClient";

// ================= GET ALL TICKETS =================
export const getTickets = async () => {
  const response = await apiClient.get("/api/tickets");

  return response.data;
};

// ================= GET SINGLE TICKET =================
export const getTicketById = async (id) => {
  const response = await apiClient.get(`/api/tickets/${id}`);

  return response.data;
};

// ================= CREATE TICKET =================
export const createTicket = async (ticketData) => {
  const response = await apiClient.post(
    "/api/tickets",
    ticketData
  );

  return response.data;
};

// ================= UPDATE TICKET =================
export const updateTicket = async (
  id,
  ticketData
) => {
  const response = await apiClient.put(
    `/api/tickets/${id}`,
    ticketData
  );

  return response.data;
};

// ================= UPDATE TICKET STATUS =================
export const updateTicketStatus = async (
  id,
  status
) => {
  const response = await apiClient.patch(
    `/api/tickets/${id}/status`,
    {
      status,
    }
  );

  return response.data;
};

// ================= DELETE TICKET =================
export const deleteTicket = async (id) => {
  const response = await apiClient.delete(
    `/api/tickets/${id}`
  );

  return response.data;
};

// ================= WORK NOTES =================

export const getTicketWorkNotes = async (ticketId) => {
  const response = await apiClient.get(
    `/api/tickets/${ticketId}/work-notes`
  );

  return response.data;
};

export const addTicketWorkNote = async (ticketId, note) => {
  const response = await apiClient.post(
    `/api/tickets/${ticketId}/work-notes`,
    { note }
  );

  return response.data;
};

export const updateTicketWorkNote = async (noteId, note) => {
  const response = await apiClient.put(
    `/api/tickets/work-notes/${noteId}`,
    { note }
  );

  return response.data;
};

export const deleteTicketWorkNote = async (noteId) => {
  const response = await apiClient.delete(
    `/api/tickets/work-notes/${noteId}`
  );

  return response.data;
};