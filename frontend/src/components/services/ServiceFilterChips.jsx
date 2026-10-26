import { useEffect, useState } from "react";
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
 */
export default function ServiceFilterChips({
  customers = [],
  value = [],
  onChange,
  disabled = false,
}) {
  const [services, setServices] = useState([]);

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
