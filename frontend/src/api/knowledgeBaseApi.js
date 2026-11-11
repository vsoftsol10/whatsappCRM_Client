import apiClient from "./apiClient";

// ==========================================
// COMPANY KNOWLEDGE BASE (company admins only)
// The AI auto-reply answers from these entries. The server always uses the
// logged-in admin's own company; no company id is ever sent from here.
// ==========================================

// params: { search, status: "all" | "active" | "inactive", page, limit }
// Response: { entries, pagination, stats, useKnowledgeBase }
export const getKnowledgeBase = async (params = {}) => {
  const response = await apiClient.get("/api/knowledge-base", { params });
  return response.data;
};

// payload: { title, content, category?, keywords?, isActive? }
export const createKnowledgeEntry = async (payload) => {
  const response = await apiClient.post("/api/knowledge-base", payload);
  return response.data;
};

// payload: any of { title, content, category, keywords, isActive }
export const updateKnowledgeEntry = async (id, payload) => {
  const response = await apiClient.patch(`/api/knowledge-base/${id}`, payload);
  return response.data;
};

export const deleteKnowledgeEntry = async (id) => {
  const response = await apiClient.delete(`/api/knowledge-base/${id}`);
  return response.data;
};

// ==========================================
// IMPORT FROM CSV / EXCEL
// ==========================================
// mode: "update" = same title replaces the existing entry, "skip" = leave it
const uploadForm = (file, mode) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);
  return formData;
};

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

// Reads the file and says what WOULD happen. Changes nothing.
export const previewKnowledgeImport = async (file, mode = "update") => {
  const response = await apiClient.post(
    "/api/knowledge-base/import/preview",
    uploadForm(file, mode),
    multipart
  );
  return response.data;
};

// Does the import. Response: { created, updated, skipped, invalid, errors }
export const importKnowledge = async (file, mode = "update") => {
  const response = await apiClient.post(
    "/api/knowledge-base/import",
    uploadForm(file, mode),
    { ...multipart, timeout: 120000 }
  );
  return response.data;
};

// Removes every entry of the company. The server needs the typed phrase.
export const deleteAllKnowledge = async () => {
  const response = await apiClient.delete("/api/knowledge-base", {
    data: { confirm: "DELETE ALL" },
  });
  return response.data;
};