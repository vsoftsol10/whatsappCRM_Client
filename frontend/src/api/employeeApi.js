// import apiClient from "./apiClient";

// export const createEmployee = async (employeeData) => {
//   const response = await apiClient.post("/api/employees", employeeData);
//   return response.data;
// };

// export const getEmployees = async () => {
//   const response = await apiClient.get("/api/employees");
//   return response.data;
// };

// export const getEmployeeById = async (id) => {
//   const response = await apiClient.get(`/api/employees/${id}`);
//   return response.data;
// };

// export const updateEmployee = async (id, employeeData) => {
//   const response = await apiClient.put(`/api/employees/${id}`, employeeData);
//   return response.data;
// };

// export const deleteEmployee = async (id) => {
//   const response = await apiClient.delete(`/api/employees/${id}`);
//   return response.data;
// };

import apiClient from "./apiClient";

export const createEmployee = async (employeeData) => {
    console.log("========== API CREATE EMPLOYEE ==========");
    console.log("Request data:", employeeData);

    try {
        const response = await apiClient.post(
            "/api/employees",
            employeeData
        );

        console.log("========== API SUCCESS ==========");
        console.log("Status:", response.status);
        console.log("Data:", response.data);

        return response.data;

    } catch (error) {

        console.error("========== API ERROR ==========");
        console.error("Status:", error?.response?.status);
        console.error("Data:", error?.response?.data);
        console.error("Message:", error?.message);

        throw error;
    }
};

export const getEmployees = async () => {
    const response = await apiClient.get("/api/employees");
    return response.data;
};

export const getEmployeeById = async (id) => {
    const response = await apiClient.get(`/api/employees/${id}`);
    return response.data;
};

export const updateEmployee = async (id, employeeData) => {
    const response = await apiClient.put(
        `/api/employees/${id}`,
        employeeData
    );

    return response.data;
};

export const deleteEmployee = async (id) => {
    const response = await apiClient.delete(
        `/api/employees/${id}`
    );

    return response.data;
};