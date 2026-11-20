import {
  Send,
  Eye,
  PencilLine,
  Trash2,
  ClipboardCheck,
} from "lucide-react";

// ============================================================
// STATUS
// ============================================================

export const STATUS_STYLES = {
  APPROVED: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-600",
  PAUSED: "bg-orange-100 text-orange-600",
  DISABLED: "bg-red-100 text-red-600",
  DRAFT: "bg-slate-100 text-slate-500",
};

export const DEFAULT_STATUS_STYLE = "bg-slate-100 text-slate-500";

export const capitalize = (value = "") =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export const formatCategory = capitalize;

// ============================================================
// LABELS / FORMATTING
// ============================================================

export const LANGUAGE_OPTIONS = [
  { value: "en_US", label: "English (US)" },
  { value: "en_GB", label: "English (UK)" },
  { value: "ta", label: "Tamil" },
  { value: "hi", label: "Hindi" },
];

const SHORT_LANGUAGE = {
  en_US: "English",
  en_GB: "English",
  ta: "Tamil",
  hi: "Hindi",
};

export const formatLanguage = (code) => SHORT_LANGUAGE[code] || code || "-";

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN") : "-";

// ============================================================
// WHAT CAN BE DONE WITH A TEMPLATE
// (same rules as before / as the backend)
// ============================================================

// Only draft or rejected templates can be edited and (re)submitted
export const canEditTemplate = (template) =>
  template?.status === "DRAFT" || template?.status === "REJECTED";

// Only approved templates can be sent to customers
export const canSendTemplate = (template) => template?.status === "APPROVED";

// ============================================================
// 3-DOT MENU ITEMS (shared by card view and table view)
// ============================================================

export const ACTIONS_MENU_WIDTH = 232;

export function getTemplateActions(
  template,
  { onSend, onPreview, onEdit, onDelete, onSubmitForApproval }
) {
  const editable = canEditTemplate(template);
  const isRejected = template.status === "REJECTED";

  const items = [
    {
      key: "send",
      label: "Send",
      icon: Send,
      disabled: !canSendTemplate(template),
      title: canSendTemplate(template)
        ? undefined
        : "Only approved templates can be sent",
      onClick: () => onSend?.(template),
    },
    {
      key: "view",
      label: "View",
      icon: Eye,
      onClick: () => onPreview?.(template),
    },
    {
      key: "edit",
      label: "Edit",
      icon: PencilLine,
      disabled: !editable,
      title: editable
        ? undefined
        : "Only draft or rejected templates can be edited",
      onClick: () => onEdit?.(template),
    },
  ];

  // Not in the visual reference, but needed so a draft can still be
  // sent to Meta for review from the list.
  if (editable) {
    items.push({
      key: "submit",
      label: isRejected ? "Resubmit for approval" : "Submit for approval",
      icon: ClipboardCheck,
      onClick: () => onSubmitForApproval?.(template.id),
    });
  }

  items.push({
    key: "delete",
    label: "Delete",
    icon: Trash2,
    danger: true,
    onClick: () => onDelete?.(template.id),
  });

  return items;
}
