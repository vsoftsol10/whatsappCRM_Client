
// import { useEffect, useMemo, useState } from "react";
// import { LayoutGrid, PanelsTopLeft } from "lucide-react";

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
// import useCustomerStore from "../store/customerStore";
// import Pagination from "../components/common/Pagination";
// import ConfirmModal from "../components/common/ConfirmModal";

// // Table / Grid switch with icon + label (active option is green)
// function ViewToggle({ viewMode, setViewMode }) {
//   const options = [
//     { value: "list", label: "Table", icon: PanelsTopLeft },
//     { value: "grid", label: "Grid", icon: LayoutGrid },
//   ];

//   return (
//     <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
//       {options.map(({ value, label, icon: Icon }) => {
//         const isActive = viewMode === value;

//         return (
//           <button
//             key={value}
//             type="button"
//             onClick={() => setViewMode(value)}
//             aria-pressed={isActive}
//             className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
//               isActive
//                 ? "bg-[#25D366] text-black shadow-sm"
//                 : "text-slate-500 hover:bg-gray-100 hover:text-slate-800"
//             }`}
//           >
//             <Icon size={18} />
//             {label}
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// export default function Lead() {
//   const {
//     leads,
//     isLoading,
//     fetchLeads,
//     removeLead,
//     changeLeadStatus,
//     convertLead,
//   } = useLeadStore();

//   const setCustomers = useCustomerStore(
//     (state) => state.setCustomers
//   );

//   const { employees, fetchEmployees } = useEmployeeStore();

//   const [searchTerm, setSearchTerm] = useState("");
//   const [selectedStatus, setSelectedStatus] =
//     useState("ALL");

//   // "grid" = card view, "list" = table view
//   const [viewMode, setViewMode] =
//     useState("grid");

//   const [showAddModal, setShowAddModal] =
//     useState(false);

//   const [showEditModal, setShowEditModal] =
//     useState(false);

//   const [showViewModal, setShowViewModal] =
//     useState(false);

//   const [selectedLead, setSelectedLead] =
//     useState(null);

//   const [deleteTargetId, setDeleteTargetId] =
//     useState(null);

//   const [currentPage, setCurrentPage] =
//     useState(1);

//   // Grid view: 12 per page, because 12 divides evenly into the 3-column
//   // (xl), 2-column (md) and 1-column layouts, so the last row is never
//   // left with a single stray card. List/table view keeps 10 per page.
//   const itemsPerPage = viewMode === "grid" ? 12 : 10;

//   useEffect(() => {
//     fetchLeads();
//     fetchEmployees();
//   }, [fetchLeads, fetchEmployees]);

//   useEffect(() => {
//     console.log("Leads:", leads);
//   }, [leads]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [
//     searchTerm,
//     selectedStatus,
//     viewMode,
//   ]);

//   // =========================
//   // LEAD STATS
//   // =========================

//   const totalLeads = leads.length;

//   const newLeads = leads.filter(
//     (lead) => lead.status === "NEW"
//   ).length;

//   const contactedLeads = leads.filter(
//     (lead) => lead.status === "CONTACTED"
//   ).length;

//   const qualifiedLeads = leads.filter(
//     (lead) => lead.status === "QUALIFIED"
//   ).length;

//   const wonLeads = leads.filter(
//     (lead) => lead.status === "WON"
//   ).length;

//   // =========================
//   // SEARCH
//   // =========================

//   const searchedLeads = useMemo(() => {
//     return leads.filter((lead) =>
//       `${lead.name || ""} ${lead.email || ""} ${lead.phone || ""
//         }`
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase())
//     );
//   }, [leads, searchTerm]);

//   // =========================
//   // STATUS FILTER
//   // =========================

//   const filteredLeads = useMemo(() => {
//     if (selectedStatus === "ALL") {
//       return searchedLeads.filter(
//         (lead) => !lead.isConverted
//       );
//     }

