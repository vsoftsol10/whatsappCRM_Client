import { useEffect, useId, useState } from "react";
import { X, ChevronDown } from "lucide-react";
import { getServices } from "../../api/serviceApi";

// Suggestions only: Source stays a free text box, so imported or
// AI-captured values (e.g. "Instagram AI") are never lost.
const SOURCE_SUGGESTIONS = [
  "WhatsApp",
  "Instagram",
  "Facebook",
  "Website",
  "Referral",
];

const inputBase =
  "h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400";

function inputClass(hasError, readOnly) {
  if (readOnly) {
    return `${inputBase} cursor-default border-slate-200 bg-slate-50`;
  }

  return `${inputBase} disabled:cursor-not-allowed disabled:bg-slate-50 ${
    hasError
      ? "border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
  }`;
}

// =========================
// MODAL SHELL (Add / Edit / View all share this)
// =========================

export function CustomerModal({
  title,
  onClose,
  closeDisabled = false,
  action = null,
  subtitle = null,
  maxWidth = "max-w-2xl",
  children,
}) {
  const titleId = useId();

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !closeDisabled) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, closeDisabled]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`max-h-[92vh] w-full ${maxWidth} overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-9`}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-2xl font-bold text-slate-900"
            >
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 truncate text-sm text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {action}

            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              disabled={closeDisabled}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

// =========================
// FIELD WRAPPER
// =========================

function Field({
  label,
  htmlFor,
  required = false,
  showRequired = true,
  error,
  className = "",
  children,
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-800"
      >
        {label}
        {required && showRequired && (
          <span className="ml-0.5 text-red-500">*</span>
        )}
      </label>

      {children}

      {error && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

// =========================
// SERVICE CHIPS
// =========================

function ServiceChips({ value = [], onChange, disabled, readOnly }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getServices();

        if (!cancelled) {
          setServices(data.services || []);
        }
      } catch (error) {
        console.error("Failed to load services:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Active services, plus any inactive one the customer already has
  const visibleServices = services.filter(
    (service) => service.isActive || value.includes(service.id)
  );

  const toggle = (id) => {
    onChange(
      value.includes(id)
        ? value.filter((serviceId) => serviceId !== id)
        : [...value, id]
    );
  };

  const locked = disabled || readOnly;

  return (
    <div className="mt-6">
      <p className="mb-2 text-sm font-medium text-slate-800">
        Services (optional)
      </p>

      {loading ? (
        <p className="text-sm text-slate-500">Loading services...</p>
      ) : visibleServices.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
          No services created yet. You can add services from the Services page.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {visibleServices.map((service) => {
            const selected = value.includes(service.id);

            return (
              <button
                key={service.id}
                type="button"
                aria-pressed={selected}
                disabled={locked}
                onClick={() => toggle(service.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-default ${
                  selected
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-slate-200 bg-white text-slate-800"
                } ${
                  locked
                    ? ""
                    : selected
                      ? "hover:bg-green-600"
                      : "hover:border-green-400 hover:bg-green-50"
                }`}
              >
                {service.name}
                {!service.isActive ? " (inactive)" : ""}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =========================
// ALL FIELDS (2-column grid)
// =========================

export function CustomerFields({
  values,
  errors = {},
  onChange,
  onServicesChange,
  disabled = false,
  readOnly = false,
}) {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;

  // Read-only: show the values, hide the "required" stars
  const showRequired = !readOnly;
  const locked = disabled || readOnly;

  return (
    <>
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <Field
          label="Customer Name"
          htmlFor={id("name")}
          required
          showRequired={showRequired}
          error={errors.name}
        >
          <input
            id={id("name")}
            type="text"
            name="name"
            value={values.name}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Enter customer name"
            className={inputClass(!!errors.name, readOnly)}
          />
        </Field>

        <Field
          label="Phone Number"
          htmlFor={id("phone")}
          required
          showRequired={showRequired}
          error={errors.phone}
        >
          <input
            id={id("phone")}
            type="tel"
            name="phone"
            inputMode="numeric"
            value={values.phone}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Enter phone number"
            className={inputClass(!!errors.phone, readOnly)}
          />
        </Field>

        <Field
          label="Email (optional)"
          htmlFor={id("email")}
          error={errors.email}
        >
          <input
            id={id("email")}
            type="email"
            name="email"
            value={values.email}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Enter email"
            className={inputClass(!!errors.email, readOnly)}
          />
        </Field>

        <Field
          label="Company"
          htmlFor={id("company")}
          required
          showRequired={showRequired}
          error={errors.company}
        >
          <input
            id={id("company")}
            type="text"
            name="company"
            value={values.company}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Enter company name"
            className={inputClass(!!errors.company, readOnly)}
          />
        </Field>

        <Field label="Source" htmlFor={id("source")}>
          <input
            id={id("source")}
            type="text"
            name="source"
            list={readOnly ? undefined : id("source-list")}
            value={values.source}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Enter source (e.g. WhatsApp, Instagram)"
            className={inputClass(false, readOnly)}
          />

          <datalist id={id("source-list")}>
            {SOURCE_SUGGESTIONS.map((source) => (
              <option key={source} value={source} />
            ))}
          </datalist>
        </Field>

        <Field
          label="Status"
          htmlFor={id("status")}
          required
          showRequired={showRequired}
          error={errors.status}
        >
          <div className="relative">
            <select
              id={id("status")}
              name="status"
              value={values.status}
              onChange={onChange}
              disabled={locked}
              className={`${inputClass(!!errors.status, readOnly)} appearance-none pr-10 disabled:opacity-100 ${
                readOnly ? "disabled:text-slate-900" : ""
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
        </Field>

        <Field
          label="Requirements"
          htmlFor={id("requirements")}
          className="sm:col-span-2"
        >
          <textarea
            id={id("requirements")}
            name="requirements"
            rows={4}
            value={values.requirements}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            placeholder="Enter customer requirements"
            className={`${inputClass(false, readOnly)} h-auto resize-none py-3`}
          />
        </Field>
      </div>

      <ServiceChips
        value={values.serviceIds}
        onChange={onServicesChange}
        disabled={disabled}
        readOnly={readOnly}
      />
    </>
  );
}

// Cancel / Close + main action row shared by the three modals
export function CustomerModalFooter({ children }) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}

export const secondaryButtonClass =
  "inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButtonClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-7 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60";