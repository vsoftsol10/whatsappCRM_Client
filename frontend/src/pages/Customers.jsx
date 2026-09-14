// import { useEffect, useState, useMemo, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { MoreVertical } from "lucide-react";
// import toast from "react-hot-toast";

// import AddCustomer from "./AddCustomer";
// import EditCustomer from "./EditCustomer";
// import useCustomerStore from "../store/customerStore";
// import { getCustomers, deleteCustomer } from "../api/customerApi";
// import CustomerStatCard from "../components/customers/CustomerStatCard";
// import ConfirmModal from "../components/common/ConfirmModal";
// import ViewCustomerModal from "../components/customers/ViewCustomerModal";

// function Customers() {
//   const customers =
//     useCustomerStore((state) => state.customers) || [];

//   const setCustomers = useCustomerStore(
//     (state) => state.setCustomers
//   );

//   const navigate = useNavigate();

//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("ALL");

//   // Currently opened customer menu
//   const [openMenu, setOpenMenu] = useState(null);

//   // Menu position
//   const [menuPosition, setMenuPosition] = useState(null);

//   const [viewCustomerId, setViewCustomerId] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);

//   const [showAddCustomer, setShowAddCustomer] = useState(false);
//   const [editCustomerId, setEditCustomerId] = useState(null);

//   // Unfiltered customers used for KPI cards
//   const [allCustomers, setAllCustomers] = useState([]);

//   const [deleteTargetId, setDeleteTargetId] = useState(null);

//   const ROWS_PER_PAGE = 10;

//   // Ref for currently opened menu
//   const menuRef = useRef(null);

//   // =========================
//   // CLOSE MENU WHEN CLICKING OUTSIDE
//   // =========================

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         menuRef.current &&
//         !menuRef.current.contains(event.target)
//       ) {
//         setOpenMenu(null);
//         setMenuPosition(null);
//       }
//     };

//     document.addEventListener(
//       "mousedown",
//       handleClickOutside
//     );

//     return () => {
//       document.removeEventListener(
//         "mousedown",
//         handleClickOutside
//       );
//     };
//   }, []);

//   // =========================
//   // CLOSE MENU ON SCROLL
//   // =========================

//   useEffect(() => {
//     const handleScroll = () => {
//       if (openMenu) {
//         setOpenMenu(null);
//         setMenuPosition(null);
//       }
//     };

//     window.addEventListener("scroll", handleScroll, true);

//     return () => {
//       window.removeEventListener(
//         "scroll",
//         handleScroll,
//         true
//       );
//     };
//   }, [openMenu]);

//   // =========================
//   // FETCH ALL CUSTOMERS
//   // =========================

//   useEffect(() => {
//     const fetchAllCustomers = async () => {
//       try {
//         const data = await getCustomers("", "");

//         setAllCustomers(
//           data.customers ||
//           data.data ||
//           []
//         );
//       } catch (error) {
//         console.error(
//           "Failed to fetch customer stats:",
//           error
//         );
//       }
//     };

//     fetchAllCustomers();
//   }, []);

//   // =========================
//   // FETCH CUSTOMERS
//   // =========================

//   useEffect(() => {
//     const fetchCustomers = async () => {
//       try {
//         const data = await getCustomers(
//           statusFilter === "ALL"
//             ? ""
//             : statusFilter,
//           searchTerm
//         );

//         setCustomers(
//           data.customers ||
//           data.data ||
//           []
//         );
//       } catch (error) {
//         console.error(
//           "Failed to fetch customers:",
//           error
//         );

//         setCustomers([]);
//       }
//     };

//     fetchCustomers();
//   }, [
//     setCustomers,
//     statusFilter,
//     searchTerm,
//   ]);

//   // =========================
//   // RESET PAGE
//   // =========================

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, statusFilter]);

//   // =========================
//   // CUSTOMER STATS
//   // =========================

//   const totalCustomers = allCustomers.length;

//   const activeCustomers =
//     allCustomers.filter(
//       (customer) =>
//         customer.status === "ACTIVE"
//     ).length;

//   const inactiveCustomers =
//     allCustomers.filter(
//       (customer) =>
//         customer.status === "INACTIVE"
//     ).length;

//   // =========================
//   // PAGINATION
//   // =========================

//   const totalPages = Math.max(
//     1,
//     Math.ceil(
//       customers.length / ROWS_PER_PAGE
//     )
//   );

//   const paginatedCustomers =
//     useMemo(() => {
//       const start =
//         (currentPage - 1) *
//         ROWS_PER_PAGE;

//       return customers.slice(
//         start,
//         start + ROWS_PER_PAGE
//       );
//     }, [customers, currentPage]);

//   // =========================
//   // OPEN ACTION MENU
//   // =========================

//   const handleMenuClick = (event, customerId) => {
//     event.stopPropagation();

//     // If clicking the same menu again,
//     // close it.
//     if (openMenu === customerId) {
//       setOpenMenu(null);
//       setMenuPosition(null);
//       return;
//     }

//     const button =
//       event.currentTarget;

//     const rect =
//       button.getBoundingClientRect();

//     const menuWidth = 144;
//     const menuHeight = 132;

//     const spacing = 8;

//     // -------------------------
//     // HORIZONTAL POSITION
//     // -------------------------

//     let left =
//       rect.right - menuWidth;

//     // Prevent menu from going outside
//     // the left side of the screen.
//     if (left < 8) {
//       left = 8;
//     }

