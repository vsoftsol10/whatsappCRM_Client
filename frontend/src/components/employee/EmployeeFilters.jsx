import { Filter, ChevronDown } from "lucide-react";

const STATUS_OPTIONS = [
  { key: "ALL", label: "All Status" },
  { key: "ACTIVE", label: "Active" },
  { key: "INACTIVE", label: "Inactive" },
];

const ROLE_CHIPS = [
  { key: "ALL", label: "All" },
  { key: "USER", label: "Employees" },
  { key: "ADMIN", label: "Admin" },
];

// Search box + status dropdown, and the role chips underneath.
function EmployeeFilters({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search employee by name or email..."
          aria-label="Search employees"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />

        <div className="relative sm:w-52">
          <Filter
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
        </div>
      </div>

      <div
        className="flex flex-wrap gap-3"
        role="group"
        aria-label="Filter by role"
      >
        {ROLE_CHIPS.map((chip) => {
          const isActive = roleFilter === chip.key;

          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => setRoleFilter(chip.key)}
              className={`h-10 rounded-full border px-6 text-sm font-medium transition ${
                isActive
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-slate-200 bg-white text-slate-800 hover:border-green-500 hover:bg-green-50"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default EmployeeFilters;
