import { ChevronDown, Eye, Pencil, Trash2 } from "lucide-react";
import RowActionsMenu from "../common/RowActionsMenu";
import {
  STATUS_OPTIONS,
  priorityLabel,
  priorityStyle,
  statusStyle,
} from "./ticketStyles";

const thClass =
  "px-5 py-4 text-xs font-semibold uppercase tracking-wide text-green-900";

function TicketTable({
  tickets,
  loading,
  isAdmin,
  pendingStatus,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const buildMenuItems = (ticket) => [
    { key: "view", label: "View", icon: Eye, onClick: () => onView(ticket) },
    ...(isAdmin
      ? [
          { key: "edit", label: "Edit", icon: Pencil, onClick: () => onEdit(ticket) },
          { key: "delete", label: "Delete", icon: Trash2, onClick: () => onDelete(ticket.id), danger: true },
        ]
      : []),
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-green-100">
            <tr>
              <th className={`${thClass} text-left`}>Subject</th>
              <th className={`${thClass} text-left`}>Customer</th>
              <th className={`${thClass} text-left`}>Assigned To</th>
              <th className={`${thClass} text-left`}>Email</th>
              <th className={`${thClass} text-center`}>Priority</th>
              <th className={`${thClass} text-center`}>Status</th>
              <th className={`${thClass} text-center`}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-slate-500">
                  Loading tickets...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-10 text-center text-slate-500">
                  No tickets found
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const status = pendingStatus[ticket.id] ?? ticket.status;

                return (
                  <tr
                    key={ticket.id}
                    className="border-t border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="max-w-[260px] px-5 py-4 text-sm font-semibold text-slate-900">
                      <span title={ticket.title} className="block truncate">
                        {ticket.title}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {ticket.customer?.name || "-"}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      {ticket.assignedTo ? (
                        ticket.assignedTo.name
                      ) : (
                        <span className="italic text-slate-400">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-700">
                      <span className="break-all">
                        {ticket.assignedTo?.email || "-"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase ${priorityStyle(
                          ticket.priority
                        )}`}
                      >
                        {priorityLabel(ticket.priority)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <div className="relative">
                          <select
                            aria-label={`Status of ${ticket.title}`}
                            value={status}
                            disabled={Boolean(pendingStatus[ticket.id])}
                            onChange={(e) =>
                              onStatusChange(ticket.id, e.target.value)
                            }
                            className={`h-8 min-w-[124px] cursor-pointer appearance-none rounded-full pl-4 pr-9 text-xs font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-green-500 disabled:cursor-wait disabled:opacity-70 ${statusStyle(
                              status
                            )}`}
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <ChevronDown
                            size={14}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <RowActionsMenu
                          ariaLabel={`Actions for ${ticket.title}`}
                          items={buildMenuItems(ticket)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TicketTable;