//     // Prevent menu from going outside
//     // the right side of the screen.
//     if (
//       left + menuWidth >
//       window.innerWidth - 8
//     ) {
//       left =
//         window.innerWidth -
//         menuWidth -
//         8;
//     }

//     // -------------------------
//     // VERTICAL POSITION
//     // -------------------------

//     const spaceBelow =
//       window.innerHeight -
//       rect.bottom;

//     const spaceAbove =
//       rect.top;

//     let top;

//     // If there is enough space below,
//     // open downward.
//     if (
//       spaceBelow >=
//       menuHeight + spacing
//     ) {
//       top =
//         rect.bottom + spacing;
//     }

//     // Otherwise if there is enough
//     // space above, open upward.
//     else if (
//       spaceAbove >=
//       menuHeight + spacing
//     ) {
//       top =
//         rect.top -
//         menuHeight -
//         spacing;
//     }

//     // If neither side has enough space,
//     // choose the side with more space.
//     else if (
//       spaceBelow >= spaceAbove
//     ) {
//       top =
//         rect.bottom + spacing;
//     } else {
//       top =
//         rect.top -
//         menuHeight -
//         spacing;
//     }

//     // Prevent menu from going above
//     // the viewport.
//     if (top < 8) {
//       top = 8;
//     }

//     // Prevent menu from going below
//     // the viewport.
//     if (
//       top + menuHeight >
//       window.innerHeight - 8
//     ) {
//       top =
//         window.innerHeight -
//         menuHeight -
//         8;
//     }

//     setOpenMenu(customerId);

//     setMenuPosition({
//       top,
//       left,
//     });
//   };

//   // =========================
//   // DELETE CUSTOMER
//   // =========================

//   const handleDelete = (id) => {
//     setOpenMenu(null);
//     setMenuPosition(null);

//     setDeleteTargetId(id);
//   };

//   // =========================
//   // CONFIRM DELETE
//   // =========================

//   const confirmDelete = async () => {
//     const id = deleteTargetId;

//     setDeleteTargetId(null);

//     try {
//       await deleteCustomer(id);

//       setCustomers(
//         customers.filter(
//           (customer) =>
//             customer.id !== id
//         )
//       );

//       setAllCustomers((prev) =>
//         prev.filter(
//           (customer) =>
//             customer.id !== id
//         )
//       );

//       toast.success(
//         "Customer deleted successfully!"
//       );
//     } catch (error) {
//       console.error(error);

//       // 403 is already handled by apiClient interceptor
//       if (error?.response?.status === 403) {
//         return;
//       }

//       // Other errors
//       toast.error(
//         error?.response?.data?.message ||
//         "Failed to delete customer"
//       );
//     }
//   };

//   // =========================
//   // VIEW CUSTOMER
//   // =========================

//   const handleView = (id) => {
//     setOpenMenu(null);
//     setMenuPosition(null);

//     setViewCustomerId(id);
//   };

//   // =========================
//   // EDIT CUSTOMER
//   // =========================

//   const handleEdit = (id) => {
//     setOpenMenu(null);
//     setMenuPosition(null);

//     setEditCustomerId(id);
//   };

//   return (
//     <div className="crm-page">

//       {/* ================= HEADER ================= */}

//       <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

//         <div className="min-w-0">

//           <h1 className="crm-title">
//             Customers
//           </h1>

//           <p className="crm-subtitle">
//             Manage your customer records
//           </p>

//         </div>

//         <button
//           onClick={() =>
//             setShowAddCustomer(true)
//           }
//           className="crm-primary-button w-full sm:w-auto"
//         >
//           + Add Customer
//         </button>

//       </div>

//       {/* ================= STATS ================= */}

//       <CustomerStatCard
//         totalCustomers={totalCustomers}
//         activeCustomers={activeCustomers}
//         inactiveCustomers={inactiveCustomers}
//         statusFilter={statusFilter}
//         setStatusFilter={setStatusFilter}
//       />

//       {/* ================= SEARCH + FILTER ================= */}

//       <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

//         {/* Search */}

//         <div className="w-full lg:max-w-md">

//           <input
//             type="text"
//             placeholder="Search customers..."
//             value={searchTerm}
//             onChange={(e) =>
//               setSearchTerm(e.target.value)
//             }
//             className="crm-input"
//           />

//         </div>

//         {/* Filter Chips */}

//         <div className="flex flex-wrap gap-2 sm:gap-3">

//           {[
//             {
//               key: "ALL",
//               label: "All",
//             },
//             {
//               key: "ACTIVE",
//               label: "Active",
//             },
//             {
//               key: "INACTIVE",
//               label: "Inactive",
//             },
//           ].map((item) => {

//             const isActive =
//               statusFilter === item.key;

//             return (
//               <button
//                 key={item.key}
//                 onClick={() =>
//                   setStatusFilter(
//                     item.key
//                   )
//                 }
//                 className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${isActive
//                     ? "border-[#25D366] bg-[#25D366] text-black shadow-md"
//                     : "border-gray-300 bg-white text-slate-700 hover:border-[#25D366] hover:bg-[#DCF8C6]"
//                   }`}
//               >
//                 {item.label}
//               </button>
//             );
//           })}

//         </div>

//       </div>

//       {/* ================= TABLE ================= */}

//       <div className="crm-table-shell overflow-visible">

