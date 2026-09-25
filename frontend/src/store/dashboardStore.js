import { create } from "zustand";
import {
  getDashboardStats,
  getRecentConversations,
} from "../api/dashboardApi";

const useDashboardStore = create((set) => ({
  dashboardStats: null,
  isLoading: false,
  error: null,

  recentConversations: [],
  isConversationsLoading: false,
  conversationsError: null,

  fetchRecentConversations: async (limit = 5) => {
    set((state) => ({
      // Only show the spinner on the very first load, not on
      // every silent background refresh (polling).
      isConversationsLoading: state.recentConversations.length === 0,
      conversationsError: null,
    }));

    try {
      const response = await getRecentConversations(limit);

      set({
        recentConversations: response.conversations || [],
        isConversationsLoading: false,
      });
    } catch (error) {
      set({
        conversationsError:
          error.response?.data?.message ||
          "Failed to fetch recent conversations",
        isConversationsLoading: false,
      });
    }
  },

  fetchDashboardStats: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await getDashboardStats();

      set({
        dashboardStats: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to fetch dashboard statistics",
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useDashboardStore;