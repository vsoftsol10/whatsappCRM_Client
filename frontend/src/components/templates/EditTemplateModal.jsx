import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import useTemplateStore from "../../store/templateStore";

export default function EditTemplateModal({
  isOpen,
  onClose,
  template,
}) {
  const { editTemplate } = useTemplateStore();

  const [formData, setFormData] = useState({
    name: "",
    category: "MARKETING",
    messageType: "TEXT",
    content: "",
    status: "DRAFT",
  });

  const [errors, setErrors] = useState({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        category: template.category || "MARKETING",
        messageType: template.messageType || "TEXT",
        content: template.content || "",
        status: template.status || "DRAFT",
      });

      setErrors({});
    }
  }, [template]);

  if (!isOpen) return null;

  // ==================================================
  // VALIDATION
  // ==================================================

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Template name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name =
        "Template name must be at least 3 characters";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.messageType) {
      newErrors.messageType = "Message type is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Template content is required";
    } else if (formData.content.trim().length < 10) {
      newErrors.content =
        "Template content must be at least 10 characters";
    }

    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ==================================================
  // HANDLE CHANGE
  // ==================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts correcting the field
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ==================================================
  // HANDLE SUBMIT
  // ==================================================

const handleSubmit = async (e) => {
  e.preventDefault();

  // Prevent duplicate submission
  if (updating) return;

  // Validate only when Update Template is clicked
  if (!validateForm()) {
    return;
  }

  try {
    // Immediately disable button
    setUpdating(true);

    await editTemplate(template.id, formData);

    toast.success("Template updated successfully!");

    // Reset form
    setFormData({
      name: "",
      category: "MARKETING",
      messageType: "TEXT",
      content: "",
      status: "DRAFT",
    });

    setErrors({});

    // Close modal after successful update
    onClose();

  } catch (error) {
    console.error("Failed to update template:", error);

    // Do NOT show another toast here.
    // apiClient already shows the 403 message.

    setUpdating(false);

    onClose();
  }
};

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex items-center justify-between gap-4 bg-[#25D366] px-5 py-4 sm:px-6 sm:py-5">

            <h2 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
              Edit Template
            </h2>

            <button
              type="button"
              onClick={onClose}
              disabled={updating}
              className="rounded-full p-2 transition hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={22} />
            </button>

          </div>

          {/* ==================================================
              FORM
          ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="max-h-[75vh] space-y-5 overflow-y-auto p-5 sm:p-6"
          >

            {/* ==================================================
                NAME
            ================================================== */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Template Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter template name"
                value={formData.name}
                onChange={handleChange}
                disabled={updating}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.name
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } disabled:cursor-not-allowed disabled:bg-gray-100`}
              />

              {errors.name && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.name}
                </p>
              )}
            </div>

            {/* ==================================================
                CATEGORY
            ================================================== */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Category{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={updating}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.category
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } disabled:cursor-not-allowed disabled:bg-gray-100`}
              >
                <option value="MARKETING">
                  Marketing
                </option>

                <option value="SUPPORT">
                  Support
                </option>

                <option value="SALES">
                  Sales
                </option>

                <option value="UTILITY">
                  Utility
                </option>

                <option value="AUTHENTICATION">
                  Authentication
                </option>
              </select>

              {errors.category && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.category}
                </p>
              )}
            </div>

            {/* ==================================================
                MESSAGE TYPE
            ================================================== */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Message Type{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="messageType"
                value={formData.messageType}
                onChange={handleChange}
                disabled={updating}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.messageType
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } disabled:cursor-not-allowed disabled:bg-gray-100`}
              >
                <option value="TEXT">
                  Text
                </option>

                <option value="IMAGE">
                  Image
                </option>

                <option value="VIDEO">
                  Video
                </option>

                <option value="DOCUMENT">
                  Document
                </option>
              </select>

              {errors.messageType && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.messageType}
                </p>
              )}
            </div>

            {/* ==================================================
                CONTENT
            ================================================== */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Template Content{" "}
                <span className="text-red-500">*</span>
              </label>

              <textarea
                rows="5"
                name="content"
                placeholder="Enter template content"
                value={formData.content}
                onChange={handleChange}
                disabled={updating}
                className={`w-full resize-none rounded-lg border px-4 py-3 outline-none ${errors.content
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } disabled:cursor-not-allowed disabled:bg-gray-100`}
              />

              {errors.content && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.content}
                </p>
              )}
            </div>

            {/* ==================================================
                STATUS
            ================================================== */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Status{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={updating}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.status
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } disabled:cursor-not-allowed disabled:bg-gray-100`}
              >
                <option value="DRAFT">
                  Draft
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>

              {errors.status && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.status}
                </p>
              )}
            </div>

            {/* ==================================================
                ACTION BUTTONS
            ================================================== */}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">

              {/* Cancel */}
              <button
                type="button"
                onClick={onClose}
                disabled={updating}
                className="crm-secondary-button disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              {/* Update */}
              <button
                type="submit"
                disabled={updating}
                className="crm-primary-button flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {updating ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Updating...
                  </>
                ) : (
                  "Update Template"
                )}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}