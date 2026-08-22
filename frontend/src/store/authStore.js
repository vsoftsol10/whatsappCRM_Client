import { create } from 'zustand';
import apiClient from '../api/apiClient';
import {
  forgotPassword,
  resetPassword,
} from "../api/authApi";
import { changePassword } from "../api/authApi";

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,
  forcePasswordChange: false,

  // LOGIN
  login: async (email, password, companyId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.post('/api/auth/login', {
        email,
        password,
        companyId,
      });

      const { token, user, forcePasswordChange } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      set({
        token,
        user,
        forcePasswordChange: !!forcePasswordChange,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return { success: true, forcePasswordChange: !!forcePasswordChange };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Login failed';

      set({
        error: message,
        isLoading: false,
      });

      return { success: false, message };
    }
  },

  // REGISTER
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });

    try {
      await apiClient.post('/api/auth/register', {
        name,
        email,
        password,
      });

      set({ isLoading: false, error: null });

      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Registration failed';

      set({
        error: message,
        isLoading: false,
      });

      return { success: false, message };
    }
  },

  // LOGOUT
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      forcePasswordChange: false,
      error: null,
    });
  },

  // FORGOT PASSWORD
  forgotPasswordAction: async (email) => {
    set({ isLoading: true, error: null });

    try {
      const data = await forgotPassword(email);

      set({
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      console.log("ERROR RESPONSE:", error.response);
      console.log("ERROR DATA:", error.response?.data);
      console.log("FULL ERROR:", error);

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

  // RESET PASSWORD
  resetPasswordAction: async (token, password) => {
    set({ isLoading: true, error: null });

    try {
      const data = await resetPassword(
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

  changePasswordAction: async (passwordData) => {
    set({ isLoading: true, error: null });

    try {
      const data = await changePassword(passwordData);

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

  // CLEAR ERROR
  clearError: () => set({ error: null }),
}));