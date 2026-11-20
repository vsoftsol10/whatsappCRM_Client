import { useState, useEffect } from "react";

import useLeadStore from "../../store/leadStore";

import toast from "react-hot-toast";

import { addLeadWorkNote } from "../../api/leadApi";

import AddWorkNote from "../common/AddWorkNote";

import {
  CustomerModal,
  CustomerModalFooter,
  primaryButtonClass,
  secondaryButtonClass,
} from "../customers/CustomerForm";
import LeadFields from "./LeadFields";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "",
  requirements: "",
  status: "NEW",
  assignedToId: "",
};

export default function EditLeadModal({
  isOpen,
  onClose,
  lead,
  employees = [],
}) {
  const { editLead } = useLeadStore();

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [errors, setErrors] = useState({});

  const [isUpdating, setIsUpdating] = useState(false);

  // =========================
  // FILL THE FORM WHEN A LEAD IS SELECTED
  // =========================

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        source: lead.source || "",
        requirements: lead.requirements || "",
        status: lead.status || "NEW",
        assignedToId: lead.assignedToId || "",
      });

      setErrors({});
      setIsUpdating(false);
    }
  }, [lead]);

  // Leads captured from Instagram / Messenger may not have an email,
  // phone or requirements yet, so those fields are optional for them.
  const isSocialLead =
    ["MESSENGER", "INSTAGRAM"].includes(lead?.channel) ||
    /messenger|instagram|facebook/i.test(lead?.source || "");

  // =========================
  // VALIDATION
  // =========================

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      if (!isSocialLead) {
        newErrors.email = "Email is required";
      }
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
        formData.email.trim()
      )
    ) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.phone.trim()) {
      if (!isSocialLead) {
        newErrors.phone = "Phone number is required";
      }
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone =
        "Enter a valid 10-digit Indian phone number";
    }

    if (!formData.source.trim()) {
      newErrors.source = "Source is required";
    }

    if (!formData.requirements.trim() && !isSocialLead) {
      newErrors.requirements =
        "Requirements are required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // =========================
  // HANDLERS
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isUpdating) return;

    if (!validateForm()) {
      return;
    }

    try {
      setIsUpdating(true);

      await editLead(lead.id, formData);

      setFormData(EMPTY_FORM);

      setErrors({});

      onClose();

      toast.success("Lead updated successfully");
    } catch (error) {
      console.error(error);

      if (error?.response?.status === 403) {
        setIsUpdating(false);
        onClose();
        return;
      }

      toast.error(
        error?.response?.data?.message ||
        "Failed to update lead"
      );

      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <CustomerModal
      title="Edit Lead"
      onClose={onClose}
      closeDisabled={isUpdating}
    >
      <form onSubmit={handleSubmit} noValidate>
        <LeadFields
          values={formData}
          errors={errors}
          onChange={handleChange}
          employees={employees}
          currentAssignee={lead?.assignedTo}
          disabled={isUpdating}
          emailRequired={!isSocialLead}
          phoneRequired={!isSocialLead}
          requirementsRequired={!isSocialLead}
          phoneMaxLength={10}
        />

        {/* Work note */}
        {lead?.id && !isUpdating && (
          <div className="mt-6 border-t border-slate-100 pt-6">
            <AddWorkNote
              entityId={lead.id}
              addNote={addLeadWorkNote}
            />
          </div>
        )}

        <CustomerModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className={secondaryButtonClass}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isUpdating}
            className={primaryButtonClass}
          >
            {isUpdating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Updating...
              </>
            ) : (
              "Update Lead"
            )}
          </button>
        </CustomerModalFooter>
      </form>
    </CustomerModal>
  );
}
