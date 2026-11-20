import { Pencil } from "lucide-react";

import WorkNotes from "../common/WorkNotes";
import {
  getLeadWorkNotes,
  addLeadWorkNote,
  updateLeadWorkNote,
  deleteLeadWorkNote,
} from "../../api/leadApi";

import {
  CustomerModal,
  CustomerModalFooter,
  secondaryButtonClass,
} from "../customers/CustomerForm";
import LeadFields from "./LeadFields";

const noop = () => {};

export default function ViewLeadModal({
  isOpen,
  onClose,
  onEdit,
  lead,
}) {
  if (!isOpen || !lead) return null;

  const values = {
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    company: lead.company || "",
    source: lead.source || "",
    requirements: lead.requirements || "",
    status: lead.status || "NEW",
    assignedToId: lead.assignedToId || "",
  };

  return (
    <CustomerModal
      title="View Lead"
      onClose={onClose}
      action={
        onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(lead)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-green-500 bg-green-50 px-5 text-sm font-semibold text-green-700 transition hover:bg-green-100"
          >
            <Pencil size={16} />
            Edit
          </button>
        ) : null
      }
    >
      <LeadFields
        values={values}
        onChange={noop}
        currentAssignee={lead.assignedTo}
        readOnly
      />

      {lead.createdAt && (
        <p className="mt-4 text-xs text-slate-500">
          Created on {new Date(lead.createdAt).toLocaleString()}
        </p>
      )}

      {lead.isConverted && (
        <div className="mt-5 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          ✓ This lead has been converted to a customer
        </div>
      )}

      <div className="mt-6 border-t border-slate-100 pt-6">
        <WorkNotes
          entityId={lead.id}
          getNotes={getLeadWorkNotes}
          addNote={addLeadWorkNote}
          editNote={updateLeadWorkNote}
          removeNote={deleteLeadWorkNote}
        />
      </div>

      <CustomerModalFooter>
        <button
          type="button"
          onClick={onClose}
          className={secondaryButtonClass}
        >
          Close
        </button>
      </CustomerModalFooter>
    </CustomerModal>
  );
}
