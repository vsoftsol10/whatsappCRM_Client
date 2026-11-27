
// import { useEffect, useMemo, useState } from "react";
// import useGuideAutoOpen from "../components/guide/useGuideAutoOpen";
// import { Trash2 } from "lucide-react";

// import useLeadStore from "../store/leadStore";
// import useEmployeeStore from "../store/employeeStore";

// import LeadCard from "../components/leads/LeadCard";
// import LeadTable from "../components/leads/LeadTable";
// import LeadStats from "../components/leads/LeadStats";
// import LeadFilters from "../components/leads/LeadFilters";
// import AddLeadModal from "../components/leads/AddLeadModal";
// import EditLeadModal from "../components/leads/EditLeadModal";
// import ViewLeadModal from "../components/leads/ViewLeadModal";
// import toast from "react-hot-toast";
// import { getCustomers } from "../api/customerApi";
// import { getLeadIds } from "../api/leadApi";
// import useCustomerStore from "../store/customerStore";
// import CustomerPagination from "../components/customers/CustomerPagination";
// import ConfirmModal from "../components/common/ConfirmModal";

// // Wait this long after the user stops typing before calling the server
// const SEARCH_DEBOUNCE_MS = 400;

// export default function Lead() {
//   const {
//     leads,
//     pagination,
//     stats,
//     isLoading,
//     fetchLeads,
//     removeLead,
//     removeLeads,
//     changeLeadStatus,
//     convertLead,
//   } = useLeadStore();

//   const setCustomers = useCustomerStore(
//     (state) => state.setCustomers
//   );

//   const { employees, fetchEmployees } = useEmployeeStore();

//   // What the user types (updates on every keystroke)
//   const [searchTerm, setSearchTerm] = useState("");

//   // What is actually sent to the server (updates after the user pauses)
//   const [debouncedSearch, setDebouncedSearch] =
//     useState("");

//   const [selectedStatus, setSelectedStatus] =
//     useState("ALL");

//   // "grid" = card view, "list" = table view (table is the default)
//   const [viewMode, setViewMode] =
//     useState("list");

//   const [showAddModal, setShowAddModal] =
//     useState(false);

//   // Opens the add form when coming from the first-visit guide
//   useGuideAutoOpen("leads", () => setShowAddModal(true));

//   const [showEditModal, setShowEditModal] =
//     useState(false);

//   const [showViewModal, setShowViewModal] =
//     useState(false);

//   const [selectedLead, setSelectedLead] =
//     useState(null);

//   const [deleteTargetId, setDeleteTargetId] =
//     useState(null);

//   // Bulk selection / bulk delete
//   const [selectedIds, setSelectedIds] = useState([]);
//   const [showBulkDeleteModal, setShowBulkDeleteModal] =
//     useState(false);
//   const [isBulkDeleting, setIsBulkDeleting] =
//     useState(false);

//   const [currentPage, setCurrentPage] =
//     useState(1);

//   // Grid view: 12 per page, because 12 divides evenly into the 3-column
//   // (xl), 2-column (md) and 1-column layouts, so the last row is never
//   // left with a single stray card. List/table view keeps 10 per page.
//   // The user can pick another size from the "Page size" dropdown;
//   // it resets to the default whenever the view (grid/table) changes.
//   const [pageSizeOverride, setPageSizeOverride] =
//     useState(null);

//   const itemsPerPage =
//     pageSizeOverride ?? (viewMode === "grid" ? 12 : 10);

//   // Switching grid/table: reset page size override and go to page 1
//   // (done together, so only ONE server request is made)
//   const handleViewModeChange = (mode) => {
//     if (mode === viewMode) return;

//     setViewMode(mode);
//     setPageSizeOverride(null);
//     setCurrentPage(1);
//   };

//   // Changing the status chip: go to page 1
//   const handleStatusFilterChange = (status) => {
//     setSelectedStatus(status);
//     setCurrentPage(1);
//   };

//   // =========================
//   // SEARCH DEBOUNCE
//   // =========================

//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setDebouncedSearch((prev) => {
//         const next = searchTerm.trim();

