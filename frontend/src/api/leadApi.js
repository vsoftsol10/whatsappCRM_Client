
// import apiClient from "./apiClient";

// // ================= GET ALL LEADS =================
// export const getLeads = async () => {
//   const response = await apiClient.get("/api/leads");
//   return response.data;
// };

// // ================= CREATE LEAD =================
// export const createLead = async (leadData) => {
//   const response = await apiClient.post(
//     "/api/leads",
//     leadData
//   );

//   return response.data;
// };

// // ================= UPDATE LEAD =================
// export const updateLead = async (id, leadData) => {
//   const response = await apiClient.put(
//     `/api/leads/${id}`,
//     leadData
//   );

//   return response.data;
// };

// // ================= UPDATE LEAD STATUS =================
// export const updateLeadStatus = async (id, status) => {
//   const response = await apiClient.patch(
//     `/api/leads/${id}/status`,
//     { status }
//   );

//   return response.data;
// };

// // ================= CONVERT LEAD TO CUSTOMER =================
// export const convertLeadToCustomer = async (id) => {
//   const response = await apiClient.post(
//     `/api/leads/${id}/convert`
//   );

//   return response.data;
// };

// // ================= DELETE LEAD =================
// export const deleteLead = async (id) => {
//   const response = await apiClient.delete(
//     `/api/leads/${id}`
//   );

//   return response.data;
// };

// // ================= BULK DELETE LEADS =================
// export const bulkDeleteLeads = async (ids) => {
//   const response = await apiClient.post(
//     "/api/leads/bulk-delete",
//     { ids }
//   );

//   return response.data;
// };

// // ================= WORK NOTES =================

// export const getLeadWorkNotes = async (leadId) => {
//   const response = await apiClient.get(
//     `/api/leads/${leadId}/work-notes`
//   );

//   return response.data;
// };

// export const addLeadWorkNote = async (leadId, note) => {
//   const response = await apiClient.post(
//     `/api/leads/${leadId}/work-notes`,
//     { note }
//   );

//   return response.data;
// };

// export const updateLeadWorkNote = async (noteId, note) => {
//   const response = await apiClient.put(
//     `/api/leads/work-notes/${noteId}`,
//     { note }
//   );

//   return response.data;
// };

// export const deleteLeadWorkNote = async (noteId) => {
//   const response = await apiClient.delete(
//     `/api/leads/work-notes/${noteId}`
//   );

//   return response.data;
// };


import apiClient from "./apiClient";

// ================= GET LEADS (server side page) =================
// params: { page, limit, search, status }
export const getLeads = async (params = {}) => {
  const response = await apiClient.get("/api/leads", { params });
  return response.data;
};

// ================= GET ALL MATCHING LEAD IDS =================
// Used by "Select all N" - returns the ids of every lead that matches
// the current search + status filter (not only the current page).
export const getLeadIds = async (params = {}) => {
  const response = await apiClient.get("/api/leads", {
    params: { ...params, idsOnly: true },
  });
  return response.data;
};

// ================= CREATE LEAD =================
export const createLead = async (leadData) => {
  const response = await apiClient.post(
    "/api/leads",
    leadData
  );

  return response.data;
};

// ================= UPDATE LEAD =================
export const updateLead = async (id, leadData) => {
  const response = await apiClient.put(
    `/api/leads/${id}`,
    leadData
  );

  return response.data;
};

// ================= UPDATE LEAD STATUS =================
export const updateLeadStatus = async (id, status) => {
  const response = await apiClient.patch(
    `/api/leads/${id}/status`,
    { status }
  );

  return response.data;
};

// ================= CONVERT LEAD TO CUSTOMER =================
export const convertLeadToCustomer = async (id) => {
  const response = await apiClient.post(
    `/api/leads/${id}/convert`
  );

  return response.data;
};

// ================= DELETE LEAD =================
export const deleteLead = async (id) => {
  const response = await apiClient.delete(
    `/api/leads/${id}`
  );

  return response.data;
};

// ================= BULK DELETE LEADS =================
export const bulkDeleteLeads = async (ids) => {
  const response = await apiClient.post(
    "/api/leads/bulk-delete",
    { ids }
  );

  return response.data;
};

// ================= WORK NOTES =================

export const getLeadWorkNotes = async (leadId) => {
  const response = await apiClient.get(
    `/api/leads/${leadId}/work-notes`
  );

  return response.data;
};

export const addLeadWorkNote = async (leadId, note) => {
  const response = await apiClient.post(
    `/api/leads/${leadId}/work-notes`,
    { note }
  );

  return response.data;
};

export const updateLeadWorkNote = async (noteId, note) => {
  const response = await apiClient.put(
    `/api/leads/work-notes/${noteId}`,
    { note }
  );

  return response.data;
};

export const deleteLeadWorkNote = async (noteId) => {
  const response = await apiClient.delete(
    `/api/leads/work-notes/${noteId}`
  );

  return response.data;
};