import { create } from "zustand";

import {
  getMySubscription,
  getPlans,
  createUpgradeRequest as createUpgradeRequestApi,
  getMyUpgradeRequest,
} from "../api/subscriptionApi";

export const useSubscriptionStore = create((set) => ({
  // ==========================================
  // SUBSCRIPTION
  // ==========================================
  subscription: null,
  isLoading: false,
  error: null,

  // ==========================================
  // PLANS
  // ==========================================
  plans: [],
  plansLoading: false,

  // ==========================================
  // UPGRADE REQUEST
  // ==========================================
  upgradeRequest: null,
  upgradeRequestLoading: false,
  upgradeRequestError: null,

  // ==========================================
  // CURRENT SUBSCRIPTION
  // ==========================================
  fetchMySubscription: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const data = await getMySubscription();

      set({
        subscription: data.data,
        isLoading: false,
        error: null,
      });

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to load subscription.";

      set({
        isLoading: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  // ==========================================
  // AVAILABLE PLANS
  // ==========================================
  fetchPlans: async () => {
    set({
      plansLoading: true,
      error: null,
    });

    try {
      const response = await getPlans();

      set({
        plans: response.data,
        plansLoading: false,
        error: null,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to load plans.";

      set({
        plans: [],
        plansLoading: false,
        error: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  // ==========================================
  // CREATE UPGRADE REQUEST
  // ==========================================
  createUpgradeRequest: async (planId) => {
    console.log(
      "UPGRADE REQUEST PLAN ID:",
      planId
    );

    try {
      const response =
        await createUpgradeRequestApi(planId);

      console.log(
        "UPGRADE REQUEST RESPONSE:",
        response
      );

      // Immediately store the new request
      set({
        upgradeRequest: response.data,
        upgradeRequestError: null,
      });

      return {
        success: true,
        data: response.data,
        message:
          response.message ||
          "Upgrade request submitted successfully.",
      };
    } catch (error) {
      console.error(
        "CREATE UPGRADE REQUEST ERROR:",
        error
      );

      console.error(
        "ERROR RESPONSE:",
        error.response?.data
      );

      return {
        success: false,
        message:
          error.response?.data?.message ||
          "Failed to submit upgrade request.",
      };
    }
  },

  // ==========================================
  // GET MY UPGRADE REQUEST
  // ==========================================
  fetchMyUpgradeRequest: async () => {
    set({
      upgradeRequestLoading: true,
      upgradeRequestError: null,
    });

    try {
      const response =
        await getMyUpgradeRequest();

      set({
        upgradeRequest: response.data,
        upgradeRequestLoading: false,
        upgradeRequestError: null,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to load upgrade request.";

      set({
        upgradeRequest: null,
        upgradeRequestLoading: false,
        upgradeRequestError: message,
      });

      return {
        success: false,
        message,
      };
    }
  },

  // ==========================================
  // CLEAR SUBSCRIPTION
  // ==========================================
  clearSubscription: () =>
    set({
      subscription: null,
      upgradeRequest: null,
      error: null,
      upgradeRequestError: null,
    }),
}));