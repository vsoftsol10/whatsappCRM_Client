import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers (same formatting rules as before)
// ---------------------------------------------------------------------------

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "—";

  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatus = (status) => {
  switch (status) {
    case "COMPLETED":
      return {
        label: "Completed",
        className: "bg-green-100 text-green-700",
        icon: CheckCircle2,
      };

    case "IN_PROGRESS":
      return {
        label: "In Progress",
        className: "bg-blue-100 text-blue-700",
        icon: Loader2,
      };

    case "PENDING":
      return {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-700",
        icon: Clock,
      };

    case "FAILED":
      return {
        label: "Failed",
        className: "bg-red-100 text-red-700",
        icon: AlertCircle,
      };

    default:
      return {
        label: status || "Unknown",
        className: "bg-gray-100 text-gray-700",
        icon: Clock,
      };
  }
};

const getTypeLabel = (backupType) => {
  if (backupType === "MANUAL") return "Manual";
  if (backupType === "AUTOMATIC") return "Automatic";
  if (backupType === "PRE_RESTORE") return "Safety copy (before a restore)";
  return backupType || "—";
};

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

// ---------------------------------------------------------------------------
// Three-dot actions menu (Restore + Download Excel)
// Rendered in a portal so the table's scroll area never clips it.
// ---------------------------------------------------------------------------

const MENU_WIDTH = 160;

const RowActionsMenu = ({
  backup,
  onDownload,
  onRestore,
  downloadingId,
}) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const isCompleted = backup.status === "COMPLETED";
  const isDownloading = downloadingId === backup.id;

  const place = () => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight || 96;

    const left = Math.max(
      8,
      Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)
    );

    const fitsBelow = rect.bottom + 6 + menuHeight <= window.innerHeight - 8;

    setPos({
      left,
      top: fitsBelow ? rect.bottom + 6 : Math.max(8, rect.top - 6 - menuHeight),
    });
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (
        menuRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    const close = () => setOpen(false);

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const showRestore = Boolean(onRestore) && isCompleted;
  const downloadDisabled = !isCompleted || Boolean(downloadingId);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Backup actions"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MoreVertical className="h-4 w-4" />
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: MENU_WIDTH,
            }}
            className="z-50 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              disabled={downloadDisabled}
              onClick={() => {
                setOpen(false);
                onDownload(backup);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-xs font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Download className="h-4 w-4 text-slate-600" />
              Excel
            </button>

            {showRestore && (
              <button
                type="button"
                role="menuitem"
                disabled={!backup.restorable}
                title={
                  backup.restorable
                    ? "Restore your CRM data from this backup"
                    : "Older backups are Excel-only and cannot be restored. Create a new backup."
                }
                onClick={() => {
                  setOpen(false);
                  onRestore(backup);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <RotateCcw className="h-4 w-4 text-slate-600" />
                Restore
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const BackupHistory = ({
  backups = [],
  onDownload,
  downloadingId,
  onRestore,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const totalPages = Math.max(1, Math.ceil(backups.length / pageSize));

  // Keep the current page valid (for example after a refresh or a page-size change)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (backups.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <FileSpreadsheet className="h-7 w-7 text-slate-500" />
        </div>

        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          No backups yet
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Create your first CRM backup to protect your company data.
        </p>
      </div>
    );
  }

  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const visible = backups.slice(start, start + pageSize);

  // Up to 5 page numbers around the current page
  const windowSize = 5;
  const firstNumber = Math.max(
    1,
    Math.min(currentPage - Math.floor(windowSize / 2), totalPages - windowSize + 1)
  );
  const pageNumbers = Array.from(
    { length: Math.min(windowSize, totalPages) },
    (_, i) => firstNumber + i
  );

  const thClass =
    "px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-green-900";

  return (
    <div>
      {/* TABLE CARD */}
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-green-100/70">
              <tr>
                <th className={thClass}>Backup</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Created</th>
                <th className={thClass}>Size</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {visible.map((backup) => {
                const status = getStatus(backup.status);
                const StatusIcon = status.icon;
                const fileName = backup.fileName
                  ? backup.fileName.replace(/\.zip$/i, ".xlsx")
                  : "Backup file";

                return (
                  <tr
                    key={backup.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4">
                      <p
                        className="max-w-[260px] truncate text-sm font-medium text-slate-900"
                        title={`${fileName}\nID: ${backup.id}`}
                      >
                        {fileName}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {getTypeLabel(backup.backupType)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                      >
                        <StatusIcon
                          className={`h-3.5 w-3.5 ${
                            backup.status === "IN_PROGRESS"
                              ? "animate-spin"
                              : ""
                          }`}
                        />
                        {status.label}
                      </span>

                      {backup.status === "FAILED" && backup.errorMessage && (
                        <p
                          className="mt-1 max-w-[220px] truncate text-xs text-red-500"
                          title={backup.errorMessage}
                        >
                          {backup.errorMessage}
                        </p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {formatDate(backup.createdAt)}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {formatBytes(backup.fileSize)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <RowActionsMenu
                        backup={backup}
                        onDownload={onDownload}
                        onRestore={onRestore}
                        downloadingId={downloadingId}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
          <span>
            Page {currentPage} of {totalPages}
          </span>

          <div className="relative">
            <select
              value={pageSize}
              aria-label="Rows per page"
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 appearance-none rounded-md border border-slate-200 bg-white pl-2.5 pr-7 text-xs font-semibold text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-1 shadow-sm">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pageNumbers.map((number) => (
            <button
              key={number}
              type="button"
              aria-current={number === currentPage ? "page" : undefined}
              onClick={() => setPage(number)}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold transition ${
                number === currentPage
                  ? "border border-green-500 bg-green-100 text-green-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {number}
            </button>
          ))}

          <button
            type="button"
            aria-label="Next page"
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupHistory;