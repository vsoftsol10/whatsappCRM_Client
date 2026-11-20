// Shared constants + helpers for the Leads module UI.
// (Components live in leadUi.jsx - kept separate so React fast-refresh
// keeps working, same split as taskHelpers.js / taskUi.jsx.)

// Values are what the API stores, labels are what the user sees.
export const LEAD_STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "WON", label: "Won" },
];

// Options of the "All Status" filter dropdown
export const LEAD_FILTER_OPTIONS = [
  { value: "ALL", label: "All Status" },
  ...LEAD_STATUS_OPTIONS,
  { value: "CONVERTED", label: "Converted" },
];

// Sources offered in the Add / Edit forms
export const STANDARD_SOURCES = [
  "Website",
  "WhatsApp",
  "Facebook",
  "Instagram",
  "Referral",
];

// "10/17/2026" (MM/DD/YYYY), as in the design
export function formatLeadDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

// Turns any stored source text into one of a few known keys, so
// "Instagram AI" and "Messenger AI" still get the right icon.
export function getSourceKey(source) {
  const value = (source || "").toLowerCase();

  if (value.includes("whatsapp")) return "whatsapp";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("facebook") || value.includes("messenger")) {
    return "facebook";
  }
  if (value.includes("web")) return "website";
  if (value.includes("referral")) return "referral";
  if (value.includes("call") || value.includes("phone")) return "call";

  return "other";
}