//         if (prev !== next) {
//           setCurrentPage(1);
//         }

//         return next;
//       });
//     }, SEARCH_DEBOUNCE_MS);

//     return () => clearTimeout(timer);
//   }, [searchTerm]);

//   // =========================
//   // FETCH FROM SERVER
//   // (page, page size, search or status changed)
//   // =========================

//   useEffect(() => {
//     fetchLeads({
//       page: currentPage,
//       limit: itemsPerPage,
//       search: debouncedSearch,
//       status: selectedStatus,
//     });
//   }, [
//     fetchLeads,
//     currentPage,
//     itemsPerPage,
//     debouncedSearch,
//     selectedStatus,
//   ]);

//   useEffect(() => {
//     fetchEmployees();
//   }, [fetchEmployees]);

//   useEffect(() => {
//     console.log("Leads:", leads);
//   }, [leads]);

//   // Selection only makes sense for the list the user is looking at
//   useEffect(() => {
//     setSelectedIds([]);
//   }, [debouncedSearch, selectedStatus]);

//   // =========================
//   // LEAD STATS (from server, whole lead list)
//   // =========================

//   const totalLeads = stats.total;
//   const newLeads = stats.new;
//   const contactedLeads = stats.contacted;
//   const wonLeads = stats.won;

//   // =========================
//   // PAGINATION (from server)
//   // =========================

//   const totalItems = pagination.total;
//   const totalPages = pagination.totalPages;

//   // The server already returns only the current page
//   const paginatedLeads = leads;

//   // =========================
//   // BULK SELECTION
//   // =========================

//   const validSelectedIds = selectedIds;

//   const selectedSet = useMemo(
//     () => new Set(validSelectedIds),
//     [validSelectedIds]
//   );

//   const pageIds = paginatedLeads.map((lead) => lead.id);

//   const allPageSelected =
//     pageIds.length > 0 &&
//     pageIds.every((id) => selectedSet.has(id));

//   const somePageSelected = pageIds.some((id) =>
//     selectedSet.has(id)
//   );

//   const handleToggleSelect = (id) => {
//     setSelectedIds((prev) =>
//       prev.includes(id)
//         ? prev.filter((item) => item !== id)
//         : [...prev, id]
//     );
//   };

//   const handleToggleSelectPage = () => {
//     setSelectedIds((prev) => {
//       if (allPageSelected) {
//         return prev.filter((id) => !pageIds.includes(id));
//       }

//       return [...new Set([...prev, ...pageIds])];
//     });
//   };

//   // Ask the server for the ids of EVERY lead matching the
//   // current search + status (not only the current page)
//   const handleSelectAllFiltered = async () => {
//     try {
//       const response = await getLeadIds({
//         search: debouncedSearch,
//         status: selectedStatus,
//       });

//       setSelectedIds(
//         Array.isArray(response?.data) ? response.data : []
//       );
//     } catch (error) {
//       console.error(error);

//       if (error?.response?.status === 403) {
//         return;
//       }

//       toast.error(
//         error?.response?.data?.message ||
//         "Failed to select all leads"
//       );
//     }
//   };

//   const handleClearSelection = () => {
//     setSelectedIds([]);
//   };

//   const confirmBulkDelete = async () => {
//     const ids = [...validSelectedIds];

//     setShowBulkDeleteModal(false);

//     if (ids.length === 0) return;

//     setIsBulkDeleting(true);

//     try {
//       const response = await removeLeads(ids);

//       const deletedCount = response?.deletedCount || 0;

//       if (deletedCount > 0) {
//         toast.success(
//           response?.message ||
//           `${deletedCount} leads deleted successfully`
//         );
//       } else {
//         toast.error("No leads were deleted");
//       }

//       setSelectedIds([]);

//       // Make sure we are not left on an empty page
//       const remainingItems =
//         totalItems - deletedCount;

//       const newTotalPages = Math.ceil(
//         remainingItems / itemsPerPage
//       );

//       if (
//         currentPage > newTotalPages &&
//         newTotalPages > 0
//       ) {
//         setCurrentPage(newTotalPages);
//       }
//     } catch (error) {
//       console.error(error);

