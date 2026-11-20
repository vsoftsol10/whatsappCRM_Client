/* ============================================================
   CONSTANTS
   ============================================================ */

export const STATUS_OPTIONS = [
  { value: "TODO", label: "Todo" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "REVIEW", label: "Review" },
  { value: "COMPLETED", label: "Completed" },
];

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

const PRIORITY_TONE = {
  HIGH: "bg-red-100 text-red-500",
  MEDIUM: "bg-amber-100 text-amber-600",
  LOW: "bg-slate-100 text-slate-500",
};

const STATUS_TONE = {
  TODO: "bg-slate-100 text-slate-500",
  IN_PROGRESS: "bg-amber-100 text-amber-600",
  REVIEW: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const FALLBACK_TONE = "bg-slate-100 text-slate-500";

export const priorityTone = (value) =>
  PRIORITY_TONE[(value || "").toUpperCase()] || FALLBACK_TONE;

export const statusTone = (value) =>
  STATUS_TONE[(value || "").toUpperCase()] || FALLBACK_TONE;

export const optionLabel = (options, value) =>
  options.find((o) => o.value === value)?.label ||
  (value || "").replace(/_/g, " ");

/* ============================================================
   DATE HELPERS
   ============================================================ */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad = (n) => String(n).padStart(2, "0");

// Due dates are stored as date-only values (UTC midnight), so read
// them with UTC getters to avoid shifting a day in other time zones.
function getParts(value, utc) {
  if (!value) return null;

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return null;

  return utc
    ? {
        day: d.getUTCDate(),
        month: d.getUTCMonth(),
        year: d.getUTCFullYear(),
      }
    : {
        day: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
      };
}

// 30 Oct 2026
export function formatDate(value, { utc = false } = {}) {
  const p = getParts(value, utc);

  if (!p) return "-";

  return `${pad(p.day)} ${MONTHS[p.month]} ${p.year}`;
}

// 30-10-2026
export function formatDateNumeric(value, { utc = false } = {}) {
  const p = getParts(value, utc);

  if (!p) return "";

  return `${pad(p.day)}-${pad(p.month + 1)}-${p.year}`;
}

export const inputClass = (error) =>
  `relative h-12 w-full rounded-xl border bg-white px-4 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-700 ${
    error ? "border-red-400" : "border-slate-200"
  }`;

export const primaryButtonClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-7 text-[15px] font-semibold text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-7 text-[15px] font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