//         <div className="crm-table-scroll overflow-visible">

//           <table className="w-full min-w-[900px]">

//             <thead className="bg-[#25D366] text-black">

//               <tr>

//                 <th className="crm-th">
//                   Name
//                 </th>

//                 <th className="crm-th">
//                   Phone
//                 </th>

//                 <th className="crm-th">
//                   Company
//                 </th>

//                 <th className="crm-th">
//                   Status
//                 </th>

//                 <th className="crm-th text-center">
//                   Actions
//                 </th>

//               </tr>

//             </thead>

//             <tbody>

//               {paginatedCustomers.length > 0 ? (

//                 paginatedCustomers.map(
//                   (customer) => (

//                     <tr
//                       key={customer.id}
//                       onClick={() =>
//                         navigate(
//                           "/conversations",
//                           {
//                             state: {
//                               customerId:
//                                 customer.id,
//                             },
//                           }
//                         )
//                       }
//                       className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50"
//                     >

//                       <td className="crm-td font-medium">
//                         {customer.name}
//                       </td>

//                       <td className="crm-td">
//                         {customer.phone}
//                       </td>

//                       <td className="crm-td">
//                         {customer.companyName ||
//                           "-"}
//                       </td>

//                       <td className="crm-td">

//                         <span
//                           className={`crm-badge ${customer.status ===
//                               "ACTIVE"
//                               ? "bg-green-100 text-green-700"
//                               : "bg-red-100 text-red-700"
//                             }`}
//                         >
//                           {customer.status}
//                         </span>

//                       </td>

//                       {/* ================= ACTION MENU ================= */}

//                       <td className="crm-td">

//                         <div className="relative flex justify-center">

//                           <button
//                             type="button"
//                             onClick={(e) =>
//                               handleMenuClick(
//                                 e,
//                                 customer.id
//                               )
//                             }
//                             className="rounded-full p-2 hover:bg-gray-100"
//                           >
//                             <MoreVertical
//                               size={20}
//                             />
//                           </button>

//                         </div>

//                       </td>

//                     </tr>

//                   )
//                 )

//               ) : (

//                 <tr>

//                   <td
//                     colSpan="5"
//                     className="p-8 text-center text-gray-500"
//                   >
//                     No customers found
//                   </td>

//                 </tr>

//               )}

//             </tbody>

//           </table>

//         </div>

//       </div>

//       {/* ================= FIXED ACTION MENU ================= */}

//       {openMenu &&
//         menuPosition && (

//           <div
//             ref={menuRef}
//             onClick={(e) =>
//               e.stopPropagation()
//             }
//             className="fixed z-[99999] w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
//             style={{
//               top: `${menuPosition.top}px`,
//               left: `${menuPosition.left}px`,
//             }}
//           >

//             <button
//               type="button"
//               onClick={() =>
//                 handleView(openMenu)
//               }
//               className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100"
//             >
//               View
//             </button>

//             <button
//               type="button"
//               onClick={() =>
//                 handleEdit(openMenu)
//               }
//               className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100"
//             >
//               Edit
//             </button>

//             <button
//               type="button"
//               onClick={() =>
//                 handleDelete(openMenu)
//               }
//               className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
//             >
//               Delete
//             </button>

//           </div>

//         )}

//       {/* ================= PAGINATION ================= */}

//       <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:px-6">

//         <p className="text-center text-sm text-gray-600 sm:text-left">
//           Page {currentPage} of{" "}
//           {totalPages}
//         </p>

//         <div className="flex max-w-full flex-wrap justify-center gap-2">

//           <button
//             onClick={() =>
//               setCurrentPage((prev) =>
//                 Math.max(
//                   prev - 1,
//                   1
//                 )
//               )
//             }
//             disabled={
//               currentPage === 1
//             }
//             className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100"
//           >
//             Previous
//           </button>

//           {Array.from(
//             { length: totalPages },
//             (_, index) => (

//               <button
//                 key={index}
//                 onClick={() =>
//                   setCurrentPage(
//                     index + 1
//                   )
//                 }
//                 className={`rounded-lg px-3 py-2 text-sm font-medium transition ${currentPage ===
//                     index + 1
//                     ? "bg-[#25D366] text-black"
//                     : "border border-gray-300 bg-white hover:bg-gray-100"
//                   }`}
//               >
//                 {index + 1}
//               </button>

//             )
//           )}

//           <button
//             onClick={() =>
//               setCurrentPage((prev) =>
//                 Math.min(
//                   prev + 1,
//                   totalPages
//                 )
//               )
//             }
//             disabled={
//               currentPage === totalPages
//             }
//             className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100"
//           >
//             Next
//           </button>

//         </div>

//       </div>

//       {/* ================= DELETE MODAL ================= */}

//       <ConfirmModal
//         isOpen={!!deleteTargetId}
//         title="Delete Customer"
//         message="Are you sure you want to delete this customer? This cannot be undone."
//         confirmText="Delete"
//         cancelText="Cancel"
//         variant="danger"
//         onConfirm={confirmDelete}
//         onCancel={() =>
//           setDeleteTargetId(null)
//         }
//       />

//       {/* ================= VIEW ================= */}

//       {viewCustomerId && (
//         <ViewCustomerModal
//           customerId={viewCustomerId}
//           onClose={() =>
//             setViewCustomerId(null)
//           }
//         />
//       )}

//       {/* ================= EDIT ================= */}

