import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { getServices } from "../../api/serviceApi";

// Special value meaning "customers who have no service".
export const NO_SERVICE = "NONE";

/**
 * Returns true when a customer should be shown for the selected filter.
 *  - filter empty            -> everyone
 *  - filter has service ids  -> customers having ANY of those services
 *  - filter has NO_SERVICE   -> customers without any service
 */
export const matchesServiceFilter = (customer, filter = []) => {
  if (!filter || filter.length === 0) return true;

  const customerServiceIds = (customer.services || []).map((s) => s.id);

  if (filter.includes(NO_SERVICE) && customerServiceIds.length === 0) {
    return true;
  }

  return customerServiceIds.some((id) => filter.includes(id));
};

/**
 * Chips that filter a customer list by service (used in campaign audience
 * pickers). Renders nothing when the company has no services, so campaigns
 * behave exactly as before for companies that don't use services.
 *
 * customers : the full customer list (each with a `services` array)
 * value     : array of selected filters (service ids and/or NO_SERVICE)
 * onChange  : (newFilter) => void
 * variant   : "chips" (default, unchanged) or "dropdown" (multi-select list)
 */
export default function ServiceFilterChips({
  customers = [],
  value = [],
  onChange,
  disabled = false,
  variant = "chips",
}) {
  const [services, setServices] = useState([]);

  // dropdown variant only
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close the dropdown when clicking anywhere outside it
  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);

    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getServices({ activeOnly: "true" });

        if (!cancelled) {
          setServices(data.services || []);
        }
      } catch (error) {
        console.error("Failed to load services:", error);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (services.length === 0) return null;

  const countFor = (serviceId) =>
    customers.filter((customer) =>
      (customer.services || []).some((s) => s.id === serviceId)
    ).length;

  const noServiceCount = customers.filter(
    (customer) => (customer.services || []).length === 0
  ).length;

  const toggle = (key) => {
    if (disabled) return;

    onChange(
      value.includes(key)
        ? value.filter((item) => item !== key)
        : [...value, key]
    );
  };

  // ------------------------------------------------------------
  // DROPDOWN VARIANT
  // ------------------------------------------------------------
  if (variant === "dropdown") {
    const options = [
      ...services.map((service) => ({
        key: service.id,
        label: `${service.name} (${countFor(service.id)})`,
      })),
      { key: NO_SERVICE, label: `No service (${noServiceCount})` },
    ];

    const selectedLabels = options
      .filter((option) => value.includes(option.key))
      .map((option) => option.label);

    const summary =
      selectedLabels.length === 0
        ? `All customers (${customers.length})`
        : selectedLabels.join(", ");

    const rowClass = (selected) =>
      `flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${
        selected ? "font-semibold text-slate-900" : "text-slate-700"
      }`;

    const boxClass = (selected) =>
      `flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
        selected
          ? "border-[#25D366] bg-[#25D366] text-white"
          : "border-slate-300 bg-white text-transparent"
      }`;

    return (
      <div className="mb-3" ref={dropdownRef}>
        <p className="mb-2 text-xs font-semibold text-gray-600">
          Filter by service
        </p>

        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setOpen((prev) => !prev)}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition hover:border-[#25D366] focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="truncate">{summary}</span>

            <ChevronDown
              size={18}
              className={`shrink-0 text-slate-500 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div
              role="listbox"
              aria-multiselectable="true"
              className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="option"
                aria-selected={value.length === 0}
                onClick={() => !disabled && onChange([])}
                disabled={disabled}
                className={rowClass(value.length === 0)}
              >
                <span className={boxClass(value.length === 0)}>
                  <Check size={12} strokeWidth={3} />
                </span>
                All customers ({customers.length})
              </button>

              {options.map((option) => {
                const selected = value.includes(option.key);

                return (
                  <button
                    key={option.key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => toggle(option.key)}
                    disabled={disabled}
                    className={rowClass(selected)}
                  >
                    <span className={boxClass(selected)}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const chipClass = (selected) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
      selected
        ? "border-[#25D366] bg-[#25D366] text-black"
        : "border-gray-300 bg-white text-slate-700 hover:border-[#25D366] hover:bg-[#DCF8C6]"
    }`;

  return (
    <div className="mb-3">
      <p className="mb-2 text-xs font-semibold text-gray-600">
        Filter by service
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => !disabled && onChange([])}
          disabled={disabled}
          className={chipClass(value.length === 0)}
        >
          All customers ({customers.length})
        </button>

        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => toggle(service.id)}
            disabled={disabled}
            className={chipClass(value.includes(service.id))}
          >
            {service.name} ({countFor(service.id)})
          </button>
        ))}

        <button
          type="button"
          onClick={() => toggle(NO_SERVICE)}
          disabled={disabled}
          className={chipClass(value.includes(NO_SERVICE))}
        >
          No service ({noServiceCount})
        </button>
      </div>
    </div>
  );
}