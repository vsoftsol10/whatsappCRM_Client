// import axios from 'axios';

// console.log("API URL:", import.meta.env.VITE_API_URL);

// const apiClient = axios.create({
//   baseURL: import.meta.env.VITE_API_URL, // baseURL is empty because we use Vite's proxy `/api`
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Interceptor to attach JWT token
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// export default apiClient;


import axios from "axios";
import { toast } from "react-hot-toast";

console.log("API URL:", import.meta.env.VITE_API_URL);

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ================= REQUEST =================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE =================
apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    if (
      error.response?.status === 403 &&
      error.response?.data?.message
    ) {
      toast.error(error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
