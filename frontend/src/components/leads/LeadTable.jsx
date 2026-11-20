import {
  ConvertedBadge,
  LeadActionsMenu,
  LeadStatusSelect,
  SourceIcon,
} from "./leadUi";
import { formatLeadDate } from "./leadHelpers";

const TH =
  "px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-green-900";

export default function LeadTable({
  leads,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onConvert,
  // Multi-select (bulk delete)
  selectedIds = [],
  onToggleSelect,
  onToggleSelectPage,
}) {
  if (!leads || leads.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        No leads found
      </div>
    );
  }

  const selectable = typeof onToggleSelect === "function";

  const selectedSet = new Set(selectedIds);

  const allSelected = leads.every((lead) => selectedSet.has(lead.id));
  const someSelected = leads.some((lead) => selectedSet.has(lead.id));

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          {/* ================= HEADER ================= */}

          <thead className="bg-green-100">
            <tr>
              {selectable && (
                <th className="w-12 px-5 py-4 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all leads on this page"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = someSelected && !allSelected;
                      }
                    }}
                    onChange={() => onToggleSelectPage?.()}
                    className="h-4 w-4 cursor-pointer accent-green-600"
                  />
                </th>
              )}

              <th className={TH}>Name</th>
              <th className={TH}>Email</th>
              <th className={TH}>Phone</th>
              <th className={TH}>Source</th>
              <th className={TH}>Status</th>
              <th className={TH}>Assigned To</th>
              <th className={TH}>Created</th>
              <th className={`${TH} text-center`}>Actions</th>
            </tr>
          </thead>

          {/* ================= BODY ================= */}

          <tbody>
            {leads.map((lead) => {
              const isSelected = selectable && selectedSet.has(lead.id);

              return (
                <tr
                  key={lead.id}
                  className={`border-t border-slate-100 transition hover:bg-slate-50 ${
                    isSelected ? "bg-green-50" : ""
                  }`}
                >
                  {selectable && (
                    <td className="w-12 px-5 py-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${lead.name}`}
                        checked={isSelected}
                        onChange={() => onToggleSelect(lead.id)}
                        className="h-4 w-4 cursor-pointer accent-green-600"
                      />
                    </td>
                  )}

                  {/* Name */}
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">
                    {lead.name}
                  </td>

                  {/* Email */}
                  <td className="break-all px-5 py-4 text-sm text-slate-700">
                    {lead.email || "-"}
                  </td>

                  {/* Phone */}
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                    {lead.phone || "-"}
                  </td>

                  {/* Source */}
                  <td className="px-5 py-4">
                    <SourceIcon source={lead.source} variant="pill" />
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    {lead.isConverted ? (
                      <ConvertedBadge />
                    ) : (
                      <LeadStatusSelect
                        className="w-36"
                        ariaLabel={`Status of ${lead.name}`}
                        value={lead.status}
                        onChange={(status) =>
                          onStatusChange(lead.id, status)
                        }
                      />
                    )}
                  </td>

                  {/* Assigned to */}
                  <td className="px-5 py-4 text-sm">
                    {lead.assignedTo?.name ? (
                      <span className="text-slate-700">
                        {lead.assignedTo.name}
                      </span>
                    ) : (
                      <span className="text-slate-500">Unassigned</span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                    {formatLeadDate(lead.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <LeadActionsMenu
                        lead={lead}
                        onView={onView}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                        onConvert={onConvert}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
