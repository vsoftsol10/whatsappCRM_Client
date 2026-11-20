import { useId } from "react";
import { ChevronDown } from "lucide-react";
import { PRIORITY_OPTIONS, priorityLabel } from "./ticketStyles";

const controlBase =
  "w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400";

function controlClass(hasError, readOnly) {
  if (readOnly) {
    return `${controlBase} cursor-default border-slate-200 bg-slate-50`;
  }

  return `${controlBase} disabled:cursor-not-allowed disabled:bg-slate-50 ${
    hasError
      ? "border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
  }`;
}

function Field({ label, htmlFor, showRequired, error, hint, className = "", children }) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-800"
      >
        {label}
        {showRequired && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {children}

      {error && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}

      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function SelectBox({ children, ...props }) {
  return (
    <div className="relative">
      <select {...props}>{children}</select>

      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

// The 5 ticket fields in a 2-column grid. Used by Add, Edit and View.
function TicketFields({
  values,
  errors = {},
  onChange,
  customers,
  employees,
  disabled = false,
  readOnly = false,
  customerLocked = false,
  unassignedLabel = "Select employee",
}) {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;

  // Required stars only make sense while editing
  const showRequired = !readOnly;
  const locked = disabled || readOnly;

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
      <Field
        label="Customer"
        htmlFor={id("customer")}
        showRequired={showRequired}
        error={errors.customerId}
        hint={customerLocked && !readOnly ? "The customer can't be changed after a ticket is created." : null}
      >
        <SelectBox
          id={id("customer")}
          value={values.customerId}
          disabled={locked || customerLocked}
          onChange={(e) => onChange("customerId", e.target.value)}
          className={`${controlClass(!!errors.customerId, readOnly)} h-11 appearance-none pr-10 disabled:opacity-100 ${
            readOnly || customerLocked ? "disabled:text-slate-900" : ""
          }`}
        >
          <option value="">Select customer</option>

          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </SelectBox>
      </Field>

      <Field
        label="Assign Employee"
        htmlFor={id("employee")}
        showRequired={showRequired}
        error={errors.assignedToId}
      >
        <SelectBox
          id={id("employee")}
          value={values.assignedToId}
          disabled={locked}
          onChange={(e) => onChange("assignedToId", e.target.value)}
          className={`${controlClass(!!errors.assignedToId, readOnly)} h-11 appearance-none pr-10 disabled:opacity-100 ${
            readOnly ? "disabled:text-slate-900" : ""
          }`}
        >
          <option value="">{unassignedLabel}</option>

          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </SelectBox>
      </Field>

      <Field
        label="Title"
        htmlFor={id("title")}
        showRequired={showRequired}
        error={errors.title}
      >
        <input
          id={id("title")}
          type="text"
          value={values.title}
          maxLength={150}
          readOnly={readOnly}
          disabled={disabled}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Enter title"
          className={`${controlClass(!!errors.title, readOnly)} h-11`}
        />
      </Field>

      <Field
        label="Priority"
        htmlFor={id("priority")}
        showRequired={showRequired}
        error={errors.priority}
      >
        <SelectBox
          id={id("priority")}
          value={values.priority}
          disabled={locked}
          onChange={(e) => onChange("priority", e.target.value)}
          className={`${controlClass(!!errors.priority, readOnly)} h-11 appearance-none pr-10 disabled:opacity-100 ${
            readOnly ? "disabled:text-slate-900" : ""
          }`}
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}

          {/* Urgent exists in the backend; keep it selectable for tickets that already have it */}
          {values.priority === "URGENT" && (
            <option value="URGENT">{priorityLabel("URGENT")}</option>
          )}
        </SelectBox>
      </Field>

      <Field
        label="Description"
        htmlFor={id("description")}
        showRequired={showRequired}
        error={errors.description}
        className="sm:col-span-2"
      >
        <textarea
          id={id("description")}
          rows={5}
          value={values.description}
          readOnly={readOnly}
          disabled={disabled}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Describe the issue"
          className={`${controlClass(!!errors.description, readOnly)} resize-none py-3`}
        />
      </Field>
    </div>
  );
}

export default TicketFields;
