
// import { create } from 'zustand';
// import apiClient from '../api/apiClient';
// import {
//   forgotPassword,
//   resetPassword,
//   changePassword,
// } from "../api/authApi";

// // ======================================================
// // CHECK WHETHER JWT TOKEN IS VALID / EXPIRED
// // ======================================================
// const isTokenValid = (token) => {
//   if (!token) return false;

//   try {
//     const payload = JSON.parse(atob(token.split(".")[1]));

//     // JWT should contain an expiration time
//     if (!payload.exp) {
//       return false;
//     }

//     // exp is in seconds, Date.now() is in milliseconds
//     return payload.exp * 1000 > Date.now();
//   } catch (error) {
//     console.error("Invalid JWT token:", error);
//     return false;
//   }
// };


// // ======================================================
// // INITIAL AUTH STATE
// // ======================================================

// const storedToken = localStorage.getItem("token");
// const storedUser = localStorage.getItem("user");

// const validToken = isTokenValid(storedToken);

// // If token is missing, expired, or invalid,
// // remove the old session immediately.
// if (!validToken) {
//   localStorage.removeItem("token");
//   localStorage.removeItem("user");
// }


// // ======================================================
// // AUTH STORE
// // ======================================================

// export const useAuthStore = create((set, get) => ({
//   // ----------------------------------------------------
//   // INITIAL STATE
//   // ----------------------------------------------------

//   user:
//     validToken && storedUser
//       ? JSON.parse(storedUser)
//       : null,

//   token:
//     validToken
//       ? storedToken
//       : null,

//   isAuthenticated: validToken,

//   isLoading: false,

//   error: null,

//   forcePasswordChange: false,


//   // ====================================================
//   // LOGIN
//   // ====================================================

//   login: async (email, password, companyId) => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       const response = await apiClient.post(
//         '/api/auth/login',
//         {
//           email,
//           password,
//           companyId,
//         }
//       );

//       const {
//         token,
//         user,
//         forcePasswordChange,
//       } = response.data;


//       // ------------------------------------------------
//       // Store NEW user's session
//       // ------------------------------------------------

//       localStorage.setItem(
//         'token',
//         token
//       );

//       localStorage.setItem(
//         'user',
//         JSON.stringify(user)
//       );


//       // ------------------------------------------------
//       // Update Zustand state
//       // ------------------------------------------------

//       set({
//         token,

//         user,

//         forcePasswordChange:
//           !!forcePasswordChange,

//         isAuthenticated: true,

//         isLoading: false,

//         error: null,
//       });


//       return {
//         success: true,

//         forcePasswordChange:
//           !!forcePasswordChange,
//       };

//     } catch (error) {

//       const message =
//         error.response?.data?.message ||
//         'Login failed';


//       set({
//         error: message,

//         isLoading: false,
//       });


//       return {
//         success: false,

//         message,
//       };
//     }
//   },


//   // ====================================================
//   // REGISTER
//   // ====================================================

//   register: async (
//     name,
//     email,
//     password
//   ) => {

//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {

//       await apiClient.post(
//         '/api/auth/register',
//         {
//           name,
//           email,
//           password,
//         }
//       );


//       set({
//         isLoading: false,
//         error: null,
//       });


//       return {
//         success: true,
//       };

//     } catch (error) {

//       const message =
//         error.response?.data?.message ||
//         'Registration failed';


//       set({
//         error: message,

//         isLoading: false,
//       });


//       return {
//         success: false,

//         message,
//       };
//     }
//   },


//   // ====================================================
//   // LOGOUT
//   // ====================================================

//   logout: () => {

//     // Remove authentication data
//     localStorage.removeItem('token');

//     localStorage.removeItem('user');


//     // Reset Zustand authentication state
//     set({

//       token: null,

//       user: null,

//       isAuthenticated: false,

//       forcePasswordChange: false,

//       error: null,
//     });
//   },


//   // ====================================================
//   // FORGOT PASSWORD
//   // ====================================================

//   forgotPasswordAction: async (
//     email
//   ) => {

//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {

//       const data =
//         await forgotPassword(email);


//       set({
//         isLoading: false,
//         error: null,
//       });


//       return {

//         success: true,

//         message: data.message,
//       };

//     } catch (error) {

//       console.log(
//         "ERROR RESPONSE:",
//         error.response
//       );

//       console.log(
//         "ERROR DATA:",
//         error.response?.data
//       );

//       console.log(
//         "FULL ERROR:",
//         error
//       );


//       const message =
//         error.response?.data?.message ||
//         "Failed to send reset email";


//       set({

//         error: message,

//         isLoading: false,
//       });


//       return {

//         success: false,

//         message,
//       };
//     }
//   },


//   // ====================================================
//   // RESET PASSWORD
//   // ====================================================

//   resetPasswordAction: async (
//     token,
//     password
//   ) => {

//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {

//       const data =
//         await resetPassword(
//           token,
//           password
//         );


//       set({

//         isLoading: false,

//         error: null,
//       });


//       return {

//         success: true,

//         message: data.message,
//       };

//     } catch (error) {

//       const message =
//         error.response?.data?.message ||
//         "Password reset failed";


//       set({

//         error: message,

//         isLoading: false,
//       });


//       return {

//         success: false,

//         message,
//       };
//     }
//   },


//   // ====================================================
//   // CHANGE PASSWORD
//   // ====================================================

//   changePasswordAction:
//     async (passwordData) => {

//       set({

//         isLoading: true,

//         error: null,
//       });

//       try {

//         const data =
//           await changePassword(
//             passwordData
//           );


//         set({

//           isLoading: false,

//           error: null,
//         });


//         return data;

//       } catch (error) {

//         set({

//           isLoading: false,

