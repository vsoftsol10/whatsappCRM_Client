// frontend/src/components/backup/BackupSchedule.jsx  (NEW FILE)
//
// "Automatic Backup" card shown on the Backup page.
// Fully self-contained: it loads and saves its own settings, so the Backup
// page does not need any extra state.
//
// GET /api/backup-settings   -> current schedule
// PUT /api/backup-settings   -> save schedule

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, Loader2 } from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

// 1 - 28 so the date exists in every month (including February)
const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => i + 1);

const KEEP_OPTIONS = [3, 5, 7, 14, 30];

const getToken = () =>
  localStorage.getItem("token") || localStorage.getItem("accessToken");

const formatDateTime = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BackupSchedule = () => {
  const [setting, setSetting] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadSetting = useCallback(async () => {
    try {
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_URL}/api/backup-settings`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load automatic backup settings"
        );
      }

      setSetting(data.setting);
      setForm(data.setting);
    } catch (err) {
      console.error("Load backup setting error:", err);
      setError(err.message || "Failed to load automatic backup settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSetting();
  }, [loadSetting]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_URL}/api/backup-settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enabled: form.enabled,
          frequency: form.frequency,
          dayOfWeek: Number(form.dayOfWeek),
          dayOfMonth: Number(form.dayOfMonth),
          retentionCount: Number(form.retentionCount),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to save automatic backup settings"
        );
      }

      setSetting(data.setting);
      setForm(data.setting);
      toast.success("Automatic backup settings saved.");
    } catch (err) {
      console.error("Save backup setting error:", err);
      setError(err.message || "Failed to save automatic backup settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading automatic backup settings...
        </div>
      </div>
    );
  }

  // Could not load (for example a server error) - show a small message
  // and let the rest of the Backup page keep working.
  if (!form) {
    return (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">
          Automatic Backup
        </p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const hasChanges =
    form.enabled !== setting.enabled ||
    form.frequency !== setting.frequency ||
    Number(form.dayOfWeek) !== setting.dayOfWeek ||
    Number(form.dayOfMonth) !== setting.dayOfMonth ||
    Number(form.retentionCount) !== setting.retentionCount;

  const inputClass =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* TITLE + ON/OFF */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50">
            <CalendarClock className="h-5 w-5 text-green-600" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Automatic Backup
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your CRM data is backed up automatically at night (about 2 AM
              IST) as the same Excel file as a manual backup.
            </p>
          </div>
        </div>

        <label className="inline-flex shrink-0 cursor-pointer items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            {form.enabled ? "On" : "Off"}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={form.enabled}
            onClick={() =>
              setForm((prev) => ({ ...prev, enabled: !prev.enabled }))
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              form.enabled ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                form.enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      {/* OPTIONS */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Frequency
          </label>

          <select
            value={form.frequency}
            disabled={!form.enabled}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, frequency: e.target.value }))
            }
            className={inputClass}
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </div>

        <div>
          {form.frequency === "WEEKLY" && (
            <>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Day of the week
              </label>

              <select
                value={form.dayOfWeek}
                disabled={!form.enabled}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))
                }
                className={inputClass}
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </>
          )}

          {form.frequency === "MONTHLY" && (
            <>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Day of the month
              </label>

              <select
                value={form.dayOfMonth}
                disabled={!form.enabled}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dayOfMonth: e.target.value }))
                }
                className={inputClass}
              >
                {DAYS_OF_MONTH.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </>
          )}

          {form.frequency === "DAILY" && (
            <>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                Runs
              </label>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
                Every night
              </div>
            </>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Keep last
          </label>

          <select
            value={form.retentionCount}
            disabled={!form.enabled}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                retentionCount: e.target.value,
              }))
            }
            className={inputClass}
          >
            {KEEP_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count} automatic backups
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STATUS + SAVE */}
      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500">
          <p>
            Last automatic backup:{" "}
            <span className="font-medium text-gray-700">
              {formatDateTime(setting.lastRunAt)}
            </span>
          </p>

          <p className="mt-1">
            Next automatic backup:{" "}
            <span className="font-medium text-gray-700">
              {setting.enabled ? formatDateTime(setting.nextRunAt) : "Off"}
            </span>
          </p>

          <p className="mt-1">
            Older automatic backups are deleted. Manual backups are never
            deleted.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default BackupSchedule;
