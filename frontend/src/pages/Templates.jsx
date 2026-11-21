
// import { useCallback, useEffect, useMemo, useState } from "react";
// import useGuideAutoOpen from "../components/guide/useGuideAutoOpen";
// import toast from "react-hot-toast";

// import useTemplateStore from "../store/templateStore";

// import TemplateStats from "../components/templates/TemplateStats";
// import TemplateFilters from "../components/templates/TemplateFilters";
// import TemplateCard from "../components/templates/TemplateCard";
// import TemplateTable from "../components/templates/TemplateTable";
// import TemplatePagination from "../components/templates/TemplatePagination";
// import TemplateDrawer from "../components/templates/TemplateDrawer";
// import SendTemplateDrawer from "../components/templates/SendTemplateDrawer";
// import ConfirmModal from "../components/common/ConfirmModal";

// // Each view has its own sensible page sizes
// // (cards sit in rows of 3, the table is a plain list)
// const PAGE_SIZES = {
//   card: [6, 9, 12, 24],
//   table: [5, 10, 20, 50],
// };

// const DEFAULT_PAGE_SIZE = { card: 9, table: 10 };

// const VIEW_STORAGE_KEY = "templates:view";

// const readSavedView = () => {
//   try {
//     const saved = localStorage.getItem(VIEW_STORAGE_KEY);
//     return saved === "table" ? "table" : "card";
//   } catch {
//     return "card";
//   }
// };

// export default function Templates() {
//   const {
//     templates,
//     fetchTemplates,
//     removeTemplate,
//     submitTemplateForApproval,
//     isLoading,
//   } = useTemplateStore();

//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("ALL");

//   const [view, setView] = useState(readSavedView);
//   const [pageSizes, setPageSizes] = useState(DEFAULT_PAGE_SIZE);
//   const [currentPage, setCurrentPage] = useState(1);

//   // Which drawer is open: { mode: "create" | "edit" | "view", template }
//   const [drawer, setDrawer] = useState(null);

//   const [sendTarget, setSendTarget] = useState(null);
//   const [deleteTargetId, setDeleteTargetId] = useState(null);

//   const itemsPerPage = pageSizes[view];

//   useEffect(() => {
//     fetchTemplates();
//   }, [fetchTemplates]);

//   // ==================================================
//   // FILTER + PAGINATE
//   // ==================================================

//   const filteredTemplates = useMemo(() => {
//     const keyword = search.trim().toLowerCase();

//     return templates.filter((template) => {
//       const matchesSearch = template.name?.toLowerCase().includes(keyword);

//       const matchesStatus =
//         statusFilter === "ALL" ? true : template.status === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [templates, search, statusFilter]);

//   const totalPages = Math.max(
//     1,
//     Math.ceil(filteredTemplates.length / itemsPerPage)
//   );

//   // Never sit on a page that no longer exists (e.g. after deleting
//   // the last template on the last page)
//   const page = Math.min(currentPage, totalPages);

//   const paginatedTemplates = useMemo(() => {
//     const start = (page - 1) * itemsPerPage;
//     return filteredTemplates.slice(start, start + itemsPerPage);
//   }, [filteredTemplates, page, itemsPerPage]);

//   const handleSearch = (value) => {
//     setSearch(value);
//     setCurrentPage(1);
//   };

//   const handleStatusFilter = (value) => {
//     setStatusFilter(value);
//     setCurrentPage(1);
//   };

//   const handleViewChange = (nextView) => {
//     setView(nextView);
//     setCurrentPage(1);

//     try {
//       localStorage.setItem(VIEW_STORAGE_KEY, nextView);
//     } catch {
//       // storage can be blocked - the choice just won't be remembered
//     }
//   };

//   const handlePageSizeChange = (size) => {
//     setPageSizes((prev) => ({ ...prev, [view]: size }));
//     setCurrentPage(1);
//   };

//   // ==================================================
//   // ACTIONS
//   // ==================================================

//   const openCreate = () => setDrawer({ mode: "create", template: null });

//   // Opens the add form when coming from the first-visit guide
//   useGuideAutoOpen("templates", () => openCreate());

//   const handlePreview = (template) => setDrawer({ mode: "view", template });

//   const handleEdit = (template) => setDrawer({ mode: "edit", template });

//   const closeDrawer = useCallback(() => setDrawer(null), []);

//   const handleSend = (template) => setSendTarget(template);

//   const handleDelete = (id) => setDeleteTargetId(id);

//   const confirmDelete = async () => {
//     const id = deleteTargetId;
//     setDeleteTargetId(null);

//     try {
//       await removeTemplate(id);
//       toast.success("Template deleted successfully!");
//     } catch (error) {
//       console.error(error);
//       toast.error("Failed to delete template. Please try again.");
//     }
//   };

//   const handleSubmitForApproval = async (id) => {
//     try {
//       await submitTemplateForApproval(id);

//       toast.success("Template submitted for approval successfully!");
//     } catch (error) {
//       console.error("SUBMIT FOR APPROVAL ERROR", error);

