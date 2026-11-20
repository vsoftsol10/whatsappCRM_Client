import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Eye,
  Globe,
  Pencil,
  Phone,
  PhoneCall,
  Tag,
  Trash2,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";

import RowActionsMenu from "../common/RowActionsMenu";
import { LEAD_STATUS_OPTIONS, getSourceKey } from "./leadHelpers";

// ======================================================
// SOURCE ICON
// Round icon badge instead of a text label (WhatsApp,
// website, Instagram, Facebook ...). The source name stays
// available as a tooltip + screen-reader text.
// ======================================================

const SOURCE_STYLES = {
  whatsapp: { icon: FaWhatsapp, className: "bg-green-100 text-green-600" },
  website: { icon: Globe, className: "bg-sky-100 text-sky-600" },
  instagram: { icon: FaInstagram, className: "bg-pink-100 text-pink-600" },
  facebook: { icon: FaFacebook, className: "bg-blue-100 text-blue-600" },
  referral: { icon: Users, className: "bg-orange-100 text-orange-600" },
  call: { icon: Phone, className: "bg-cyan-100 text-cyan-600" },
  other: { icon: Tag, className: "bg-slate-100 text-slate-500" },
};

// variant "pill"   -> table row (wide, short)
// variant "circle" -> lead card header
export function SourceIcon({ source, variant = "circle" }) {
  const style = SOURCE_STYLES[getSourceKey(source)];
  const Icon = style.icon;
  const label = source || "Unknown source";

  return (
    <span
      role="img"
      aria-label={`Source: ${label}`}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${
        style.className
      } ${variant === "pill" ? "h-7 w-10" : "h-8 w-8"}`}
    >
      <Icon size={variant === "pill" ? 15 : 16} />
    </span>
  );
}

// ======================================================
// STATUS SELECT
// Compact dropdown used in the table row and on the card.
// ======================================================

export function LeadStatusSelect({
  value,
  onChange,
  disabled = false,
  ariaLabel = "Lead status",
  className = "",
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      >
        {LEAD_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
}

// Shown instead of the status select once a lead is a customer
export function ConvertedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
      <CheckCircle2 size={14} />
      Converted
    </span>
  );
}

// ======================================================
// ACTIONS MENU (three dots)
// Built on the shared RowActionsMenu, so it is positioned
// with `fixed` and never clipped by the rounded table.
// ======================================================

export function LeadActionsMenu({
  lead,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onConvert,
}) {
  const items = [
    {
      key: "view",
      label: "View Details",
      icon: Eye,
      onClick: () => onView(lead),
    },
    {
      key: "edit",
      label: "Edit Lead",
      icon: Pencil,
      onClick: () => onEdit(lead),
    },
  ];

  if (!lead.isConverted && lead.status === "NEW") {
    items.push({
      key: "contacted",
      label: "Mark Contacted",
      icon: PhoneCall,
      onClick: () => onStatusChange(lead.id, "CONTACTED"),
    });
  }

  if (!lead.isConverted && lead.status === "CONTACTED") {
    items.push({
      key: "qualified",
      label: "Mark Qualified",
      icon: BadgeCheck,
      onClick: () => onStatusChange(lead.id, "QUALIFIED"),
    });
  }

  if (!lead.isConverted && lead.status === "QUALIFIED") {
    items.push({
      key: "won",
      label: "Mark Won",
      icon: Trophy,
      onClick: () => onStatusChange(lead.id, "WON"),
    });
  }

  if (lead.status === "WON" && !lead.isConverted) {
    items.push({
      key: "convert",
      label: "Convert to Customer",
      icon: UserPlus,
      onClick: () => onConvert(lead.id),
    });
  }

  items.push({
    key: "delete",
    label: "Delete Lead",
    icon: Trash2,
    danger: true,
    onClick: () => onDelete(lead.id),
  });

  return (
    // Light grey circle behind the dots, as in the design
    <div className="inline-flex rounded-full bg-slate-100 transition hover:bg-slate-200">
      <RowActionsMenu
        ariaLabel={`Actions for ${lead.name}`}
        items={items}
        width={236}
      />
    </div>
  );
}