//       // 403 is already handled by apiClient interceptor
//       if (error?.response?.status === 403) {
//         return;
//       }

//       toast.error(
//         error?.response?.data?.message ||
//         "Failed to delete leads"
//       );
//     } finally {
//       setIsBulkDeleting(false);
//     }
//   };

//   // =========================
//   // HANDLERS
//   // =========================

//   const handleEdit = (lead) => {
//     setSelectedLead(lead);
//     setShowEditModal(true);
//   };

//   const handleView = (lead) => {
//     setSelectedLead(lead);
//     setShowViewModal(true);
//   };

//   const handleDelete = (id) => {
//     setDeleteTargetId(id);
//   };

//   const confirmDelete = async () => {
//     const id = deleteTargetId;
//     setDeleteTargetId(null);

//     try {
//       await removeLead(id);

//       toast.success("Lead deleted successfully");

//       // Check whether the current page becomes empty
//       const remainingItems = totalItems - 1;

//       const newTotalPages = Math.ceil(
//         remainingItems / itemsPerPage
//       );

//       if (
//         currentPage > newTotalPages &&
//         newTotalPages > 0
//       ) {
//         setCurrentPage(newTotalPages);
//       }

//     } catch (error) {
//       console.error(error);

//       // 403 is already handled by apiClient interceptor
//       if (error?.response?.status === 403) {
//         return;
//       }

//       toast.error(
//         error?.response?.data?.message ||
//         "Failed to delete lead"
//       );
//     }
//   };

//   const handleStatusChange = async (
//     id,
//     status
//   ) => {
//     try {
//       await changeLeadStatus(id, status);
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   // =========================
//   // ERROR
//   // =========================


//   const handleConvert = async (id) => {
//     console.log("handleConvert called", id);
//     try {
//       await convertLead(id);

//       const response = await getCustomers();
//       setCustomers(response.data);

//       // Reloads the current page with the same search / filter / page
//       await fetchLeads();

//       toast.success("Lead converted to customer successfully");
//     } catch (error) {
//       console.error(error);

//       toast.error(
//         error?.response?.data?.message ||
//         "Failed to convert lead"
//       );
//     }
//   };

//   return (

//     <div className="crm-page">

//       {/* ================= HEADER ================= */}

//       <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

//         <div className="min-w-0">
//           <h1 className="crm-title">
//             Leads
//           </h1>

//           <p className="crm-subtitle">
//             Manage your WhatsApp CRM leads
//           </p>
//         </div>

//         <button
//           type="button"
//           onClick={() => setShowAddModal(true)}
//           className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-green-500 px-6 text-sm font-semibold text-white transition hover:bg-green-600 sm:w-auto"
//         >
//           + Add Leads
//         </button>

//       </div>

//       {/* ================= STATS ================= */}

//       <LeadStats
//         totalLeads={totalLeads}
//         newLeads={newLeads}
//         contactedLeads={contactedLeads}
//         wonLeads={wonLeads}
//       />

//       {/* ================= SEARCH + FILTER + VIEW ================= */}

//       <LeadFilters
//         searchTerm={searchTerm}
//         setSearchTerm={setSearchTerm}
//         selectedStatus={selectedStatus}
//         setSelectedStatus={handleStatusFilterChange}
//         viewMode={viewMode}
//         onViewModeChange={handleViewModeChange}
//       />

//       {/* ================= BULK SELECT BAR ================= */}

//       {validSelectedIds.length > 0 && (
//         <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

//           <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
//             <input
//               type="checkbox"
//               checked={allPageSelected}
//               ref={(el) => {
//                 if (el) {
//                   el.indeterminate =
//                     somePageSelected && !allPageSelected;
//                 }
//               }}
//               onChange={handleToggleSelectPage}
//               className="h-4 w-4 cursor-pointer accent-green-600"
//             />

//             {validSelectedIds.length} selected
//           </label>

//           <div className="flex flex-wrap items-center gap-2">

//             {validSelectedIds.length < totalItems && (
//               <button
//                 type="button"
//                 onClick={handleSelectAllFiltered}
//                 className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-green-500 hover:bg-green-50"
//               >
//                 Select all {totalItems}
//               </button>
//             )}

