import { Send, Eye, PencilLine, Trash2 } from "lucide-react";

// ==================================================
// STATUS / TYPE LABELS + COLOURS
// ==================================================

export const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "SENDING", label: "Sending" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
];

export const STATUS_STYLES = {
  COMPLETED: "bg-green-100 text-green-700",
  SCHEDULED: "bg-teal-100 text-teal-700",
  SENDING: "bg-amber-100 text-amber-600",
  DRAFT: "bg-slate-100 text-slate-500",
  FAILED: "bg-red-100 text-red-600",
};

export const DEFAULT_STATUS_STYLE = "bg-slate-100 text-slate-500";

export const TYPE_OPTIONS = [
  { value: "PROMOTIONAL", label: "Promotional" },
  { value: "BROADCAST", label: "Broadcast" },
  { value: "FOLLOW_UP", label: "Follow Up" },
  { value: "ANNOUNCEMENT", label: "Announcement" },
];

export const TYPE_STYLES = {
  PROMOTIONAL: "bg-purple-100 text-purple-700",
  BROADCAST: "bg-indigo-100 text-indigo-700",
  FOLLOW_UP: "bg-orange-100 text-orange-600",
  ANNOUNCEMENT: "bg-cyan-100 text-cyan-700",
};

export const DEFAULT_TYPE_STYLE = "bg-slate-100 text-slate-600";

export const capitalize = (value = "") =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export const formatStatus = (status) => capitalize(status || "");

// FOLLOW_UP -> "FOLLOW UP"
export const formatType = (type) => String(type || "").replace(/_/g, " ");

// ==================================================
// CAMPAIGN VALUES
// ==================================================

export const getAudienceCount = (campaign) =>
  campaign?.recipients?.length ||
  campaign?.audienceCount ||
  campaign?._count?.recipients ||
  0;

export const getSentCount = (campaign) => campaign?.sentCount || 0;

export const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "";

// Only a campaign that is sending right now is locked. Completed campaigns
// can be edited (parameters changed) and then sent again.
export const canEditCampaign = (campaign) => campaign?.status !== "SENDING";

export const canSendCampaign = (campaign) => campaign?.status !== "SENDING";

// ==================================================
// 3-DOT MENU (Send / View / Edit / Delete)
// ==================================================

export const ACTIONS_MENU_WIDTH = 232;

export function getCampaignActions(
  campaign,
  { onSend, onView, onEdit, onDelete }
) {
  const editable = canEditCampaign(campaign);
  const sendable = canSendCampaign(campaign);

  return [
    {
      key: "send",
      label: "Send",
      icon: Send,
      disabled: !sendable,
      title: sendable ? undefined : "This campaign is already sending",
      onClick: () => onSend?.(campaign),
    },
    {
      key: "view",
      label: "View",
      icon: Eye,
      onClick: () => onView?.(campaign),
    },
    {
      key: "edit",
      label: "Edit",
      icon: PencilLine,
      disabled: !editable,
      title: editable
        ? undefined
        : "A campaign that is currently sending cannot be edited",
      onClick: () => onEdit?.(campaign),
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      danger: true,
      onClick: () => onDelete?.(campaign.id),
    },
  ];
}