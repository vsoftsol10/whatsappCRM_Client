import apiClient from "./apiClient";

// GET COMPANY BRANDING (name + logo)
// Any authenticated CRM user (admin or employee) can read this.
export const getCompanySettings = async () => {
  const response = await apiClient.get("/api/company/settings");

  return response.data;
};

// UPDATE COMPANY BRANDING (admin only — enforced on the backend)
// companyData: { companyName?: string, logo?: File }
export const updateCompanySettings = async (companyData) => {
  const formData = new FormData();

  Object.entries(companyData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  const response = await apiClient.put(
    "/api/company/settings",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data;
};