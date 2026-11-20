import { useEffect, useState } from "react";
import {
  X,
  Pencil,
  Megaphone,
  Users,
  Clock,
  Upload,
  ChevronDown,
  Loader2,
  RotateCcw,
} from "lucide-react";

import { TemplateButtonsPreview } from "../templates/TemplateButtonsEditor";
import CampaignVariableInputs from "./CampaignVariableInputs";
import { TYPE_OPTIONS, formatDateTime } from "./campaignHelpers";

/**
 * One right-side drawer for the three campaign screens:
 *
 *   mode="create" -> empty form
 *   mode="edit"   -> form filled from the campaign
 *   mode="view"   -> same layout, read-only, with an "Edit" shortcut
 *
 * It only DRAWS the form. The state, validation and saving stay in
 * CreateCampaignModal / EditCampaignModal / ViewCampaignModal.
 */

const MODE_COPY = {
  create: {
    title: "Create Campaign",
    subtitle: "Create a campaign using an approved WhatsApp template",
    submit: "Create Campaign",
    submitting: "Creating...",
  },
  edit: {
    title: "Edit Campaign",
    subtitle: "Edit a campaign using an approved WhatsApp template",
    submit: "Save Changes",
    submitting: "Saving...",
  },
  view: {
    title: "View Campaign",
    subtitle: "View a campaign using an approved WhatsApp template",
  },
};

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600";

const fieldClass = `${inputBase} h-11`;

const outlineButton =
  "h-10 rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

const primaryButton =
  "inline-flex h-10 min-w-[132px] items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60";

// ==================================================
// SMALL PIECES
// ==================================================

function Card({ icon: Icon, title, optional, subtitle, badge, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Icon size={16} className="shrink-0 text-green-600" />

            <h3 className="text-[15px] font-semibold text-slate-900">
              {title}
              {optional && (
                <span className="ml-2 text-xs font-medium text-slate-400">
                  (optional)
                </span>
              )}
            </h3>
          </div>

          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          )}
        </div>

        {badge}
      </div>

      {children}
    </section>
  );
}

function Badge({ children, tone = "green" }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        tone === "green"
          ? "bg-green-100 text-green-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {children}
    </span>
  );
}

