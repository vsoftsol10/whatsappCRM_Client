import { Calendar, ChevronDown, X } from "lucide-react";

import {
  PRIORITY_OPTIONS,
  formatDateNumeric,
  inputClass,
} from "./taskHelpers";

/* ============================================================
   PILLS
   ============================================================ */

export function Pill({ tone, children }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium ${tone}`}
    >
      {children}
    </span>
  );
}

// A pill that is also a dropdown (native <select>, so it stays
// keyboard / screen-reader friendly).
export function PillSelect({
  value,
  options,
  tone,
  onChange,
  label,
}) {
  return (
    <div
      className={`relative inline-flex items-center rounded-full ${tone}`}
    >
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer appearance-none rounded-full bg-transparent py-1.5 pl-3.5 pr-7 text-xs font-medium text-inherit outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-slate-800"
          >
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={12}
        className="pointer-events-none absolute right-2.5"
      />
    </div>
  );
}

/* ============================================================
   FORM PARTS
   ============================================================ */

export function Field({
  label,
  required,
  error,
  className = "",
  children,
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-[15px] font-medium text-slate-900">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children}

      {error && (
        <p className="mt-1.5 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectBox({ error, children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${inputClass(error)} cursor-pointer appearance-none pr-11`}
      >
        {children}
      </select>

      <ChevronDown
        size={20}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

// Same fields for Add / Edit / View so all three modals look alike.
// `createdAt` (View only) adds the read-only "Create Date" row.
export function TaskFormFields({
  formData,
  errors = {},
  onChange,
  employees = [],
  disabled = false,
  loadingEmployees = false,
  createdAt,
}) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
      <Field
        label="Task Title"
        required
        error={errors.title}
      >
        <input
          name="title"
          placeholder="Enter Task Title"
          value={formData.title}
          onChange={onChange}
          disabled={disabled}
          className={inputClass(errors.title)}
        />
      </Field>

      <Field
        label="Assign Employee"
        required
        error={errors.assignedToId}
      >
        <SelectBox
          name="assignedToId"
          value={formData.assignedToId}
          onChange={onChange}
          disabled={disabled || loadingEmployees}
          error={errors.assignedToId}
        >
          <option value="">
            {loadingEmployees
              ? "Loading employees..."
              : "Unassigned"}
          </option>

          {(employees || []).map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </SelectBox>
      </Field>

      <Field
        label="Priority"
        required
        error={errors.priority}
      >
        <SelectBox
          name="priority"
          value={formData.priority}
          onChange={onChange}
          disabled={disabled}
          error={errors.priority}
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectBox>
      </Field>

      <Field
        label="Due Date"
        required
        error={errors.dueDate}
      >
        <div className="relative">
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={onChange}
            disabled={disabled}
            className={`${inputClass(
              errors.dueDate
            )} pr-12 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`}
          />

          <Calendar
            size={22}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
        </div>
      </Field>

      {createdAt !== undefined && (
        <Field label="Create Date" className="md:col-span-2">
          <input
            readOnly
            disabled
            value={formatDateNumeric(createdAt) || "-"}
            className={inputClass(false)}
          />
        </Field>
      )}

      <Field
        label="Description"
        required
        error={errors.description}
        className="md:col-span-2"
      >
        <textarea
          name="description"
          placeholder="Enter Description"
          rows={5}
          value={formData.description}
          onChange={onChange}
          disabled={disabled}
          className={`${inputClass(
            errors.description
          )} h-auto resize-y py-3 leading-relaxed`}
        />
      </Field>
    </div>
  );
}

/* ============================================================
   MODAL SHELL
   ============================================================ */

// Pass `onSubmit` to render the shell as a <form>.
export function TaskModalShell({
  title,
  onClose,
  closeDisabled = false,
  headerExtra,
  onSubmit,
  footer,
  children,
}) {
  const Wrapper = onSubmit ? "form" : "div";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-[2px]">
      <div className="flex min-h-screen items-center justify-center p-4">
        <Wrapper
          {...(onSubmit ? { onSubmit, noValidate: true } : {})}
          className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
        >
          {/* HEADER */}

          <div className="mb-6 flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold text-slate-900">
              {title}
            </h2>

            <div className="flex items-center gap-3">
              {headerExtra}

              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                disabled={closeDisabled}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* BODY */}

          <div className="max-h-[65vh] overflow-y-auto px-1 py-1">
            {children}
          </div>

          {/* FOOTER */}

          <div className="mt-6 flex justify-end gap-3">
            {footer}
          </div>
        </Wrapper>
      </div>
    </div>
  );
}

/* ============================================================
   PAGINATION
   ============================================================ */

function pageList(current, total) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 3) return [1, 2, 3, 4, "…", total];

  if (current >= total - 2) {
    return [1, "…", total - 3, total - 2, total - 1, total];
  }

  return [1, "…", current - 1, current, current + 1, "…", total];
}

export function TaskPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  sizes = [5, 10, 20, 50],
}) {
  const last = Math.max(1, totalPages);

  const sizeOptions = [...new Set([...sizes, itemsPerPage])].sort(
    (a, b) => a - b
  );

  const arrowClass =
    "flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
      {/* LEFT */}

      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          Page {currentPage} of {last}
        </span>

        <select
          aria-label="Rows per page"
          value={itemsPerPage}
          onChange={(e) =>
            onPageSizeChange(Number(e.target.value))
          }
          className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-green-500"
        >
          {sizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* RIGHT */}

      <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={arrowClass}
        >
          <ChevronDown size={16} className="rotate-90" />
        </button>

        {pageList(currentPage, last).map((p, i) =>
          p === "…" ? (
            <span
              key={`gap-${i}`}
              className="px-1 text-sm text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === currentPage ? "page" : undefined}
              className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-medium transition ${
                p === currentPage
                  ? "border border-green-500 bg-green-50 text-green-600"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="Next page"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= last}
          className={arrowClass}
        >
          <ChevronDown size={16} className="-rotate-90" />
        </button>
      </div>
    </div>
  );
}
