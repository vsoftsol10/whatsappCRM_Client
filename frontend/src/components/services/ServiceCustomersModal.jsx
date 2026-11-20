import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getCustomers } from "../../api/customerApi";
import { getServiceCustomers, setServiceCustomers } from "../../api/serviceApi";
import { formatPhone } from "../../utils/customerFormat";
import {
  CustomerModal,
  CustomerModalFooter,
  primaryButtonClass,
  secondaryButtonClass,
} from "../customers/CustomerForm";

// Choose which customers use a service.
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

    // "98400 11201" should still find 919840011201
    const keywordDigits = keyword.replace(/\D/g, "");

    return customers.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(keyword) ||
        customer.email?.toLowerCase().includes(keyword) ||
        customer.phone?.toLowerCase().includes(keyword) ||
        (keywordDigits &&
          String(customer.phone || "").replace(/\D/g, "").includes(keywordDigits))
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

      await onSaved();
      onClose();

      // Success message (shown AFTER the popup is closed)
      toast.success("Service customers updated!");
    } catch (error) {
      console.error("Save service customers error:", error);

      // 403 is already handled by the apiClient interceptor
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
    <CustomerModal
      title="Manage Customers"
      subtitle={service.name}
      onClose={onClose}
      closeDisabled={saving}
      maxWidth="max-w-2xl"
    >
      <input
        type="text"
        aria-label="Search customers"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search customers by name, phone or email"
        disabled={saving}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={selectAllVisible}
          disabled={saving || filtered.length === 0}
          className="h-10 rounded-full bg-green-500 px-5 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Select All
        </button>

        <button
          type="button"
          onClick={() => setSelected([])}
          disabled={saving || selected.length === 0}
          className="h-10 rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear All
        </button>

        <span className="ml-1 text-sm text-slate-500" aria-live="polite">
          {selected.length} selected
        </span>
      </div>

      <div className="mt-4 max-h-80 overflow-y-auto rounded-xl border border-slate-200">
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No customers found.
          </div>
        ) : (
          filtered.map((customer) => {
            const isSelected = selected.includes(customer.id);

            return (
              <label
                key={customer.id}
                className={`flex cursor-pointer items-center gap-4 border-b border-slate-200 px-4 py-3.5 transition last:border-b-0 ${
                  isSelected ? "bg-green-50" : "hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(customer.id)}
                  disabled={saving}
                  className="h-5 w-5 shrink-0 cursor-pointer accent-green-600"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">
                    {customer.name || "Unnamed Customer"}
                  </p>

                  <p className="text-sm text-slate-500">
                    {customer.phone ? formatPhone(customer.phone) : "No phone number"}
                  </p>
                </div>
              </label>
            );
          })
        )}
      </div>

      <CustomerModalFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className={secondaryButtonClass}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className={primaryButtonClass}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </CustomerModalFooter>
    </CustomerModal>
  );
}

export default ServiceCustomersModal;