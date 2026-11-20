import { useState } from "react";
import toast from "react-hot-toast";
import { createCustomer } from "../api/customerApi";
import {
  CustomerModal,
  CustomerFields,
  CustomerModalFooter,
  primaryButtonClass,
  secondaryButtonClass,
} from "../components/customers/CustomerForm";

function AddCustomer({ onClose, onSuccess }) {
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
  const [loading, setLoading] = useState(false);

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

    // Prevent double click / duplicate request
    if (loading) return;

    // Validate
    if (!validateForm()) return;

    try {
      // Start loading
      setLoading(true);

      // Create customer
      await createCustomer({
        ...formData,
        phone: formData.phone.trim(),
      });

      // Refresh customer list
      if (onSuccess) {
        await onSuccess();
      }

      // Close modal automatically
      onClose();

      // Success message (shown AFTER the popup is closed)
      toast.success("Customer created successfully!");
    } catch (error) {
      console.error("Create customer error:", error);

      // 403 errors are already handled by apiClient interceptor
      if (error?.response?.status === 403) {
        setLoading(false);

        // Automatically close the modal
        onClose();

        return;
      }

      // Handle other errors normally
      toast.error(
        error?.response?.data?.message || "Failed to create customer"
      );

      // Allow user to try again
      setLoading(false);
    }
  };

  return (
    <CustomerModal
      title="Add Customer"
      onClose={onClose}
      closeDisabled={loading}
    >
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
                Creating...
              </>
            ) : (
              "Create Customer"
            )}
          </button>
        </CustomerModalFooter>
      </form>
    </CustomerModal>
  );
}

export default AddCustomer;