//             <button
//               type="button"
//               onClick={handleClearSelection}
//               className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
//             >
//               Clear
//             </button>

//             <button
//               type="button"
//               onClick={() => setShowBulkDeleteModal(true)}
//               disabled={isBulkDeleting}
//               className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               <Trash2 size={16} />
//               {isBulkDeleting
//                 ? "Deleting..."
//                 : "Delete Selected"}
//             </button>

//           </div>

//         </div>
//       )}

//       {/* ================= CONTENT ================= */}
//       {/* The old list stays on screen (slightly faded) while the next
//           page loads. The "Loading leads..." text shows only on the
//           very first load, when there is nothing to show yet. */}

//       <div
//         className={`transition-opacity duration-150 ${
//           isLoading && paginatedLeads.length > 0
//             ? "pointer-events-none opacity-60"
//             : "opacity-100"
//         }`}
//       >

//       {isLoading && paginatedLeads.length === 0 ? (
//         <div className="py-10 text-center">
//           Loading leads...
//         </div>
//       ) : paginatedLeads.length === 0 ? (
//         <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">

//           <h3 className="text-xl font-semibold">
//             No Leads Found
//           </h3>

//           <p className="mt-2 text-slate-500">
//             Create your first lead to get started.
//           </p>

//         </div>
//       ) : viewMode === "grid" ? (

//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">

//           {paginatedLeads.map((lead) => (
//             <LeadCard
//               key={lead.id}
//               lead={lead}
//               onView={handleView}
//               onEdit={handleEdit}
//               onDelete={handleDelete}
//               onStatusChange={handleStatusChange}
//               onConvert={handleConvert}
//               selected={selectedSet.has(lead.id)}
//               onToggleSelect={handleToggleSelect}
//             />
//           ))}

//         </div>

//       ) : (

//         <LeadTable
//           leads={paginatedLeads}
//           onView={handleView}
//           onEdit={handleEdit}
//           onDelete={handleDelete}
//           onStatusChange={handleStatusChange}
//           onConvert={handleConvert}
//           selectedIds={validSelectedIds}
//           onToggleSelect={handleToggleSelect}
//           onToggleSelectPage={handleToggleSelectPage}
//         />

//       )}

//       </div>

//       {totalItems > 0 && (
//         <CustomerPagination
//           currentPage={currentPage}
//           totalPages={Math.max(1, totalPages || 1)}
//           pageSize={itemsPerPage}
//           onPageChange={setCurrentPage}
//           onPageSizeChange={(size) => {
//             setPageSizeOverride(size);
//             setCurrentPage(1);
//           }}
//         />
//       )}

//       {/* ================= ADD MODAL ================= */}

//       <AddLeadModal
//         isOpen={showAddModal}
//         onClose={() => setShowAddModal(false)}
//         employees={employees}
//       />

//       {/* ================= EDIT MODAL ================= */}

//       <EditLeadModal
//         isOpen={showEditModal}
//         onClose={() => setShowEditModal(false)}
//         lead={selectedLead}
//         employees={employees}
//       />

//       {/* ================= VIEW MODAL ================= */}

//       <ViewLeadModal
//         isOpen={showViewModal}
//         onClose={() => setShowViewModal(false)}
//         onEdit={(lead) => {
//           setShowViewModal(false);
//           handleEdit(lead);
//         }}
//         lead={selectedLead}
//       />

//       {/* ================= DELETE CONFIRM MODAL ================= */}

//       <ConfirmModal
//         isOpen={!!deleteTargetId}
//         title="Delete Lead"
//         message="Are you sure you want to delete this lead? This cannot be undone."
//         confirmText="Delete"
//         cancelText="Cancel"
//         variant="danger"
//         onConfirm={confirmDelete}
//         onCancel={() => setDeleteTargetId(null)}
//       />

//       {/* ================= BULK DELETE CONFIRM MODAL ================= */}

