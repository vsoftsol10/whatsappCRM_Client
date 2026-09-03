

import { useState } from "react";
import {
  X,
  Sparkles,
  Loader2,
  CircleDollarSign,
  Package,
  CalendarDays,
  PartyPopper,
  Megaphone,
  Gift,
  HeartHandshake,
  Headset,
} from "lucide-react";

import useTemplateStore from "../../store/templateStore";
import toast from "react-hot-toast";

export default function CreateTemplateModal({
  isOpen,
  onClose,
}) {
  const { addTemplate, generateTemplate } = useTemplateStore();

  // ==================================================
  // FORM STATE
  // ==================================================

  const [formData, setFormData] = useState({
    name: "",
    category: "UTILITY",
    purpose: "CUSTOM",
    language: "en_US",

    headerType: "NONE",
    headerContent: "",

    content: "",
    footerContent: "",
  });

  // ==================================================
  // AI STATE
  // ==================================================

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("Professional");

  const [generating, setGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({});

  // ==================================================
  // QUICK TEMPLATES
  // ==================================================

  const quickTemplates = [
    {
      label: "Payment Reminder",
      icon: CircleDollarSign,
      purpose: "PAYMENT_REMINDER",
      category: "UTILITY",
    },
    {
      label: "Order Confirmation",
      icon: Package,
      purpose: "ORDER_CONFIRMATION",
      category: "UTILITY",
    },
    {
      label: "Appointment Reminder",
      icon: CalendarDays,
      purpose: "APPOINTMENT_REMINDER",
      category: "UTILITY",
    },
    {
      label: "Festival Wishes",
      icon: PartyPopper,
      purpose: "FESTIVAL_GREETING",
      category: "MARKETING",
    },
    {
      label: "Product Launch",
      icon: Megaphone,
      purpose: "PROMOTION",
      category: "MARKETING",
    },
    {
      label: "Offer Announcement",
      icon: Gift,
      purpose: "PROMOTION",
      category: "MARKETING",
    },
    {
      label: "Thank You Message",
      icon: HeartHandshake,
      purpose: "CUSTOM",
      category: "UTILITY",
    },
    {
      label: "Support Follow-up",
      icon: Headset,
      purpose: "SUPPORT_FOLLOW_UP",
      category: "UTILITY",
    },
  ];

  if (!isOpen) return null;

  // ==================================================
  // VALIDATION
  // ==================================================

  const validateForm = () => {
    const newErrors = {};

    // Template name
    if (!formData.name.trim()) {
      newErrors.name = "Template name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name =
        "Template name must be at least 3 characters";
    }

    // Category
    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    // Purpose
    if (!formData.purpose) {
      newErrors.purpose = "Purpose is required";
    }

    // Language
    if (!formData.language) {
      newErrors.language = "Language is required";
    }

    // Header
    if (
      formData.headerType !== "NONE" &&
      !formData.headerContent.trim()
    ) {
      newErrors.headerContent =
        "Header content is required";
    }

    // Body
    if (!formData.content.trim()) {
      newErrors.content = "Template body is required";
    } else if (formData.content.trim().length < 10) {
      newErrors.content =
        "Template body must be at least 10 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ==================================================
  // HANDLE INPUT CHANGE
  // ==================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Remove field error when user changes it
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ==================================================
  // QUICK TEMPLATE SELECT
  // ==================================================

  const handleQuickTemplate = (template) => {
    if (isSubmitting || generating) {
      return;
    }

    setAiPrompt(template.label);

    setFormData((prev) => ({
      ...prev,
      category: template.category,
      purpose: template.purpose,
    }));

    setErrors((prev) => ({
      ...prev,
      category: "",
      purpose: "",
    }));
  };

  // ==================================================
  // AI GENERATOR
  // ==================================================

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      return toast.error("Please enter a topic.");
    }

    if (isSubmitting) {
      return;
    }

    try {
      setGenerating(true);

      const content = await generateTemplate(
        aiPrompt,
        aiTone
      );

      setFormData((prev) => ({
        ...prev,
        content,
      }));

      setErrors((prev) => ({
        ...prev,
        content: "",
      }));

      toast.success(
        "Template generated successfully."
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to generate template."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ==================================================
  // RESET FORM
  // ==================================================

  const resetForm = () => {
    setFormData({
      name: "",
      category: "UTILITY",
      purpose: "CUSTOM",
      language: "en_US",

      headerType: "NONE",
      headerContent: "",

      content: "",
      footerContent: "",
    });

    setAiPrompt("");
    setAiTone("Professional");

    setErrors({});

    setGenerating(false);
    setIsSubmitting(false);
  };

  // ==================================================
  // HANDLE SUBMIT
  // ==================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate API requests
    if (isSubmitting) {
      return;
    }

    // Don't submit while AI is generating
    if (generating) {
      toast.error(
        "Please wait until AI generation is complete."
      );
      return;
    }

    // Validate
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      /*
       * IMPORTANT:
       *
       * Status is intentionally NOT sent from the UI.
       *
       * Backend should create the template with:
       *
       * status: "DRAFT"
       *
       * companyId and createdById should also come
       * from the authenticated user on the backend.
       */

      await addTemplate(formData);

      toast.success(
        "Template saved as draft successfully!"
      );

      resetForm();

      onClose();
    } catch (error) {
      console.error(
        "Failed to create template:",
        error
      );

      // 403 errors are already handled by apiClient
      // interceptor
      if (error?.response?.status === 403) {
        setIsSubmitting(false);

        onClose();

        return;
      }

      toast.error(
        error?.response?.data?.message ||
          "Failed to save template!"
      );

      setIsSubmitting(false);
    }
  };

  // ==================================================
  // CLOSE MODAL
  // ==================================================

  const handleClose = () => {
    // Don't close while submitting
    if (isSubmitting) {
      return;
    }

    // Don't close while AI is generating
    if (generating) {
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

        <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex items-center justify-between gap-4 bg-[#25D366] px-5 py-4 sm:px-6 sm:py-5">

            <div>
              <h2 className="break-words text-xl font-bold text-gray-800 sm:text-2xl">
                Create WhatsApp Template
              </h2>

              <p className="mt-1 text-sm text-gray-700">
                Create a template that can later be
                submitted to Meta for approval.
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || generating}
              className={`rounded-full p-2 transition ${
                isSubmitting || generating
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-[#128C7E]"
              }`}
            >
              <X size={22} />
            </button>

          </div>

          {/* ==================================================
              FORM
          ================================================== */}

          <form
            onSubmit={handleSubmit}
            className="max-h-[78vh] space-y-6 overflow-y-auto p-5 sm:p-6"
          >

            {/* ==================================================
                BASIC INFORMATION
            ================================================== */}

            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* TEMPLATE NAME */}

                <div className="md:col-span-2">

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
                    disabled={isSubmitting}
                    className={`w-full rounded-lg border px-4 py-3 outline-none ${
                      errors.name
                        ? "border-red-500"
                        : "border-gray-300 focus:border-[#25D366]"
                    } ${
                      isSubmitting
                        ? "cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    Use a clear template name, for example:
                    order_confirmation
                  </p>

                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.name}
                    </p>
                  )}

                </div>

                {/* CATEGORY */}

                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Category{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`w-full rounded-lg border px-4 py-3 outline-none ${
                      errors.category
                        ? "border-red-500"
                        : "border-gray-300 focus:border-[#25D366]"
                    } ${
                      isSubmitting
                        ? "cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
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
                    This classification is used for
                    Meta WhatsApp templates.
                  </p>

                  {errors.category && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.category}
                    </p>
                  )}

                </div>

                {/* PURPOSE */}

                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Purpose{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`w-full rounded-lg border px-4 py-3 outline-none ${
                      errors.purpose
                        ? "border-red-500"
                        : "border-gray-300 focus:border-[#25D366]"
                    } ${
                      isSubmitting
                        ? "cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
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

                {/* LANGUAGE */}

                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Language{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`w-full rounded-lg border px-4 py-3 outline-none ${
                      errors.language
                        ? "border-red-500"
                        : "border-gray-300 focus:border-[#25D366]"
                    } ${
                      isSubmitting
                        ? "cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
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

              </div>
            </div>

            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="border-t pt-5">

              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                Header
              </h3>

              <div>

                <label className="mb-2 block font-medium text-gray-700">
                  Header Type
                </label>

                <select
                  name="headerType"
                  value={formData.headerType}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#25D366]"
                >
                  <option value="NONE">
                    No Header
                  </option>

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

              </div>

              {/* HEADER CONTENT */}

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
                    disabled={isSubmitting}
                    placeholder={
                      formData.headerType === "TEXT"
                        ? "Enter header text"
                        : `Enter ${formData.headerType.toLowerCase()} reference`
                    }
                    className={`w-full rounded-lg border px-4 py-3 outline-none ${
                      errors.headerContent
                        ? "border-red-500"
                        : "border-gray-300 focus:border-[#25D366]"
                    } ${
                      isSubmitting
                        ? "cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  />

                  {formData.headerType === "IMAGE" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Media upload can be connected to
                      Meta media handling later.
                    </p>
                  )}

                  {formData.headerType === "VIDEO" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Video upload can be connected to
                      Meta media handling later.
                    </p>
                  )}

                  {formData.headerType === "DOCUMENT" && (
                    <p className="mt-1 text-xs text-gray-500">
                      Document upload can be connected to
                      Meta media handling later.
                    </p>
                  )}

                  {errors.headerContent && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.headerContent}
                    </p>
                  )}

                </div>
              )}

            </div>

            {/* ==================================================
                BODY
            ================================================== */}

            <div className="border-t pt-5">

              <div className="mb-3 flex items-center justify-between gap-3">

                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Body
                  </h3>

                  <p className="text-sm text-gray-500">
                    Write the main message of your template.
                  </p>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  Required
                </span>

              </div>

              <textarea
                rows="7"
                name="content"
                placeholder={
                  "Hello {{1}},\n\nYour order {{2}} has been confirmed.\n\nThank you for shopping with us."
                }
                value={formData.content}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.content
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                } ${
                  isSubmitting
                    ? "cursor-not-allowed bg-gray-100"
                    : ""
                }`}
              />

              <div className="mt-2 rounded-lg bg-gray-50 p-3">

                <p className="text-sm font-medium text-gray-700">
                  Dynamic variables
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Use variables such as{" "}
                  <span className="font-semibold text-gray-700">
                    {"{{1}}"}
                  </span>
                  ,{" "}
                  <span className="font-semibold text-gray-700">
                    {"{{2}}"}
                  </span>{" "}
                  for dynamic customer information.
                </p>

                <div className="mt-2 flex flex-wrap gap-2">

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        content:
                          prev.content +
                          (prev.content ? " " : "") +
                          "{{1}}",
                      }))
                    }
                    className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100"
                  >
                    + {"{{1}}"}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        content:
                          prev.content +
                          (prev.content ? " " : "") +
                          "{{2}}",
                      }))
                    }
                    className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100"
                  >
                    + {"{{2}}"}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        content:
                          prev.content +
                          (prev.content ? " " : "") +
                          "{{3}}",
                      }))
                    }
                    className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100"
                  >
                    + {"{{3}}"}
                  </button>

                </div>

              </div>

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

              <h3 className="mb-2 text-lg font-semibold text-gray-800">
                Footer
              </h3>

              <p className="mb-3 text-sm text-gray-500">
                Optional text displayed at the bottom of
                the message.
              </p>

              <input
                type="text"
                name="footerContent"
                value={formData.footerContent}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Example: Thank you for choosing us."
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  isSubmitting
                    ? "cursor-not-allowed bg-gray-100"
                    : "border-gray-300 focus:border-[#25D366]"
                }`}
              />

            </div>

            {/* ==================================================
                AI GENERATOR
            ================================================== */}

            <div className="border-t pt-5">

              <div className="rounded-xl border bg-green-50 p-4">

                <div className="mb-3 flex items-center gap-2">

                  <Sparkles
                    size={18}
                    className="text-green-600"
                  />

                  <div>
                    <h3 className="font-semibold text-gray-800">
                      AI Template Generator
                    </h3>

                    <p className="text-xs text-gray-600">
                      Generate content for your template
                      body.
                    </p>
                  </div>

                </div>

                {/* QUICK TEMPLATES */}

                <div className="mb-4">

                  <label className="mb-2 block font-medium text-gray-700">
                    Quick Templates
                  </label>

                  <div className="flex flex-wrap gap-2">

                    {quickTemplates.map((item) => {
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.label}
                          type="button"
                          disabled={
                            isSubmitting || generating
                          }
                          onClick={() =>
                            handleQuickTemplate(item)
                          }
                          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                            aiPrompt === item.label
                              ? "bg-green-600 text-white"
                              : "border border-gray-300 bg-white hover:bg-green-50"
                          } ${
                            isSubmitting || generating
                              ? "cursor-not-allowed opacity-50"
                              : ""
                          }`}
                        >
                          <Icon size={16} />
                          {item.label}
                        </button>
                      );
                    })}

                  </div>

                </div>

                {/* CUSTOM PROMPT */}

                <input
                  type="text"
                  placeholder="Or describe your own template..."
                  value={aiPrompt}
                  onChange={(e) =>
                    setAiPrompt(e.target.value)
                  }
                  disabled={
                    isSubmitting || generating
                  }
                  className={`mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-[#25D366] ${
                    isSubmitting || generating
                      ? "cursor-not-allowed bg-gray-100"
                      : ""
                  }`}
                />

                {/* TONE + GENERATE */}

                <div className="flex flex-col gap-3 sm:flex-row">

                  <select
                    value={aiTone}
                    onChange={(e) =>
                      setAiTone(e.target.value)
                    }
                    disabled={
                      isSubmitting || generating
                    }
                    className={`rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#25D366] ${
                      isSubmitting || generating
                        ? "cursor-not-allowed bg-gray-100"
                        : ""
                    }`}
                  >
                    <option value="Professional">
                      Professional
                    </option>

                    <option value="Friendly">
                      Friendly
                    </option>

                    <option value="Formal">
                      Formal
                    </option>

                    <option value="Promotional">
                      Promotional
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={
                      generating || isSubmitting
                    }
                    className={`crm-primary-button flex flex-1 items-center justify-center gap-2 ${
                      generating || isSubmitting
                        ? "cursor-not-allowed opacity-70"
                        : ""
                    }`}
                  >
                    {generating ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />

                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />

                        Generate with AI
                      </>
                    )}
                  </button>

                </div>

              </div>

            </div>

            {/* ==================================================
                DRAFT INFORMATION
            ================================================== */}

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">

              <p className="text-sm font-medium text-yellow-800">
                Template status
              </p>

              <p className="mt-1 text-sm text-yellow-700">
                New templates are saved as Drafts. Once
                Meta WhatsApp integration is connected,
                approved templates can be submitted to
                Meta for review.
              </p>

            </div>

            {/* ==================================================
                ACTIONS
            ================================================== */}

            <div className="mt-6 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-end">

              {/* CANCEL */}

              <button
                type="button"
                onClick={handleClose}
                disabled={
                  isSubmitting || generating
                }
                className={`crm-secondary-button ${
                  isSubmitting || generating
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
              >
                Cancel
              </button>

              {/* SAVE DRAFT */}

              <button
                type="submit"
                disabled={
                  isSubmitting || generating
                }
                className={`crm-primary-button flex min-w-[160px] items-center justify-center gap-2 ${
                  isSubmitting || generating
                    ? "cursor-not-allowed opacity-70"
                    : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  "Save as Draft"
                )}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

