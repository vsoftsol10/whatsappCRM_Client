
// import { create } from "zustand";

// import {
//   getLeads,
//   createLead,
//   updateLead,
//   updateLeadStatus,
//   convertLeadToCustomer,
//   deleteLead,
//   bulkDeleteLeads,
// } from "../api/leadApi";

// const useLeadStore = create((set) => ({
//   leads: [],
//   isLoading: false,
//   error: null,

//   // ================= FETCH LEADS =================
//   fetchLeads: async () => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       const response = await getLeads();

//       set({
//         leads: Array.isArray(response?.data) ? response.data : [],
//         isLoading: false,
//       });
//     } catch (error) {
//       set({
//         error:
//           error.response?.status === 403
//             ? null
//             : error.response?.data?.message || "Failed to fetch leads",
//         isLoading: false,
//       });
//     }
//   },

//   // ================= ADD LEAD =================
//   addLead: async (leadData) => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       const response = await createLead(leadData);

//       set((state) => ({
//         leads: [response.data, ...state.leads],
//         isLoading: false,
//       }));

//       return response;
//     } catch (error) {
//       set({
//         error:
//           error.response?.data?.message ||
//           "Failed to create lead",
//         isLoading: false,
//       });

//       throw error;
//     }
//   },

//   // ================= EDIT LEAD =================
//   editLead: async (id, leadData) => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       const response = await updateLead(id, leadData);

//       set((state) => ({
//         leads: state.leads.map((lead) =>
//           lead.id === id ? response.data : lead
//         ),
//         isLoading: false,
//       }));

//       return response;
//     } catch (error) {
//       set({
//         error:
//           error.response?.data?.message ||
//           "Failed to update lead",
//         isLoading: false,
//       });

//       throw error;
//     }
//   },

//   // ================= UPDATE STATUS =================
//   changeLeadStatus: async (id, status) => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       const response = await updateLeadStatus(id, status);

//       set((state) => ({
//         leads: state.leads.map((lead) =>
//           lead.id === id ? response.data : lead
//         ),
//         isLoading: false,
//       }));

//       return response;
//     } catch (error) {
//       set({
//         error:
//           error.response?.data?.message ||
//           "Failed to update status",
//         isLoading: false,
//       });

//       throw error;
//     }
//   },

//   // ================= CONVERT LEAD =================
//   convertLead: async (id) => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       const response = await convertLeadToCustomer(id);

//       set((state) => ({
//         leads: state.leads.map((lead) =>
//           lead.id === id
//             ? {
//               ...lead,
//               isConverted: true,
//             }
//             : lead
//         ),
//         isLoading: false,
//       }));

//       return response;
//     } catch (error) {
//       set({
//         isLoading: false,
//       });

//       throw error;
//     }
//   },

//   // ================= DELETE LEAD =================
//   removeLead: async (id) => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       await deleteLead(id);

//       set((state) => ({
//         leads: state.leads.filter(
//           (lead) => lead.id !== id
//         ),
//         isLoading: false,
//       }));
//     } catch (error) {
//       set({
//         error:
//           error.response?.data?.message ||
//           "Failed to delete lead",
//         isLoading: false,
//       });

//       throw error;
//     }
//   },

//   // ================= BULK DELETE LEADS =================
//   removeLeads: async (ids) => {
//     try {
//       const response = await bulkDeleteLeads(ids);

//       const deletedIds = Array.isArray(response?.deletedIds)
//         ? response.deletedIds
//         : [];

//       set((state) => ({
//         leads: state.leads.filter(
//           (lead) => !deletedIds.includes(lead.id)
//         ),
//       }));

//       return response;
//     } catch (error) {
//       set({
//         error:
//           error.response?.data?.message ||
//           "Failed to delete leads",
//       });

//       throw error;
//     }
//   },

//   // ================= CLEAR ERROR =================
//   clearError: () => {
//     set({
//       error: null,
//     });
//   },
// }));

// export default useLeadStore;



import { create } from "zustand";

import {
  getLeads,
  createLead,
  updateLead,
  updateLeadStatus,
  convertLeadToCustomer,
  deleteLead,
  bulkDeleteLeads,
} from "../api/leadApi";