//       {editCustomerId && (
//         <EditCustomer
//           customerId={editCustomerId}
//           onClose={() =>
//             setEditCustomerId(null)
//           }
//           onSuccess={async () => {

//             const data =
//               await getCustomers(
//                 statusFilter === "ALL"
//                   ? ""
//                   : statusFilter,
//                 searchTerm
//               );

//             setCustomers(
//               data.customers ||
//               data.data ||
//               []
//             );

//             const allData =
//               await getCustomers(
//                 "",
//                 ""
//               );

//             setAllCustomers(
//               allData.customers ||
//               allData.data ||
//               []
//             );
//           }}
//         />
//       )}

//       {/* ================= ADD CUSTOMER ================= */}

//       {showAddCustomer && (
//         <AddCustomer
//           onClose={() =>
//             setShowAddCustomer(false)
//           }
//           onSuccess={async () => {

//             const data =
//               await getCustomers(
//                 statusFilter === "ALL"
//                   ? ""
//                   : statusFilter,
//                 searchTerm
//               );

//             setCustomers(
//               data.customers ||
//               data.data ||
//               []
//             );

//             const allData =
//               await getCustomers(
//                 "",
//                 ""
//               );

//             setAllCustomers(
//               allData.customers ||
//               allData.data ||
//               []
//             );
//           }}
//         />
//       )}

//     </div>
//   );
// }

// export default Customers;


import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical,
  Upload,
  FileSpreadsheet,
  X,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import AddCustomer from "./AddCustomer";
import EditCustomer from "./EditCustomer";
import useCustomerStore from "../store/customerStore";
import {
  getCustomers,
  deleteCustomer,
  previewCustomerImport,
  importCustomers,
} from "../api/customerApi";
import CustomerStatCard from "../components/customers/CustomerStatCard";
import ConfirmModal from "../components/common/ConfirmModal";
import ViewCustomerModal from "../components/customers/ViewCustomerModal";

