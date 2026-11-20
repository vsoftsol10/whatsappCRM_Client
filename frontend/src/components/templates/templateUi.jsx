import {
  STATUS_STYLES,
  DEFAULT_STATUS_STYLE,
  capitalize,
} from "./templateHelpers";

/**
 * Small coloured status badge.
 * uppercase = true  -> "APPROVED" (card view)
 * uppercase = false -> "Approved" (table view, drawer)
 */
export function StatusPill({ status, uppercase = false }) {
  const style = STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 font-medium ${style} ${
        uppercase ? "text-[11px] tracking-wide" : "text-xs"
      }`}
    >
      {uppercase ? status : capitalize(status)}
    </span>
  );
}
