import {
  HardDrive,
  RefreshCw,
  ShieldCheck,
  Plus,
} from "lucide-react";

const BackupHeader = ({
  onCreateBackup,
  onRefresh,
  creating,
  refreshing,
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
              <HardDrive className="h-6 w-6 text-green-600" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Backup & Restore
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Create and manage backups of your CRM data.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={onCreateBackup}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {creating ? "Creating..." : "Create Backup"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

        <div>
          <p className="text-sm font-semibold text-green-800">
            Your CRM data is protected
          </p>

          <p className="mt-1 text-sm text-green-700">
            Backups contain company CRM data only. Passwords and WhatsApp
            access tokens are not included.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BackupHeader;