// Used to ignore a slow, outdated response when a newer request
// (e.g. the user typed another letter / clicked next page) already started.
let latestFetchId = 0;

const emptyPagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
};

const emptyStats = {
  total: 0,
  new: 0,
  contacted: 0,
  qualified: 0,
  won: 0,
};

const useLeadStore = create((set, get) => ({
  leads: [],
  pagination: emptyPagination,
  stats: emptyStats,

  // true once the stat-card counters were loaded at least one time
  statsLoaded: false,

  // The last params sent to the server ({ page, limit, search, status }).
  // fetchLeads() called with no arguments re-uses them.
  lastParams: {},

  isLoading: false,
  error: null,

  // ================= FETCH LEADS (server side) =================
  // params  : { page, limit, search, status }  (omit = re-use last params)
  // options : { silent: true }    refresh without the loader
  //           { withStats: true } also recalculate the stat cards
  //
  // The stat-card counters are requested only on the first load and after
  // add / edit / delete / status change. Normal page, search and filter
  // changes skip that extra database query, so they are faster.
  fetchLeads: async (params, options = {}) => {
    const query = params ?? get().lastParams;
    const fetchId = ++latestFetchId;

    const withStats = options.withStats ?? !get().statsLoaded;

    set(
      options.silent
        ? { lastParams: query, error: null }
        : { lastParams: query, isLoading: true, error: null }
    );

    try {
      const response = await getLeads({ ...query, withStats });

      // A newer request has started - ignore this old response
      if (fetchId !== latestFetchId) return;

      set((state) => ({
        leads: Array.isArray(response?.data) ? response.data : [],
        pagination: response?.pagination || emptyPagination,
        stats: response?.stats || state.stats,
        statsLoaded: response?.stats ? true : state.statsLoaded,
        isLoading: false,
      }));
    } catch (error) {
      if (fetchId !== latestFetchId) return;

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
    set({ error: null });

    try {
      const response = await createLead(leadData);

      // Totals / pages / stats changed - reload quietly in the background
      get().fetchLeads(undefined, { silent: true, withStats: true });

      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to create lead",
      });

      throw error;
    }
  },

  // ================= EDIT LEAD =================
  editLead: async (id, leadData) => {
    set({ error: null });

    try {
      const response = await updateLead(id, leadData);

      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id ? response.data : lead
        ),
      }));

      // The edit may move the lead to another filter / change the stats
      get().fetchLeads(undefined, { silent: true, withStats: true });

      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to update lead",
      });

      throw error;
    }
  },

  // ================= UPDATE STATUS =================
  changeLeadStatus: async (id, status) => {
    set({ error: null });

    try {
      const response = await updateLeadStatus(id, status);

      // Show the new status immediately
      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id ? response.data : lead
        ),
      }));

      // Keeps the stat cards and the active status filter correct
      get().fetchLeads(undefined, { silent: true, withStats: true });

      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to update status",
      });

      throw error;
    }
  },

  // ================= CONVERT LEAD =================
  convertLead: async (id) => {
    set({ error: null });

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
      }));

      return response;
    } catch (error) {
      throw error;
    }
  },

  // ================= DELETE LEAD =================
  removeLead: async (id) => {
    set({ error: null });

    try {
      await deleteLead(id);

      set((state) => ({
        leads: state.leads.filter(
          (lead) => lead.id !== id
        ),
      }));

      get().fetchLeads(undefined, { silent: true, withStats: true });
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to delete lead",
      });

      throw error;
    }
  },

  // ================= BULK DELETE LEADS =================
  removeLeads: async (ids) => {
    try {
      const response = await bulkDeleteLeads(ids);

      const deletedIds = Array.isArray(response?.deletedIds)
        ? response.deletedIds
        : [];

      set((state) => ({
        leads: state.leads.filter(
          (lead) => !deletedIds.includes(lead.id)
        ),
      }));

      get().fetchLeads(undefined, { silent: true, withStats: true });

      return response;
    } catch (error) {
      set({
        error:
          error.response?.data?.message ||
          "Failed to delete leads",
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