import { create } from "zustand";

import {
  getLeads,
  createLead,
  updateLead,
  updateLeadStatus,
  convertLeadToCustomer,
  deleteLead,
} from "../api/leadApi";

const useLeadStore = create((set) => ({
  leads: [],
  isLoading: false,
  error: null,

  // ================= FETCH LEADS =================
  fetchLeads: async () => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await getLeads();

      set({
        leads: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        error:
          error.response?.status === 403
            ? null
            : error.response?.data?.message || "Failed to fetch leads",
        isLoading: false,
      });
    }
  },

  // ================= ADD LEAD =================
  addLead: async (leadData) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await createLead(leadData);

      set((state) => ({
        leads: [response.data, ...state.leads],
        isLoading: false,
      }));

      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to create lead",
        isLoading: false,
      });

      throw error;
    }
  },

  // ================= EDIT LEAD =================
  editLead: async (id, leadData) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await updateLead(id, leadData);

      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id ? response.data : lead
        ),
        isLoading: false,
      }));

      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to update lead",
        isLoading: false,
      });

      throw error;
    }
  },

  // ================= UPDATE STATUS =================
  changeLeadStatus: async (id, status) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await updateLeadStatus(id, status);

      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id ? response.data : lead
        ),
        isLoading: false,
      }));

      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to update status",
        isLoading: false,
      });

      throw error;
    }
  },

  // ================= CONVERT LEAD =================
  convertLead: async (id) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await convertLeadToCustomer(id);

      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id
            ? {
              ...lead,
              isConverted: true,
            }
            : lead
        ),
        isLoading: false,
      }));

      return response;
    } catch (error) {
      set({
        isLoading: false,
      });

      throw error;
    }
  },

  // ================= DELETE LEAD =================
  removeLead: async (id) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      await deleteLead(id);

      set((state) => ({
        leads: state.leads.filter(
          (lead) => lead.id !== id
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to delete lead",
        isLoading: false,
      });

      throw error;
    }
  },

  // ================= CLEAR ERROR =================
  clearError: () => {
    set({
      error: null,
    });
  },
}));

export default useLeadStore;