//           error:
//             error.response?.data?.message ||
//             "Password change failed",
//         });


//         throw error;
//       }
//     },


//   // ====================================================
//   // CLEAR ERROR
//   // ====================================================

//   clearError: () =>
//     set({
//       error: null,
//     }),
// }));




import { create } from 'zustand';
import apiClient from '../api/apiClient';
import {
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
} from "../api/authApi";

// ======================================================
// CHECK WHETHER JWT TOKEN IS VALID / EXPIRED
// ======================================================
const isTokenValid = (token) => {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    // JWT should contain an expiration time
    if (!payload.exp) {
      return false;
    }

    // exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 > Date.now();
  } catch (error) {
    console.error("Invalid JWT token:", error);
    return false;
  }
};


// ======================================================
// INITIAL AUTH STATE
// ======================================================

const storedToken = localStorage.getItem("token");
const storedUser = localStorage.getItem("user");

const validToken = isTokenValid(storedToken);

// If token is missing, expired, or invalid,
// remove the old session immediately.
if (!validToken) {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}


// ======================================================
// AUTH STORE
// ======================================================

export const useAuthStore = create((set, get) => ({
  // ----------------------------------------------------
  // INITIAL STATE
  // ----------------------------------------------------

  user:
    validToken && storedUser
      ? JSON.parse(storedUser)
      : null,

  token:
    validToken
      ? storedToken
      : null,

  isAuthenticated: validToken,

  isLoading: false,

  error: null,

  forcePasswordChange: false,


  // ====================================================
  // LOGIN
  // ====================================================

  login: async (email, password, companyId) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await apiClient.post(
        '/api/auth/login',
        {
          email,
          password,
          companyId,
        }
      );

      const {
        token,
        user,
        forcePasswordChange,
      } = response.data;


      // ------------------------------------------------
      // Store NEW user's session
      // ------------------------------------------------

      localStorage.setItem(
        'token',
        token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(user)
      );


      // ------------------------------------------------
      // Update Zustand state
      // ------------------------------------------------

      set({
        token,

        user,

        forcePasswordChange:
          !!forcePasswordChange,

        isAuthenticated: true,

        isLoading: false,

        error: null,
      });


      return {
        success: true,

        forcePasswordChange:
          !!forcePasswordChange,
      };

    } catch (error) {

      const message =
        error.response?.data?.message ||
        'Login failed';


      set({
        error: message,

        isLoading: false,
      });


      return {
        success: false,

        message,
      };
    }
  },


  // ====================================================
  // REGISTER
  // ====================================================

  register: async (
    name,
    email,
    password
  ) => {

    set({
      isLoading: true,
      error: null,
    });

    try {

      await apiClient.post(
        '/api/auth/register',
        {
          name,
          email,
          password,
        }
      );


      set({
        isLoading: false,
        error: null,
      });


      return {
        success: true,
      };

    } catch (error) {

      const message =
        error.response?.data?.message ||
        'Registration failed';


      set({
        error: message,

        isLoading: false,
      });


      return {
        success: false,

        message,
      };
    }
  },


  // ====================================================
  // LOGOUT
  // ====================================================

  logout: () => {

    // Remove authentication data
    localStorage.removeItem('token');

    localStorage.removeItem('user');


    // Reset Zustand authentication state
    set({

      token: null,

      user: null,

      isAuthenticated: false,

      forcePasswordChange: false,

      error: null,
    });
  },


  // ====================================================
  // FORGOT PASSWORD
  // ====================================================

  forgotPasswordAction: async (
    email
  ) => {

    set({
      isLoading: true,
      error: null,
    });

    try {

      const data =
        await forgotPassword(email);


      set({
        isLoading: false,
        error: null,
      });


      return {

        success: true,

        message: data.message,
      };

    } catch (error) {

      console.log(
        "ERROR RESPONSE:",
        error.response
      );

      console.log(
        "ERROR DATA:",
        error.response?.data
      );

      console.log(
        "FULL ERROR:",
        error
      );


      const message =
        error.response?.data?.message ||
        "Failed to send reset email";


      set({

        error: message,

        isLoading: false,
      });


      return {

        success: false,

        message,
      };
    }
  },


  // ====================================================
  // RESET PASSWORD
  // ====================================================

  resetPasswordAction: async (
    token,
    password
  ) => {

    set({
      isLoading: true,
      error: null,
    });

    try {

      const data =
        await resetPassword(
          token,
          password
        );


      set({

        isLoading: false,

        error: null,
      });


      return {

        success: true,

        message: data.message,
      };

    } catch (error) {

      const message =
        error.response?.data?.message ||
        "Password reset failed";


      set({

        error: message,

        isLoading: false,
      });


      return {

        success: false,

        message,
      };
    }
  },


  // ====================================================
  // UPDATE MY PROFILE
  // ====================================================

  updateProfileAction: async (profileData) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const data = await updateProfile(profileData);

      const updatedUser = {
        ...get().user,
        ...data.user,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      set({
        user: updatedUser,
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to update profile";

      set({
        error: message,
        isLoading: false,
      });

      return {
        success: false,
        message,
      };
    }
  },


  // ====================================================
  // CHANGE PASSWORD
  // ====================================================

  changePasswordAction:
    async (passwordData) => {

      set({

        isLoading: true,

        error: null,
      });

      try {

        const data =
          await changePassword(
            passwordData
          );


        set({

          isLoading: false,

          error: null,
        });


        return data;

      } catch (error) {

        set({

          isLoading: false,

          error:
            error.response?.data?.message ||
            "Password change failed",
        });


        throw error;
      }
    },


  // ====================================================
  // CLEAR ERROR
  // ====================================================

  clearError: () =>
    set({
      error: null,
    }),
}));

