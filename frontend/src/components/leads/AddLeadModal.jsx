import { useState } from "react";
import useLeadStore from "../../store/leadStore";
import toast from "react-hot-toast";

import {
  CustomerModal,
  CustomerModalFooter,
  primaryButtonClass,
  secondaryButtonClass,
} from "../customers/CustomerForm";
import LeadFields from "./LeadFields";

export default function AddLeadModal({
  isOpen,
  onClose,
  employees = [],
}) {
  const { addLead } = useLeadStore();

  const initialFormData = {
    name: "",
    email: "",
    phone: "",
    source: "",
    company: "",
    requirements: "",
    status: "NEW",
    assignedToId: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
        formData.email
      )
    ) {
      newErrors.email = "Enter a valid email address";
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone =
        "Enter a valid 10-digit Indian phone number";
    }

    // Source
    if (!formData.source.trim()) {
      newErrors.source = "Source is required";
    }

    // Requirements
    if (!formData.requirements.trim()) {
      newErrors.requirements = "Requirements are required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate request
    if (loading) return;

    // Validate
    if (!validateForm()) return;

    try {
      setLoading(true);

      await addLead(formData);

      // Reset form
      setFormData(initialFormData);
      setErrors({});

      // IMPORTANT: reset loading before closing
      setLoading(false);

      // Automatically close modal
      onClose();

      // Success message (shown AFTER the popup is closed)
      toast.success("Lead created successfully!");
    } catch (error) {
      console.error("Create lead error:", error);

      // 403 errors are already handled by apiClient interceptor
      if (error?.response?.status === 403) {
        setLoading(false);
        onClose();
        return;
      }
      // Other errors
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create lead"
      );

      // Allow user to try again
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <CustomerModal
      title="Add Lead"
      onClose={onClose}
      closeDisabled={loading}
    >
      <form onSubmit={handleSubmit} noValidate>
        <LeadFields
          values={formData}
          errors={errors}
          onChange={handleChange}
          employees={employees}
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
              "Save Lead"
            )}
          </button>
        </CustomerModalFooter>
      </form>
    </CustomerModal>
  );
}
