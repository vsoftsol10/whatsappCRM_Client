import {
  ConvertedBadge,
  LeadActionsMenu,
  LeadStatusSelect,
  SourceIcon,
} from "./leadUi";
import { formatLeadDate } from "./leadHelpers";

export default function LeadCard({
  lead,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onConvert,
  selected = false,
  onToggleSelect,
}) {
  const requirement = lead.requirements || lead.notes;

  return (
    <div
      className={`flex flex-col rounded-3xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
        selected
          ? "border-green-500 ring-2 ring-green-100"
          : "border-slate-200"
      }`}
    >
      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {typeof onToggleSelect === "function" && (
            <input
              type="checkbox"
              aria-label={`Select ${lead.name}`}
              checked={selected}
              onChange={() => onToggleSelect(lead.id)}
              className="h-4 w-4 shrink-0 cursor-pointer accent-green-600"
            />
          )}

          <SourceIcon source={lead.source} />

          <h3
            title={lead.name}
            className="truncate text-[15px] font-semibold text-slate-900"
          >
            {lead.name}
          </h3>
        </div>

        <LeadActionsMenu
          lead={lead}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onConvert={onConvert}
        />
      </div>

      {/* ================= CONTACT ================= */}

      <p className="mt-3 break-all text-[13px] text-slate-500">
        {lead.email || "-"}
      </p>

      <p className="mt-1 text-[13px] text-slate-500">
        {lead.phone || "-"}
      </p>

      {/* ================= REQUIREMENT ================= */}

      <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        Requirement
      </p>

      <p
        className={`mt-1 line-clamp-3 text-sm ${
          requirement ? "text-slate-700" : "text-slate-500"
        }`}
      >
        {requirement || "No requirement added"}
      </p>

      {/* ================= STATUS ================= */}

      <div className="mt-4">
        {lead.isConverted ? (
          <ConvertedBadge />
        ) : (
          <LeadStatusSelect
            className="w-full"
            ariaLabel={`Status of ${lead.name}`}
            value={lead.status}
            onChange={(status) => onStatusChange(lead.id, status)}
          />
        )}
      </div>

      {/* ================= FOOTER ================= */}

      <p className="mt-4 text-xs text-slate-500">
        {lead.assignedTo?.name || "Unassigned"} ·{" "}
        {formatLeadDate(lead.createdAt)}
      </p>
    </div>
  );
}
