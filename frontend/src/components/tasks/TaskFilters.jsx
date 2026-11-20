import {
  Search,
  Filter,
  ChevronDown,
  LayoutGrid,
  Table2,
} from "lucide-react";

import {
  STATUS_OPTIONS,
} from "./taskHelpers";

export default function TaskFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
}) {
  const toggleClass = (active) =>
    `flex h-10 w-11 items-center justify-center rounded-lg transition ${
      active
        ? "bg-green-500 text-white shadow-sm"
        : "text-slate-500 hover:bg-slate-100"
    }`;

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* SEARCH */}

      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          placeholder="Search task..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100"
        />
      </div>

      {/* STATUS FILTER */}

      <div className="relative">
        <Filter
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
        />

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-11 pr-11 text-sm font-medium text-slate-800 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100 sm:w-52"
        >
          <option value="ALL">All Status</option>

          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-600"
        />
      </div>

      {/* VIEW TOGGLE */}

      <div className="flex shrink-0 items-center gap-1 self-start rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:self-auto">
        <button
          type="button"
          aria-label="Table view"
          aria-pressed={viewMode === "LIST"}
          onClick={() => setViewMode("LIST")}
          className={toggleClass(viewMode === "LIST")}
        >
          <Table2 size={18} />
        </button>

        <button
          type="button"
          aria-label="Card view"
          aria-pressed={viewMode === "KANBAN"}
          onClick={() => setViewMode("KANBAN")}
          className={toggleClass(viewMode === "KANBAN")}
        >
          <LayoutGrid size={18} />
        </button>
      </div>
    </div>
  );
}
