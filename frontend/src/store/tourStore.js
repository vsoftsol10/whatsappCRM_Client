// // src/store/tourStore.js
// import { create } from "zustand";
// import { TOUR_VERSION } from "../config/tourSteps";

// const storageKey = (userId) => `vatup_tour_${TOUR_VERSION}_${userId}`;

// export const isTourDone = (userId) => {
//   try {
//     return localStorage.getItem(storageKey(userId)) === "done";
//   } catch {
//     return false;
//   }
// };

// export const markTourDone = (userId) => {
//   try {
//     localStorage.setItem(storageKey(userId), "done");
//   } catch {
//     /* storage blocked – tour may show again, that's fine */
//   }
// };

// export const useTourStore = create((set) => ({
//   active: false,
//   index: 0,
//   start: (index = 0) => set({ active: true, index }),
//   goTo: (index) => set({ index }),
//   stop: () => set({ active: false, index: 0 }),
// }));

// // Call from anywhere (e.g. a "Take a tour" button)
// export const startProductTour = () => window.dispatchEvent(new Event("vatup-tour:start"));



// src/store/tourStore.js
import { create } from "zustand";
import apiClient from "../api/apiClient"; // NEW
import { useAuthStore } from "./authStore"; // NEW
import { TOUR_VERSION } from "../config/tourSteps";

const storageKey = (userId) => `vatup_tour_${TOUR_VERSION}_${userId}`;

export const isTourDone = (userId) => {
  try {
    return localStorage.getItem(storageKey(userId)) === "done";
  } catch {
    return false;
  }
};

export const markTourDone = (userId) => {
  try {
    localStorage.setItem(storageKey(userId), "done");
  } catch {
    /* storage blocked – tour may show again, that's fine */
  }
};

// NEW: remember on the ACCOUNT (server) that the guide was shown, so it is
// not shown again when the same user logs in from another browser.
export const markTourSeenOnServer = async () => {
  const { user } = useAuthStore.getState();

  if (!user || user.tourSeenAt) return;

  try {
    const response = await apiClient.post("/api/auth/tour-seen");

    const updatedUser = {
      ...useAuthStore.getState().user,
      tourSeenAt: response.data?.tourSeenAt || new Date().toISOString(),
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));
    useAuthStore.setState({ user: updatedUser });
  } catch {
    /* ignore - the browser flag above still stops it in this browser */
  }
};

export const useTourStore = create((set) => ({
  active: false,
  index: 0,
  start: (index = 0) => set({ active: true, index }),
  goTo: (index) => set({ index }),
  stop: () => set({ active: false, index: 0 }),
}));

// Call from anywhere (e.g. a "Take a tour" button)
export const startProductTour = () => window.dispatchEvent(new Event("vatup-tour:start"));