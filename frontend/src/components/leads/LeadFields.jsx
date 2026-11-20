import { useId } from "react";
import { ChevronDown } from "lucide-react";

import { LEAD_STATUS_OPTIONS, STANDARD_SOURCES } from "./leadHelpers";

// Same look as the Customer form fields
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

// <select> with the chevron drawn on top (native arrow is hidden)
function SelectBox({ readOnly, hasError, children, ...selectProps }) {
  return (
    <div className="relative">
      <select
        {...selectProps}
        className={`${inputClass(hasError, readOnly)} appearance-none pr-10 disabled:opacity-100 ${
          readOnly ? "disabled:text-slate-900" : ""
        }`}
      >
        {children}
      </select>

      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

/**
 * Lead form fields.
 *
 *  values / errors / onChange : normal controlled-form props
 *  employees                   : list for "Assign Employee"
 *  currentAssignee             : lead.assignedTo - kept selectable even if
 *                                the employee is not in `employees`
 *  disabled                    : locks the form while saving
 *  readOnly                    : "View Lead" mode
 *  emailRequired / phoneRequired / requirementsRequired
 *                              : social leads (Instagram / Messenger) can be
 *                                saved without these, so Edit turns them off
 *  phoneMaxLength              : optional input limit for the phone box
 */
export default function LeadFields({
  values,
  errors = {},
  onChange,
  employees = [],
  currentAssignee = null,
  disabled = false,
  readOnly = false,
  emailRequired = true,
  phoneRequired = true,
  requirementsRequired = true,
  phoneMaxLength,
}) {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;

  const showRequired = !readOnly;
  const locked = disabled || readOnly;

  // In the empty read-only boxes show a dash, not "Enter ..."
  const hint = (text) => (readOnly ? "-" : text);

  // Keep a lead's real source (e.g. "Instagram AI") selectable
  const hasCustomSource =
    values.source && !STANDARD_SOURCES.includes(values.source);

  // Keep the current assignee visible even if the employee list has not
  // loaded (or no longer contains that person)
  const showAssigneeFallback =
    currentAssignee?.id &&
    !employees.some((employee) => employee.id === currentAssignee.id);

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
      {/* Name */}
      <Field
        label="Name"
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
          placeholder={hint("Enter lead name")}
          className={inputClass(!!errors.name, readOnly)}
        />
      </Field>

      {/* Email */}
      <Field
        label="Email"
        htmlFor={id("email")}
        required={emailRequired}
        showRequired={showRequired}
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
          placeholder={hint("Enter email")}
          className={inputClass(!!errors.email, readOnly)}
        />
      </Field>

      {/* Phone */}
      <Field
        label="Phone Number"
        htmlFor={id("phone")}
        required={phoneRequired}
        showRequired={showRequired}
        error={errors.phone}
      >
        <input
          id={id("phone")}
          type="tel"
          name="phone"
          inputMode="numeric"
          maxLength={phoneMaxLength}
          value={values.phone}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={hint("Enter phone number")}
          className={inputClass(!!errors.phone, readOnly)}
        />
      </Field>

      {/* Company */}
      <Field label="Company" htmlFor={id("company")}>
        <input
          id={id("company")}
          type="text"
          name="company"
          value={values.company}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={hint("Enter company name")}
          className={inputClass(false, readOnly)}
        />
      </Field>

      {/* Source */}
      <Field
        label="Source"
        htmlFor={id("source")}
        required
        showRequired={showRequired}
        error={errors.source}
      >
        <SelectBox
          id={id("source")}
          name="source"
          value={values.source}
          onChange={onChange}
          disabled={locked}
          readOnly={readOnly}
          hasError={!!errors.source}
        >
          <option value="">Select source</option>

          {hasCustomSource && (
            <option value={values.source}>{values.source}</option>
          )}

          {STANDARD_SOURCES.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </SelectBox>
      </Field>

      {/* Assign employee */}
      <Field label="Assign Employee" htmlFor={id("assignedToId")}>
        <SelectBox
          id={id("assignedToId")}
          name="assignedToId"
          value={values.assignedToId}
          onChange={onChange}
          disabled={locked}
          readOnly={readOnly}
        >
          <option value="">Unassigned</option>

          {showAssigneeFallback && (
            <option value={currentAssignee.id}>
              {currentAssignee.name}
            </option>
          )}

          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </SelectBox>
      </Field>

      {/* Status (left column only, as in the design) */}
      <Field
        label="Status"
        htmlFor={id("status")}
        required
        showRequired={showRequired}
      >
        <SelectBox
          id={id("status")}
          name="status"
          value={values.status}
          onChange={onChange}
          disabled={locked}
          readOnly={readOnly}
        >
          {LEAD_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectBox>
      </Field>

      {/* Requirements */}
      <Field
        label="Requirements"
        htmlFor={id("requirements")}
        required={requirementsRequired}
        showRequired={showRequired}
        error={errors.requirements}
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
          placeholder={hint("Enter customer requirements")}
          className={`${inputClass(!!errors.requirements, readOnly)} h-auto min-h-[110px] py-3 ${
            readOnly ? "resize-none" : "resize-y"
          }`}
        />
      </Field>
    </div>
  );
}
