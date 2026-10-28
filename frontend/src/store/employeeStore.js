// import { create } from "zustand";
// import { getEmployees } from "../api/employeeApi";

// const useEmployeeStore = create((set) => ({
//   employees: [],
//   loading: false,
//   error: null,

//   fetchEmployees: async () => {
//     try {
//       set({
//         loading: true,
//         error: null,
//       });

//       const response = await getEmployees();
//       console.log("Employees API Response:", response);

//       set({
//         employees: response.employees,
//         loading: false,
//       });
//     } catch (error) {
//       set({
//         loading: false,
//         error: error.message,
//       });
//     }
//   },

//   setEmployees: (employees) =>
//     set({ employees }),
// }));

// export default useEmployeeStore;

import { create } from "zustand";
import { getEmployees } from "../api/employeeApi";

const useEmployeeStore = create((set) => ({
  employees: [],
  loading: false,
  error: null,

  fetchEmployees: async () => {
    try {
      set({
        loading: true,
        error: null,
      });

      const response = await getEmployees();
      console.log("Employees API Response:", response);

      set({
        employees: Array.isArray(response?.employees) ? response.employees : [],
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error.message,
      });
    }
  },

  setEmployees: (employees) =>
    set({ employees }),
}));

export default useEmployeeStore;