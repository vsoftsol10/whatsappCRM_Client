import { useState } from "react";
import toast from "react-hot-toast";
import TicketFields from "./TicketFields";
import {
  CustomerModal,
  CustomerModalFooter,
  primaryButtonClass,
  secondaryButtonClass,
} from "../customers/CustomerForm";

// Create / edit a ticket.
//   mode     : "add" | "edit"
//   ticket   : the ticket being edited (edit only)
//   onSubmit : (payload) => Promise, throws when saving fails
function AddEditTicketModal({
  mode,
  ticket,
  customers,
  employees,
  onClose,
  onSubmit,
}) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    customerId: ticket?.customer?.id || ticket?.customerId || "",
    assignedToId: ticket?.assignedToId || "",
    title: ticket?.title || "",
    priority: ticket?.priority || "MEDIUM",
    description: ticket?.description || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // The saved customer / employee must stay selectable even when they
  // are missing from the lists (e.g. an employee who is now inactive).
  const customerOptions =
    ticket?.customer && !customers.some((c) => c.id === ticket.customer.id)
      ? [ticket.customer, ...customers]
      : customers;

  const employeeOptions =
    ticket?.assignedTo && !employees.some((e) => e.id === ticket.assignedTo.id)
      ? [ticket.assignedTo, ...employees]
      : employees;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next = {};

    if (!form.customerId) {
      next.customerId = "Please select a customer";
    }

    if (!form.assignedToId) {
      next.assignedToId = "Please assign an employee";
    }

    if (!form.title.trim()) {
      next.title = "Ticket title is required";
    } else if (form.title.trim().length < 3) {
      next.title = "Ticket title must be at least 3 characters";
    }

    if (!form.priority) {
      next.priority = "Priority is required";
    }

    if (!form.description.trim()) {
      next.description = "Description is required";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving || !validate()) return;

    // The backend can't change a ticket's customer, and status is
    // changed from the table, so neither is sent when editing.
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      assignedToId: form.assignedToId,
      ...(isEdit ? {} : { customerId: form.customerId }),
    };

    try {
      setSaving(true);

      await onSubmit(payload);

      onClose();

      // Success message (shown AFTER the popup is closed)
      toast.success(
        isEdit ? "Ticket updated successfully!" : "Ticket created successfully!"
      );
    } catch (error) {
      console.error("Save ticket error:", error);

      // 403 is already handled by the apiClient interceptor
      if (error?.response?.status === 403) {
        setSaving(false);
        onClose();
        return;
      }

      toast.error(
        error?.response?.data?.message ||
          (isEdit ? "Failed to update ticket" : "Failed to create ticket")
      );

      setSaving(false);
    }
  };

  return (
    <CustomerModal
      title={isEdit ? "Edit Ticket" : "Create Ticket"}
      onClose={onClose}
      closeDisabled={saving}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} noValidate>
        <TicketFields
          values={form}
          errors={errors}
          onChange={handleChange}
          customers={customerOptions}
          employees={employeeOptions}
          disabled={saving}
          customerLocked={isEdit}
        />

        <CustomerModalFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={secondaryButtonClass}
          >
            Cancel
          </button>

          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Create Ticket"
            )}
          </button>
        </CustomerModalFooter>
      </form>
    </CustomerModal>
  );
}

export default AddEditTicketModal;