//       <ConfirmModal
//         isOpen={showBulkDeleteModal}
//         title="Delete Selected Leads"
//         message={`Are you sure you want to delete ${validSelectedIds.length} selected lead${validSelectedIds.length === 1 ? "" : "s"}? This cannot be undone.`}
//         confirmText={`Delete ${validSelectedIds.length}`}
//         cancelText="Cancel"
//         variant="danger"
//         onConfirm={confirmBulkDelete}
//         onCancel={() => setShowBulkDeleteModal(false)}
//       />

//     </div>
//   );
// }




import { useEffect, useMemo, useState } from "react";
import useGuideAutoOpen from "../components/guide/useGuideAutoOpen";
import { Trash2 } from "lucide-react";

import useLeadStore from "../store/leadStore";
import useEmployeeStore from "../store/employeeStore";

import LeadCard from "../components/leads/LeadCard";
import LeadTable from "../components/leads/LeadTable";
import LeadStats from "../components/leads/LeadStats";
import LeadFilters from "../components/leads/LeadFilters";
import AddLeadModal from "../components/leads/AddLeadModal";
import EditLeadModal from "../components/leads/EditLeadModal";
import ViewLeadModal from "../components/leads/ViewLeadModal";
import toast from "react-hot-toast";
import { getCustomers } from "../api/customerApi";
import { getLeadIds } from "../api/leadApi";
import useCustomerStore from "../store/customerStore";
import CustomerPagination from "../components/customers/CustomerPagination";
import ConfirmModal from "../components/common/ConfirmModal";

// Wait this long after the user stops typing before calling the server
const SEARCH_DEBOUNCE_MS = 400;

