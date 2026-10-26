import { useEffect, useMemo, useState } from "react";
import { MoreVertical, Pencil, Trash2, Users, X, Search } from "lucide-react";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/authStore";
import ConfirmModal from "../components/common/ConfirmModal";
import { getCustomers } from "../api/customerApi";
import {
  getServices,
  createService,
  updateService,
  deleteService,
  getServiceCustomers,
  setServiceCustomers,
} from "../api/serviceApi";

// =====================================================
// ADD / EDIT SERVICE MODAL
// =====================================================
function ServiceFormModal({ service, onClose, onSaved }) {
  const isEdit = Boolean(service);

  const [name, setName] = useState(service?.name || "");
  const [description, setDescription] = useState(service?.description || "");
  const [isActive, setIsActive] = useState(service ? service.isActive : true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    if (!name.trim()) {
      setError("Service name is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        isActive,
      };

      const result = isEdit
        ? await updateService(service.id, payload)
        : await createService(payload);

      toast.success(
        isEdit ? "Service updated successfully!" : "Service created successfully!"
      );

      await onSaved(result.service);
      onClose();
    } catch (err) {
      console.error("Save service error:", err);

      if (err?.response?.status === 403) {
        setSaving(false);
        onClose();
        return;
      }

      toast.error(err?.response?.data?.message || "Failed to save service");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#25D366] px-5 py-5 sm:px-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-black">
              {isEdit ? "Edit Service" : "Add Service"}
            </h1>
            <p className="mt-1 text-gray-800">
              {isEdit ? "Update service details" : "Create a new service"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full bg-white p-2 shadow transition hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-8">
          <div>
            <label className="block mb-2 font-semibold text-black">
              Service Name <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={name}
              maxLength={100}
              disabled={saving}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="e.g. Web Design, Yoga, Insurance"
              className={`w-full border rounded-lg px-4 py-3 outline-none disabled:bg-gray-100 ${
                error ? "border-red-500" : "border-gray-300 focus:border-[#25D366]"
              }`}
            />

            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div>
            <label className="block mb-2 font-semibold text-black">
              Description{" "}
              <span className="font-normal text-gray-400">(optional)</span>
            </label>

            <textarea
              rows={3}
              value={description}
              maxLength={500}
              disabled={saving}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this service"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#25D366] resize-none disabled:bg-gray-100"
            />
          </div>

          {isEdit && (
            <div>
              <label className="block mb-2 font-semibold text-black">
                Status
              </label>

              <select
                value={isActive ? "ACTIVE" : "INACTIVE"}
                disabled={saving}
                onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#25D366] disabled:bg-gray-100"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>

              <p className="mt-1 text-xs text-gray-500">
                Inactive services are hidden from new customer forms and campaign
                filters, but existing customers keep the tag.
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="crm-secondary-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="crm-primary-button disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : isEdit ? "Update Service" : "Create Service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// MANAGE CUSTOMERS OF A SERVICE MODAL
// =====================================================
function ServiceCustomersModal({ service, onClose, onSaved }) {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [customerData, memberData] = await Promise.all([
          getCustomers("", ""),
          getServiceCustomers(service.id),
        ]);

        if (cancelled) return;

        setCustomers(customerData.customers || customerData.data || []);
        setSelected(memberData.customerIds || []);
      } catch (error) {
        console.error("Load service customers error:", error);
        toast.error("Failed to load customers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [service.id]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return customers;

    return customers.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(keyword) ||
        customer.phone?.toLowerCase().includes(keyword) ||
        customer.email?.toLowerCase().includes(keyword)
    );
  }, [customers, search]);

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    setSelected((prev) => [
      ...new Set([...prev, ...filtered.map((customer) => customer.id)]),
    ]);
  };

  const handleSave = async () => {
    if (saving) return;

    try {
      setSaving(true);

      await setServiceCustomers(service.id, selected);

      toast.success("Service customers updated!");

      await onSaved();
      onClose();
    } catch (error) {
      console.error("Save service customers error:", error);

      if (error?.response?.status === 403) {
        setSaving(false);
        onClose();
        return;
      }

      toast.error(
        error?.response?.data?.message || "Failed to update customers"
      );
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#25D366] px-5 py-5 sm:px-8">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-black sm:text-2xl">
              Customers of "{service.name}"
            </h1>
            <p className="mt-1 text-gray-800">
              {selected.length} selected
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full bg-white p-2 shadow transition hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-3 border-b border-gray-200 p-5">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name, phone or email..."
              disabled={saving}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 outline-none focus:border-[#25D366]"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllVisible}
              disabled={saving || filtered.length === 0}
              className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Select All
            </button>

            <button
              type="button"
              onClick={() => setSelected([])}
              disabled={saving || selected.length === 0}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="py-10 text-center text-gray-500">
              Loading customers...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No customers found.
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((customer) => {
                const isSelected = selected.includes(customer.id);

                return (
                  <label
                    key={customer.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition hover:bg-gray-50 ${
                      isSelected ? "bg-green-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(customer.id)}
                      disabled={saving}
                      className="h-4 w-4 accent-[#25D366]"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-800">
                        {customer.name || "Unnamed Customer"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {customer.phone || "No phone number"}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="crm-secondary-button disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="crm-primary-button disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Customers"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SERVICES PAGE
// =====================================================
export default function Services() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState(null);
  const [customersService, setCustomersService] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

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

  useEffect(() => {
    fetchServices();
  }, []);

  // Close the row menu when clicking anywhere else
  useEffect(() => {
    if (!openMenu) return undefined;

    const close = () => setOpenMenu(null);

    document.addEventListener("click", close);

    return () => document.removeEventListener("click", close);
  }, [openMenu]);

  const filteredServices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return services;

    return services.filter(
      (service) =>
        service.name?.toLowerCase().includes(keyword) ||
        service.description?.toLowerCase().includes(keyword)
    );
  }, [services, search]);

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
            onClick={() => {
              setEditService(null);
              setShowForm(true);
            }}
            className="crm-primary-button w-full sm:w-auto"
          >
            + Add Service
          </button>
        )}
      </div>

      {/* ================= SEARCH ================= */}
      <div className="mb-6 w-full lg:max-w-md">
        <input
          type="text"
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="crm-input"
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="crm-table-shell overflow-visible">
        <div className="crm-table-scroll overflow-visible">
          <table className="w-full min-w-[700px]">
            <thead className="bg-[#25D366] text-black">
              <tr>
                <th className="crm-th">Service</th>
                <th className="crm-th">Description</th>
                <th className="crm-th">Customers</th>
                <th className="crm-th">Status</th>
                <th className="crm-th text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Loading services...
                  </td>
                </tr>
              ) : filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-gray-100 transition hover:bg-gray-50"
                  >
                    <td className="crm-td font-medium">{service.name}</td>

                    <td className="crm-td text-gray-600">
                      {service.description || "-"}
                    </td>

                    <td className="crm-td">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <Users size={16} className="text-[#128C7E]" />
                        {service.customerCount}
                      </span>
                    </td>

                    <td className="crm-td">
                      <span
                        className={`crm-badge ${
                          service.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {service.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    <td className="crm-td">
                      <div className="relative flex justify-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(
                              openMenu === service.id ? null : service.id
                            );
                          }}
                          className="rounded-full p-2 hover:bg-gray-100"
                        >
                          <MoreVertical size={20} />
                        </button>

                        {openMenu === service.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenu(null);
                                setCustomersService(service);
                              }}
                              className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-gray-50"
                            >
                              <Users size={16} />
                              Manage Customers
                            </button>

                            {isAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenu(null);
                                    setEditService(service);
                                    setShowForm(true);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-gray-50"
                                >
                                  <Pencil size={16} />
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenu(null);
                                    setDeleteTarget(service);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={16} />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    {services.length === 0
                      ? isAdmin
                        ? "No services yet. Click \"+ Add Service\" to create your first one."
                        : "No services yet. Ask your admin to create services."
                      : "No services found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {showForm && (
        <ServiceFormModal
          service={editService}
          onClose={() => {
            setShowForm(false);
            setEditService(null);
          }}
          onSaved={fetchServices}
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
