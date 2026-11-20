import { Pencil } from "lucide-react";
import TicketFields from "./TicketFields";
import WorkNotes from "../common/WorkNotes";
import {
  getTicketWorkNotes,
  addTicketWorkNote,
  updateTicketWorkNote,
  deleteTicketWorkNote,
} from "../../api/ticketApi";
import {
  CustomerModal,
  CustomerModalFooter,
  secondaryButtonClass,
} from "../customers/CustomerForm";

const noop = () => {};

// Read-only ticket. Work notes stay below the fields so employees
// can still read and add notes. "Edit" is for admins only.
export default function ViewTicketModal({ ticket, onClose, onEdit }) {
  const values = {
    customerId: ticket.customer?.id || "",
    assignedToId: ticket.assignedTo?.id || "",
    title: ticket.title || "",
    priority: ticket.priority || "MEDIUM",
    description: ticket.description || "",
  };

  return (
    <CustomerModal
      title="View Ticket"
      onClose={onClose}
      maxWidth="max-w-2xl"
      action={
        onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-green-500 bg-green-50 px-5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
          >
            <Pencil size={16} />
            Edit
          </button>
        ) : null
      }
    >
      <TicketFields
        values={values}
        onChange={noop}
        customers={ticket.customer ? [ticket.customer] : []}
        employees={ticket.assignedTo ? [ticket.assignedTo] : []}
        unassignedLabel="Unassigned"
        readOnly
      />

      <div className="mt-6 border-t border-slate-200 pt-5">
        <WorkNotes
          entityId={ticket.id}
          getNotes={getTicketWorkNotes}
          addNote={addTicketWorkNote}
          editNote={updateTicketWorkNote}
          removeNote={deleteTicketWorkNote}
        />
      </div>

      <CustomerModalFooter>
        <button type="button" onClick={onClose} className={secondaryButtonClass}>
          Close
        </button>
      </CustomerModalFooter>
    </CustomerModal>
  );
}