//     if (selectedStatus === "CONVERTED") {
//       return searchedLeads.filter(
//         (lead) => lead.isConverted
//       );
//     }

//     return searchedLeads.filter(
//       (lead) =>
//         lead.status === selectedStatus &&
//         !lead.isConverted
//     );
//   }, [searchedLeads, selectedStatus]);
//   // =========================
//   // PAGINATION
//   // =========================

//   const totalPages = Math.ceil(
//     filteredLeads.length / itemsPerPage
//   );

//   const startIndex =
//     (currentPage - 1) * itemsPerPage;

//   const paginatedLeads =
//     filteredLeads.slice(
//       startIndex,
//       startIndex + itemsPerPage
//     );


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
//       const remainingItems = filteredLeads.length - 1;

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

//     <div className="crm-page space-y-6">

//       {/* ================= HEADER ================= */}

//       <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

//         <div className="min-w-0">
//           <h1 className="crm-title">
//             Leads
//           </h1>

//           <p className="crm-subtitle">
//             Manage your WhatsApp CRM leads
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center gap-3">

//           {/* Table / Grid Toggle */}

//           <ViewToggle
//             viewMode={viewMode}
//             setViewMode={setViewMode}
//           />

//           <button
//             onClick={() => setShowAddModal(true)}
//             className="crm-primary-button w-full sm:w-auto"
//           >
//             + Add Lead
//           </button>

//         </div>

//       </div>

//       {/* ================= STATS ================= */}

//       <LeadStats
//         totalLeads={totalLeads}
//         newLeads={newLeads}
//         contactedLeads={contactedLeads}
//         qualifiedLeads={qualifiedLeads}
//         wonLeads={wonLeads}
//       />

//       {/* ================= FILTERS ================= */}

//       <LeadFilters
//         searchTerm={searchTerm}
//         setSearchTerm={setSearchTerm}
//         selectedStatus={selectedStatus}
//         setSelectedStatus={setSelectedStatus}
//       />

//       {/* ================= CONTENT ================= */}

//       {isLoading ? (
//         <div className="py-10 text-center">
//           Loading leads...
//         </div>
//       ) : filteredLeads.length === 0 ? (
//         <div className="crm-page-surface p-8 text-center sm:p-10">

//           <h3 className="text-xl font-semibold">
//             No Leads Found
//           </h3>

//           <p className="text-gray-500 mt-2">
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
//         />

//       )}

//       {filteredLeads.length > 0 && (
//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           totalItems={filteredLeads.length}
//           itemsPerPage={itemsPerPage}
//           onPageChange={setCurrentPage}
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

//     </div>
//   );
// }





import { useEffect, useMemo, useState } from "react";
import { LayoutGrid, PanelsTopLeft, Trash2 } from "lucide-react";

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
import useCustomerStore from "../store/customerStore";
import Pagination from "../components/common/Pagination";
import ConfirmModal from "../components/common/ConfirmModal";

