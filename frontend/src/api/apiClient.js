
// import axios from "axios";
// import { toast } from "react-hot-toast";

// console.log("API URL:", import.meta.env.VITE_API_URL);

// const apiClient = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,

//   headers: {
//     "Content-Type": "application/json",
//   },
// });


// // ======================================================
// // REQUEST INTERCEPTOR
// // ======================================================

// apiClient.interceptors.request.use(
//   (config) => {

//     const token = localStorage.getItem("token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },

//   (error) => {
//     return Promise.reject(error);
//   }
// );


// // ======================================================
// // RESPONSE INTERCEPTOR
// // ======================================================

// apiClient.interceptors.response.use(

//   // ----------------------------------------------------
//   // SUCCESS
//   // ----------------------------------------------------

//   (response) => {
//     return response;
//   },


//   // ----------------------------------------------------
//   // ERROR
//   // ----------------------------------------------------

//   (error) => {

//     const status = error.response?.status;

//     const message =
//       error.response?.data?.message;


//     // ==================================================
//     // JWT EXPIRED / INVALID TOKEN
//     // ==================================================

//     if (status === 401) {

//       console.log(
//         "Authentication failed. Clearing session..."
//       );


//       // ----------------------------------------------
//       // Remove old authentication data
//       // ----------------------------------------------

//       localStorage.removeItem("token");

//       localStorage.removeItem("user");


//       // ----------------------------------------------
//       // Show message
//       // ----------------------------------------------

//       toast.error(
//         "Your session has expired. Please login again."
//       );


//       // ----------------------------------------------
//       // Redirect to login
//       // ----------------------------------------------

//       // Avoid repeatedly redirecting if we are
//       // already on the login page.
//       if (
//         window.location.pathname !== "/login"
//       ) {

//         window.location.href = "/login";
//       }
//     }


//     // ==================================================
//     // EXISTING 403 HANDLING
//     // ==================================================

//     if (
//       status === 403 &&
//       message
//     ) {

//       toast.error(message);
//     }


//     return Promise.reject(error);
//   }
// );


// export default apiClient;



import axios from "axios";
import { toast } from "react-hot-toast";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ------------------------------------------------------
// REQUEST: attach login token
// ------------------------------------------------------
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

// ------------------------------------------------------
// RESPONSE
// ------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => {
    // If the server sent back a web page (HTML) instead of data -
    // wrong API address, or the backend is waking up - treat it as an
    // error. Otherwise the screens receive a string and crash.
    const body = response.data;
    if (
      typeof body === "string" &&
      /^\s*<(!doctype|html)/i.test(body)
    ) {
      const error = new Error(
        "The server is not reachable right now. Please try again in a minute."
      );
      error.isHtmlResponse = true;
      return Promise.reject(error);
    }
    return response;
  },

  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    // Login expired / invalid
    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toast.error("Your session has expired. Please login again.");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (status === 403 && message) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;

