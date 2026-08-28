

import { useState } from "react";
import { X } from "lucide-react";

import { addTicketWorkNote } from "../../api/ticketApi";
import AddWorkNote from "../common/AddWorkNote";

function AddEditTicketModal({
  form,
  setForm,
  customers,
  employees,
  loading,
  isEditing,
  setShowForm,
  handleSubmit,
}) {
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!form.customerId) {
      newErrors.customerId = "Please select a customer";
    }

    if (!form.title.trim()) {
      newErrors.title = "Ticket title is required";
    } else if (form.title.trim().length < 3) {
      newErrors.title =
        "Ticket title must be at least 3 characters";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!form.priority) {
      newErrors.priority = "Priority is required";
    }

    if (!form.assignedToId) {
      newErrors.assignedToId =
        "Please assign an employee";
    }

    if (isEditing && !form.status) {
      newErrors.status = "Status is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setForm({
      ...form,
      [field]: value,
    });

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    handleSubmit(e);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 bg-[#25D366] px-5 py-4 sm:px-6 sm:py-5">
            <h2 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
              {isEditing ? "Edit Ticket" : "Create Ticket"}
            </h2>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-2 rounded-full hover:bg-[#128C7E] transition"
            >
              <X size={22} />
            </button>
          </div>

          <form
            onSubmit={onSubmit}
            className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6"
          >
            {/* Customer */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Customer <span className="text-red-500">*</span>
              </label>

              <select
                value={form.customerId}
                disabled={isEditing}
                onChange={(e) =>
                  handleChange("customerId", e.target.value)
                }
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.customerId
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                }`}
              >
                <option value="">
                  Select Customer
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name}
                  </option>
                ))}
              </select>

              {errors.customerId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.customerId}
                </p>
              )}
            </div>

            {/* Assign Employee */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Assign Employee <span className="text-red-500">*</span>
              </label>

              <select
                value={form.assignedToId}
                onChange={(e) =>
                  handleChange(
                    "assignedToId",
                    e.target.value
                  )
                }
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.assignedToId
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                }`}
              >
                <option value="">
                  Select Employee
                </option>

                {employees.map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name}
                  </option>
                ))}
              </select>

              {errors.assignedToId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.assignedToId}
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Title <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  handleChange("title", e.target.value)
                }
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.title
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                }`}
                placeholder="Ticket title"
              />

              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>

              <textarea
                rows="5"
                value={form.description}
                onChange={(e) =>
                  handleChange(
                    "description",
                    e.target.value
                  )
                }
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.description
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                }`}
                placeholder="Describe the issue"
              />

              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Priority <span className="text-red-500">*</span>
              </label>

              <select
                value={form.priority}
                onChange={(e) =>
                  handleChange(
                    "priority",
                    e.target.value
                  )
                }
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.priority
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                }`}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>

              {errors.priority && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.priority}
                </p>
              )}
            </div>

            {/* Status */}
            {isEditing && (
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    handleChange("status", e.target.value)
                  }
                  className={`w-full rounded-lg border px-4 py-3 outline-none ${
                    errors.status
                      ? "border-red-500"
                      : "border-gray-300 focus:border-[#25D366]"
                  }`}
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">
                    IN PROGRESS
                  </option>
                  <option value="RESOLVED">
                    RESOLVED
                  </option>
                  <option value="CLOSED">
                    CLOSED
                  </option>
                </select>

                {errors.status && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.status}
                  </p>
                )}
              </div>
            )}

            {/* WORK NOTE */}
            {isEditing && form.id && (
              <div className="border-t pt-4">
                <AddWorkNote
                  entityId={form.id}
                  addNote={addTicketWorkNote}
                />
              </div>
            )}

            {/* Buttons */}
            <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="crm-secondary-button"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="crm-primary-button"
              >
                {loading
                  ? "Saving..."
                  : isEditing
                  ? "Update Ticket"
                  : "Create Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddEditTicketModal;