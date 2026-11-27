// import {
//   ChevronDown,
//   Filter,
//   LayoutDashboard,
//   PanelsTopLeft,
// } from "lucide-react";

// import { LEAD_FILTER_OPTIONS } from "./leadHelpers";

// // Table / card switch. Icon only; the active one is solid green.
// function ViewToggle({ viewMode, onViewModeChange }) {
//   const options = [
//     { value: "list", label: "Table view", icon: PanelsTopLeft },
//     { value: "grid", label: "Card view", icon: LayoutDashboard },
//   ];

//   return (
//     <div
//       role="group"
//       aria-label="Change view"
//       className="inline-flex h-12 items-center gap-1 self-start rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:self-auto"
//     >
//       {options.map(({ value, label, icon: Icon }) => {
//         const isActive = viewMode === value;

//         return (
//           <button
//             key={value}
//             type="button"
//             title={label}
//             aria-label={label}
//             aria-pressed={isActive}
//             onClick={() => onViewModeChange(value)}
//             className={`flex h-10 w-11 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
//               isActive
//                 ? "bg-green-500 text-white shadow-sm"
//                 : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
//             }`}
//           >
//             <Icon size={18} />
//           </button>
//         );
//       })}
//     </div>
//   );
// }

// export default function LeadFilters({
//   searchTerm,
//   setSearchTerm,
//   selectedStatus,
//   setSelectedStatus,
//   viewMode,
//   onViewModeChange,
// }) {
//   return (
//     <div className="mb-6 flex flex-col gap-3 sm:flex-row">
//       {/* Search */}
//       <input
//         type="text"
//         aria-label="Search leads"
//         placeholder="Search leads..."
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
//       />

//       {/* Status filter */}
//       <div className="relative sm:w-52">
//         <Filter
//           size={18}
//           className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
//         />

//         <select
//           aria-label="Filter by status"
//           value={selectedStatus}
//           onChange={(e) => setSelectedStatus(e.target.value)}
//           className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
//         >
//           {LEAD_FILTER_OPTIONS.map((option) => (
//             <option key={option.value} value={option.value}>
//               {option.label}
//             </option>
//           ))}
//         </select>

//         <ChevronDown
//           size={18}
//           className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
//         />
//       </div>

//       {/* Table / card view */}
//       <ViewToggle
//         viewMode={viewMode}
//         onViewModeChange={onViewModeChange}
//       />
//     </div>
//   );
// }



import {
  ChevronDown,
  Filter,
  LayoutDashboard,
  PanelsTopLeft,
} from "lucide-react";

import { LEAD_FILTER_OPTIONS } from "./leadHelpers";

// Table / card switch. Icon only; the active one is solid green.
function ViewToggle({ viewMode, onViewModeChange }) {
  const options = [
    { value: "list", label: "Table view", icon: PanelsTopLeft },
    { value: "grid", label: "Card view", icon: LayoutDashboard },
  ];

  return (
    <div
      role="group"
      aria-label="Change view"
      className="inline-flex h-12 items-center gap-1 self-start rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:self-auto"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = viewMode === value;

        return (
          <button
            key={value}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            onClick={() => onViewModeChange(value)}
            className={`flex h-10 w-11 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
              isActive
                ? "bg-green-500 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            <Icon size={18} />
          </button>
        );
      })}
    </div>
  );
}

export default function LeadFilters({
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  viewMode,
  onViewModeChange,
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row">
      {/* Search */}
      <input
        type="text"
        aria-label="Search leads"
        placeholder="Search leads..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-12 w-full min-w-0 rounded-xl sm:flex-1 border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
      />

      {/* Status filter */}
      <div className="relative sm:w-52">
        <Filter
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <select
          aria-label="Filter by status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
        >
          {LEAD_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
        />
      </div>

      {/* Table / card view */}
      <ViewToggle
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
      />
    </div>
  );
}