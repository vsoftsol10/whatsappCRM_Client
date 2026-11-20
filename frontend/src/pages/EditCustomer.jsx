import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getCustomerById, updateCustomer } from "../api/customerApi";
import { toLocalPhone } from "../utils/customerFormat";
import {
  CustomerModal,
  CustomerFields,
  CustomerModalFooter,
  primaryButtonClass,
  secondaryButtonClass,
} from "../components/customers/CustomerForm";

function EditCustomer({ customerId, onClose, onSuccess }) {
  const id = customerId;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    source: "",
    requirements: "",
    status: "ACTIVE",
    serviceIds: [], // optional
  });

  const [errors, setErrors] = useState({});

  // Saving
  const [loading, setLoading] = useState(false);

  // Loading customer data
  const [fetchingCustomer, setFetchingCustomer] = useState(true);

  // =========================
  // FETCH CUSTOMER
  // =========================

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setFetchingCustomer(true);

        const data = await getCustomerById(id);
        const customer = data.customer;

        setFormData({
          name: customer.name || "",
          phone: toLocalPhone(customer.phone),
          email: customer.email || "",
          company: customer.companyName || "",
          source: customer.source || "",
          requirements: customer.requirements || "",
          status: customer.status || "ACTIVE",
          serviceIds: (customer.services || []).map((s) => s.id),
        });
      } catch (error) {
        console.error("Fetch customer error:", error);

        toast.error("Failed to fetch customer");
      } finally {
        setFetchingCustomer(false);
      }
    };

    if (id) {
      fetchCustomer();
    }
  }, [id]);

  // =========================
  // VALIDATION
  // =========================

  const validateForm = () => {
    const newErrors = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name = "Customer name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Customer name must be at least 3 characters";
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit Indian phone number";
    }

    // Email - optional
    if (
      formData.email.trim() &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())
    ) {
      newErrors.email = "Enter a valid email address";
    }

    // Company
    if (!formData.company.trim()) {
      newErrors.company = "Company is required";
    }

    // Status
    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================
  // HANDLE CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double click
    if (loading) return;

    // Validate
    if (!validateForm()) return;

    try {
      // Start loading
      setLoading(true);

      // Update customer
      await updateCustomer(id, {
        ...formData,
        phone: formData.phone.trim(),
      });

      // Refresh customer list
      if (onSuccess) {
        await onSuccess();
      }

      // Close automatically
      onClose();

      // Success message (shown AFTER the popup is closed)
      toast.success("Customer updated successfully!");
    } catch (error) {
      console.error("Update customer error:", error);

      // 403 errors are already handled by apiClient interceptor
      if (error?.response?.status === 403) {
        setLoading(false);

        // Automatically close the modal
        onClose();

        return;
      }

      // Handle other errors normally
      toast.error(
        error?.response?.data?.message || "Failed to update customer"
      );

      // Allow retry
      setLoading(false);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <CustomerModal
      title="Edit Customer"
      onClose={onClose}
      closeDisabled={loading}
    >
      {fetchingCustomer ? (
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          <span>Loading customer...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <CustomerFields
            values={formData}
            errors={errors}
            onChange={handleChange}
            onServicesChange={(ids) =>
              setFormData((prev) => ({ ...prev, serviceIds: ids }))
            }
            disabled={loading}
          />

          <CustomerModalFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={secondaryButtonClass}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={primaryButtonClass}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                "Update Customer"
              )}
            </button>
          </CustomerModalFooter>
        </form>
      )}
    </CustomerModal>
  );
}

export default EditCustomer;