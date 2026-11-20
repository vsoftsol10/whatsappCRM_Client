import { Eye, Pencil, Trash2 } from "lucide-react";

import RowActionsMenu from "../common/RowActionsMenu";
import StatusToggle from "../customers/StatusToggle";

function roleBadge(role) {
  return (role || "").toUpperCase() === "ADMIN"
    ? "bg-teal-100 text-teal-700"
    : "bg-green-100 text-green-700";
}

const roleText = (role) =>
  (role || "").toUpperCase() === "ADMIN" ? "Admin" : "User";

const thClass =
  "whitespace-nowrap px-5 py-4 text-left text-xs font-semibold text-green-900";

const tdClass = "px-5 py-4 text-sm text-slate-700";

export default function EmployeeTable({
  employees,
  handleView,
  handleEdit,
  handleDelete,
  onToggleStatus,
  togglingId,
  currentUserId,
}) {
  // =========================
  // NO EMPLOYEES
  // =========================

  if (!employees || employees.length === 0) {
    return (
      <div className="crm-page-surface p-8 text-center text-gray-500 sm:p-10">
        No employees found
      </div>
    );
  }

  const menuItems = (employee) => [
    {
      key: "view",
      label: "View",
      icon: Eye,
      onClick: () => handleView(employee.id),
    },
    {
      key: "edit",
      label: "Edit",
      icon: Pencil,
      onClick: () => handleEdit(employee.id),
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      danger: true,
      onClick: () => handleDelete(employee.id),
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-green-100">
            <tr>
              <th className={thClass}>Employee</th>
              <th className={thClass}>Email</th>
              <th className={thClass}>Department</th>
              <th className={thClass}>Designation</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>Role</th>
              <th className={`${thClass} text-center`}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((employee) => {
              const isSelf = employee.id === currentUserId;

              return (
                <tr
                  key={employee.id}
                  className="border-t border-slate-200 transition hover:bg-slate-50"
                >
                  <td className={`${tdClass} font-medium text-slate-800`}>
                    {employee.name}
                  </td>

                  <td className={`${tdClass} break-all`}>
                    {employee.email}
                  </td>

                  <td className={tdClass}>
                    {employee.department || "-"}
                  </td>

                  <td className={tdClass}>
                    {employee.designation || "-"}
                  </td>

                  <td className={tdClass}>
                    <span
                      title={
                        isSelf
                          ? "You cannot change your own status"
                          : undefined
                      }
                      className="inline-flex"
                    >
                      <StatusToggle
                        checked={employee.status === "ACTIVE"}
                        label={`${employee.name} is ${
                          employee.status === "ACTIVE" ? "active" : "inactive"
                        }`}
                        disabled={isSelf || togglingId === employee.id}
                        onChange={(makeActive) =>
                          onToggleStatus(employee, makeActive)
                        }
                      />
                    </span>
                  </td>

                  <td className={tdClass}>
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-4 py-1 text-xs font-medium ${roleBadge(
                        employee.role
                      )}`}
                    >
                      {roleText(employee.role)}
                    </span>
                  </td>

                  <td className={tdClass}>
                    <div className="flex justify-center">
                      <RowActionsMenu
                        ariaLabel={`Actions for ${employee.name}`}
                        items={menuItems(employee)}
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