function Field({ label, required, htmlFor, children }) {
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
    </div>
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${fieldClass} appearance-none pr-10 ${className}`}
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

function Avatar({ name }) {
  const initial = String(name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500 text-sm font-semibold text-white">
      {initial}
    </span>
  );
}

// WhatsApp-style bubble that shows how the message looks
function TemplatePreview({ template, bodyText, imageSrc }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl bg-[#efeae2] p-4">
      <div className="max-w-full rounded-lg bg-white p-3.5 shadow-sm">
        {template.headerType === "IMAGE" && imageSrc && (
          <img
            src={imageSrc}
            alt="Campaign header"
            className="mb-3 max-h-48 w-full rounded-md object-cover"
          />
        )}

        {template.headerType === "TEXT" && template.headerContent && (
          <p className="mb-2 text-sm font-semibold text-slate-800">
            {template.headerContent}
          </p>
        )}

        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
          {bodyText}
        </p>

        {template.footerContent && (
          <p className="mt-2.5 text-xs text-slate-500">
            {template.footerContent}
          </p>
        )}

        <TemplateButtonsPreview buttons={template.buttons} />
      </div>
    </div>
  );
}

// ==================================================
// DRAWER
// ==================================================

export default function CampaignFormDrawer({
  mode = "create",
  onClose,
  onRequestEdit,
  canEdit = true,
  onSubmit,
  submitting = false,
  submitLabel,
  submitDisabled = false,

  // details
  formData,
  onFieldChange,
  templates = [],
  loadingTemplates = false,
  selectedTemplateId = "",
  selectedTemplate = null,
  onTemplateChange,
  templateVariables = [],
  variableConfigs = {},
  onVariableChange,
  previewText, // view mode: the message with the saved values filled in

  // audience
  customers = [],
  loadingCustomers = false,
  customerSearch = "",
  onCustomerSearch,
  selectedCustomers = [],
  onToggleCustomer,
  onSelectAll,
  onClearAll,
  audienceRequired = false,

  // media
  image = null,
  imagePreview = "",
  fileInputRef,
  onImageChange,
  onRemoveImage,
  restrictImageToTemplate = false,

  // view extras
  canResend = false,
  onResend,
  resending = false,
}) {
  const isView = mode === "view";
  const copy = MODE_COPY[mode] || MODE_COPY.create;

  const busy = submitting || resending;
  const locked = isView || submitting;

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

  // ------------------------------------------------
  // media rules
  // ------------------------------------------------

  const templateHasImageHeader = selectedTemplate?.headerType === "IMAGE";

  const imageBlocked =
    restrictImageToTemplate &&
    !!selectedTemplate &&
    selectedTemplate.headerType !== "IMAGE";

  const uploadDisabled = locked || imageBlocked;

  // earliest allowed schedule time (computed once when the drawer opens)
  const [minSchedule] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
  );

  // ------------------------------------------------
  // summary
  // ------------------------------------------------

  const scheduleLabel = formData.scheduledAt
    ? formatDateTime(formData.scheduledAt)
    : "Draft";

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
        aria-labelledby="campaign-drawer-title"
        className="crm-drawer-in relative flex h-full w-full flex-col bg-white shadow-2xl sm:w-[520px]"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="campaign-drawer-title"
              className="text-lg font-semibold text-slate-900"
            >
              {copy.title}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">{copy.subtitle}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isView && canEdit && (
              <button
                type="button"
                onClick={onRequestEdit}
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
          onSubmit={onSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* SCROLLING BODY */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {/* ==========================================
                CAMPAIGN DETAILS
            ========================================== */}
            <Card
              icon={Megaphone}
              title="Campaign Details"
              subtitle="Configure your campaign"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Campaign Name" required htmlFor="cmp-name">
                  <input
                    id="cmp-name"
                    type="text"
                    name="name"
                    autoFocus={mode === "create"}
                    value={formData.name}
                    onChange={onFieldChange}
                    placeholder="e.g. Diwali Promotion 2026"
                    disabled={locked}
                    className={fieldClass}
                  />
                </Field>

                <Field label="Campaign Type" htmlFor="cmp-type">
                  <Select
                    id="cmp-type"
                    name="type"
                    value={formData.type}
                    onChange={onFieldChange}
                    disabled={locked}
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {/* TEMPLATE */}
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label
                    htmlFor="cmp-template"
                    className="text-sm font-medium text-slate-800"
                  >
                    WhatsApp Template
                    <span className="text-red-500"> *</span>
                  </label>

                  <Badge>Required</Badge>
                </div>

                {loadingTemplates ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                    Loading approved templates...
                  </div>
                ) : templates.length === 0 && !isView ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <p className="text-sm font-semibold text-amber-800">
                      No approved templates available
                    </p>

                    <p className="mt-1 text-xs text-amber-700">
                      Create a WhatsApp template and submit it for Meta
                      approval before creating a campaign.
                    </p>
                  </div>
                ) : (
                  <Select
                    id="cmp-template"
                    value={selectedTemplateId}
                    onChange={onTemplateChange}
                    disabled={locked}
                  >
                    <option value="">Select an approved template</option>

                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} — {template.language} —{" "}
                        {template.category}
                      </option>
                    ))}
                  </Select>
                )}

                <p className="mt-1.5 text-xs text-slate-500">
                  Only approved templates can be used for campaigns.
                </p>

                {isView && !selectedTemplate && previewText && (
                  <div className="mt-4 overflow-hidden rounded-xl bg-[#efeae2] p-4">
                    <div className="rounded-lg bg-white p-3.5 shadow-sm">
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {previewText}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTemplate && (
                  <TemplatePreview
                    template={selectedTemplate}
                    bodyText={
                      isView && previewText ? previewText : selectedTemplate.content
                    }
                    imageSrc={imagePreview}
                  />
                )}

                {/* one input per {{variable}} (create / edit only) */}
                {!isView && selectedTemplate && templateVariables.length > 0 && (
                  <CampaignVariableInputs
                    content={selectedTemplate.content}
                    numbers={templateVariables}
                    configs={variableConfigs}
                    onChange={onVariableChange}
                    disabled={submitting}
                  />
                )}
              </div>
            </Card>

            {/* ==========================================
                CAMPAIGN AUDIENCE
            ========================================== */}
            <Card
              icon={Users}
              title="Campaign Audience"
              subtitle="Select customers who should receive this campaign"
              badge={
                isView ? null : audienceRequired ? (
                  <Badge>Required</Badge>
                ) : (
                  <Badge tone="gray">Optional</Badge>
                )
              }
            >
              {!isView && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onSelectAll}
                    disabled={submitting || customers.length === 0}
                    className="h-9 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={onClearAll}
                    disabled={submitting || selectedCustomers.length === 0}
                    className="h-9 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear All
                  </button>

                  <span className="ml-auto text-xs font-medium text-slate-500">
                    {selectedCustomers.length} selected
                  </span>
                </div>
              )}

              <input
                type="text"
                aria-label="Search customers"
                value={customerSearch}
                onChange={(e) => onCustomerSearch?.(e.target.value)}
                placeholder="Search customers by name, phone or email..."
                disabled={submitting}
                className={`${fieldClass} mb-3`}
              />

              {loadingCustomers ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  Loading customers...
                </div>
              ) : customers.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  <Users size={26} className="mx-auto mb-2 text-slate-300" />
                  No customers found.
                </div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-0.5">
                  {customers.map((customer) => {
                    const isSelected = selectedCustomers.includes(customer.id);

                    return (
                      <label
                        key={customer.id}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                          isSelected
                            ? "border-green-300 bg-green-50/60"
                            : "border-slate-200 bg-white"
                        } ${
                          locked
                            ? "cursor-default"
                            : "cursor-pointer hover:border-green-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleCustomer?.(customer.id)}
                          disabled={locked}
                          className="h-4 w-4 shrink-0 accent-green-600"
                        />

                        <Avatar name={customer.name} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {customer.name || "Unnamed Customer"}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {customer.phone || "No phone number"}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* ==========================================
                SCHEDULE
            ========================================== */}
            <Card
              icon={Clock}
              title="Schedule Campaign"
              optional
              subtitle="Leave empty to save as a draft. If you pick a date and time, the campaign is scheduled for then."
            >
              <input
                type="datetime-local"
                aria-label="Schedule date and time"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={onFieldChange}
                disabled={locked}
                min={isView ? undefined : minSchedule}
                className={fieldClass}
              />
            </Card>

            {/* ==========================================
                MEDIA
            ========================================== */}
            <Card icon={Upload} title="Campaign Media" optional>
              {!isView && templateHasImageHeader && (
                <p className="mb-2 text-xs text-green-700">
                  This template requires an image header — an image is
                  required.
                </p>
              )}

              {!isView && imageBlocked && (
                <p className="mb-2 text-xs text-amber-600">
                  This template doesn't have an IMAGE header, so any image
                  you attach here won't be sent. Choose an IMAGE-header
                  template to send media.
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onImageChange}
                disabled={uploadDisabled}
                className="hidden"
              />

              {imagePreview ? (
                <div className="rounded-xl border border-slate-200 p-3">
                  <img
                    src={imagePreview}
                    alt="Campaign preview"
                    className="max-h-64 w-full rounded-lg object-contain"
                  />

                  {!isView && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef?.current?.click()}
                        disabled={uploadDisabled}
                        className="h-9 rounded-lg border border-green-500 bg-green-50 px-4 text-sm font-medium text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Change Image
                      </button>

                      <button
                        type="button"
                        onClick={onRemoveImage}
                        disabled={submitting}
                        className="h-9 rounded-lg border border-red-300 bg-white px-4 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ) : isView ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                  No campaign image
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef?.current?.click()}
                  disabled={uploadDisabled}
                  className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-green-400 bg-green-50 px-4 py-8 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload size={22} className="text-green-700" />

                  <span className="mt-2 text-sm font-semibold text-green-800">
                    Upload Campaign Image
                  </span>

                  <span className="mt-1 text-xs text-green-700">
                    PNG, JPG or WebP · up to 15 MB
                  </span>
                </button>
              )}
            </Card>

            {/* ==========================================
                SUMMARY
            ========================================== */}
            <section className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-[15px] font-semibold text-slate-900">
                Campaign Summary
              </h3>

              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Template</dt>
                  <dd className="min-w-0 break-words text-right font-semibold text-slate-900">
                    {selectedTemplate?.name || "Not selected"}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Schedule</dt>
                  <dd className="text-right font-semibold text-slate-900">
                    {scheduleLabel}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-slate-500">Audience</dt>
                  <dd className="text-right font-semibold text-slate-900">
                    {selectedCustomers.length} customer(s)
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
            <div className="min-w-0 text-xs font-medium text-green-700">
              {!isView && image && "✓ Campaign image selected"}
            </div>

            <div className="flex gap-3">
              {isView ? (
                <>
                  {canResend && (
                    <button
                      type="button"
                      onClick={onResend}
                      disabled={resending}
                      className={`${primaryButton} min-w-[150px]`}
                    >
                      {resending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Resending...
                        </>
                      ) : (
                        <>
                          <RotateCcw size={16} />
                          Resend Campaign
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={busy}
                    className={outlineButton}
                  >
                    Close
                  </button>
                </>
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
                    disabled={submitting || submitDisabled}
                    className={primaryButton}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {copy.submitting}
                      </>
                    ) : (
                      submitLabel || copy.submit
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}
