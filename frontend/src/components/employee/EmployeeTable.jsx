import { useEffect, useRef, useState } from "react";
import {
  MoreVertical,
  Pencil,
  Eye,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function roleBadge(role) {
  switch ((role || "").toUpperCase()) {
    case "ADMIN":
      return "bg-red-100 text-red-700";

    case "USER":
      return "bg-green-100 text-green-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function statusBadge(status) {
  switch ((status || "").toUpperCase()) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";

    case "INACTIVE":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function EmployeeTable({
  employees,
  handleDelete,
  handleEdit,
}) {
  const navigate = useNavigate();

  // Which employee menu is currently open
  const [openMenu, setOpenMenu] = useState(null);

  // Reference to the currently opened menu
  const menuRef = useRef(null);

  // =========================
  // CLOSE MENU WHEN CLICKING OUTSIDE
  // =========================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================
  // CLOSE MENU WHEN ESC IS PRESSED
  // =========================

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

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

  return (
    <div className="crm-table-shell overflow-visible">
      <div className="crm-table-scroll overflow-visible">
        <table className="w-full min-w-[980px]">

          {/* =========================
              TABLE HEADER
          ========================= */}

          <thead className="bg-[#25D366] text-black">
            <tr>
              <th className="crm-th min-w-[240px]">
                Employee
              </th>

              <th className="crm-th">
                Phone
              </th>

              <th className="crm-th">
                Department
              </th>

              <th className="crm-th">
                Designation
              </th>

              <th className="crm-th">
                Status
              </th>

              <th className="crm-th">
                Role
              </th>

              <th className="crm-th text-center">
                Actions
              </th>
            </tr>
          </thead>

          {/* =========================
              TABLE BODY
          ========================= */}

          <tbody>
            {employees.map((employee, index) => {

              // Check whether this is one of the last two rows
              const isLastTwoRows =
                index >= employees.length - 2;

              const isMenuOpen =
                openMenu === employee.id;

              return (
                <tr
                  key={employee.id}
                  className="relative border-b border-gray-100 last:border-b-0 hover:bg-[#DCF8C6] transition"
                >

                  {/* =========================
                      EMPLOYEE
                  ========================= */}

                  <td className="crm-td">
                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] font-bold text-black">
                        {employee.name
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">

                        <div className="font-semibold text-slate-800">
                          {employee.name}
                        </div>

                        <div className="break-all text-xs text-gray-500">
                          {employee.email}
                        </div>

                      </div>

                    </div>
                  </td>

                  {/* =========================
                      PHONE
                  ========================= */}

                  <td className="crm-td">
                    {employee.phone || "-"}
                  </td>

                  {/* =========================
                      DEPARTMENT
                  ========================= */}

                  <td className="crm-td">
                    {employee.department || "-"}
                  </td>

                  {/* =========================
                      DESIGNATION
                  ========================= */}

                  <td className="crm-td">
                    {employee.designation || "-"}
                  </td>

                  {/* =========================
                      STATUS
                  ========================= */}

                  <td className="crm-td">
                    <span
                      className={`crm-badge ${statusBadge(
                        employee.status
                      )}`}
                    >
                      {employee.status}
                    </span>
                  </td>

                  {/* =========================
                      ROLE
                  ========================= */}

                  <td className="crm-td">
                    <span
                      className={`crm-badge ${roleBadge(
                        employee.role
                      )}`}
                    >
                      {employee.role}
                    </span>
                  </td>

                  {/* =========================
                      ACTIONS
                  ========================= */}

                  <td className="crm-td">
                    <div
                      ref={
                        isMenuOpen
                          ? menuRef
                          : null
                      }
                      className="relative flex justify-center"
                    >

                      {/* Three dots button */}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          setOpenMenu(
                            isMenuOpen
                              ? null
                              : employee.id
                          );
                        }}
                        className="rounded-lg p-2 transition hover:bg-gray-100"
                        aria-label="Employee actions"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* =========================
                          ACTION MENU
                      ========================= */}

                      {isMenuOpen && (
                        <div
                          className={`
                            absolute
                            right-0
                            z-[100]
                            w-44
                            overflow-hidden
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            shadow-xl
                            ${
                              isLastTwoRows
                                ? "bottom-11"
                                : "top-11"
                            }
                          `}
                        >

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null);

                              navigate(
                                `/employees/${employee.id}`
                              );
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-100"
                          >
                            <Eye size={16} />

                            <span>
                              View
                            </span>
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null);

                              handleEdit(
                                employee.id
                              );
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-100"
                          >
                            <Pencil size={16} />

                            <span>
                              Edit
                            </span>
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenu(null);

                              handleDelete(
                                employee.id
                              );
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />

                            <span>
                              Delete
                            </span>
                          </button>

                        </div>
                      )}

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