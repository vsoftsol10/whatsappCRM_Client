import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Search,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { getAuditLogs } from "../../api/auditLogApi";

// =====================================================
// CONSTANTS
// =====================================================

const MODULE_OPTIONS = [
  "CUSTOMER",
  "EMPLOYEE",
  "LEAD",
  "DEAL",
  "TASK",
  "TICKET",
  "CAMPAIGN",
  "TEMPLATE",
  "USER",
  "COMPANY",
  "BACKUP",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "user", label: "User (A-Z)" },
  { value: "module", label: "Module (A-Z)" },
  { value: "action", label: "Action (A-Z)" },
];

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

const ACTION_STYLES = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-600",
  STATUS_CHANGE: "bg-amber-100 text-amber-600",
  ASSIGN: "bg-purple-100 text-purple-700",
  RESTORE: "bg-teal-100 text-teal-700",
};

const formatLabel = (value = "") => value.replace(/_/g, " ");

const toTitleCase = (value = "") =>
  value.charAt(0) + value.slice(1).toLowerCase();

const formatDate = (dateStr) => {
  const date = new Date(dateStr);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// "YYYY-MM-DD" (from the date input) -> ISO string in the user's local day
const startOfDayISO = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
};

const endOfDayISO = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
};

// 1 2 3 ... 10 style page list
const getPageNumbers = (current, total) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 3) return [1, 2, 3, 4, "...", total];

  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
};

// =====================================================
// SMALL UI PIECES
// =====================================================

const toolbarControl =
  "h-12 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20";

function SelectBox({ value, onChange, children, leftIcon, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      {leftIcon && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {leftIcon}
        </span>
      )}

      <select
        value={value}
        onChange={onChange}
        className={`${toolbarControl} w-full cursor-pointer appearance-none pr-10 ${
          leftIcon ? "pl-12" : "pl-4"
        }`}
      >
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-700" />
    </div>
  );
}

