// import { useEffect, useState } from "react";
// import { getServices } from "../../api/serviceApi";

// /**
//  * Optional multi-select of services, used in Add / Edit Customer.
//  *
//  * value    : array of selected service ids
//  * onChange : (newIds) => void
//  */
// export default function ServiceMultiSelect({
//   value = [],
//   onChange,
//   disabled = false,
// }) {
//   const [services, setServices] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;

//     const load = async () => {
//       try {
//         const data = await getServices();

//         if (!cancelled) {
//           setServices(data.services || []);
//         }
//       } catch (error) {
//         console.error("Failed to load services:", error);

//         if (!cancelled) {
//           setServices([]);
//         }
//       } finally {
//         if (!cancelled) {
//           setLoading(false);
//         }
//       }
//     };

//     load();

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   // Show active services, plus any inactive one the customer already has.
//   const visibleServices = services.filter(
//     (service) => service.isActive || value.includes(service.id)
//   );

//   const toggle = (id) => {
//     if (disabled) return;

//     onChange(
//       value.includes(id)
//         ? value.filter((serviceId) => serviceId !== id)
//         : [...value, id]
//     );
//   };

//   return (
//     <div>
//       <label className="block mb-2 font-semibold text-black">
//         Services{" "}
//         <span className="font-normal text-gray-400">(optional)</span>
//       </label>

//       {loading ? (
//         <p className="text-sm text-gray-500">Loading services...</p>
//       ) : visibleServices.length === 0 ? (
//         <p className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
//           No services created yet. You can add services from the Services page.
//         </p>
//       ) : (
//         <div className="flex flex-wrap gap-2">
//           {visibleServices.map((service) => {
//             const selected = value.includes(service.id);

//             return (
//               <button
//                 key={service.id}
//                 type="button"
//                 onClick={() => toggle(service.id)}
//                 disabled={disabled}
//                 className={`rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
//                   selected
//                     ? "border-[#25D366] bg-[#25D366] text-black shadow-sm"
//                     : "border-gray-300 bg-white text-slate-700 hover:border-[#25D366] hover:bg-[#DCF8C6]"
//                 }`}
//               >
//                 {selected ? "✓ " : ""}
//                 {service.name}
//                 {!service.isActive ? " (inactive)" : ""}
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {value.length > 0 && (
//         <button
//           type="button"
//           onClick={() => !disabled && onChange([])}
//           disabled={disabled}
//           className="mt-2 text-xs font-medium text-gray-500 underline hover:text-gray-700 disabled:cursor-not-allowed"
//         >
//           Clear services
//         </button>
//       )}
//     </div>
//   );
// }



import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { getServices } from "../../api/serviceApi";

/**
 * Optional multi-select DROPDOWN of services, used in Add / Edit Customer.
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
  const [open, setOpen] = useState(false);

  const containerRef = useRef(null);

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

  // Close dropdown when clicking outside of it
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  // Show active services, plus any inactive one the customer already has.
  const visibleServices = services.filter(
    (service) => service.isActive || value.includes(service.id)
  );

  const selectedServices = visibleServices.filter((service) =>
    value.includes(service.id)
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
    <div ref={containerRef} className="relative">
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
        <>
          {/* Dropdown trigger */}
          <button
            type="button"
            onClick={() => !disabled && setOpen((prev) => !prev)}
            disabled={disabled}
            className={`flex w-full items-center justify-between gap-2 rounded-lg border bg-white px-4 py-3 text-left outline-none disabled:cursor-not-allowed disabled:bg-gray-100 ${
              open ? "border-[#25D366]" : "border-gray-300"
            }`}
          >
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {selectedServices.length === 0 ? (
                <span className="text-gray-500">Select Services</span>
              ) : (
                selectedServices.map((service) => (
                  <span
                    key={service.id}
                    className="inline-flex items-center gap-1 rounded-full bg-[#DCF8C6] px-3 py-1 text-sm font-semibold text-black"
                  >
                    {service.name}
                    {!service.isActive ? " (inactive)" : ""}
                  </span>
                ))
              )}
            </span>

            <ChevronDown
              size={18}
              className={`shrink-0 text-gray-500 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown list */}
          {open && (
            <div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {visibleServices.map((service) => {
                const selected = value.includes(service.id);

                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggle(service.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[#DCF8C6] ${
                      selected ? "bg-[#F0FBE8] font-semibold" : ""
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-[#25D366] bg-[#25D366] text-black"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selected && <Check size={14} strokeWidth={3} />}
                    </span>

                    <span className="text-slate-800">
                      {service.name}
                      {!service.isActive ? " (inactive)" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {value.length > 0 && (
        <button
          type="button"
          onClick={() => !disabled && onChange([])}
          disabled={disabled}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 underline hover:text-gray-700 disabled:cursor-not-allowed"
        >
          <X size={12} />
          Clear services
        </button>
      )}
    </div>
  );
}
