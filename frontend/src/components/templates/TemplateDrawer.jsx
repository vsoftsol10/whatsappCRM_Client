import { useEffect, useMemo, useState } from "react";
import {
  X,
  Sparkles,
  Loader2,
  ImagePlus,
  Pencil,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

import useTemplateStore from "../../store/templateStore";
import { uploadTemplateHeaderImage } from "../../api/templateApi";
import { getVariableNumbers } from "../../utils/templateVariables";
import TemplateButtonsEditor, {
  TemplateButtonsPreview,
  validateTemplateButtons,
} from "./TemplateButtonsEditor";
import { StatusPill } from "./templateUi";
import { LANGUAGE_OPTIONS, canEditTemplate } from "./templateHelpers";

/**
 * One right-side drawer for the three template screens:
 *
 *   mode="create"  -> empty form, "Save as Draft"
 *   mode="edit"    -> form filled from `template`, "Save changes"
 *   mode="view"    -> same form, read-only, with an "Edit" shortcut
 *
 * Render it only while it is open and give it a `key` that changes with
 * the mode / template, so the form always starts from fresh values.
 */

const MAX_BODY = 1024;

const PURPOSE_OPTIONS = [
  { value: "WELCOME", label: "Welcome" },
  { value: "ORDER_CONFIRMATION", label: "Order Confirmation" },
  { value: "ORDER_UPDATE", label: "Order Update" },
  { value: "PAYMENT_REMINDER", label: "Payment Reminder" },
  { value: "APPOINTMENT_REMINDER", label: "Appointment Reminder" },
  { value: "SUPPORT_FOLLOW_UP", label: "Support Follow-up" },
  { value: "FESTIVAL_GREETING", label: "Festival Greeting" },
  { value: "PROMOTION", label: "Promotion" },
  { value: "CUSTOM", label: "Custom" },
];

const QUICK_TEMPLATES = [
  { label: "Welcome Message", purpose: "WELCOME", category: "UTILITY" },
  { label: "Payment Reminder", purpose: "PAYMENT_REMINDER", category: "UTILITY" },
  { label: "Order Confirmation", purpose: "ORDER_CONFIRMATION", category: "UTILITY" },
  { label: "Appointment Reminder", purpose: "APPOINTMENT_REMINDER", category: "UTILITY" },
  { label: "Festival Wishes", purpose: "FESTIVAL_GREETING", category: "MARKETING" },
  { label: "Product Launch", purpose: "PROMOTION", category: "MARKETING" },
  { label: "Offer Announcement", purpose: "PROMOTION", category: "MARKETING" },
  { label: "Thank You Message", purpose: "CUSTOM", category: "UTILITY" },
  { label: "Support Follow-up", purpose: "SUPPORT_FOLLOW_UP", category: "UTILITY" },
];

const MODE_COPY = {
  create: {
    title: "Create WhatsApp Template",
    subtitle: "Create a template that will later be submitted for approval",
    submit: "Save as Draft",
    saving: "Saving...",
  },
  edit: {
    title: "Edit WhatsApp Template",
    subtitle: "Edit a template that will later be submitted for approval",
    submit: "Save changes",
    saving: "Saving...",
  },
  view: {
    title: "View WhatsApp Template",
    subtitle: "View a template that will later be submitted for approval",
  },
};

const STATUS_NOTES = {
  DRAFT: "This template is a draft. Edit it if needed, then submit it for approval from the Templates list.",
  PENDING: "This template is waiting for Meta's review. It can't be edited until the review finishes.",
  APPROVED: "This template is approved and can be sent to customers. Approved templates can't be edited.",
  REJECTED: "Meta rejected this template. Fix the issue, save, and submit it again.",
  PAUSED: "This template is paused by Meta and can't be edited.",
  DISABLED: "This template is disabled by Meta and can't be edited.",
};

// ============================================================
// FORM HELPERS
// ============================================================

const buildForm = (template) => {
  const content = template?.content || "";

  // bodyExamples is stored in variable order, e.g. ["Rahul", "ORD1234"]
  // for {{1}} and {{2}} -> turn it back into { 1: "Rahul", 2: "ORD1234" }
  const examples = Array.isArray(template?.bodyExamples)
    ? template.bodyExamples
    : [];

  const variableSamples = {};
  getVariableNumbers(content).forEach((number, index) => {
    variableSamples[number] = String(examples[index] ?? "");
  });

  return {
    name: template?.name || "",
    category: template?.category || "UTILITY",
    purpose: template?.purpose || "CUSTOM",
    language: template?.language || "en_US",

    headerType: template?.headerType || "NONE",
    headerContent: template?.headerContent || "",

    content,
    footerContent: template?.footerContent || "",
    buttons: Array.isArray(template?.buttons) ? template.buttons : [],
    variableSamples,
  };
};

// ============================================================
// SMALL UI PIECES
// ============================================================

const inputBase =
  "w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600";

const fieldClass = (error) =>
  `${inputBase} h-11 ${error ? "border-red-400" : "border-slate-200"}`;

const sectionTitle = "text-base font-semibold text-slate-900";

function Field({ label, required, error, hint, htmlFor, children }) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-800"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      {children}

      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

function Select({ error, className = "", children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${fieldClass(error)} appearance-none pr-10 ${className}`}
      >
        {children}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

function SectionHeading({ children, optional }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className={sectionTitle}>{children}</h3>
      {optional && <span className="text-xs text-slate-400">Optional</span>}
    </div>
  );
}

// ============================================================
// DRAWER
// ============================================================

export default function TemplateDrawer({
  mode = "create",
  template = null,
  onClose,
  onRequestEdit,
}) {
  const { addTemplate, editTemplate, generateTemplate } = useTemplateStore();

  const isView = mode === "view";
  const isEdit = mode === "edit";
  const copy = MODE_COPY[mode] || MODE_COPY.create;

  const [form, setForm] = useState(() => buildForm(template));
  const [errors, setErrors] = useState({});

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiTone, setAiTone] = useState("Professional");

  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);

  const busy = submitting || generating || uploadingHeader;

  // Fields can't be changed while viewing or while saving
  const locked = isView || submitting;

  const detectedVariables = useMemo(
    () => getVariableNumbers(form.content),
    [form.content]
  );

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  // Escape closes the drawer; the page behind it doesn't scroll
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };

    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [busy, onClose]);

  // ----------------------------------------------------------
  // CHANGE HANDLERS
  // ----------------------------------------------------------

  const clearError = (key) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  // A text heading and an uploaded image URL are never valid for each
  // other's type, so clear the content when the type changes.
  const handleHeaderTypeChange = (e) => {
    setForm((prev) => ({
      ...prev,
      headerType: e.target.value,
      headerContent: "",
    }));

    clearError("headerContent");
  };

  const handleHeaderImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB (Meta's limit for header images).");
      return;
    }

    try {
      setUploadingHeader(true);

      const result = await uploadTemplateHeaderImage(file);

      setForm((prev) => ({
        ...prev,
        headerContent: result.data.imageUrl,
      }));

      clearError("headerContent");
      toast.success("Sample image uploaded.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload sample image.");
    } finally {
      setUploadingHeader(false);
    }
  };

  const handleSampleChange = (number, value) => {
    setForm((prev) => ({
      ...prev,
      variableSamples: { ...prev.variableSamples, [number]: value },
    }));

    clearError(`sample_${number}`);
  };

  const insertVariable = (number) => {
    setForm((prev) => ({
      ...prev,
      content:
        prev.content + (prev.content ? " " : "") + `{{${number}}}`,
    }));

    clearError("content");
  };

  const handleQuickTemplate = (item) => {
    if (submitting || generating) return;

    setAiPrompt(item.label);

    setForm((prev) => ({
      ...prev,
      category: item.category,
      purpose: item.purpose,
    }));
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) {
      return toast.error("Please enter a topic.");
    }

    if (submitting) return;

    try {
      setGenerating(true);

      const content = await generateTemplate(aiPrompt, aiTone);

      setForm((prev) => ({ ...prev, content }));
      clearError("content");

      toast.success("Template generated successfully.");
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message || "Failed to generate template."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ----------------------------------------------------------
  // VALIDATION + SUBMIT
  // ----------------------------------------------------------

  const validate = () => {
    const next = {};

    if (!form.name.trim()) {
      next.name = "Template name is required";
    } else if (form.name.trim().length < 3) {
      next.name = "Template name must be at least 3 characters";
    }

    if (!form.category) next.category = "Category is required";
    if (!form.purpose) next.purpose = "Purpose is required";
    if (!form.language) next.language = "Language is required";

    if (form.headerType === "TEXT" && !form.headerContent.trim()) {
      next.headerContent = "Header text is required";
    }

    if (
      ["IMAGE", "VIDEO", "DOCUMENT"].includes(form.headerType) &&
      !form.headerContent.trim()
    ) {
      next.headerContent = `Please upload a sample ${form.headerType.toLowerCase()} before saving`;
    }

    if (!form.content.trim()) {
      next.content = "Template body is required";
    } else if (form.content.trim().length < 10) {
      next.content = "Template body must be at least 10 characters";
    } else if (form.content.length > MAX_BODY) {
      next.content = `Template body can be at most ${MAX_BODY} characters`;
    }

    detectedVariables.forEach((number) => {
      if (!form.variableSamples[number]?.trim()) {
        next[`sample_${number}`] = `Sample value for {{${number}}} is required`;
      }
    });

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isView || submitting) return;

    if (generating) {
      toast.error("Please wait until AI generation is complete.");
      return;
    }

    if (uploadingHeader) {
      toast.error("Please wait for the header image to finish uploading.");
      return;
    }

    if (isEdit && !canEditTemplate(template)) {
      toast.error("Only draft or rejected templates can be edited.");
      return;
    }

    if (!validate()) return;

    const buttonError = validateTemplateButtons(form.buttons, form.category);

    if (buttonError) {
      toast.error(buttonError);
      return;
    }

    // Sample values in the same order as the variable numbers
    const bodyExamples = detectedVariables.map((number) =>
      form.variableSamples[number].trim()
    );

    const payload = {
      name: form.name.trim(),
      category: form.category,
      purpose: form.purpose,
      language: form.language,

      headerType: form.headerType,
      headerContent:
        form.headerType !== "NONE" ? form.headerContent.trim() : null,

      content: form.content.trim(),
      footerContent: form.footerContent.trim() || null,
      buttons: form.buttons,
      bodyExamples,
    };

    // The status is never sent: the backend controls it
    // (any save puts the template back into DRAFT).
    try {
      setSubmitting(true);

      if (isEdit) {
        await editTemplate(template.id, payload);
      } else {
        await addTemplate(payload);
      }

      onClose();

      // Shown AFTER the drawer is closed
      toast.success(
        isEdit
          ? "Template updated successfully!"
          : "Template saved as draft successfully!"
      );
    } catch (error) {
      console.error("Failed to save template:", error);

      // 403 is already explained by the app (plan / permission message)
      if (error?.response?.status === 403) {
        onClose();
        return;
      }

      toast.error(
        error?.response?.data?.message ||
          (isEdit ? "Failed to update template." : "Failed to save template!")
      );

      setSubmitting(false);
    }
  };

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  const isRejected = template?.status === "REJECTED";

  const outlineButton =
    "h-10 rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

  const primaryButton =
    "inline-flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* BACKDROP */}
      <div
        aria-hidden="true"
        onClick={handleClose}
        className="crm-fade-in absolute inset-0 bg-slate-900/40"
      />

      {/* PANEL */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-drawer-title"
        className="crm-drawer-in relative flex h-full w-full flex-col bg-white shadow-2xl sm:w-[480px]"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="template-drawer-title"
              className="text-base font-semibold text-slate-900"
            >
              {copy.title}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">{copy.subtitle}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isView && canEditTemplate(template) && (
              <button
                type="button"
                onClick={() => onRequestEdit?.(template)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-green-500 bg-green-50 px-3 text-sm font-medium text-green-700 transition hover:bg-green-100"
              >
                <Pencil size={14} />
                Edit
              </button>
            )}

            <button
              type="button"
              aria-label="Close"
              onClick={handleClose}
              disabled={busy}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* SCROLLING BODY */}
          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
            {/* REJECTION REASON */}
            {isRejected && template?.rejectionReason && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-red-500"
                />

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-700">
                    Rejected by Meta
                  </p>

                  <p className="mt-0.5 break-words text-sm text-red-600">
                    {template.rejectionReason}
                  </p>
                </div>
              </div>
            )}

            {/* BASIC INFORMATION */}
            <div className="space-y-4">
              <Field
                label="Template Name"
                required
                error={errors.name}
                htmlFor="tpl-name"
              >
                <input
                  id="tpl-name"
                  type="text"
                  name="name"
                  autoFocus={mode === "create"}
                  placeholder="e.g. order_confirmation"
                  value={form.name}
                  onChange={handleChange}
                  disabled={locked}
                  className={fieldClass(errors.name)}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Category"
                  required
                  error={errors.category}
                  htmlFor="tpl-category"
                >
                  <Select
                    id="tpl-category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    disabled={locked}
                    error={errors.category}
                  >
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </Select>
                </Field>

                <Field
                  label="Purpose"
                  required
                  error={errors.purpose}
                  htmlFor="tpl-purpose"
                >
                  <Select
                    id="tpl-purpose"
                    name="purpose"
                    value={form.purpose}
                    onChange={handleChange}
                    disabled={locked}
                    error={errors.purpose}
                  >
                    {PURPOSE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field
                label="Language"
                required
                error={errors.language}
                htmlFor="tpl-language"
              >
                <Select
                  id="tpl-language"
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  disabled={locked}
                  error={errors.language}
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* HEADER */}
            <section>
              <h3 className={`${sectionTitle} mb-3`}>Header</h3>

              <Field
                label="Header Type"
                htmlFor="tpl-headerType"
                hint={
                  isView
                    ? undefined
                    : "Meta locks this in once the template is approved: an image-header template can never be sent with text or video instead."
                }
              >
                <Select
                  id="tpl-headerType"
                  name="headerType"
                  value={form.headerType}
                  onChange={handleHeaderTypeChange}
                  disabled={locked}
                >
                  <option value="NONE">No Header</option>
                  <option value="TEXT">Text</option>
                  <option value="IMAGE">Image</option>
                  <option value="VIDEO">Video</option>
                  <option value="DOCUMENT">Document</option>
                </Select>
              </Field>

              {/* TEXT */}
              {form.headerType === "TEXT" && (
                <div className="mt-4">
                  <Field
                    label="Header Text"
                    required
                    error={errors.headerContent}
                    htmlFor="tpl-headerContent"
                  >
                    <input
                      id="tpl-headerContent"
                      type="text"
                      name="headerContent"
                      value={form.headerContent}
                      onChange={handleChange}
                      disabled={locked}
                      placeholder="Enter header text"
                      className={fieldClass(errors.headerContent)}
                    />
                  </Field>
                </div>
              )}

              {/* IMAGE */}
              {form.headerType === "IMAGE" && (
                <div className="mt-4">
                  <p className="mb-1.5 text-sm font-medium text-slate-800">
                    Sample Image
                    {!isView && <span className="text-red-500"> *</span>}
                  </p>

                  {!isView && (
                    <p className="mb-2 text-xs text-slate-500">
                      Upload a real sample image (JPEG/PNG, under 5MB). This
                      is what Meta's reviewers see.
                    </p>
                  )}

                  {!form.headerContent ? (
                    isView ? (
                      <p className="text-sm text-slate-500">
                        No sample image uploaded.
                      </p>
                    ) : (
                      <label
                        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                          errors.headerContent
                            ? "border-red-400"
                            : "border-green-300"
                        } ${
                          locked || uploadingHeader
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer bg-green-50/60 hover:bg-green-50"
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleHeaderImageUpload}
                          disabled={locked || uploadingHeader}
                          className="hidden"
                        />

                        {uploadingHeader ? (
                          <>
                            <Loader2
                              size={22}
                              className="animate-spin text-green-600"
                            />
                            <span className="mt-2 text-sm text-slate-600">
                              Uploading...
                            </span>
                          </>
                        ) : (
                          <>
                            <ImagePlus size={22} className="text-green-600" />
                            <span className="mt-2 text-sm text-slate-600">
                              Click to upload sample image
                            </span>
                          </>
                        )}
                      </label>
                    )
                  ) : (
                    <div className="flex items-center gap-4 rounded-xl border border-slate-200 p-3">
                      <img
                        src={form.headerContent}
                        alt="Header sample"
                        className="h-20 w-20 rounded-lg object-cover"
                      />

                      {!isView && (
                        <button
                          type="button"
                          disabled={locked}
                          onClick={() =>
                            setForm((prev) => ({ ...prev, headerContent: "" }))
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Change image
                        </button>
                      )}
                    </div>
                  )}

                  {errors.headerContent && (
                    <p role="alert" className="mt-1.5 text-xs text-red-500">
                      {errors.headerContent}
                    </p>
                  )}
                </div>
              )}

              {/* VIDEO / DOCUMENT */}
              {(form.headerType === "VIDEO" ||
                form.headerType === "DOCUMENT") &&
                (isView ? (
                  form.headerContent && (
                    <input
                      type="text"
                      aria-label="Header content"
                      value={form.headerContent}
                      disabled
                      className={`${fieldClass(false)} mt-4`}
                    />
                  )
                ) : (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <p className="text-sm text-amber-800">
                      {form.headerType === "VIDEO" ? "Video" : "Document"}{" "}
                      header uploads aren't supported in this form yet. Use
                      Image or Text for now.
                    </p>
                  </div>
                ))}
            </section>

            {/* BODY */}
            <section>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <label htmlFor="tpl-content" className={sectionTitle}>
                  Body <span className="text-red-500">*</span>
                </label>

                {!isView && (
                  <span className="text-right text-xs text-slate-400">
                    Write the main message of your template
                  </span>
                )}
              </div>

              <textarea
                id="tpl-content"
                name="content"
                rows={6}
                maxLength={isView ? undefined : MAX_BODY}
                placeholder={
                  "Hello {{1}},\nYour order {{2}} has been confirmed.\nThank you for shopping with us."
                }
                value={form.content}
                onChange={handleChange}
                disabled={locked}
                className={`${inputBase} resize-none py-3 leading-6 ${
                  errors.content ? "border-red-400" : "border-slate-200"
                }`}
              />

              <div className="mt-1 flex items-start justify-between gap-3">
                {errors.content ? (
                  <p role="alert" className="text-xs text-red-500">
                    {errors.content}
                  </p>
                ) : (
                  <span />
                )}

                <p
                  className={`shrink-0 text-xs ${
                    form.content.length > MAX_BODY
                      ? "text-red-500"
                      : "text-slate-400"
                  }`}
                >
                  {form.content.length}/{MAX_BODY}
                </p>
              </div>

              {/* DYNAMIC VARIABLES */}
              {!isView && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-800">
                    Dynamic variables
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Use variables such as {"{{1}}"}, {"{{2}}"} to personalize
                    each message.
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {[1, 2, 3].map((number) => (
                      <button
                        key={number}
                        type="button"
                        disabled={locked}
                        onClick={() => insertVariable(number)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-green-500 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        + {`{{${number}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SAMPLE VALUES (required by Meta for every variable) */}
              {detectedVariables.length > 0 && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <p className="text-sm font-medium text-slate-800">
                    Sample values
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Meta needs a realistic example for each variable before it
                    reviews the template.
                  </p>

                  <div className="mt-3 space-y-2.5">
                    {detectedVariables.map((number) => (
                      <div key={number}>
                        <div className="flex items-center gap-2">
                          <span className="w-11 shrink-0 text-xs font-semibold text-slate-600">
                            {`{{${number}}}`}
                          </span>

                          <input
                            type="text"
                            aria-label={`Sample value for {{${number}}}`}
                            value={form.variableSamples[number] || ""}
                            onChange={(e) =>
                              handleSampleChange(number, e.target.value)
                            }
                            disabled={locked}
                            placeholder={
                              number === 1 ? "e.g. Rahul" : "e.g. ORD1234"
                            }
                            className={`${inputBase} h-10 ${
                              errors[`sample_${number}`]
                                ? "border-red-400"
                                : "border-slate-200"
                            }`}
                          />
                        </div>

                        {errors[`sample_${number}`] && (
                          <p
                            role="alert"
                            className="mt-1 pl-[3.25rem] text-xs text-red-500"
                          >
                            {errors[`sample_${number}`]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* FOOTER */}
            <section>
              <SectionHeading optional>Footer</SectionHeading>

              <input
                type="text"
                name="footerContent"
                aria-label="Footer"
                value={form.footerContent}
                onChange={handleChange}
                disabled={locked}
                placeholder="Example: Thank you for choosing us"
                className={fieldClass(false)}
              />
            </section>

            {/* BUTTONS */}
            <section>
              {isView ? (
                <>
                  <SectionHeading optional>Buttons</SectionHeading>

                  {form.buttons.length > 0 ? (
                    <TemplateButtonsPreview buttons={form.buttons} />
                  ) : (
                    <p className="text-sm text-slate-500">
                      No buttons added.
                    </p>
                  )}
                </>
              ) : (
                <TemplateButtonsEditor
                  value={form.buttons}
                  onChange={(buttons) =>
                    setForm((prev) => ({ ...prev, buttons }))
                  }
                  category={form.category}
                  disabled={submitting}
                />
              )}
            </section>

            {/* AI GENERATOR */}
            {!isView && (
              <section className="rounded-2xl border border-green-400 bg-green-50/60 p-4">
                <div className="flex items-start gap-2">
                  <Sparkles size={16} className="mt-0.5 text-green-600" />

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      AI Template Generator
                    </h3>

                    <p className="text-xs text-slate-500">
                      Create custom or quick templates
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm font-medium text-slate-800">
                  Quick Templates
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK_TEMPLATES.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      aria-pressed={aiPrompt === item.label}
                      disabled={submitting || generating}
                      onClick={() => handleQuickTemplate(item)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        aiPrompt === item.label
                          ? "border-green-500 bg-green-100 text-green-800"
                          : "border-slate-200 bg-white text-slate-800 hover:border-green-400"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <p className="mt-4 text-sm font-medium text-slate-800">
                  Or describe your own template
                </p>

                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    aria-label="Describe your own template"
                    placeholder="Or describe your own template"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={submitting || generating}
                    className={`${inputBase} h-10 min-w-0 flex-1 border-slate-200`}
                  />

                  <div className="relative w-36 shrink-0">
                    <select
                      aria-label="Tone"
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                      disabled={submitting || generating}
                      className={`${inputBase} h-10 appearance-none border-slate-200 pr-8`}
                    >
                      <option value="Professional">Professional</option>
                      <option value="Friendly">Friendly</option>
                      <option value="Formal">Formal</option>
                      <option value="Promotional">Promotional</option>
                    </select>

                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={generating || submitting}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate with AI
                    </>
                  )}
                </button>
              </section>
            )}

            {/* STATUS NOTE */}
            {isView ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">
                    Template status
                  </p>

                  <StatusPill status={template?.status} />
                </div>

                <p className="mt-1.5 text-xs text-slate-600">
                  {STATUS_NOTES[template?.status] ||
                    "Status is managed by the system and Meta's approval process."}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <p className="text-sm font-semibold text-amber-800">
                  Template status
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  {isEdit
                    ? "Saving changes keeps this template as a Draft. Submit it for approval again from the Templates list."
                    : "New templates are saved as Drafts. Once Meta WhatsApp integration is connected, approved templates can be submitted for review."}
                </p>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
            {isView ? (
              <button type="button" onClick={handleClose} className={outlineButton}>
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={busy}
                  className={outlineButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={busy}
                  className={primaryButton}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {copy.saving}
                    </>
                  ) : (
                    copy.submit
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </aside>
    </div>
  );
}
