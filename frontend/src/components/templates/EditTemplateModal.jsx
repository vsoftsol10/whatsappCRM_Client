import { useEffect, useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import useTemplateStore from "../../store/templateStore";

export default function EditTemplateModal({
  isOpen,
  onClose,
  template,
}) {
  const { editTemplate } = useTemplateStore();

  // ==================================================
  // FORM STATE
  // ==================================================

  const [formData, setFormData] = useState({
    name: "",
    category: "MARKETING",
    messageType: "TEXT",
    language: "en_US",
    purpose: "CUSTOM",
    headerType: "NONE",
    headerContent: "",
    content: "",
    footerContent: "",
  });

  const [errors, setErrors] = useState({});
  const [updating, setUpdating] = useState(false);

  // ==================================================
  // LOAD TEMPLATE
  // ==================================================

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        category: template.category || "MARKETING",
        messageType: template.messageType || "TEXT",
        language: template.language || "en_US",
        purpose: template.purpose || "CUSTOM",
        headerType: template.headerType || "NONE",
        headerContent: template.headerContent || "",
        content: template.content || "",
        footerContent: template.footerContent || "",
      });

      setErrors({});
    }
  }, [template]);

  if (!isOpen || !template) {
    return null;
  }

  // ==================================================
  // DRAFT OR REJECTED CAN BE EDITED
  // ==================================================
  // Matches backend: updateTemplate blocks only
  // APPROVED / PENDING statuses.

  const isDraft = template.status === "DRAFT";
  const isRejected = template.status === "REJECTED";
  const isEditable = isDraft || isRejected;

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

    if (!formData.language) {
      newErrors.language = "Language is required";
    }

    if (!formData.purpose) {
      newErrors.purpose = "Purpose is required";
    }

    if (
      formData.headerType !== "NONE" &&
      !formData.headerContent.trim()
    ) {
      newErrors.headerContent = "Header content is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Template content is required";
    } else if (formData.content.trim().length < 10) {
      newErrors.content =
        "Template content must be at least 10 characters";
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

    if (updating) {
      return;
    }

    if (!isEditable) {
      toast.error(
        "Only draft or rejected templates can be edited."
      );

      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setUpdating(true);

      /*
       * IMPORTANT
       *
       * We intentionally DO NOT send status.
       *
       * Backend controls the template status.
       *
       * Example:
       *
       * DRAFT / REJECTED
       *   ↓
       * Edit + Submit for approval
       *   ↓
       * PENDING
       *
       * Once PENDING or APPROVED, the template cannot
       * be edited (enforced by the backend too).
       */

      await editTemplate(template.id, {
        name: formData.name.trim(),
        category: formData.category,
        messageType: formData.messageType,
        language: formData.language,
        purpose: formData.purpose,
        headerType: formData.headerType,
        headerContent:
          formData.headerType !== "NONE"
            ? formData.headerContent.trim()
            : null,
        content: formData.content.trim(),
        footerContent: formData.footerContent.trim() || null,
      });

      toast.success("Template updated successfully!");

      setErrors({});

      onClose();
    } catch (error) {
      console.error("Failed to update template:", error);

      if (error?.response?.status !== 403) {
        toast.error(
          error?.response?.data?.message ||
            "Failed to update template."
        );
      }

      setUpdating(false);
    }
  };

  // ==================================================
  // CLOSE MODAL
  // ==================================================

  const handleClose = () => {
    if (updating) {
      return;
    }

    onClose();
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
      <div className="flex min-h-screen items-center justify-center p-3 sm:p-4">

        <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex items-center justify-between gap-4 bg-[#25D366] px-5 py-4 sm:px-6 sm:py-5">

            <div>
              <h2 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
                Edit Template
              </h2>

              <p className="mt-1 text-sm text-gray-700">
                Update your template before submitting
                it to Meta for approval.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={updating}
              className="rounded-full p-2 transition hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={22} />
            </button>

          </div>

          {/* ==================================================
              REJECTION REASON (shown for REJECTED templates)
          ================================================== */}

          {isRejected && template.rejectionReason && (
            <div className="mx-5 mt-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 sm:mx-6">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-500"
              />
              <div>
                <p className="font-semibold text-red-800">
                  Rejected by Meta
                </p>
                <p className="mt-1 text-sm text-red-700">
                  {template.rejectionReason}
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Fix the issue above and resubmit.
                </p>
              </div>
            </div>
          )}

          {/* ==================================================
              LOCKED WARNING (PENDING / APPROVED / PAUSED / DISABLED)
          ================================================== */}

          {!isEditable && (
            <div className="mx-5 mt-5 rounded-lg border border-yellow-200 bg-yellow-50 p-4 sm:mx-6">

              <p className="font-semibold text-yellow-800">
                Template is {template.status}
              </p>

              <p className="mt-1 text-sm text-yellow-700">
                This template cannot be edited because it has
                already been submitted for Meta approval.
              </p>

            </div>
          )}

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
                placeholder="Example: order_confirmation"
                value={formData.name}
                onChange={handleChange}
                disabled={updating || !isEditable}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.name
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
                CATEGORY (Meta only accepts these 3)
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
                disabled={updating || !isEditable}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.category
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                } disabled:cursor-not-allowed disabled:bg-gray-100`}
              >
                <option value="MARKETING">
                  Marketing
                </option>

                <option value="UTILITY">
                  Utility
                </option>

                <option value="AUTHENTICATION">
                  Authentication
                </option>
              </select>

              <p className="mt-1 text-xs text-gray-500">
                This classification is used for Meta WhatsApp
                templates.
              </p>

              {errors.category && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.category}
                </p>
              )}
            </div>

            {/* ==================================================
                PURPOSE
            ================================================== */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Purpose{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                disabled={updating || !isEditable}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.purpose
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                } disabled:cursor-not-allowed disabled:bg-gray-100`}
              >
                <option value="WELCOME">
                  Welcome
                </option>

                <option value="ORDER_CONFIRMATION">
                  Order Confirmation
                </option>

                <option value="ORDER_UPDATE">
                  Order Update
                </option>

                <option value="PAYMENT_REMINDER">
                  Payment Reminder
                </option>

                <option value="APPOINTMENT_REMINDER">
                  Appointment Reminder
                </option>

                <option value="SUPPORT_FOLLOW_UP">
                  Support Follow-up
                </option>

                <option value="FESTIVAL_GREETING">
                  Festival Greeting
                </option>

                <option value="PROMOTION">
                  Promotion
                </option>

                <option value="CUSTOM">
                  Custom
                </option>
              </select>

              {errors.purpose && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.purpose}
                </p>
              )}
            </div>

            {/* ==================================================
                LANGUAGE
            ================================================== */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Language{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                disabled={updating || !isEditable}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.language
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                } disabled:cursor-not-allowed disabled:bg-gray-100`}
              >
                <option value="en_US">
                  English (US)
                </option>

                <option value="en_GB">
                  English (UK)
                </option>

                <option value="ta">
                  Tamil
                </option>

                <option value="hi">
                  Hindi
                </option>
              </select>

              {errors.language && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.language}
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
                disabled={updating || !isEditable}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.messageType
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
                HEADER
            ================================================== */}

            <div className="border-t pt-5">
              <label className="mb-2 block font-medium text-gray-700">
                Header Type
              </label>

              <select
                name="headerType"
                value={formData.headerType}
                onChange={handleChange}
                disabled={updating || !isEditable}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#25D366] disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="NONE">No Header</option>
                <option value="TEXT">Text</option>
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="DOCUMENT">Document</option>
              </select>

              {formData.headerType !== "NONE" && (
                <div className="mt-4">
                  <label className="mb-2 block font-medium text-gray-700">
                    Header Content{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="headerContent"
                    value={formData.headerContent}
                    onChange={handleChange}
                    disabled={updating || !isEditable}
                    placeholder={
                      formData.headerType === "TEXT"
                        ? "Enter header text"
                        : `Enter ${formData.headerType.toLowerCase()} reference`
                    }
                    className={`w-full rounded-lg border px-4 py-3 outline-none ${
                      errors.headerContent
                        ? "border-red-500"
                        : "border-gray-300 focus:border-[#25D366]"
                    } disabled:cursor-not-allowed disabled:bg-gray-100`}
                  />

                  {errors.headerContent && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.headerContent}
                    </p>
                  )}
                </div>
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
                rows="7"
                name="content"
                placeholder={`Hello {{1}},

Your order {{2}} has been confirmed.

Thank you for shopping with us.`}
                value={formData.content}
                onChange={handleChange}
                disabled={updating || !isEditable}
                className={`w-full resize-none rounded-lg border px-4 py-3 outline-none ${
                  errors.content
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                } disabled:cursor-not-allowed disabled:bg-gray-100`}
              />

              <p className="mt-2 text-xs text-gray-500">
                Use variables such as {"{{1}}"}, {"{{2}}"} and
                {" {{3}}"} for dynamic customer information.
              </p>

              {errors.content && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.content}
                </p>
              )}
            </div>

            {/* ==================================================
                FOOTER
            ================================================== */}

            <div className="border-t pt-5">
              <label className="mb-2 block font-medium text-gray-700">
                Footer
              </label>

              <input
                type="text"
                name="footerContent"
                value={formData.footerContent}
                onChange={handleChange}
                disabled={updating || !isEditable}
                placeholder="Example: Thank you for choosing us."
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#25D366] disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            {/* ==================================================
                STATUS INFORMATION
            ================================================== */}

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">

              <p className="font-semibold text-blue-800">
                Current Status
              </p>

              <div className="mt-2 flex items-center gap-2">

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    template.status === "DRAFT"
                      ? "bg-gray-200 text-gray-700"
                      : template.status === "PENDING"
                      ? "bg-yellow-200 text-yellow-800"
                      : template.status === "APPROVED"
                      ? "bg-green-200 text-green-800"
                      : template.status === "REJECTED"
                      ? "bg-red-200 text-red-800"
                      : template.status === "PAUSED"
                      ? "bg-orange-200 text-orange-800"
                      : template.status === "DISABLED"
                      ? "bg-red-200 text-red-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {template.status}
                </span>

              </div>

              <p className="mt-2 text-sm text-blue-700">
                Status is managed by the system and Meta
                approval process. It cannot be changed manually.
              </p>

            </div>

            {/* ==================================================
                ACTION BUTTONS
            ================================================== */}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">

              {/* CANCEL */}

              <button
                type="button"
                onClick={handleClose}
                disabled={updating}
                className="crm-secondary-button disabled:cursor-not-allowed disabled:opacity-50"
              >
                Close
              </button>

              {/* UPDATE */}

              {isEditable && (
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
              )}

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}