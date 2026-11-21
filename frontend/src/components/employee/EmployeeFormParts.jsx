// // Shared building blocks for the Add / Edit / View Employee popups.
// import { ChevronDown, X } from "lucide-react";

// export const ROLE_OPTIONS = [
//   { value: "USER", label: "User" },
//   { value: "ADMIN", label: "Admin" },
// ];

// export const roleLabel = (role) =>
//   ROLE_OPTIONS.find((r) => r.value === (role || "").toUpperCase())?.label ||
//   role ||
//   "-";

// export const fieldInputClass = (hasError = false) =>
//   `h-[52px] w-full rounded-xl border bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 ${
//     hasError
//       ? "border-red-500 focus:ring-2 focus:ring-red-100"
//       : "border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
//   }`;

// export const fieldTextareaClass = (hasError = false) =>
//   `min-h-[150px] w-full resize-y rounded-xl border bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 ${
//     hasError
//       ? "border-red-500 focus:ring-2 focus:ring-red-100"
//       : "border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
//   }`;

// export const cancelButtonClass =
//   "h-12 rounded-xl border border-slate-200 bg-white px-7 text-base font-medium text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

// export const primaryButtonClass =
//   "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-8 text-base font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60";

// // White rounded popup with a title and a round close button.
// export function EmployeeModalShell({
//   title,
//   onClose,
//   closeDisabled = false,
//   onBackdropClick,
//   headerExtra,
//   children,
// }) {
//   return (
//     <div
//       className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4"
//       onMouseDown={(e) => {
//         if (e.target === e.currentTarget) onBackdropClick?.();
//       }}
//     >
//       <div
//         role="dialog"
//         aria-modal="true"
//         aria-label={title}
//         className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
//       >
//         <div className="mb-8 flex items-center justify-between gap-3">
//           <h1 className="text-2xl font-bold text-slate-900">{title}</h1>

//           <div className="flex items-center gap-3">
//             {headerExtra}

//             <button
//               type="button"
//               onClick={onClose}
//               disabled={closeDisabled}
//               aria-label="Close"
//               className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         {children}
//       </div>
//     </div>
//   );
// }

// export function FormSection({ title, children }) {
//   return (
//     <section>
//       <h2 className="mb-5 text-xl font-bold text-slate-900">{title}</h2>
//       {children}
//     </section>
//   );
// }

// // Label (with optional red *) + the input + an error line.
// export function FormField({ label, required, error, className = "", children }) {
//   return (
//     <div className={className}>
//       <label className="block">
//         <span className="mb-2 block text-base text-slate-900">
//           {label}
//           {required && <span className="ml-1 text-red-500">*</span>}
//         </span>
//         {children}
//       </label>

//       {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
//     </div>
//   );
// }

// // Select with the arrow drawn by us so it matches the other inputs.
// export function SelectInput({ hasError = false, children, ...props }) {
//   return (
//     <div className="relative">
//       <select
//         {...props}
//         className={`${fieldInputClass(hasError)} appearance-none pr-11`}
//       >
//         {children}
//       </select>

//       <ChevronDown
//         size={18}
//         className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
//       />
//     </div>
//   );
// }

// export function FormActions({ children }) {
//   return <div className="flex justify-end gap-3 pt-8">{children}</div>;
// }




// Shared building blocks for the Add / Edit / View Employee popups.
import { ChevronDown, X } from "lucide-react";

export const ROLE_OPTIONS = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
];

export const roleLabel = (role) =>
  ROLE_OPTIONS.find((r) => r.value === (role || "").toUpperCase())?.label ||
  role ||
  "-";

export const fieldInputClass = (hasError = false) =>
  `h-[52px] w-full rounded-xl border bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 ${
    hasError
      ? "border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
  }`;

export const fieldTextareaClass = (hasError = false) =>
  `min-h-[150px] w-full resize-y rounded-xl border bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 ${
    hasError
      ? "border-red-500 focus:ring-2 focus:ring-red-100"
      : "border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
  }`;

export const cancelButtonClass =
  "h-12 rounded-xl border border-slate-200 bg-white px-7 text-base font-medium text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButtonClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-8 text-base font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60";

// White rounded popup with a title and a round close button.
export function EmployeeModalShell({
  title,
  onClose,
  closeDisabled = false,
  onBackdropClick,
  headerExtra,
  children,
}) {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onBackdropClick?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-8 flex items-center justify-between gap-3">
          <h1 className="crm-title">{title}</h1>

          <div className="flex items-center gap-3">
            {headerExtra}

            <button
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              aria-label="Close"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

export function FormSection({ title, children }) {
  return (
    <section>
      <h2 className="mb-5 text-xl font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

// Label (with optional red *) + the input + an error line.
export function FormField({ label, required, error, className = "", children }) {
  return (
    <div className={className}>
      <label className="block">
        <span className="mb-2 block text-base text-slate-900">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </span>
        {children}
      </label>

      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
}

// Select with the arrow drawn by us so it matches the other inputs.
export function SelectInput({ hasError = false, children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${fieldInputClass(hasError)} appearance-none pr-11`}
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

export function FormActions({ children }) {
  return <div className="flex justify-end gap-3 pt-8">{children}</div>;
}
