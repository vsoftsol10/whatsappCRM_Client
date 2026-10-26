import { useEffect, useState } from "react";
import { getServices } from "../../api/serviceApi";

/**
 * Optional multi-select of services, used in Add / Edit Customer.
 *
 * value    : array of selected service ids
 * onChange : (newIds) => void
 */
export default function ServiceMultiSelect({
  value = [],
  onChange,
  disabled = false,
}) {
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

        if (!cancelled) {
          setServices([]);
        }
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

  // Show active services, plus any inactive one the customer already has.
  const visibleServices = services.filter(
    (service) => service.isActive || value.includes(service.id)
  );

  const toggle = (id) => {
    if (disabled) return;

    onChange(
      value.includes(id)
        ? value.filter((serviceId) => serviceId !== id)
        : [...value, id]
    );
  };

  return (
    <div>
      <label className="block mb-2 font-semibold text-black">
        Services{" "}
        <span className="font-normal text-gray-400">(optional)</span>
      </label>

      {loading ? (
        <p className="text-sm text-gray-500">Loading services...</p>
      ) : visibleServices.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
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
                onClick={() => toggle(service.id)}
                disabled={disabled}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? "border-[#25D366] bg-[#25D366] text-black shadow-sm"
                    : "border-gray-300 bg-white text-slate-700 hover:border-[#25D366] hover:bg-[#DCF8C6]"
                }`}
              >
                {selected ? "✓ " : ""}
                {service.name}
                {!service.isActive ? " (inactive)" : ""}
              </button>
            );
          })}
        </div>
      )}

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => !disabled && onChange([])}
          disabled={disabled}
          className="mt-2 text-xs font-medium text-gray-500 underline hover:text-gray-700 disabled:cursor-not-allowed"
        >
          Clear services
        </button>
      )}
    </div>
  );
}
