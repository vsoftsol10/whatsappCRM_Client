


import apiClient from "./apiClient";

// ===============================
// GET ALL CAMPAIGNS
// ===============================
export const getCampaigns = async () => {
  const response = await apiClient.get("/api/campaigns");
  return response.data;
};

// ===============================
// GET CAMPAIGN BY ID
// ===============================
export const getCampaignById = async (id) => {
  const response = await apiClient.get(`/api/campaigns/${id}`);
  return response.data;
};

// ===============================
// CREATE CAMPAIGN
// ===============================
export const createCampaign = async (campaignData) => {
  const formData = new FormData();

  formData.append("name", campaignData.name);
  formData.append("type", campaignData.type);
  formData.append("messageContent", campaignData.messageContent);

  if (campaignData.scheduledAt) {
    formData.append("scheduledAt", campaignData.scheduledAt);
  }

  // Customer IDs
  campaignData.customerIds.forEach((id) => {
    formData.append("customerIds", id);
  });

  // Image
  if (campaignData.image) {
    formData.append("image", campaignData.image);
  }

  const response = await apiClient.post(
    "/api/campaigns",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// ===============================
// UPDATE CAMPAIGN
// ===============================
export const updateCampaign = async (
  id,
  campaignData
) => {
  const formData = new FormData();

  if (campaignData.name !== undefined) {
    formData.append("name", campaignData.name);
  }

  if (campaignData.type !== undefined) {
    formData.append("type", campaignData.type);
  }

  if (campaignData.messageContent !== undefined) {
    formData.append(
      "messageContent",
      campaignData.messageContent
    );
  }

  if (campaignData.status !== undefined) {
    formData.append("status", campaignData.status);
  }

  if (campaignData.scheduledAt) {
    formData.append(
      "scheduledAt",
      campaignData.scheduledAt
    );
  }

  if (campaignData.image) {
    formData.append(
      "image",
      campaignData.image
    );
  }

  const response = await apiClient.put(
    `/api/campaigns/${id}`,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data;
};

// ===============================
// DELETE CAMPAIGN
// ===============================
export const deleteCampaign = async (id) => {
  const response = await apiClient.delete(
    `/api/campaigns/${id}`
  );

  return response.data;
};

// ===============================
// GENERATE AI CAMPAIGN
// ===============================
// ===============================
// GENERATE AI CAMPAIGN
// ===============================
export const generateAICampaign = async (prompt) => {
  const response = await apiClient.post(
    "/api/campaigns/generate-ai",
    {
      prompt,
    }
  );

  return response.data;
};

// ===============================
// SEND CAMPAIGN TO CUSTOMERS
// ===============================
export const sendCampaign = async (
  campaignId,
  customerIds
) => {

  console.log("Sending Campaign...");
  console.log("Campaign:", campaignId);
  console.log("Customers:", customerIds);

  const response = await apiClient.post(
    "/api/campaigns/send",
    {
      campaignId,
      customerIds,
    }
  );

  console.log(response.data);

  return response.data;
};

// ===============================
// GET CAMPAIGN RECIPIENTS
// ===============================
export const getCampaignRecipients = async (campaignId) => {
  const response = await apiClient.get(
    `/api/campaigns/${campaignId}/recipients`
  );

  return response.data;
};