//       toast.error(
//         error?.response?.data?.message ||
//           "Failed to submit template for approval."
//       );
//     }
//   };

//   const rowActions = {
//     onPreview: handlePreview,
//     onEdit: handleEdit,
//     onDelete: handleDelete,
//     onSend: handleSend,
//     onSubmitForApproval: handleSubmitForApproval,
//   };

//   // Only show the loader on the very first load, so the list doesn't
//   // blink away every time the store is busy (sending, saving...).
//   const showLoader = isLoading && templates.length === 0;

//   return (
//     <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6">
//       {/* HEADER */}
//       <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-900">Templates</h1>

//           <p className="mt-1 text-sm text-slate-500">
//             Manage and monitor your templates
//           </p>
//         </div>

//         <button
//           type="button"
//           onClick={openCreate}
//           className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
//         >
//           + Create Template
//         </button>
//       </div>

//       {/* STATS */}
//       <TemplateStats templates={templates} />

//       {/* SEARCH / FILTER / VIEW TOGGLE */}
//       <TemplateFilters
//         search={search}
//         setSearch={handleSearch}
//         statusFilter={statusFilter}
//         setStatusFilter={handleStatusFilter}
//         view={view}
//         setView={handleViewChange}
//       />

//       {/* LOADING */}
//       {showLoader && (
//         <div className="mt-10 text-center text-sm text-slate-500">
//           Loading templates...
//         </div>
//       )}

//       {/* EMPTY */}
//       {!showLoader && filteredTemplates.length === 0 && (
//         <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
//           <h3 className="text-base font-semibold text-slate-900">
//             {templates.length === 0
//               ? "No templates yet"
//               : "No templates match your search"}
//           </h3>

//           <p className="mt-1 text-sm text-slate-500">
//             {templates.length === 0
//               ? "Create your first template to start messaging customers."
//               : "Try a different name or status."}
//           </p>

//           {templates.length === 0 && (
//             <button
//               type="button"
//               onClick={openCreate}
//               className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
//             >
//               + Create Template
//             </button>
//           )}
//         </div>
//       )}

//       {/* CARD VIEW */}
//       {!showLoader && filteredTemplates.length > 0 && view === "card" && (
//         <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
//           {paginatedTemplates.map((template) => (
//             <TemplateCard
//               key={template.id}
//               template={template}
//               {...rowActions}
//             />
//           ))}
//         </div>
//       )}

//       {/* TABLE VIEW */}
//       {!showLoader && filteredTemplates.length > 0 && view === "table" && (
//         <TemplateTable templates={paginatedTemplates} {...rowActions} />
//       )}

//       {/* PAGINATION */}
//       {!showLoader && filteredTemplates.length > 0 && (
//         <TemplatePagination
//           currentPage={page}
//           totalPages={totalPages}
//           itemsPerPage={itemsPerPage}
//           pageSizeOptions={PAGE_SIZES[view]}
//           onPageChange={setCurrentPage}
//           onPageSizeChange={handlePageSizeChange}
//         />
//       )}

//       {/* CREATE / EDIT / VIEW DRAWER
//           The key makes the form start fresh for every template / mode */}
//       {drawer && (
//         <TemplateDrawer
//           key={`${drawer.mode}-${drawer.template?.id || "new"}`}
//           mode={drawer.mode}
//           template={drawer.template}
//           onClose={closeDrawer}
//           onRequestEdit={handleEdit}
//         />
//       )}

//       <SendTemplateDrawer
//         isOpen={!!sendTarget}
//         onClose={() => setSendTarget(null)}
//         template={sendTarget}
//       />

//       <ConfirmModal
//         isOpen={!!deleteTargetId}
//         title="Delete Template"
//         message="Are you sure you want to delete this template? This cannot be undone."
//         confirmText="Delete"
//         cancelText="Cancel"
//         variant="danger"
//         onConfirm={confirmDelete}
//         onCancel={() => setDeleteTargetId(null)}
//       />
//     </div>
//   );
// }



import { useCallback, useEffect, useMemo, useState } from "react";
import useGuideAutoOpen from "../components/guide/useGuideAutoOpen";
import toast from "react-hot-toast";

import useTemplateStore from "../store/templateStore";

import TemplateStats from "../components/templates/TemplateStats";
import TemplateFilters from "../components/templates/TemplateFilters";
import TemplateCard from "../components/templates/TemplateCard";
import TemplateTable from "../components/templates/TemplateTable";
import TemplatePagination from "../components/templates/TemplatePagination";
import TemplateDrawer from "../components/templates/TemplateDrawer";
import SendTemplateDrawer from "../components/templates/SendTemplateDrawer";
import ConfirmModal from "../components/common/ConfirmModal";

// Each view has its own sensible page sizes
// (cards sit in rows of 3, the table is a plain list)
const PAGE_SIZES = {
  card: [6, 9, 12, 24],
  table: [5, 10, 20, 50],
};