export default function Lead() {
  const {
    leads,
    pagination,
    stats,
    isLoading,
    fetchLeads,
    removeLead,
    removeLeads,
    changeLeadStatus,
    convertLead,
  } = useLeadStore();

  const setCustomers = useCustomerStore(
    (state) => state.setCustomers
  );

  const { employees, fetchEmployees } = useEmployeeStore();

  // What the user types (updates on every keystroke)
  const [searchTerm, setSearchTerm] = useState("");

  // What is actually sent to the server (updates after the user pauses)
  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("ALL");

  // "grid" = card view, "list" = table view (table is the default)
  const [viewMode, setViewMode] =
    useState("list");

  const [showAddModal, setShowAddModal] =
    useState(false);

  // Opens the add form when coming from the first-visit guide
  useGuideAutoOpen("leads", () => setShowAddModal(true));

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [selectedLead, setSelectedLead] =
    useState(null);

  const [deleteTargetId, setDeleteTargetId] =
    useState(null);

  // Bulk selection / bulk delete
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] =
    useState(false);
  const [isBulkDeleting, setIsBulkDeleting] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  // Grid view: 12 per page, because 12 divides evenly into the 3-column
  // (xl), 2-column (md) and 1-column layouts, so the last row is never
  // left with a single stray card. List/table view keeps 10 per page.
  // The user can pick another size from the "Page size" dropdown;
  // it resets to the default whenever the view (grid/table) changes.
  const [pageSizeOverride, setPageSizeOverride] =
    useState(null);

  const itemsPerPage =
    pageSizeOverride ?? (viewMode === "grid" ? 12 : 10);

  // Switching grid/table: reset page size override and go to page 1
  // (done together, so only ONE server request is made)
  const handleViewModeChange = (mode) => {
    if (mode === viewMode) return;

    setViewMode(mode);
    setPageSizeOverride(null);
    setCurrentPage(1);
  };

  // Changing the status chip: go to page 1
  const handleStatusFilterChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  // =========================
  // SEARCH DEBOUNCE
  // =========================

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch((prev) => {
        const next = searchTerm.trim();

        if (prev !== next) {
          setCurrentPage(1);
        }

        return next;
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // =========================
  // FETCH FROM SERVER
  // (page, page size, search or status changed)
  // =========================

  useEffect(() => {
    fetchLeads({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearch,
      status: selectedStatus,
    });
  }, [
    fetchLeads,
    currentPage,
    itemsPerPage,
    debouncedSearch,
    selectedStatus,
  ]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    console.log("Leads:", leads);
  }, [leads]);

  // Selection only makes sense for the list the user is looking at
  useEffect(() => {
    setSelectedIds([]);
  }, [debouncedSearch, selectedStatus]);

  // =========================
  // LEAD STATS (from server, whole lead list)
  // =========================

  const totalLeads = stats.total;
  const newLeads = stats.new;
  const contactedLeads = stats.contacted;
  const wonLeads = stats.won;

  // =========================
  // PAGINATION (from server)
  // =========================

  const totalItems = pagination.total;
  const totalPages = pagination.totalPages;

  // The server already returns only the current page
  const paginatedLeads = leads;

  // =========================
  // BULK SELECTION
  // =========================

  const validSelectedIds = selectedIds;

  const selectedSet = useMemo(
    () => new Set(validSelectedIds),
    [validSelectedIds]
  );

  const pageIds = paginatedLeads.map((lead) => lead.id);

  const allPageSelected =
    pageIds.length > 0 &&
    pageIds.every((id) => selectedSet.has(id));

  const somePageSelected = pageIds.some((id) =>
    selectedSet.has(id)
  );

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleToggleSelectPage = () => {
    setSelectedIds((prev) => {
      if (allPageSelected) {
        return prev.filter((id) => !pageIds.includes(id));
      }

      return [...new Set([...prev, ...pageIds])];
    });
  };

  // Ask the server for the ids of EVERY lead matching the
  // current search + status (not only the current page)
  const handleSelectAllFiltered = async () => {
    try {
      const response = await getLeadIds({
        search: debouncedSearch,
        status: selectedStatus,
      });

      setSelectedIds(
        Array.isArray(response?.data) ? response.data : []
      );
    } catch (error) {
      console.error(error);

      if (error?.response?.status === 403) {
        return;
      }

      toast.error(
        error?.response?.data?.message ||
        "Failed to select all leads"
      );
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const confirmBulkDelete = async () => {
    const ids = [...validSelectedIds];

    setShowBulkDeleteModal(false);

    if (ids.length === 0) return;

    setIsBulkDeleting(true);

    try {
      const response = await removeLeads(ids);

      const deletedCount = response?.deletedCount || 0;

      if (deletedCount > 0) {
        toast.success(
          response?.message ||
          `${deletedCount} leads deleted successfully`
        );
      } else {
        toast.error("No leads were deleted");
      }

      setSelectedIds([]);

      // Make sure we are not left on an empty page
      const remainingItems =
        totalItems - deletedCount;

      const newTotalPages = Math.ceil(
        remainingItems / itemsPerPage
      );

      if (
        currentPage > newTotalPages &&
        newTotalPages > 0
      ) {
        setCurrentPage(newTotalPages);
      }
    } catch (error) {
      console.error(error);

      // 403 is already handled by apiClient interceptor
      if (error?.response?.status === 403) {
        return;
      }

      toast.error(
        error?.response?.data?.message ||
        "Failed to delete leads"
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // =========================
  // HANDLERS
  // =========================

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setShowEditModal(true);
  };

  const handleView = (lead) => {
    setSelectedLead(lead);
    setShowViewModal(true);
  };

  const handleDelete = (id) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      await removeLead(id);

      toast.success("Lead deleted successfully");

      // Check whether the current page becomes empty
      const remainingItems = totalItems - 1;

      const newTotalPages = Math.ceil(
        remainingItems / itemsPerPage
      );

      if (
        currentPage > newTotalPages &&
        newTotalPages > 0
      ) {
        setCurrentPage(newTotalPages);
      }

    } catch (error) {
      console.error(error);

      // 403 is already handled by apiClient interceptor
      if (error?.response?.status === 403) {
        return;
      }

      toast.error(
        error?.response?.data?.message ||
        "Failed to delete lead"
      );
    }
  };

  const handleStatusChange = async (
    id,
    status
  ) => {
    try {
      await changeLeadStatus(id, status);
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // ERROR
  // =========================


  const handleConvert = async (id) => {
    console.log("handleConvert called", id);
    try {
      await convertLead(id);

      const response = await getCustomers();
      setCustomers(response.data);

      // Reloads the current page with the same search / filter / page
      await fetchLeads();

      toast.success("Lead converted to customer successfully");
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
        "Failed to convert lead"
      );
    }
  };

  return (

    <div className="crm-page">

      {/* ================= HEADER ================= */}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">

        <div className="min-w-0">
          <h1 className="crm-title">
            Leads
          </h1>

          <p className="crm-subtitle">
            Manage your WhatsApp CRM leads
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-green-500 px-6 text-sm font-semibold text-white transition hover:bg-green-600"
        >
          + Add Leads
        </button>

      </div>

      {/* ================= STATS ================= */}

      <LeadStats
        totalLeads={totalLeads}
        newLeads={newLeads}
        contactedLeads={contactedLeads}
        wonLeads={wonLeads}
      />

      {/* ================= SEARCH + FILTER + VIEW ================= */}

      <LeadFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={handleStatusFilterChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* ================= BULK SELECT BAR ================= */}

      {validSelectedIds.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

          <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={allPageSelected}
              ref={(el) => {
                if (el) {
                  el.indeterminate =
                    somePageSelected && !allPageSelected;
                }
              }}
              onChange={handleToggleSelectPage}
              className="h-4 w-4 cursor-pointer accent-green-600"
            />

            {validSelectedIds.length} selected
          </label>

          <div className="flex flex-wrap items-center gap-2">

            {validSelectedIds.length < totalItems && (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-green-500 hover:bg-green-50"
              >
                Select all {totalItems}
              </button>
            )}

            <button
              type="button"
              onClick={handleClearSelection}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              disabled={isBulkDeleting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
              {isBulkDeleting
                ? "Deleting..."
                : "Delete Selected"}
            </button>

          </div>

        </div>
      )}

      {/* ================= CONTENT ================= */}
      {/* The old list stays on screen (slightly faded) while the next
          page loads. The "Loading leads..." text shows only on the
          very first load, when there is nothing to show yet. */}

      <div
        className={`transition-opacity duration-150 ${
          isLoading && paginatedLeads.length > 0
            ? "pointer-events-none opacity-60"
            : "opacity-100"
        }`}
      >

      {isLoading && paginatedLeads.length === 0 ? (
        <div className="py-10 text-center">
          Loading leads...
        </div>
      ) : paginatedLeads.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">

          <h3 className="text-xl font-semibold">
            No Leads Found
          </h3>

          <p className="mt-2 text-slate-500">
            Create your first lead to get started.
          </p>

        </div>
      ) : viewMode === "grid" ? (

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 xl:gap-6">

          {paginatedLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onConvert={handleConvert}
              selected={selectedSet.has(lead.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))}

        </div>

      ) : (

        <LeadTable
          leads={paginatedLeads}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          onConvert={handleConvert}
          selectedIds={validSelectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectPage={handleToggleSelectPage}
        />

      )}

      </div>

      {totalItems > 0 && (
        <CustomerPagination
          currentPage={currentPage}
          totalPages={Math.max(1, totalPages || 1)}
          pageSize={itemsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSizeOverride(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* ================= ADD MODAL ================= */}

      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        employees={employees}
      />

      {/* ================= EDIT MODAL ================= */}

      <EditLeadModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        lead={selectedLead}
        employees={employees}
      />

      {/* ================= VIEW MODAL ================= */}

      <ViewLeadModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        onEdit={(lead) => {
          setShowViewModal(false);
          handleEdit(lead);
        }}
        lead={selectedLead}
      />

      {/* ================= DELETE CONFIRM MODAL ================= */}

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Lead"
        message="Are you sure you want to delete this lead? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* ================= BULK DELETE CONFIRM MODAL ================= */}

      <ConfirmModal
        isOpen={showBulkDeleteModal}
        title="Delete Selected Leads"
        message={`Are you sure you want to delete ${validSelectedIds.length} selected lead${validSelectedIds.length === 1 ? "" : "s"}? This cannot be undone.`}
        confirmText={`Delete ${validSelectedIds.length}`}
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteModal(false)}
      />

    </div>
  );
}