// Shared labels and colours for ticket status and priority.

export const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

export const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export function statusLabel(status) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || status || "-";
}

export function priorityLabel(priority) {
  if (priority === "URGENT") return "Urgent";

  return PRIORITY_OPTIONS.find((item) => item.value === priority)?.label || priority || "-";
}

export function statusStyle(status) {
  switch (status) {
    case "OPEN":
      return "bg-green-100 text-green-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700";
    case "RESOLVED":
      return "bg-teal-100 text-teal-700";
    case "CLOSED":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function priorityStyle(priority) {
  switch (priority) {
    case "URGENT":
      return "bg-red-600 text-white";
    case "HIGH":
      return "bg-red-100 text-red-600";
    case "MEDIUM":
      return "bg-amber-100 text-amber-600";
    case "LOW":
      return "bg-slate-100 text-slate-500";
    default:
      return "bg-slate-100 text-slate-500";
  }
}