function Customers() {
  const customers =
    useCustomerStore((state) => state.customers) || [];

  const setCustomers = useCustomerStore(
    (state) => state.setCustomers
  );

  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Currently opened customer menu
  const [openMenu, setOpenMenu] = useState(null);

  // Menu position
  const [menuPosition, setMenuPosition] = useState(null);

  const [viewCustomerId, setViewCustomerId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState(null);

  // Unfiltered customers used for KPI cards
  const [allCustomers, setAllCustomers] = useState([]);

  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const ROWS_PER_PAGE = 10;

  // Ref for currently opened menu
  const menuRef = useRef(null);

  // =========================
  // CUSTOMER IMPORT STATE
  // =========================

  const fileInputRef = useRef(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedImportFile, setSelectedImportFile] = useState(null);

  const [importPreview, setImportPreview] = useState(null);

  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // =========================
  // CLOSE MENU WHEN CLICKING OUTSIDE
  // =========================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenu(null);
        setMenuPosition(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================
  // CLOSE MENU ON SCROLL
  // =========================

  useEffect(() => {
    const handleScroll = () => {
      if (openMenu) {
        setOpenMenu(null);
        setMenuPosition(null);
      }
    };

    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );
    };
  }, [openMenu]);

  // =========================
  // FETCH ALL CUSTOMERS
  // =========================

  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        const data = await getCustomers("", "");

        setAllCustomers(
          data.customers ||
          data.data ||
          []
        );
      } catch (error) {
        console.error(
          "Failed to fetch customer stats:",
          error
        );
      }
    };

    fetchAllCustomers();
  }, []);

  // =========================
  // FETCH CUSTOMERS
  // =========================

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await getCustomers(
          statusFilter === "ALL"
            ? ""
            : statusFilter,
          searchTerm
        );

        setCustomers(
          data.customers ||
          data.data ||
          []
        );
      } catch (error) {
        console.error(
          "Failed to fetch customers:",
          error
        );

        setCustomers([]);
      }
    };

    fetchCustomers();
  }, [
    setCustomers,
    statusFilter,
    searchTerm,
  ]);

  // =========================
  // RESET PAGE
  // =========================

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // =========================
  // CUSTOMER STATS
  // =========================

  const totalCustomers = allCustomers.length;

  const activeCustomers =
    allCustomers.filter(
      (customer) =>
        customer.status === "ACTIVE"
    ).length;

  const inactiveCustomers =
    allCustomers.filter(
      (customer) =>
        customer.status === "INACTIVE"
    ).length;

  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.max(
    1,
    Math.ceil(
      customers.length / ROWS_PER_PAGE
    )
  );

  const paginatedCustomers =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        ROWS_PER_PAGE;

      return customers.slice(
        start,
        start + ROWS_PER_PAGE
      );
    }, [customers, currentPage]);

  // =========================
  // OPEN ACTION MENU
  // =========================

  const handleMenuClick = (event, customerId) => {
    event.stopPropagation();

    // If clicking the same menu again,
    // close it.
    if (openMenu === customerId) {
      setOpenMenu(null);
      setMenuPosition(null);
      return;
    }

    const button =
      event.currentTarget;

    const rect =
      button.getBoundingClientRect();

    const menuWidth = 144;
    const menuHeight = 132;

    const spacing = 8;

    // -------------------------
    // HORIZONTAL POSITION
    // -------------------------

    let left =
      rect.right - menuWidth;

    // Prevent menu from going outside
    // the left side of the screen.
    if (left < 8) {
      left = 8;
    }

    // Prevent menu from going outside
    // the right side of the screen.
    if (
      left + menuWidth >
      window.innerWidth - 8
    ) {
      left =
        window.innerWidth -
        menuWidth -
        8;
    }

    // -------------------------
    // VERTICAL POSITION
    // -------------------------

    const spaceBelow =
      window.innerHeight -
      rect.bottom;

    const spaceAbove =
      rect.top;

    let top;

    // If there is enough space below,
    // open downward.
    if (
      spaceBelow >=
      menuHeight + spacing
    ) {
      top =
        rect.bottom + spacing;
    }

    // Otherwise if there is enough
    // space above, open upward.
    else if (
      spaceAbove >=
      menuHeight + spacing
    ) {
      top =
        rect.top -
        menuHeight -
        spacing;
    }

    // If neither side has enough space,
    // choose the side with more space.
    else if (
      spaceBelow >= spaceAbove
    ) {
      top =
        rect.bottom + spacing;
    } else {
      top =
        rect.top -
        menuHeight -
        spacing;
    }

    // Prevent menu from going above
    // the viewport.
    if (top < 8) {
      top = 8;
    }

    // Prevent menu from going below
    // the viewport.
    if (
      top + menuHeight >
      window.innerHeight - 8
    ) {
      top =
        window.innerHeight -
        menuHeight -
        8;
    }

    setOpenMenu(customerId);

    setMenuPosition({
      top,
      left,
    });
  };

  // =========================
  // DELETE CUSTOMER
  // =========================

  const handleDelete = (id) => {
    setOpenMenu(null);
    setMenuPosition(null);

    setDeleteTargetId(id);
  };

  // =========================
  // CONFIRM DELETE
  // =========================

  const confirmDelete = async () => {
    const id = deleteTargetId;

    setDeleteTargetId(null);

    try {
      await deleteCustomer(id);

      setCustomers(
        customers.filter(
          (customer) =>
            customer.id !== id
        )
      );

      setAllCustomers((prev) =>
        prev.filter(
          (customer) =>
            customer.id !== id
        )
      );

      toast.success(
        "Customer deleted successfully!"
      );
    } catch (error) {
      console.error(error);

      // 403 is already handled by apiClient interceptor
      if (error?.response?.status === 403) {
        return;
      }

      // Other errors
      toast.error(
        error?.response?.data?.message ||
        "Failed to delete customer"
      );
    }
  };

  // =========================
  // VIEW CUSTOMER
  // =========================

  const handleView = (id) => {
    setOpenMenu(null);
    setMenuPosition(null);

    setViewCustomerId(id);
  };

  // =========================
  // EDIT CUSTOMER
  // =========================

  const handleEdit = (id) => {
    setOpenMenu(null);
    setMenuPosition(null);

    setEditCustomerId(id);
  };

  // =========================
  // OPEN IMPORT FILE PICKER
  // =========================

  const handleOpenImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // =========================
  // SELECT IMPORT FILE
  // =========================

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0];

    // Reset input so same file can be selected again
    event.target.value = "";

    if (!file) {
      return;
    }

    const allowedExtensions = [
      ".xlsx",
      ".xls",
      ".csv",
    ];

    const fileName =
      file.name.toLowerCase();

    const isValidFile =
      allowedExtensions.some((extension) =>
        fileName.endsWith(extension)
      );

    if (!isValidFile) {
      toast.error(
        "Please select an Excel or CSV file."
      );
      return;
    }

    setSelectedImportFile(file);
    setImportPreview(null);
    setShowImportModal(true);
    setIsPreviewLoading(true);

    try {
      const result =
        await previewCustomerImport(file);

      if (!result?.success) {
        toast.error(
          result?.message ||
          "Failed to preview customer import."
        );

        setShowImportModal(false);
        setSelectedImportFile(null);
        return;
      }

      setImportPreview(result);
    } catch (error) {
      console.error(
        "Customer import preview error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to preview customer import."
      );

      setShowImportModal(false);
      setSelectedImportFile(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // =========================
  // CLOSE IMPORT MODAL
  // =========================

  const handleCloseImport = () => {
    if (isPreviewLoading || isImporting) {
      return;
    }

    setShowImportModal(false);
    setSelectedImportFile(null);
    setImportPreview(null);
  };

  // =========================
  // CONFIRM CUSTOMER IMPORT
  // =========================

  const handleConfirmImport = async () => {
    if (
      !importPreview ||
      !Array.isArray(importPreview.rows) ||
      importPreview.rows.length === 0
    ) {
      toast.error(
        "There are no valid customers to import."
      );
      return;
    }

    if (importPreview.summary?.limitExceeded) {
      toast.error(
        "Customer limit exceeded for your plan."
      );
      return;
    }

    setIsImporting(true);

    try {
      const result =
        await importCustomers(
          importPreview.rows
        );

      if (!result?.success) {
        toast.error(
          result?.message ||
          "Failed to import customers."
        );
        return;
      }

      toast.success(
        result.message ||
        "Customers imported successfully."
      );

      // Close import modal
      setShowImportModal(false);
      setSelectedImportFile(null);
      setImportPreview(null);

      // Refresh filtered customer list
      const data =
        await getCustomers(
          statusFilter === "ALL"
            ? ""
            : statusFilter,
          searchTerm
        );

      setCustomers(
        data.customers ||
        data.data ||
        []
      );

      // Refresh KPI customers
      const allData =
        await getCustomers("", "");

      setAllCustomers(
        allData.customers ||
        allData.data ||
        []
      );

      // Return to first page
      setCurrentPage(1);
    } catch (error) {
      console.error(
        "Customer import error:",
        error
      );

      if (
        error?.response?.status === 403
      ) {
        return;
      }

      toast.error(
        error?.response?.data?.message ||
        "Failed to import customers."
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="crm-page">

      {/* ================= HEADER ================= */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="min-w-0">

          <h1 className="crm-title">
            Customers
          </h1>

          <p className="crm-subtitle">
            Manage your customer records
          </p>

        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

          {/* ================= IMPORT CUSTOMER ================= */}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleOpenImport}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#25D366] hover:bg-[#DCF8C6] sm:w-auto"
          >
            <Upload size={18} />
            Import Customers
          </button>

          {/* ================= ADD CUSTOMER ================= */}

          <button
            onClick={() =>
              setShowAddCustomer(true)
            }
            className="crm-primary-button w-full sm:w-auto"
          >
            + Add Customer
          </button>

        </div>

      </div>

      {/* ================= STATS ================= */}

      <CustomerStatCard
        totalCustomers={totalCustomers}
        activeCustomers={activeCustomers}
        inactiveCustomers={inactiveCustomers}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* ================= SEARCH + FILTER ================= */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* Search */}

        <div className="w-full lg:max-w-md">

          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            className="crm-input"
          />

        </div>

        {/* Filter Chips */}

        <div className="flex flex-wrap gap-2 sm:gap-3">

          {[
            {
              key: "ALL",
              label: "All",
            },
            {
              key: "ACTIVE",
              label: "Active",
            },
            {
              key: "INACTIVE",
              label: "Inactive",
            },
          ].map((item) => {

            const isActive =
              statusFilter === item.key;

            return (
              <button
                key={item.key}
                onClick={() =>
                  setStatusFilter(
                    item.key
                  )
                }
                className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${isActive
                  ? "border-[#25D366] bg-[#25D366] text-black shadow-md"
                  : "border-gray-300 bg-white text-slate-700 hover:border-[#25D366] hover:bg-[#DCF8C6]"
                  }`}
              >
                {item.label}
              </button>
            );
          })}

        </div>

      </div>

      {/* ================= TABLE ================= */}

      <div className="crm-table-shell overflow-visible">

        <div className="crm-table-scroll overflow-visible">

          <table className="w-full min-w-[900px]">

            <thead className="bg-[#25D366] text-black">

              <tr>

                <th className="crm-th">
                  Name
                </th>

                <th className="crm-th">
                  Phone
                </th>

                <th className="crm-th">
                  Company
                </th>

                <th className="crm-th">
                  Status
                </th>

                <th className="crm-th text-center">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {paginatedCustomers.length > 0 ? (

                paginatedCustomers.map(
                  (customer) => (

                    <tr
                      key={customer.id}
                      onClick={() =>
                        navigate(
                          "/conversations",
                          {
                            state: {
                              customerId:
                                customer.id,
                            },
                          }
                        )
                      }
                      className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50"
                    >

                      <td className="crm-td font-medium">
                        {customer.name}
                      </td>

                      <td className="crm-td">
                        {customer.phone}
                      </td>

                      <td className="crm-td">
                        {customer.companyName ||
                          "-"}
                      </td>

                      <td className="crm-td">

                        <span
                          className={`crm-badge ${customer.status ===
                            "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                            }`}
                        >
                          {customer.status}
                        </span>

                      </td>

                      {/* ================= ACTION MENU ================= */}

                      <td className="crm-td">

                        <div className="relative flex justify-center">

                          <button
                            type="button"
                            onClick={(e) =>
                              handleMenuClick(
                                e,
                                customer.id
                              )
                            }
                            className="rounded-full p-2 hover:bg-gray-100"
                          >
                            <MoreVertical
                              size={20}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="p-8 text-center text-gray-500"
                  >
                    No customers found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ================= FIXED ACTION MENU ================= */}

      {openMenu &&
        menuPosition && (

          <div
            ref={menuRef}
            onClick={(e) =>
              e.stopPropagation()
            }
            className="fixed z-[99999] w-36 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >

            <button
              type="button"
              onClick={() =>
                handleView(openMenu)
              }
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100"
            >
              View
            </button>

            <button
              type="button"
              onClick={() =>
                handleEdit(openMenu)
              }
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                handleDelete(openMenu)
              }
              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>

          </div>

        )}

      {/* ================= PAGINATION ================= */}

      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:px-6">

        <p className="text-center text-sm text-gray-600 sm:text-left">
          Page {currentPage} of{" "}
          {totalPages}
        </p>

        <div className="flex max-w-full flex-wrap justify-center gap-2">

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.max(
                  prev - 1,
                  1
                )
              )
            }
            disabled={
              currentPage === 1
            }
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100"
          >
            Previous
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => (

              <button
                key={index}
                onClick={() =>
                  setCurrentPage(
                    index + 1
                  )
                }
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${currentPage ===
                  index + 1
                  ? "bg-[#25D366] text-black"
                  : "border border-gray-300 bg-white hover:bg-gray-100"
                  }`}
              >
                {index + 1}
              </button>

            )
          )}

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(
                  prev + 1,
                  totalPages
                )
              )
            }
            disabled={
              currentPage === totalPages
            }
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100"
          >
            Next
          </button>

        </div>

      </div>

      {/* ================= DELETE MODAL ================= */}

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() =>
          setDeleteTargetId(null)
        }
      />

      {/* ================= VIEW ================= */}

      {viewCustomerId && (
        <ViewCustomerModal
          customerId={viewCustomerId}
          onClose={() =>
            setViewCustomerId(null)
          }
        />
      )}

      {/* ================= EDIT ================= */}

      {editCustomerId && (
        <EditCustomer
          customerId={editCustomerId}
          onClose={() =>
            setEditCustomerId(null)
          }
          onSuccess={async () => {

            const data =
              await getCustomers(
                statusFilter === "ALL"
                  ? ""
                  : statusFilter,
                searchTerm
              );

            setCustomers(
              data.customers ||
              data.data ||
              []
            );

            const allData =
              await getCustomers(
                "",
                ""
              );

            setAllCustomers(
              allData.customers ||
              allData.data ||
              []
            );
          }}
        />
      )}

      {/* ================= ADD CUSTOMER ================= */}

      {showAddCustomer && (
        <AddCustomer
          onClose={() =>
            setShowAddCustomer(false)
          }
          onSuccess={async () => {

            const data =
              await getCustomers(
                statusFilter === "ALL"
                  ? ""
                  : statusFilter,
                searchTerm
              );

            setCustomers(
              data.customers ||
              data.data ||
              []
            );

            const allData =
              await getCustomers(
                "",
                ""
              );

            setAllCustomers(
              allData.customers ||
              allData.data ||
              []
            );
          }}
        />
      )}

      {/* ================= CUSTOMER IMPORT MODAL ================= */}

      {/* ================= CUSTOMER IMPORT MODAL ================= */}

      {showImportModal && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">

          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* ================= MODAL HEADER ================= */}

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Import Customers
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Upload a CSV or Excel file to add many customers at once.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseImport}
                disabled={
                  isPreviewLoading ||
                  isImporting
                }
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={22} />
              </button>

            </div>

            {/* ================= MODAL CONTENT ================= */}

            <div className="overflow-y-auto px-6 py-5">

              {/* ================= LOADING ================= */}

              {isPreviewLoading && (
                <div className="flex min-h-[280px] flex-col items-center justify-center">

                  <Loader2
                    size={38}
                    className="animate-spin text-[#25D366]"
                  />

                  <p className="mt-4 text-sm font-medium text-gray-600">
                    Reading your file and generating preview...
                  </p>

                </div>
              )}

              {/* ================= PREVIEW ================= */}

              {!isPreviewLoading && importPreview && (
                <div>

                  {/* ================= SUMMARY CARDS ================= */}

                  <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

                    {/* READY */}

                    <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-center">

                      <p className="text-2xl font-bold text-green-700">
                        {importPreview.rows?.length || 0}
                      </p>

                      <p className="mt-1 text-sm font-medium text-green-700">
                        Ready to import
                      </p>

                    </div>

                    {/* EXISTING */}

                    <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-center">

                      <p className="text-2xl font-bold text-yellow-700">
                        {importPreview.existingRows?.length ??
                          importPreview.summary?.existingCustomers ??
                          0}
                      </p>

                      <p className="mt-1 text-sm font-medium text-yellow-700">
                        Already exist
                      </p>

                    </div>

                    {/* INVALID */}

                    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-center">

                      <p className="text-2xl font-bold text-red-700">
                        {(importPreview.invalidRows?.length || 0) +
                          (importPreview.duplicateRows?.length || 0)}
                      </p>

                      <p className="mt-1 text-sm font-medium text-red-700">
                        Invalid rows
                      </p>

                    </div>

                  </div>

                  {/* ================= EXISTING CUSTOMERS ================= */}

                  {importPreview.existingRows?.length > 0 && (
                    <div className="mb-6">

                      <div className="mb-2 flex items-center gap-2">

                        <span className="text-xl text-yellow-500">
                          ⚠
                        </span>

                        <h3 className="text-base font-bold text-slate-800">
                          Already in your customer list (
                          {importPreview.existingRows.length}
                          )
                        </h3>

                      </div>

                      <p className="mb-3 text-sm text-gray-500">
                        These customers already exist in your CRM and
                        will be left untouched.
                      </p>

                      <div className="overflow-hidden rounded-xl border border-gray-200">

                        <table className="w-full">

                          <thead className="bg-gray-50">

                            <tr>

                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                Row
                              </th>

                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                Existing Customer
                              </th>

                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                Incoming
                              </th>

                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                                Status
                              </th>

                            </tr>

                          </thead>

                          <tbody>

                            {importPreview.existingRows.map(
                              (row, index) => {

                                /*
                                 * Support different backend property names.
                                 */

                                const existingName =
                                  row.existing?.name ||
                                  row.existingName ||
                                  row.name ||
                                  "-";

                                const existingPhone =
                                  row.existing?.phone ||
                                  row.existingPhone ||
                                  row.phone ||
                                  "-";

                                const existingEmail =
                                  row.existing?.email ||
                                  row.existingEmail ||
                                  "";

                                const incomingName =
                                  row.incoming?.name ||
                                  row.name ||
                                  "-";

                                const incomingPhone =
                                  row.incoming?.phone ||
                                  row.phone ||
                                  "-";

                                const incomingEmail =
                                  row.incoming?.email ||
                                  row.email ||
                                  "";

                                return (
                                  <tr
                                    key={`existing-${row.rowNumber || index}`}
                                    className="border-t border-gray-100"
                                  >

                                    {/* ROW */}

                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {row.rowNumber ||
                                        index + 2}
                                    </td>

                                    {/* EXISTING */}

                                    <td className="px-4 py-3">

                                      <p className="text-sm font-medium text-slate-800">
                                        {existingName}
                                      </p>

                                      <p className="text-xs text-gray-500">
                                        {existingPhone}

                                        {existingEmail &&
                                          ` • ${existingEmail}`}
                                      </p>

                                    </td>

                                    {/* INCOMING */}

                                    <td className="px-4 py-3">

                                      <p className="text-sm font-medium text-slate-800">
                                        {incomingName}
                                      </p>

                                      <p className="text-xs text-gray-500">
                                        {incomingPhone}

                                        {incomingEmail &&
                                          ` • ${incomingEmail}`}
                                      </p>

                                    </td>

                                    {/* STATUS */}

                                    <td className="px-4 py-3 text-center">

                                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                        Already exists
                                      </span>

                                    </td>

                                  </tr>
                                );
                              }
                            )}

                          </tbody>

                        </table>

                      </div>

                    </div>
                  )}

                  {/* ================= NEW CUSTOMERS ================= */}

                  {importPreview.rows?.length > 0 && (
                    <div className="mb-6">

                      <div className="mb-3 flex items-center justify-between">

                        <h3 className="text-base font-bold text-slate-800">
                          Ready to import
                        </h3>

                        <span className="rounded-full bg-[#DCF8C6] px-3 py-1 text-xs font-semibold text-green-700">
                          {importPreview.rows.length} customers
                        </span>

                      </div>

                      <div className="overflow-hidden rounded-xl border border-gray-200">

                        <table className="w-full">

                          <thead className="bg-gray-50">

                            <tr>

                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                Name
                              </th>

                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                Phone
                              </th>

                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                Company
                              </th>

                            </tr>

                          </thead>

                          <tbody>

                            {importPreview.rows.map(
                              (row) => (

                                <tr
                                  key={`${row.rowNumber}-${row.phone}`}
                                  className="border-t border-gray-100"
                                >

                                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                    {row.name || "-"}
                                  </td>

                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {row.phone || "-"}
                                  </td>

                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {row.company || "-"}
                                  </td>

                                </tr>

                              )
                            )}

                          </tbody>

                        </table>

                      </div>

                    </div>
                  )}

                  {/* ================= INVALID / DUPLICATE ================= */}

                  {(importPreview.invalidRows?.length > 0 ||
                    importPreview.duplicateRows?.length > 0) && (

                      <div className="mb-2">

                        <div className="mb-3 flex items-center gap-2">

                          <span className="text-xl text-red-500">
                            ⚠
                          </span>

                          <h3 className="text-base font-bold text-slate-800">
                            Couldn't be imported (
                            {(importPreview.invalidRows?.length || 0) +
                              (importPreview.duplicateRows?.length || 0)}
                            )
                          </h3>

                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-200">

                          <table className="w-full">

                            <thead className="bg-gray-50">

                              <tr>

                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                  Row
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                  Name
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                  Phone
                                </th>

                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                  Reason
                                </th>

                              </tr>

                            </thead>

                            <tbody>

                              {/* INVALID ROWS */}

                              {importPreview.invalidRows?.map(
                                (row) => (

                                  <tr
                                    key={`invalid-${row.rowNumber}`}
                                    className="border-t border-gray-100"
                                  >

                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {row.rowNumber}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {row.name || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {row.phone || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-red-600">
                                      {row.reason || "Invalid row"}
                                    </td>

                                  </tr>

                                )
                              )}

                              {/* DUPLICATE ROWS */}

                              {importPreview.duplicateRows?.map(
                                (row) => (

                                  <tr
                                    key={`duplicate-${row.rowNumber}`}
                                    className="border-t border-gray-100"
                                  >

                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {row.rowNumber}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {row.name || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-700">
                                      {row.phone || "-"}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-red-600">
                                      {row.reason ||
                                        "Duplicate phone number within the file."}
                                    </td>

                                  </tr>

                                )
                              )}

                            </tbody>

                          </table>

                        </div>

                      </div>
                    )}

                  {/* ================= NOTHING TO IMPORT ================= */}

                  {importPreview.rows?.length === 0 &&
                    !importPreview.existingRows?.length &&
                    !importPreview.invalidRows?.length &&
                    !importPreview.duplicateRows?.length && (

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">

                        <p className="text-sm font-medium text-gray-600">
                          No customers found in this file.
                        </p>

                      </div>

                    )}

                </div>
              )}

            </div>

            {/* ================= MODAL FOOTER ================= */}

            {!isPreviewLoading && importPreview && (

              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">

                <button
                  type="button"
                  onClick={handleCloseImport}
                  disabled={isImporting}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={
                    isImporting ||
                    !importPreview.rows?.length ||
                    importPreview.summary?.limitExceeded
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-semibold text-black shadow-md transition hover:bg-[#20c45c] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {isImporting ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Import {importPreview.rows?.length || 0} customers
                    </>
                  )}

                </button>

              </div>

            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default Customers;