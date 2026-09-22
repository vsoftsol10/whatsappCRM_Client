
// import apiClient from "./apiClient";

// // ============================================================
// // GET ALL TEMPLATES
// // ============================================================

// export const getTemplates = async (params = {}) => {
//   const response = await apiClient.get(
//     "/api/templates",
//     {
//       params,
//     }
//   );

//   return response.data;
// };

// // ============================================================
// // GET SINGLE TEMPLATE
// // ============================================================

// export const getTemplateById = async (id) => {
//   const response = await apiClient.get(
//     `/api/templates/${id}`
//   );

//   return response.data;
// };

// // ============================================================
// // GET TEMPLATE RECIPIENTS
// // ============================================================

// export const getTemplateRecipients = async (id) => {
//   const response = await apiClient.get(
//     `/api/templates/${id}/recipients`
//   );

//   return response.data;
// };

// // ============================================================
// // CREATE TEMPLATE
// // ============================================================

// export const createTemplate = async (
//   templateData
// ) => {
//   const response = await apiClient.post(
//     "/api/templates",
//     templateData
//   );

//   return response.data;
// };

// // ============================================================
// // GENERATE TEMPLATE WITH AI
// // ============================================================

// export const generateTemplateWithAI = async (
//   topic,
//   tone = "Professional"
// ) => {
//   const response = await apiClient.post(
//     "/api/templates/generate",
//     {
//       topic,
//       tone,
//     }
//   );

//   return response.data;
// };

// // ============================================================
// // UPDATE TEMPLATE
// // ============================================================

// export const updateTemplate = async (
//   id,
//   templateData
// ) => {
//   const response = await apiClient.put(
//     `/api/templates/${id}`,
//     templateData
//   );

//   return response.data;
// };

// // ============================================================
// // DELETE TEMPLATE
// // ============================================================

// export const deleteTemplate = async (id) => {
//   const response = await apiClient.delete(
//     `/api/templates/${id}`
//   );

//   return response.data;
// };

// // ============================================================
// // SEND TEMPLATE
// // ============================================================

// export const sendTemplate = async (
//   templateId,
//   customerIds
// ) => {
//   const response = await apiClient.post(
//     "/api/templates/send",
//     {
//       templateId,
//       customerIds,
//     }
//   );

//   return response.data;
// };


// // ============================================================
// // SUBMIT TEMPLATE FOR APPROVAL
// // ============================================================

// export const submitTemplateForApproval = async (id) => {
//   const response = await apiClient.post(
//     `/api/templates/${id}/submit`
//   );

//   return response.data;
// };

import apiClient from "./apiClient";

// ============================================================
// GET ALL TEMPLATES
// ============================================================

export const getTemplates = async (params = {}) => {
  const response = await apiClient.get(
    "/api/templates",
    {
      params,
    }
  );

  return response.data;
};

// ============================================================
// GET SINGLE TEMPLATE
// ============================================================

export const getTemplateById = async (id) => {
  const response = await apiClient.get(
    `/api/templates/${id}`
  );

  return response.data;
};

// ============================================================
// GET TEMPLATE RECIPIENTS
// ============================================================

export const getTemplateRecipients = async (id) => {
  const response = await apiClient.get(
    `/api/templates/${id}/recipients`
  );

  return response.data;
};

// ============================================================
// CREATE TEMPLATE
// ============================================================

export const createTemplate = async (
  templateData
) => {
  const response = await apiClient.post(
    "/api/templates",
    templateData
  );

  return response.data;
};

// ============================================================
// GENERATE TEMPLATE WITH AI
// ============================================================

export const generateTemplateWithAI = async (
  topic,
  tone = "Professional"
) => {
  const response = await apiClient.post(
    "/api/templates/generate",
    {
      topic,
      tone,
    }
  );

  return response.data;
};

// ============================================================
// UPLOAD TEMPLATE HEADER IMAGE  👈 NEW
// ============================================================
// Uploads a sample header image (used when headerType === "IMAGE")
// to the backend, which is expected to push it to Cloudinary and
// return back a public URL Meta can fetch.
//
// NOTE: this requires a matching backend route —
// POST /api/templates/upload-header-image — that accepts
// multipart/form-data and returns { data: { imageUrl } }.
// If that route doesn't exist yet on your server, this call
// will 404. Let me know if you need that endpoint built too.

export const uploadTemplateHeaderImage = async (file) => {
  const formData = new FormData();
  formData.append("headerImage", file);

  const response = await apiClient.post(
    "/api/templates/upload-header-image",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// ============================================================
// UPDATE TEMPLATE
// ============================================================

export const updateTemplate = async (
  id,
  templateData
) => {
  const response = await apiClient.put(
    `/api/templates/${id}`,
    templateData
  );

  return response.data;
};

// ============================================================
// DELETE TEMPLATE
// ============================================================

export const deleteTemplate = async (id) => {
  const response = await apiClient.delete(
    `/api/templates/${id}`
  );

  return response.data;
};

// ============================================================
// SEND TEMPLATE
// ============================================================

export const sendTemplate = async (
  templateId,
  customerIds
) => {
  const response = await apiClient.post(
    "/api/templates/send",
    {
      templateId,
      customerIds,
    }
  );

  return response.data;
};


// ============================================================
// SUBMIT TEMPLATE FOR APPROVAL
// ============================================================

export const submitTemplateForApproval = async (id) => {
  const response = await apiClient.post(
    `/api/templates/${id}/submit`
  );

  return response.data;
};