const DEFAULT_PAGE_SIZE = { card: 9, table: 10 };

const VIEW_STORAGE_KEY = "templates:view";

const readSavedView = () => {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    return saved === "table" ? "table" : "card";
  } catch {
    return "card";
  }
};

export default function Templates() {
  const {
    templates,
    fetchTemplates,
    removeTemplate,
    submitTemplateForApproval,
    isLoading,
  } = useTemplateStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [view, setView] = useState(readSavedView);
  const [pageSizes, setPageSizes] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  // Which drawer is open: { mode: "create" | "edit" | "view", template }
  const [drawer, setDrawer] = useState(null);

  const [sendTarget, setSendTarget] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const itemsPerPage = pageSizes[view];

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ==================================================
  // FILTER + PAGINATE
  // ==================================================

  const filteredTemplates = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesSearch = template.name?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ? true : template.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [templates, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTemplates.length / itemsPerPage)
  );

  // Never sit on a page that no longer exists (e.g. after deleting
  // the last template on the last page)
  const page = Math.min(currentPage, totalPages);

  const paginatedTemplates = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredTemplates.slice(start, start + itemsPerPage);
  }, [filteredTemplates, page, itemsPerPage]);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleViewChange = (nextView) => {
    setView(nextView);
    setCurrentPage(1);

    try {
      localStorage.setItem(VIEW_STORAGE_KEY, nextView);
    } catch {
      // storage can be blocked - the choice just won't be remembered
    }
  };

  const handlePageSizeChange = (size) => {
    setPageSizes((prev) => ({ ...prev, [view]: size }));
    setCurrentPage(1);
  };

  // ==================================================
  // ACTIONS
  // ==================================================

  const openCreate = () => setDrawer({ mode: "create", template: null });

  // Opens the add form when coming from the first-visit guide
  useGuideAutoOpen("templates", () => openCreate());

  const handlePreview = (template) => setDrawer({ mode: "view", template });

  const handleEdit = (template) => setDrawer({ mode: "edit", template });

  const closeDrawer = useCallback(() => setDrawer(null), []);

  const handleSend = (template) => setSendTarget(template);

  const handleDelete = (id) => setDeleteTargetId(id);

  const confirmDelete = async () => {
    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      await removeTemplate(id);
      toast.success("Template deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete template. Please try again.");
    }
  };

  const handleSubmitForApproval = async (id) => {
    try {
      await submitTemplateForApproval(id);

      toast.success("Template submitted for approval successfully!");
    } catch (error) {
      console.error("SUBMIT FOR APPROVAL ERROR", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to submit template for approval."
      );
    }
  };

  const rowActions = {
    onPreview: handlePreview,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onSend: handleSend,
    onSubmitForApproval: handleSubmitForApproval,
  };

  // Only show the loader on the very first load, so the list doesn't
  // blink away every time the store is busy (sending, saving...).
  const showLoader = isLoading && templates.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="crm-title">Templates</h1>

          <p className="crm-subtitle">
            Manage and monitor your templates
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
        >
          + Create Template
        </button>
      </div>

      {/* STATS */}
      <TemplateStats templates={templates} />

      {/* SEARCH / FILTER / VIEW TOGGLE */}
      <TemplateFilters
        search={search}
        setSearch={handleSearch}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusFilter}
        view={view}
        setView={handleViewChange}
      />

      {/* LOADING */}
      {showLoader && (
        <div className="mt-10 text-center text-sm text-slate-500">
          Loading templates...
        </div>
      )}

      {/* EMPTY */}
      {!showLoader && filteredTemplates.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <h3 className="text-base font-semibold text-slate-900">
            {templates.length === 0
              ? "No templates yet"
              : "No templates match your search"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {templates.length === 0
              ? "Create your first template to start messaging customers."
              : "Try a different name or status."}
          </p>

          {templates.length === 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              + Create Template
            </button>
          )}
        </div>
      )}

      {/* CARD VIEW */}
      {!showLoader && filteredTemplates.length > 0 && view === "card" && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {paginatedTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              {...rowActions}
            />
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {!showLoader && filteredTemplates.length > 0 && view === "table" && (
        <TemplateTable templates={paginatedTemplates} {...rowActions} />
      )}

      {/* PAGINATION */}
      {!showLoader && filteredTemplates.length > 0 && (
        <TemplatePagination
          currentPage={page}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          pageSizeOptions={PAGE_SIZES[view]}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* CREATE / EDIT / VIEW DRAWER
          The key makes the form start fresh for every template / mode */}
      {drawer && (
        <TemplateDrawer
          key={`${drawer.mode}-${drawer.template?.id || "new"}`}
          mode={drawer.mode}
          template={drawer.template}
          onClose={closeDrawer}
          onRequestEdit={handleEdit}
        />
      )}

      <SendTemplateDrawer
        isOpen={!!sendTarget}
        onClose={() => setSendTarget(null)}
        template={sendTarget}
      />

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Template"
        message="Are you sure you want to delete this template? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}