// src/store/planFeatureStore.js
//
// Which features the company's plan (Super Admin) has switched on,
// the limits, and how much of each limit is used.
// features = { leads: { enabled: true }, customers: { enabled: true, limit: 500 }, ... }
// limit null = unlimited
import { create } from "zustand";
import { getMyFeatures } from "../api/subscriptionApi";

const empty = {
  loaded: false,
  features: null,
  usage: null,
  planName: null,
  isTrial: false,
  isCustom: false,
};

export const usePlanFeatureStore = create((set) => ({
  ...empty,

  fetchFeatures: async () => {
    try {
      const response = await getMyFeatures();
      const data = response?.data || {};

      set({
        loaded: true,
        features: data.features || null,
        usage: data.usage || null,
        planName: data.planName || null,
        isTrial: Boolean(data.isTrial),
        isCustom: Boolean(data.isCustom),
      });
    } catch (error) {
      // If this fails nothing gets hidden (keeps whatever was loaded before)
      set({ loaded: true });
    }
  },

  reset: () => set({ ...empty }),
}));
