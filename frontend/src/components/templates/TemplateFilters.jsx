// import { ChevronDown, Filter, LayoutGrid, Table2 } from "lucide-react";

// const STATUS_OPTIONS = [
//   { value: "ALL", label: "All Status" },
//   { value: "DRAFT", label: "Draft" },
//   { value: "PENDING", label: "Pending" },
//   { value: "APPROVED", label: "Approved" },
//   { value: "REJECTED", label: "Rejected" },
// ];

// export default function TemplateFilters({
//   search,
//   setSearch,
//   statusFilter,
//   setStatusFilter,
//   view,
//   setView,
// }) {
//   const toggleClass = (active) =>
//     `flex h-9 w-11 items-center justify-center rounded-lg transition ${
//       active
//         ? "bg-green-500 text-white shadow-sm"
//         : "text-slate-500 hover:bg-slate-100"
//     }`;

//   return (
//     <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
//       {/* SEARCH */}
//       <input
//         type="text"
//         aria-label="Search templates"
//         placeholder="Search templates..."
//         value={search}
//         onChange={(e) => setSearch(e.target.value)}
//         className="h-11 w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
//       />

//       <div className="flex items-center gap-3">
//         {/* STATUS FILTER */}
//         <div className="relative flex-1 sm:flex-none">
//           <Filter
//             size={16}
//             className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
//           />

//           <select
//             aria-label="Filter by status"
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:w-44"
//           >
//             {STATUS_OPTIONS.map((option) => (
//               <option key={option.value} value={option.value}>
//                 {option.label}
//               </option>
//             ))}
//           </select>

//           <ChevronDown
//             size={16}
//             className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600"
//           />
//         </div>

//         {/* VIEW TOGGLE */}
//         <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
//           <button
//             type="button"
//             aria-label="Table view"
//             aria-pressed={view === "table"}
//             onClick={() => setView("table")}
//             className={toggleClass(view === "table")}
//           >
//             <Table2 size={18} />
//           </button>

//           <button
//             type="button"
//             aria-label="Card view"
//             aria-pressed={view === "card"}
//             onClick={() => setView("card")}
//             className={toggleClass(view === "card")}
//           >
//             <LayoutGrid size={18} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }



import { ChevronDown, Filter, LayoutGrid, Table2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Status" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function TemplateFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  view,
  setView,
}) {
  const toggleClass = (active) =>
    `flex h-9 w-11 items-center justify-center rounded-lg transition ${
      active
        ? "bg-green-500 text-white shadow-sm"
        : "text-slate-500 hover:bg-slate-100"
    }`;

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* SEARCH */}
      <input
        type="text"
        aria-label="Search templates"
        placeholder="Search templates..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-11 w-full min-w-0 rounded-xl sm:flex-1 border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
      />

      <div className="flex items-center gap-3">
        {/* STATUS FILTER */}
        <div className="relative flex-1 sm:flex-none">
          <Filter
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:w-44"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600"
          />
        </div>

        {/* VIEW TOGGLE */}
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            aria-label="Table view"
            aria-pressed={view === "table"}
            onClick={() => setView("table")}
            className={toggleClass(view === "table")}
          >
            <Table2 size={18} />
          </button>

          <button
            type="button"
            aria-label="Card view"
            aria-pressed={view === "card"}
            onClick={() => setView("card")}
            className={toggleClass(view === "card")}
          >
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}