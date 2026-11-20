import { useId, useState } from "react";
import { Pencil, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { createService, updateService } from "../../api/serviceApi";
import {
  CustomerModal,
  CustomerModalFooter,
  primaryButtonClass,
  secondaryButtonClass,
} from "../customers/CustomerForm";

const inputBase =
  "w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400";

// One modal for all three modes: add, edit and view (read-only).
function ServiceFormModal({ mode, service, onClose, onSaved, onEdit }) {
  const uid = useId();
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const [name, setName] = useState(service?.name || "");
  const [description, setDescription] = useState(service?.description || "");
  const [isActive, setIsActive] = useState(service ? service.isActive : true);
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);

  const title = isView ? "View Service" : isEdit ? "Edit Service" : "Add Service";

  const fieldClass = (hasError) =>
    isView
      ? `${inputBase} cursor-default border-slate-200 bg-slate-50`
      : `${inputBase} disabled:cursor-not-allowed disabled:bg-slate-50 ${
          hasError
            ? "border-red-400 focus:ring-2 focus:ring-red-100"
            : "border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
        }`;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    if (!name.trim()) {
      setNameError("Service name is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        description: description.trim(),
        isActive,
      };

      let saved;

      if (isEdit) {
        const result = await updateService(service.id, payload);
        saved = result.service;
      } else {
        const result = await createService(payload);
        saved = result.service;

        // The create endpoint always starts a service as active,
        // so an "Inactive" choice is applied right after it.
        if (!isActive) {
          try {
            await updateService(saved.id, { isActive: false });
          } catch (statusError) {
            console.error("Set inactive after create failed:", statusError);

            toast.error(
              "Service created, but it could not be set to inactive. Use the status switch to change it."
            );
          }
        }
      }

      await onSaved(saved);
      onClose();

      // Success message (shown AFTER the popup is closed)
      toast.success(
        isEdit ? "Service updated successfully!" : "Service created successfully!"
      );
    } catch (err) {
      console.error("Save service error:", err);

      // 403 is already handled by the apiClient interceptor
      if (err?.response?.status === 403) {
        setSaving(false);
        onClose();
        return;
      }

      const message = err?.response?.data?.message || "Failed to save service";

      // Duplicate name: show it under the field instead of a toast
      if (/already exists/i.test(message)) {
        setNameError(message);
      } else {
        toast.error(message);
      }

      setSaving(false);
    }
  };

  const content = (
    <>
      <div className="space-y-5">
        <div>
          <label
            htmlFor={`${uid}-name`}
            className="mb-1.5 block text-sm font-medium text-slate-800"
          >
            Service Name
            {!isView && <span className="ml-0.5 text-red-500">*</span>}
          </label>

          <input
            id={`${uid}-name`}
            type="text"
            value={name}
            maxLength={100}
            readOnly={isView}
            disabled={saving}
            onChange={(e) => {
              setName(e.target.value);
              setNameError("");
            }}
            placeholder="e.g. Web Design, Yoga, Insurance"
            className={`${fieldClass(!!nameError)} h-11`}
          />

          {nameError && (
            <p role="alert" className="mt-1 text-xs text-red-500">
              {nameError}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor={`${uid}-description`}
            className="mb-1.5 block text-sm font-medium text-slate-800"
          >
            Description (optional)
          </label>

          <textarea
            id={`${uid}-description`}
            rows={4}
            value={description}
            maxLength={500}
            readOnly={isView}
            disabled={saving}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of this service"
            className={`${fieldClass(false)} resize-none py-3`}
          />
        </div>

        {/* Status is only shown when viewing or editing; a new service always starts Active */}
        {(isView || isEdit) && (
          <div>
            <label
              htmlFor={`${uid}-status`}
              className="mb-1.5 block text-sm font-medium text-slate-800"
            >
              Status
              {!isView && <span className="ml-0.5 text-red-500">*</span>}
            </label>

            <div className="relative">
              <select
                id={`${uid}-status`}
                value={isActive ? "ACTIVE" : "INACTIVE"}
                disabled={saving || isView}
                onChange={(e) => setIsActive(e.target.value === "ACTIVE")}
                className={`${fieldClass(false)} h-11 appearance-none pr-10 disabled:opacity-100 ${
                  isView ? "disabled:text-slate-900" : ""
                }`}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>

              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>

            {!isView && (
              <p className="mt-1.5 text-xs text-slate-500">
                Inactive services are hidden from new customer forms and campaign
                filters, but existing customers keep the tag.
              </p>
            )}
          </div>
        )}
      </div>

      <CustomerModalFooter>
        {isView ? (
          <button
            type="button"
            onClick={onClose}
            className={secondaryButtonClass}
          >
            Close
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={secondaryButtonClass}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className={primaryButtonClass}
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {isEdit ? "Saving..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Service"
              )}
            </button>
          </>
        )}
      </CustomerModalFooter>
    </>
  );

  return (
    <CustomerModal
      title={title}
      onClose={onClose}
      closeDisabled={saving}
      maxWidth="max-w-xl"
      action={
        isView && onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-green-500 bg-green-50 px-5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
          >
            <Pencil size={16} />
            Edit
          </button>
        ) : null
      }
    >
      {isView ? content : <form onSubmit={handleSubmit} noValidate>{content}</form>}
    </CustomerModal>
  );
}

export default ServiceFormModal;