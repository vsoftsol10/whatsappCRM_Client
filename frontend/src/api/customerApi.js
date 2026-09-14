// import apiClient from "./apiClient";

// export const getCustomers = async (
//   status = "",
//   search = "",
// ) => {
//   const response = await apiClient.get("/api/customers", {
//     params: {
//       status,
//       search,
//     },
//   });
//   return response.data;
// };

// export const getCustomerById = async (id) => {
//   const response = await apiClient.get(`/api/customers/${id}`);
//   return response.data;
// };

// export const createCustomer = async (customerData) => {
//   const response = await apiClient.post("/api/customers", customerData);
//   return response.data;
// };

// export const updateCustomer = async (id, customerData) => {
//   const response = await apiClient.put(`/api/customers/${id}`, customerData);
//   return response.data;
// };

// export const deleteCustomer = async (id) => {
//   const response = await apiClient.delete(`/api/customers/${id}`);
//   return response.data;
// };

import apiClient from "./apiClient";

export const getCustomers = async (
  status = "",
  search = "",
) => {
  const response = await apiClient.get("/api/customers", {
    params: {
      status,
      search,
    },
  });

  return response.data;
};

export const getCustomerById = async (id) => {
  const response = await apiClient.get(`/api/customers/${id}`);

  return response.data;
};

export const createCustomer = async (customerData) => {
  const response = await apiClient.post(
    "/api/customers",
    customerData
  );

  return response.data;
};

export const updateCustomer = async (
  id,
  customerData
) => {
  const response = await apiClient.put(
    `/api/customers/${id}`,
    customerData
  );

  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await apiClient.delete(
    `/api/customers/${id}`
  );

  return response.data;
};

/**
 * Preview customer Excel / CSV import
 */
export const previewCustomerImport = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await apiClient.post(
    "/api/customers/import/preview",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/**
 * Import customers after preview confirmation
 */
export const importCustomers = async (
  rows
) => {
  const response = await apiClient.post(
    "/api/customers/import",
    {
      rows,
    }
  );

  return response.data;
};