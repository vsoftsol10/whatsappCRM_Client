import {
  STATUS_STYLES,
  DEFAULT_STATUS_STYLE,
  TYPE_STYLES,
  DEFAULT_TYPE_STYLE,
  formatStatus,
  formatType,
} from "./campaignHelpers";

/**
 * Small coloured status badge.
 * uppercase = true  -> "COMPLETED" (card view)
 * uppercase = false -> "Completed" (table view)
 */
export function StatusPill({ status, uppercase = false }) {
  const style = STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 font-medium ${style} ${
        uppercase ? "text-[11px] tracking-wide" : "text-xs"
      }`}
    >
      {uppercase ? String(status || "").replace(/_/g, " ") : formatStatus(status)}
    </span>
  );
}

/** Campaign type badge, e.g. PROMOTIONAL / FOLLOW UP */
export function TypePill({ type }) {
  const style = TYPE_STYLES[type] || DEFAULT_TYPE_STYLE;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium tracking-wide ${style}`}
    >
      {formatType(type)}
    </span>
  );
}
