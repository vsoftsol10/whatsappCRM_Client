// import { create } from "zustand";

// import {
//   getTemplates,
//   getTemplateById,
//   createTemplate,
//   updateTemplate,
//   deleteTemplate,
//   sendTemplate,
//   generateTemplateWithAI,
// } from "../api/templateApi";

// const useTemplateStore = create((set) => ({
//   templates: [],
//   selectedTemplate: null,

//   isLoading: false,
//   error: null,

//   // ================= FETCH ALL =================
//   fetchTemplates: async () => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       const data = await getTemplates();

//       set({
//         templates: data.data,
//         isLoading: false,
//       });
//     } catch (error) {
//       set({
//         error: error.message,
//         isLoading: false,
//       });
//     }
//   },

//   // ================= FETCH ONE =================
//   fetchTemplateById: async (id) => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       const data = await getTemplateById(id);

//       set({
//         selectedTemplate: data.data,
//         isLoading: false,
//       });
//     } catch (error) {
//       set({
//         error: error.message,
//         isLoading: false,
//       });
//     }
//   },

//   // ================= CREATE =================
//   addTemplate: async (templateData) => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       const data = await createTemplate(
//         templateData
//       );

//       set((state) => ({
//         templates: [
//           data.data,
//           ...state.templates,
//         ],
//         isLoading: false,
//       }));

//       return data;
//     } catch (error) {
//       set({
//         error: error.message,
//         isLoading: false,
//       });

//       throw error;
//     }
//   },

//   // ================= UPDATE =================
//   editTemplate: async (
//     id,
//     templateData
//   ) => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       const data = await updateTemplate(
//         id,
//         templateData
//       );

//       set((state) => ({
//         templates: state.templates.map(
//           (template) =>
//             template.id === id
//               ? data.data
//               : template
//         ),
//         isLoading: false,
//       }));

//       return data;
//     } catch (error) {
//       set({
//         error: error.message,
//         isLoading: false,
//       });

//       throw error;
//     }
//   },

//   // ================= DELETE =================
//   removeTemplate: async (id) => {
//     set({
//       isLoading: true,
//       error: null,
//     });

//     try {
//       await deleteTemplate(id);

//       set((state) => ({
//         templates: state.templates.filter(
//           (template) =>
//             template.id !== id
//         ),
//         isLoading: false,
//       }));
//     } catch (error) {
//       set({
//         error: error.message,
//         isLoading: false,
//       });

//       throw error;
//     }
//   },

//   // ================= GENERATE TEMPLATE WITH AI =================
// generateTemplate: async (
//   topic,
//   tone = "Professional"
// ) => {
//   set({
//     isLoading: true,
//     error: null,
//   });

//   try {
//     const response =
//       await generateTemplateWithAI(
//         topic,
//         tone
//       );

//     set({
//       isLoading: false,
//     });

//     return response.data.content;
//   } catch (error) {
//     set({
//       error: error.message,
//       isLoading: false,
//     });

//     throw error;
//   }
// },

//   // ================= SEND TEMPLATE =================
//     sendTemplate: async (
//       templateId,
//       customerId
//     ) => {
//       set({
//         isLoading: true,
//         error: null,
//       });

//       try {
//         const response =
//           await sendTemplate(
//             templateId,
//             customerId
//           );

//         set({
//           isLoading: false,
//         });

//         return response;
//       } catch (error) {
//         set({
//           error: error.message,
//           isLoading: false,
//         });

//         throw error;
//       }
//     },

//   // ================= CLEAR ERROR =================
//   clearError: () =>
//     set({
//       error: null,
//     }),
// }));

// export default useTemplateStore;


import { create } from "zustand";

import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  sendTemplate,
  generateTemplateWithAI,
  submitTemplateForApproval,
} from "../api/templateApi";

const useTemplateStore = create((set) => ({
  // ============================================================
  // STATE
  // ============================================================

  templates: [],
  selectedTemplate: null,

  isLoading: false,
  error: null,

  // ============================================================
  // FETCH ALL
  // ============================================================

  fetchTemplates: async (params = {}) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const data = await getTemplates(params);

      set({
        templates: data.data || [],
        isLoading: false,
      });

      return data;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          error.message ||
          "Failed to fetch templates",
        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================
  // FETCH ONE
  // ============================================================

  fetchTemplateById: async (id) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const data = await getTemplateById(id);

      set({
        selectedTemplate: data.data,
        isLoading: false,
      });

      return data;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          error.message ||
          "Failed to fetch template",
        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================
  // CREATE
  // ============================================================

  addTemplate: async (templateData) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const data = await createTemplate(templateData);

      set((state) => ({
        templates: [
          data.data,
          ...state.templates,
        ],

        isLoading: false,
      }));

      return data;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          error.message ||
          "Failed to create template",

        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================
  // UPDATE
  // ============================================================

  editTemplate: async (id, templateData) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const data = await updateTemplate(
        id,
        templateData
      );

      set((state) => ({
        templates: state.templates.map(
          (template) =>
            template.id === id
              ? data.data
              : template
        ),

        selectedTemplate:
          state.selectedTemplate?.id === id
            ? data.data
            : state.selectedTemplate,

        isLoading: false,
      }));

      return data;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          error.message ||
          "Failed to update template",

        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================
  // DELETE
  // ============================================================

  removeTemplate: async (id) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      await deleteTemplate(id);

      set((state) => ({
        templates: state.templates.filter(
          (template) => template.id !== id
        ),

        selectedTemplate:
          state.selectedTemplate?.id === id
            ? null
            : state.selectedTemplate,

        isLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          error.message ||
          "Failed to delete template",

        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================
  // GENERATE TEMPLATE WITH AI
  // ============================================================

  generateTemplate: async (
    topic,
    tone = "Professional"
  ) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response =
        await generateTemplateWithAI(
          topic,
          tone
        );

      set({
        isLoading: false,
      });

      return response.data.content;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          error.message ||
          "Failed to generate template",

        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================
  // SUBMIT TEMPLATE FOR APPROVAL
  // ============================================================

  submitTemplateForApproval: async (id) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response =
        await submitTemplateForApproval(id);

      const updatedTemplate = response.data;

      set((state) => ({
        templates: state.templates.map(
          (template) =>
            template.id === id
              ? updatedTemplate
              : template
        ),

        selectedTemplate:
          state.selectedTemplate?.id === id
            ? updatedTemplate
            : state.selectedTemplate,

        isLoading: false,
      }));

      return response;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          error.message ||
          "Failed to submit template for approval",

        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================
  // SEND TEMPLATE
  // ============================================================

  sendTemplate: async (
    templateId,
    customerIds
  ) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await sendTemplate(
        templateId,
        customerIds
      );

      set({
        isLoading: false,
      });

      return response;
    } catch (error) {
      set({
        error:
          error?.response?.data?.message ||
          error.message ||
          "Failed to send template",

        isLoading: false,
      });

      throw error;
    }
  },

  // ============================================================
  // CLEAR SELECTED TEMPLATE
  // ============================================================

  clearSelectedTemplate: () => {
    set({
      selectedTemplate: null,
    });
  },

  // ============================================================
  // CLEAR ERROR
  // ============================================================

  clearError: () => {
    set({
      error: null,
    });
  },
}));

export default useTemplateStore;