// =====================================================
// PAGE
// =====================================================

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Date popover
  const [dateOpen, setDateOpen] = useState(false);
  const [draftRange, setDraftRange] = useState({ start: "", end: "" });
  const dateRef = useRef(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const requestId = useRef(0);

  // -----------------------------------------------------
  // Debounce the search box
  // -----------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch((prev) => {
        const next = searchInput.trim();
        if (prev !== next) setPage(1);
        return next;
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // -----------------------------------------------------
  // Close the date popover on outside click / Escape
  // -----------------------------------------------------
  useEffect(() => {
    if (!dateOpen) return undefined;

    const onClick = (e) => {
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setDateOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setDateOpen(false);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [dateOpen]);

  // -----------------------------------------------------
  // Load audit logs
  // -----------------------------------------------------
  useEffect(() => {
    const currentRequest = ++requestId.current;

    const load = async () => {
      try {
        setLoading(true);

        const params = { page, limit, sort };

        if (search) params.search = search;
        if (moduleFilter) params.module = moduleFilter;
        if (dateRange.start) params.startDate = startOfDayISO(dateRange.start);
        if (dateRange.end) params.endDate = endOfDayISO(dateRange.end);

        const response = await getAuditLogs(params);

        // Ignore out-of-date responses
        if (currentRequest !== requestId.current) return;

        setLogs(response.data || []);
        setMeta({
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 1,
        });
      } catch (error) {
        if (currentRequest !== requestId.current) return;

        console.error("Failed to load audit logs:", error);
        toast.error(
          error.response?.data?.message || "Failed to load audit logs."
        );
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    };

    load();
  }, [page, limit, sort, search, moduleFilter, dateRange]);

  // -----------------------------------------------------
  // Handlers
  // -----------------------------------------------------
  const hasDateFilter = Boolean(dateRange.start || dateRange.end);

  const hasActiveFilters =
    Boolean(searchInput) || Boolean(moduleFilter) || hasDateFilter;

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setModuleFilter("");
    setDateRange({ start: "", end: "" });
    setDraftRange({ start: "", end: "" });
    setPage(1);
  };

  const openDatePicker = () => {
    setDraftRange(dateRange);
    setDateOpen((open) => !open);
  };

  const applyDateRange = () => {
    let { start, end } = draftRange;

    // keep the range valid if the user picked it the wrong way round
    if (start && end && start > end) [start, end] = [end, start];

    setDateRange({ start, end });
    setPage(1);
    setDateOpen(false);
  };

  const resetDateRange = () => {
    setDraftRange({ start: "", end: "" });
    setDateRange({ start: "", end: "" });
    setPage(1);
    setDateOpen(false);
  };

  const totalPages = Math.max(1, meta.totalPages);
  const pageNumbers = useMemo(
    () => getPageNumbers(page, totalPages),
    [page, totalPages]
  );

  const goToPage = (next) => {
    if (next < 1 || next > totalPages || next === page) return;
    setPage(next);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="p-4 sm:p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Audit Logs
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track who did what, and when, across your CRM.
        </p>
      </div>

      {/* TOOLBAR */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search Audit logs..."
            className={`${toolbarControl} w-full pl-11 pr-4 placeholder:text-slate-400`}
          />
        </div>

        <SelectBox
          value={moduleFilter}
          onChange={(e) => {
            setModuleFilter(e.target.value);
            setPage(1);
          }}
          leftIcon={<Filter className="h-4 w-4" />}
          className="w-full sm:w-52"
        >
          <option value="">All Modules</option>
          {MODULE_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {toTitleCase(m)}
            </option>
          ))}
        </SelectBox>

        <SelectBox
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-48"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.value === "newest" ? "Sort by" : o.label}
            </option>
          ))}
        </SelectBox>

        {/* DATE RANGE */}
        <div className="relative" ref={dateRef}>
          <button
            type="button"
            aria-label="Filter by date"
            onClick={openDatePicker}
            className={`relative flex h-12 w-14 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm transition hover:bg-[#1ebe5a] ${
              hasDateFilter ? "ring-2 ring-[#25D366]/40 ring-offset-2" : ""
            }`}
          >
            <Calendar className="h-5 w-5" />
            {hasDateFilter && (
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-amber-400" />
            )}
          </button>

          {dateOpen && (
            <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  From
                  <input
                    type="date"
                    value={draftRange.start}
                    max={draftRange.end || undefined}
                    onChange={(e) =>
                      setDraftRange((prev) => ({
                        ...prev,
                        start: e.target.value,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal normal-case text-slate-700 outline-none focus:border-[#25D366]"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  To
                  <input
                    type="date"
                    value={draftRange.end}
                    min={draftRange.start || undefined}
                    onChange={(e) =>
                      setDraftRange((prev) => ({
                        ...prev,
                        end: e.target.value,
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal normal-case text-slate-700 outline-none focus:border-[#25D366]"
                  />
                </label>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={resetDateRange}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={applyDateRange}
                  className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1ebe5a]"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-12 items-center gap-1 rounded-xl px-3 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#DCFCE7]">
              <tr className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                <th className="px-6 py-4">Date &amp; Time</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Record</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading && logs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Loading audit logs...
                  </td>
                </tr>
              )}

              {!loading && logs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    No audit log entries found.
                  </td>
                </tr>
              )}

              {logs.map((log) => (
                <tr
                  key={log.id}
                  className={`transition hover:bg-slate-50 ${
                    loading ? "opacity-60" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-slate-700">
                    {formatDate(log.createdAt)}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium leading-snug text-slate-800">
                      {log.userName}
                    </div>
                    <div className="text-sm uppercase leading-snug text-slate-800">
                      {log.userRole}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium uppercase ${
                        ACTION_STYLES[log.action] ||
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {formatLabel(log.action)}
                    </span>
                  </td>

                  <td className="px-6 py-4 uppercase text-slate-800">
                    {log.module}
                  </td>

                  <td className="px-6 py-4 text-slate-800">
                    {log.entityName || "—"}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button
                      type="button"
                      aria-label="View audit log details"
                      title="View details"
                      onClick={() => setSelectedLog(log)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#16a34a] transition hover:bg-green-50"
                    >
                      <Eye className="h-[18px] w-[18px]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {meta.total > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500">
              Page {page} of {totalPages}
            </span>

            <div className="relative">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                aria-label="Rows per page"
                className="h-10 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-4 pr-9 text-sm font-semibold text-slate-800 outline-none focus:border-[#25D366]"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-700" />
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
            <button
              type="button"
              aria-label="Previous page"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {pageNumbers.map((p, index) =>
              p === "..." ? (
                <span key={`gap-${index}`} className="px-1 text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${
                    p === page
                      ? "border border-[#25D366] bg-green-50 font-semibold text-slate-900"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              type="button"
              aria-label="Next page"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Audit Log Detail
              </h2>

              <button
                type="button"
                aria-label="Close"
                onClick={() => setSelectedLog(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Date &amp; Time</span>
                <span className="font-medium text-slate-800">
                  {formatDate(selectedLog.createdAt)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">User</span>
                <span className="font-medium text-slate-800">
                  {selectedLog.userName} ({selectedLog.userRole})
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Action</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium uppercase ${
                    ACTION_STYLES[selectedLog.action] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {formatLabel(selectedLog.action)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Module</span>
                <span className="font-medium text-slate-800">
                  {selectedLog.module}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Record</span>
                <span className="font-medium text-slate-800">
                  {selectedLog.entityName || "—"}
                </span>
              </div>

              {selectedLog.changes && (
                <div>
                  <span className="text-slate-500">Changes</span>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                    {JSON.stringify(selectedLog.changes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}