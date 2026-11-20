// Read-only employee details popup (opened from the Manage Employees table).
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";

import { getEmployeeById } from "../../api/employeeApi";
import {
  EmployeeModalShell,
  FormActions,
  FormField,
  FormSection,
  cancelButtonClass,
  roleLabel,
} from "./EmployeeFormParts";

// A value shown like an input, but not editable
function ReadOnlyValue({ children, tall = false }) {
  return (
    <div
      className={`w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-600 ${
        tall
          ? "min-h-[150px] whitespace-pre-wrap break-words py-3.5"
          : "flex min-h-[52px] items-center break-all"
      }`}
    >
      {children || "-"}
    </div>
  );
}

function ViewEmployeeModal({ employeeId, onClose, onEdit }) {
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getEmployeeById(employeeId)
      .then((data) => {
        if (!cancelled) setEmployee(data.employee);
      })
      .catch((error) => {
        console.error("Failed to load employee:", error);
        toast.error(
          error?.response?.data?.message || "Failed to load employee."
        );
        if (!cancelled) onClose();
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId, onClose]);

  const editButton = employee && (
    <button
      type="button"
      onClick={() => onEdit(employee.id)}
      className="inline-flex h-11 items-center gap-2 rounded-xl border border-green-500 bg-green-50 px-5 text-base font-semibold text-green-700 transition hover:bg-green-100"
    >
      <Pencil size={16} />
      Edit
    </button>
  );

  return (
    <EmployeeModalShell
      title="View Employee"
      onClose={onClose}
      onBackdropClick={onClose}
      headerExtra={editButton}
    >
      {!employee ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-green-500" />
            <p className="text-slate-500">Loading employee...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-9">
          <FormSection title="Personal Information">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Full Name">
                <ReadOnlyValue>{employee.name}</ReadOnlyValue>
              </FormField>

              <FormField label="Email Address">
                <ReadOnlyValue>{employee.email}</ReadOnlyValue>
              </FormField>

              <FormField label="Phone Number">
                <ReadOnlyValue>{employee.phone}</ReadOnlyValue>
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Work Information">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Department">
                <ReadOnlyValue>{employee.department}</ReadOnlyValue>
              </FormField>

              <FormField label="Designation">
                <ReadOnlyValue>{employee.designation}</ReadOnlyValue>
              </FormField>

              <FormField label="Role">
                <ReadOnlyValue>{roleLabel(employee.role)}</ReadOnlyValue>
              </FormField>
            </div>
          </FormSection>

          <FormSection title="Address">
            <FormField label="Address">
              <ReadOnlyValue tall>{employee.address}</ReadOnlyValue>
            </FormField>
          </FormSection>

          <FormActions>
            <button type="button" onClick={onClose} className={cancelButtonClass}>
              Close
            </button>
          </FormActions>
        </div>
      )}
    </EmployeeModalShell>
  );
}

export default ViewEmployeeModal;
