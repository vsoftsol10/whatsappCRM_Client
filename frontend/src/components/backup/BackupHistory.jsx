import {
  Download,
  FileArchive,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

const BackupHistory = ({ backups = [], onDownload, downloadingId }) => {
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

  if (backups.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <FileArchive className="h-7 w-7 text-gray-500" />
        </div>

        <h3 className="mt-4 text-lg font-semibold text-gray-900">
          No backups yet
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Create your first CRM backup to protect your company data.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Backup History
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          View and download your previous CRM backups.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Backup
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Type
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Status
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Created
              </th>

              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Size
              </th>

              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {backups.map((backup) => {
              const status = getStatus(backup.status);
              const StatusIcon = status.icon;

              return (
                <tr
                  key={backup.id}
                  className="transition hover:bg-gray-50"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                        <FileArchive className="h-5 w-5 text-gray-600" />
                      </div>

                      <div className="min-w-0">
                        <p
                          className="max-w-[260px] truncate text-sm font-medium text-gray-900"
                          title={backup.fileName || ""}
                        >
                          {backup.fileName || "Backup file"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          ID: {backup.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-sm text-gray-700">
                      {backup.backupType === "MANUAL"
                        ? "Manual"
                        : backup.backupType || "—"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}
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

                    {backup.status === "FAILED" &&
                      backup.errorMessage && (
                        <p
                          className="mt-1 max-w-[220px] truncate text-xs text-red-500"
                          title={backup.errorMessage}
                        >
                          {backup.errorMessage}
                        </p>
                      )}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {formatDate(backup.createdAt)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                    {formatBytes(backup.fileSize)}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDownload(backup)}
                      disabled={
                        backup.status !== "COMPLETED" ||
                        downloadingId === backup.id
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {downloadingId === backup.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}

                      {downloadingId === backup.id
                        ? "Downloading..."
                        : "Download"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BackupHistory;