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

  const [formData, setFormData] = useState({
    name: "",
    category: "SUPPORT",
    messageType: "TEXT",
    content: "",
    status: "DRAFT",
  });

  const [aiPrompt, setAiPrompt] = useState("");

  const [aiTone, setAiTone] = useState("Professional");

  // AI generating state
  const [generating, setGenerating] = useState(false);

  // Template creating state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errors, setErrors] = useState({});

  const quickTemplates = [
    {
      label: "Payment Reminder",
      icon: CircleDollarSign,
    },
    {
      label: "Order Confirmation",
      icon: Package,
    },
    {
      label: "Appointment Reminder",
      icon: CalendarDays,
    },
    {
      label: "Festival Wishes",
      icon: PartyPopper,
    },
    {
      label: "Product Launch",
      icon: Megaphone,
    },
    {
      label: "Offer Announcement",
      icon: Gift,
    },
    {
      label: "Thank You Message",
      icon: HeartHandshake,
    },
    {
      label: "Support Follow-up",
      icon: Headset,
    },
  ];

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
  // HANDLE INPUT CHANGE
  // ==================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Remove validation error when user changes field
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ==================================================
  // AI GENERATOR
  // ==================================================

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      return toast.error("Please enter a topic.");
    }

    // Don't allow AI generation while template is being created
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

      // Remove content validation error
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
      category: "SUPPORT",
      messageType: "TEXT",
      content: "",
      status: "DRAFT",
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

    // IMPORTANT:
    // Prevent duplicate API requests.
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

    // Validate before setting submitting state
    if (!validateForm()) {
      return;
    }

    try {
      // IMPORTANT:
      // Set immediately before API request.
      setIsSubmitting(true);

      await addTemplate(formData);

      toast.success(
        "Template created successfully!"
      );

      resetForm();

      // Close only after successful creation
      onClose();
    } catch (error) {
      console.error(
        "Failed to create template:",
        error
      );

      // 403 errors are already handled by apiClient interceptor
      if (error?.response?.status === 403) {
        setIsSubmitting(false);

        // Automatically close the modal
        onClose();

        return;
      }

      // Handle other errors normally
      toast.error(
        error?.response?.data?.message ||
        "Failed to create template!"
      );

      // Allow retry if API failed
      setIsSubmitting(false);
    }
  };

  // ==================================================
  // CLOSE MODAL
  // ==================================================

  const handleClose = () => {
    // Don't close while creating
    if (isSubmitting) {
      return;
    }

    // Don't close while AI is generating
    if (generating) {
      return;
    }

    onClose();
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
              Create Template
            </h2>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || generating}
              className={`rounded-full p-2 transition ${isSubmitting || generating
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
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.name
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } ${isSubmitting
                    ? "cursor-not-allowed bg-gray-100"
                    : ""
                  }`}
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
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.category
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } ${isSubmitting
                    ? "cursor-not-allowed bg-gray-100"
                    : ""
                  }`}
              >
                <option value="MARKETING">
                  Marketing
                </option>

                <option value="SUPPORT">
                  Support
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
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.messageType
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } ${isSubmitting
                    ? "cursor-not-allowed bg-gray-100"
                    : ""
                  }`}
              >
                <option value="TEXT">
                  Text
                </option>

                <option value="IMAGE">
                  Image
                </option>

                <option value="MEDIA">
                  Media
                </option>
              </select>

              {errors.messageType && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.messageType}
                </p>
              )}
            </div>

            {/* ==================================================
                AI GENERATOR
            ================================================== */}

            <div className="rounded-xl border bg-green-50 p-4">

              <div className="mb-3 flex items-center gap-2">

                <Sparkles
                  size={18}
                  className="text-green-600"
                />

                <h3 className="font-semibold">
                  AI Template Generator
                </h3>

              </div>

              {/* Quick Templates */}

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
                        disabled={isSubmitting}
                        onClick={() =>
                          setAiPrompt(item.label)
                        }
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${aiPrompt === item.label
                            ? "bg-green-600 text-white"
                            : "border border-gray-300 hover:bg-green-50"
                          } ${isSubmitting
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

              {/* Custom Prompt */}

              <input
                type="text"
                placeholder="Or describe your own template..."
                value={aiPrompt}
                onChange={(e) =>
                  setAiPrompt(e.target.value)
                }
                disabled={isSubmitting || generating}
                className={`mb-3 w-full rounded-lg border px-4 py-3 ${isSubmitting || generating
                    ? "cursor-not-allowed bg-gray-100"
                    : ""
                  }`}
              />

              {/* Tone + Generate */}

              <div className="flex flex-col gap-3 sm:flex-row">

                <select
                  value={aiTone}
                  onChange={(e) =>
                    setAiTone(e.target.value)
                  }
                  disabled={
                    isSubmitting || generating
                  }
                  className={`rounded-lg border px-4 py-3 ${isSubmitting || generating
                      ? "cursor-not-allowed bg-gray-100"
                      : ""
                    }`}
                >
                  <option>
                    Professional
                  </option>

                  <option>
                    Friendly
                  </option>

                  <option>
                    Formal
                  </option>

                  <option>
                    Promotional
                  </option>
                </select>

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={
                    generating || isSubmitting
                  }
                  className={`crm-primary-button flex items-center justify-center gap-2 ${generating || isSubmitting
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
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.content
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } ${isSubmitting
                    ? "cursor-not-allowed bg-gray-100"
                    : ""
                  }`}
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
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.status
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } ${isSubmitting
                    ? "cursor-not-allowed bg-gray-100"
                    : ""
                  }`}
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
                className={`crm-secondary-button ${isSubmitting || generating
                    ? "cursor-not-allowed opacity-50"
                    : ""
                  }`}
              >
                Cancel
              </button>

              {/* CREATE TEMPLATE */}

              <button
                type="submit"
                disabled={
                  isSubmitting || generating
                }
                className={`crm-primary-button flex min-w-[160px] items-center justify-center gap-2 ${isSubmitting || generating
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

                    Creating...
                  </>
                ) : (
                  "Create Template"
                )}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}