// Table / Grid switch with icon + label (active option is green)
function ViewToggle({ viewMode, setViewMode }) {
  const options = [
    { value: "list", label: "Table", icon: PanelsTopLeft },
    { value: "grid", label: "Grid", icon: LayoutGrid },
  ];

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm">
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = viewMode === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => setViewMode(value)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? "bg-[#25D366] text-black shadow-sm"
                : "text-slate-500 hover:bg-gray-100 hover:text-slate-800"
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function Lead() {
  const {
    leads,
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

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] =
    useState("ALL");

  // "grid" = card view, "list" = table view
  const [viewMode, setViewMode] =
    useState("grid");

  const [showAddModal, setShowAddModal] =
    useState(false);

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
  const itemsPerPage = viewMode === "grid" ? 12 : 10;

  useEffect(() => {
    fetchLeads();
    fetchEmployees();
  }, [fetchLeads, fetchEmployees]);

  useEffect(() => {
    console.log("Leads:", leads);
  }, [leads]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedStatus,
    viewMode,
  ]);

  // Selection only makes sense for the list the user is looking at
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm, selectedStatus]);

  // =========================
  // LEAD STATS
  // =========================

  const totalLeads = leads.length;

  const newLeads = leads.filter(
    (lead) => lead.status === "NEW"
  ).length;

  const contactedLeads = leads.filter(
    (lead) => lead.status === "CONTACTED"
  ).length;

  const qualifiedLeads = leads.filter(
    (lead) => lead.status === "QUALIFIED"
  ).length;

  const wonLeads = leads.filter(
    (lead) => lead.status === "WON"
  ).length;

  // =========================
  // SEARCH
  // =========================

  const searchedLeads = useMemo(() => {
    return leads.filter((lead) =>
      `${lead.name || ""} ${lead.email || ""} ${lead.phone || ""
        }`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [leads, searchTerm]);

  // =========================
  // STATUS FILTER
  // =========================

  const filteredLeads = useMemo(() => {
    if (selectedStatus === "ALL") {
      return searchedLeads.filter(
        (lead) => !lead.isConverted
      );
    }

    if (selectedStatus === "CONVERTED") {
      return searchedLeads.filter(
        (lead) => lead.isConverted
      );
    }

    return searchedLeads.filter(
      (lead) =>
        lead.status === selectedStatus &&
        !lead.isConverted
    );
  }, [searchedLeads, selectedStatus]);
  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.ceil(
    filteredLeads.length / itemsPerPage
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const paginatedLeads =
    filteredLeads.slice(
      startIndex,
      startIndex + itemsPerPage
    );


  // =========================
  // BULK SELECTION
  // =========================

  // Only keep ids that are still in the current (filtered) list
  const validSelectedIds = useMemo(() => {
    const visible = new Set(
      filteredLeads.map((lead) => lead.id)
    );

    return selectedIds.filter((id) => visible.has(id));
  }, [selectedIds, filteredLeads]);

  const selectedSet = new Set(validSelectedIds);

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

  const handleSelectAllFiltered = () => {
    setSelectedIds(filteredLeads.map((lead) => lead.id));
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
        filteredLeads.length - deletedCount;

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
      const remainingItems = filteredLeads.length - 1;

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

    <div className="crm-page space-y-6">

      {/* ================= HEADER ================= */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="min-w-0">
          <h1 className="crm-title">
            Leads
          </h1>

          <p className="crm-subtitle">
            Manage your WhatsApp CRM leads
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* Table / Grid Toggle */}

          <ViewToggle
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          <button
            onClick={() => setShowAddModal(true)}
            className="crm-primary-button w-full sm:w-auto"
          >
            + Add Lead
          </button>

        </div>

      </div>

      {/* ================= STATS ================= */}

      <LeadStats
        totalLeads={totalLeads}
        newLeads={newLeads}
        contactedLeads={contactedLeads}
        qualifiedLeads={qualifiedLeads}
        wonLeads={wonLeads}
      />

      {/* ================= FILTERS ================= */}

      <LeadFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />

      {/* ================= BULK SELECT BAR ================= */}

      {!isLoading && filteredLeads.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">

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
              className="h-4 w-4 cursor-pointer accent-[#25D366]"
            />

            {validSelectedIds.length > 0
              ? `${validSelectedIds.length} selected`
              : "Select all on this page"}
          </label>

          {validSelectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">

              {validSelectedIds.length < filteredLeads.length && (
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#25D366] hover:bg-[#DCF8C6]"
                >
                  Select all {filteredLeads.length}
                </button>
              )}

              <button
                type="button"
                onClick={handleClearSelection}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-gray-100"
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
          )}

        </div>
      )}

      {/* ================= CONTENT ================= */}

      {isLoading ? (
        <div className="py-10 text-center">
          Loading leads...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="crm-page-surface p-8 text-center sm:p-10">

          <h3 className="text-xl font-semibold">
            No Leads Found
          </h3>

          <p className="text-gray-500 mt-2">
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

      {filteredLeads.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLeads.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
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
