


// import axios from "axios";
// import { toast } from "react-hot-toast";

// console.log("API URL:", import.meta.env.VITE_API_URL);

// const apiClient = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // ================= REQUEST =================
// apiClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // ================= RESPONSE =================
// apiClient.interceptors.response.use(
//   (response) => response,

//   (error) => {
//     if (
//       error.response?.status === 403 &&
//       error.response?.data?.message
//     ) {
//       toast.error(error.response.data.message);
//     }

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


// ======================================================
// REQUEST INTERCEPTOR
// ======================================================

apiClient.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// ======================================================
// RESPONSE INTERCEPTOR
// ======================================================

apiClient.interceptors.response.use(

  // ----------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------

  (response) => {
    return response;
  },


  // ----------------------------------------------------
  // ERROR
  // ----------------------------------------------------

  (error) => {

    const status = error.response?.status;

    const message =
      error.response?.data?.message;


    // ==================================================
    // JWT EXPIRED / INVALID TOKEN
    // ==================================================

    if (status === 401) {

      console.log(
        "Authentication failed. Clearing session..."
      );


      // ----------------------------------------------
      // Remove old authentication data
      // ----------------------------------------------

      localStorage.removeItem("token");

      localStorage.removeItem("user");


      // ----------------------------------------------
      // Show message
      // ----------------------------------------------

      toast.error(
        "Your session has expired. Please login again."
      );


      // ----------------------------------------------
      // Redirect to login
      // ----------------------------------------------

      // Avoid repeatedly redirecting if we are
      // already on the login page.
      if (
        window.location.pathname !== "/login"
      ) {

        window.location.href = "/login";
      }
    }


    // ==================================================
    // EXISTING 403 HANDLING
    // ==================================================

    if (
      status === 403 &&
      message
    ) {

      toast.error(message);
    }


    return Promise.reject(error);
  }
);


export default apiClient;

