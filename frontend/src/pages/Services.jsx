import { useEffect, useMemo, useState } from "react";
import { Users, Table2, LayoutGrid } from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/authStore";
import ConfirmModal from "../components/common/ConfirmModal";
import StatusToggle from "../components/customers/StatusToggle";
import CustomerPagination from "../components/customers/CustomerPagination";
import ServiceActionsMenu from "../components/services/ServiceActionsMenu";
import ServiceFormModal from "../components/services/ServiceFormModal";
import ServiceCustomersModal from "../components/services/ServiceCustomersModal";
import {
  getServices,
  updateService,
  deleteService,
} from "../api/serviceApi";

const VIEW_STORAGE_KEY = "servicesViewMode";

// Remember table / card choice between visits
function readSavedView() {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "cards" ? "cards" : "table";
  } catch {
    return "table";
  }
}

export default function Services() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState(readSavedView);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Which modal is open: { mode: "add" | "view" | "edit", service }
  const [formModal, setFormModal] = useState(null);
  const [customersService, setCustomersService] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  const fetchServices = async () => {
    try {
      const data = await getServices();
      setServices(data.services || []);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error("Failed to load services");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  // First load (fetchServices above is used for refreshes after saving)
  useEffect(() => {
    let cancelled = false;

    getServices()
      .then((data) => {
        if (!cancelled) setServices(data.services || []);
      })
      .catch((error) => {
        console.error("Failed to fetch services:", error);

        if (!cancelled) {
          toast.error("Failed to load services");
          setServices([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const changeView = (mode) => {
    setViewMode(mode);

    try {
      localStorage.setItem(VIEW_STORAGE_KEY, mode);
    } catch {
      // Storage can be blocked, the choice just won't be remembered
    }
  };

  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return services;

    return services.filter(
      (service) =>
        service.name?.toLowerCase().includes(keyword) ||
        service.description?.toLowerCase().includes(keyword)
    );
  }, [services, search]);

  // Pagination (page is kept inside the valid range, e.g. after a delete)
  const totalPages = Math.max(1, Math.ceil(filteredServices.length / pageSize));
  const page = Math.min(currentPage, totalPages);

  const pagedServices = useMemo(
    () => filteredServices.slice((page - 1) * pageSize, page * pageSize),
    [filteredServices, page, pageSize]
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // =========================
  // STATUS SWITCH
  // =========================

  const handleToggleStatus = async (service, makeActive) => {
    if (statusUpdatingId) return;

    const applyStatus = (isActive) =>
      setServices((prev) =>
        prev.map((item) =>
          item.id === service.id ? { ...item, isActive } : item
        )
      );

    // Show the change straight away, undo it if saving fails
    applyStatus(makeActive);
    setStatusUpdatingId(service.id);

    try {
      await updateService(service.id, { isActive: makeActive });

      toast.success(
        `${service.name} is now ${makeActive ? "active" : "inactive"}`
      );
    } catch (error) {
      console.error(error);

      applyStatus(service.isActive);

      // 403 is already handled by the apiClient interceptor
      if (error?.response?.status === 403) return;

      toast.error(error?.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // =========================
  // DELETE
  // =========================

  const confirmDelete = async () => {
    const target = deleteTarget;

    setDeleteTarget(null);

    if (!target) return;

    try {
      await deleteService(target.id);

      setServices((prev) => prev.filter((service) => service.id !== target.id));

      toast.success("Service deleted successfully!");
    } catch (error) {
      console.error(error);

      if (error?.response?.status === 403) return;

      toast.error(error?.response?.data?.message || "Failed to delete service");
    }
  };

  // =========================
  // SHARED PIECES
  // =========================

  const renderStatusToggle = (service) => (
    <span
      title={isAdmin ? undefined : "Only an admin can change the status"}
      className="inline-flex"
    >
      <StatusToggle
        checked={service.isActive}
        disabled={!isAdmin || statusUpdatingId === service.id}
        label={`${service.name} is ${service.isActive ? "active" : "inactive"}`}
        onChange={(makeActive) => handleToggleStatus(service, makeActive)}
      />
    </span>
  );

  const renderMenu = (service) => (
    <ServiceActionsMenu
      service={service}
      canManage={isAdmin}
      onManageCustomers={() => setCustomersService(service)}
      onView={() => setFormModal({ mode: "view", service })}
      onEdit={() => setFormModal({ mode: "edit", service })}
      onDelete={() => setDeleteTarget(service)}
    />
  );

  const emptyMessage =
    services.length === 0
      ? isAdmin
        ? 'No services yet. Click "+ Add Service" to create your first one.'
        : "No services yet. Ask your admin to create services."
      : "No services found";

  const thClass =
    "px-5 py-4 text-xs font-semibold uppercase tracking-wide text-green-900";

  return (
    <div className="crm-page">
      {/* ================= HEADER ================= */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="crm-title">Services</h1>
          <p className="crm-subtitle">
            Group your customers by service to send targeted campaigns
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setFormModal({ mode: "add", service: null })}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-green-500 px-6 text-sm font-semibold text-white transition hover:bg-green-600 sm:w-auto"
          >
            + Add Service
          </button>
        )}
      </div>

      {/* ================= SEARCH + VIEW SWITCH ================= */}
      <div className="mb-6 flex items-center gap-3">
        <input
          type="text"
          aria-label="Search services"
          placeholder="Search services..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />

        <div
          role="group"
          aria-label="Services layout"
          className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
        >
          {[
            { key: "table", label: "Table view", icon: Table2 },
            { key: "cards", label: "Card view", icon: LayoutGrid },
          ].map((option) => {
            const Icon = option.icon;
            const active = viewMode === option.key;

            return (
              <button
                key={option.key}
                type="button"
                aria-label={option.label}
                aria-pressed={active}
                onClick={() => changeView(option.key)}
                className={`flex h-10 w-12 items-center justify-center rounded-lg transition ${
                  active
                    ? "bg-green-500 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-green-100">
                <tr>
                  <th className={`${thClass} text-left`}>Service</th>
                  <th className={`${thClass} text-center`}>Description</th>
                  <th className={`${thClass} text-center`}>Customers</th>
                  <th className={`${thClass} text-center`}>Status</th>
                  <th className={`${thClass} text-center`}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-500">
                      Loading services...
                    </td>
                  </tr>
                ) : pagedServices.length > 0 ? (
                  pagedServices.map((service) => (
                    <tr
                      key={service.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                        {service.name}
                      </td>

                      <td className="px-5 py-4 text-center text-sm text-slate-700">
                        <span
                          title={service.description || undefined}
                          className="mx-auto block max-w-xs truncate"
                        >
                          {service.description || "-"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
                          <Users size={16} className="text-green-600" />
                          {service.customerCount}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          {renderStatusToggle(service)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center">
                          {renderMenu(service)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-500">
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : loading ? (
        <p className="py-12 text-center text-slate-500">Loading services...</p>
      ) : pagedServices.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pagedServices.map((service) => (
            <div
              key={service.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900">
                    {service.name}
                  </h3>

                  <p
                    title={service.description || undefined}
                    className={`mt-1 line-clamp-2 text-sm ${
                      service.description ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {service.description || "No description"}
                  </p>
                </div>

                <div className="-mr-1 -mt-1 shrink-0">{renderMenu(service)}</div>
              </div>

              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-800">
                <Users size={16} className="text-green-600" />
                {service.customerCount}
              </span>

              <div className="mt-4">{renderStatusToggle(service)}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-slate-500">
          {emptyMessage}
        </p>
      )}

      {/* ================= PAGINATION ================= */}
      {!loading && filteredServices.length > 0 && (
        <CustomerPagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* ================= MODALS ================= */}
      {formModal && (
        <ServiceFormModal
          // A new key remounts the form when View switches to Edit
          key={`${formModal.mode}-${formModal.service?.id || "new"}`}
          mode={formModal.mode}
          service={formModal.service}
          onClose={() => setFormModal(null)}
          onSaved={fetchServices}
          onEdit={
            isAdmin
              ? () => setFormModal({ mode: "edit", service: formModal.service })
              : undefined
          }
        />
      )}

      {customersService && (
        <ServiceCustomersModal
          service={customersService}
          onClose={() => setCustomersService(null)}
          onSaved={fetchServices}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Service"
        message="This removes the service tag from its customers. The customers themselves are not deleted."
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}