import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, RotateCcw, X } from "lucide-react";

// Two-step restore:
//   1. GET  /api/backups/:id/restore-preview  -> shows what will change (changes nothing)
//   2. POST /api/backups/:id/restore          -> only after the admin types RESTORE
const RestoreBackupModal = ({ backup, apiUrl, getToken, onClose, onRestored }) => {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [confirmToken, setConfirmToken] = useState("");
  const [confirmWord, setConfirmWord] = useState("RESTORE");
  const [typed, setTyped] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState("");

  const request = async (path, options = {}) => {
    const token = getToken();
    if (!token) throw new Error("Authentication token not found");

    const response = await fetch(`${apiUrl}/api/backups/${backup.id}/${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Something went wrong");
    return data;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await request("restore-preview");
        if (cancelled) return;
        setPreview(data.preview);
        setConfirmToken(data.confirmToken);
        setConfirmWord(data.confirmWord || "RESTORE");
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backup.id]);

  const handleRestore = async () => {
    try {
      setRestoring(true);
      setError("");
      await request("restore", {
        method: "POST",
        body: JSON.stringify({ confirmToken, confirmText: typed }),
      });
      onRestored();
    } catch (err) {
      setError(err.message);
      setRestoring(false);
    }
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const canRestore = preview && typed === confirmWord && !restoring;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Restore from backup
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Backup taken on {formatDate(backup.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={restoring}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {loading && (
            <div className="py-8 text-center text-sm text-gray-500">
              <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin" />
              Checking the backup...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {preview && (
            <>
              <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  This replaces your company&apos;s current CRM data with the
                  data in this backup. Anything created or changed after{" "}
                  {formatDate(preview.snapshotCreatedAt)} will be lost. A
                  safety copy of your current data is saved first, so you can
                  undo this by restoring that copy.
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2">Data</th>
                      <th className="px-4 py-2 text-right">Now</th>
                      <th className="px-4 py-2 text-right">After restore</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.tables.map((t) => (
                      <tr key={t.key}>
                        <td className="px-4 py-2 text-gray-800">{t.label}</td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          {t.current}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-medium ${
                            t.current === t.afterRestore
                              ? "text-gray-800"
                              : "text-amber-700"
                          }`}
                        >
                          {t.afterRestore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.notes.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {preview.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}

              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-800">Not changed:</p>
                <p>{preview.unchanged.join(", ")}.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800">
                  Type {confirmWord} to confirm
                </label>
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  disabled={restoring}
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={restoring}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRestore}
            disabled={!canRestore}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {restoring ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {restoring ? "Restoring..." : "Restore data"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreBackupModal;