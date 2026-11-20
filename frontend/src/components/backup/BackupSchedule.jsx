// frontend/src/components/backup/BackupSchedule.jsx
//
// "Automatic Backup" card shown on the Backup page.
// Fully self-contained: it loads and saves its own settings, so the Backup
// page does not need any extra state.
//
// GET /api/backup-settings   -> current schedule
// PUT /api/backup-settings   -> save schedule
//
// NOTE: only the markup / classNames were redesigned. All state, API calls,
// validation and payloads are exactly the same as before.

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarClock, ChevronDown, Loader2 } from "lucide-react";

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

// ---------------------------------------------------------------------------
// Small UI helpers (presentation only)
// ---------------------------------------------------------------------------

const labelClass =
  "mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500";

const fieldClass =
  "h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

const SelectField = ({ label, children, ...props }) => (
  <div>
    <label className={labelClass}>{label}</label>

    <div className="relative">
      <select {...props} className={fieldClass}>
        {children}
      </select>

      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  </div>
);

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
      <div className="mb-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-slate-500">
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

  return (
    <div className="mb-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
      {/* TITLE + ON/OFF */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
            <CalendarClock className="h-5 w-5 text-green-700" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Automatic Backup
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your CRM data is backed up automatically at night (about 2 AM
              IST) as the same Excel file as a manual backup.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={form.enabled}
          aria-label={`Automatic backup is ${form.enabled ? "on" : "off"}`}
          title={form.enabled ? "On" : "Off"}
          onClick={() =>
            setForm((prev) => ({ ...prev, enabled: !prev.enabled }))
          }
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
            form.enabled ? "bg-green-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
              form.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* OPTIONS */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SelectField
          label="Frequency"
          value={form.frequency}
          disabled={!form.enabled}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, frequency: e.target.value }))
          }
        >
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
        </SelectField>

        {form.frequency === "WEEKLY" && (
          <SelectField
            label="Day of the week"
            value={form.dayOfWeek}
            disabled={!form.enabled}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dayOfWeek: e.target.value }))
            }
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </SelectField>
        )}

        {form.frequency === "MONTHLY" && (
          <SelectField
            label="Day of the month"
            value={form.dayOfMonth}
            disabled={!form.enabled}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, dayOfMonth: e.target.value }))
            }
          >
            {DAYS_OF_MONTH.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </SelectField>
        )}

        {form.frequency === "DAILY" && (
          <div>
            <label className={labelClass}>Runs</label>

            <div className="flex h-11 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-700">
              Every night
            </div>
          </div>
        )}

        <SelectField
          label="Keep last"
          value={form.retentionCount}
          disabled={!form.enabled}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              retentionCount: e.target.value,
            }))
          }
        >
          {KEEP_OPTIONS.map((count) => (
            <option key={count} value={count}>
              {count} automatic backups
            </option>
          ))}
        </SelectField>
      </div>

      {/* STATUS NOTES + SAVE */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <ul className="list-disc space-y-1.5 pl-4 text-xs text-slate-600 marker:text-slate-400">
          <li>
            Last automatic backup:{" "}
            <span className="font-semibold text-slate-800">
              {formatDateTime(setting.lastRunAt)}
            </span>
          </li>

          <li>
            Next automatic backup:{" "}
            <span className="font-semibold text-slate-800">
              {setting.enabled ? formatDateTime(setting.nextRunAt) : "Off"}
            </span>
          </li>

          <li>
            Older automatic backups are deleted. Manual backups are never
            deleted.
          </li>
        </ul>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default BackupSchedule;