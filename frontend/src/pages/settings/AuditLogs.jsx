import { useEffect, useState, useCallback } from "react";
import {
  History,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { getAuditLogs } from "../../api/auditLogApi";

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
];

const ACTION_OPTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "STATUS_CHANGE",
  "ASSIGN",
];

const ACTION_STYLES = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  STATUS_CHANGE: "bg-yellow-100 text-yellow-700",
  ASSIGN: "bg-purple-100 text-purple-700",
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const [filters, setFilters] = useState({
    module: "",
    action: "",
    startDate: "",
    endDate: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // =====================================================
  // LOAD AUDIT LOGS
  // =====================================================

  const loadLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      const params = {
        page,
        limit: pagination.limit,
      };

      if (filters.module) params.module = filters.module;
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await getAuditLogs(params);

      setLogs(response.data || []);

      setPagination((prev) => ({
        ...prev,
        page: response.pagination?.page || 1,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 1,
      }));
    } catch (error) {
      console.error("Failed to load audit logs:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load audit logs."
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.limit]);

  useEffect(() => {
    loadLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      module: "",
      action: "",
      startDate: "",
      endDate: "",
    });
  };

  const hasActiveFilters =
    filters.module || filters.action || filters.startDate || filters.endDate;

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

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/10">
          <History className="h-5 w-5 text-[#25D366]" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500">
            Track who did what, and when, across your CRM.
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Filter className="h-4 w-4" />
            Filters
          </div>

          <select
            value={filters.module}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, module: e.target.value }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#25D366] focus:outline-none"
          >
            <option value="">All Modules</option>
            {MODULE_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0) + m.slice(1).toLowerCase()}
              </option>
            ))}
          </select>

          <select
            value={filters.action}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, action: e.target.value }))
            }
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#25D366] focus:outline-none"
          >
            <option value="">All Actions</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a.replace("_", " ")}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#25D366] focus:outline-none"
            />

            <span className="text-sm text-slate-400">to</span>

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-[#25D366] focus:outline-none"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date &amp; Time</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Record</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Loading audit logs...
                  </td>
                </tr>
              )}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No audit log entries found.
                  </td>
                </tr>
              )}

              {!loading &&
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {formatDate(log.createdAt)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {log.userName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {log.userRole}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          ACTION_STYLES[log.action] ||
                          "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {log.action.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {log.module}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {log.entityName || "—"}
                    </td>

                    <td className="px-4 py-3 text-right text-[#25D366]">
                      View
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} total entries
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadLogs(pagination.page - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadLogs(pagination.page + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Audit Log Detail
              </h2>

              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Date &amp; Time</span>
                <span className="font-medium text-slate-800">
                  {formatDate(selectedLog.createdAt)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">User</span>
                <span className="font-medium text-slate-800">
                  {selectedLog.userName} ({selectedLog.userRole})
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Action</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    ACTION_STYLES[selectedLog.action] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {selectedLog.action.replace("_", " ")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">Module</span>
                <span className="font-medium text-slate-800">
                  {selectedLog.module}
                </span>
              </div>

              <div className="flex justify-between">
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