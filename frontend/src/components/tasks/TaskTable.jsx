import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useAuthStore } from "../../store/authStore";
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  User,
} from "lucide-react";

function priorityBadge(priority) {
  switch ((priority || "").toUpperCase()) {
    case "HIGH":
      return "bg-red-100 text-red-700 border border-red-200";

    case "MEDIUM":
      return "bg-[#DCF8C6] text-[#128C7E] border border-[#DCF8C6]";

    case "LOW":
      return "bg-green-100 text-green-700 border border-green-200";

    default:
      return "bg-gray-100 text-gray-700 border border-gray-200";
  }
}

function statusBadge(status) {
  switch ((status || "").toUpperCase()) {
    case "TODO":
      return "bg-gray-100 text-gray-700 border border-gray-200";

    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700 border border-blue-200";

    case "REVIEW":
      return "bg-[#DCF8C6] text-[#128C7E] border border-[#DCF8C6]";

    case "COMPLETED":
      return "bg-green-100 text-green-700 border border-green-200";

    default:
      return "bg-gray-100 text-gray-700 border border-gray-200";
  }
}

export default function TaskTable({
  tasks = [],
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
}) {
  const { user } = useAuthStore();

  const isAdmin = user?.role === "ADMIN";

  const currentUserId = user?.id || user?.userId;

  // Which menu is currently open
  const [openMenu, setOpenMenu] = useState(null);

  // Whether menu should open upward or downward
  const [menuPosition, setMenuPosition] = useState("down");

  // Main table wrapper
  const wrapperRef = useRef(null);

  // Store each three-dot button
  const buttonRefs = useRef({});

  // Store menu itself
  const menuRef = useRef(null);

  // ============================================================
  // CLOSE MENU WHEN CLICKING OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If no menu is open, nothing to do
      if (openMenu === null) return;

      // Click is inside the table/menu area
      if (
        wrapperRef.current &&
        wrapperRef.current.contains(event.target)
      ) {
        return;
      }

      // Otherwise close menu
      setOpenMenu(null);
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
  }, [openMenu]);

  // ============================================================
  // CALCULATE MENU POSITION
  // ============================================================

  useLayoutEffect(() => {
    if (openMenu === null) return;

    const button = buttonRefs.current[openMenu];

    if (!button) return;

    const rect = button.getBoundingClientRect();

    /*
      Approximate menu height:

      View Details
      Edit Task
      Delete Task

      Each item is around 44px.
      So approximately 132px total.
    */
    const menuHeight = 140;

    const menuGap = 8;

    const spaceAbove = rect.top;

    const spaceBelow =
      window.innerHeight - rect.bottom;

    /*
      If there isn't enough space below,
      open upward.

      Otherwise open downward.
    */
    if (
      spaceBelow < menuHeight + menuGap &&
      spaceAbove > menuHeight + menuGap
    ) {
      setMenuPosition("up");
    } else {
      setMenuPosition("down");
    }
  }, [openMenu]);

  // ============================================================
  // CLOSE MENU ON SCROLL
  // ============================================================

  useEffect(() => {
    if (openMenu === null) return;

    const handleScroll = () => {
      setOpenMenu(null);
    };

    window.addEventListener(
      "scroll",
      handleScroll,
      true
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );
    };
  }, [openMenu]);

  // ============================================================
  // OPEN / CLOSE MENU
  // ============================================================

  const handleMenuToggle = (taskId) => {
    setOpenMenu((current) =>
      current === taskId ? null : taskId
    );
  };

  // ============================================================
  // VIEW
  // ============================================================

  const handleView = (task) => {
    setOpenMenu(null);

    if (onView) {
      onView(task);
    }
  };

  // ============================================================
  // EDIT
  // ============================================================

  const handleEdit = (task) => {
    setOpenMenu(null);

    if (onEdit) {
      onEdit(task);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = (taskId) => {
    setOpenMenu(null);

    if (onDelete) {
      onDelete(taskId);
    }
  };

  // ============================================================
  // NO TASKS
  // ============================================================

  if (!tasks || tasks.length === 0) {
    return (
      <div className="crm-page-surface mt-6 p-8 text-center sm:p-12">
        <div className="flex flex-col items-center justify-center">

          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#DCF8C6]">
            <User
              size={30}
              className="text-[#25D366]"
            />
          </div>

          <h3 className="text-xl font-semibold text-slate-800">
            No Tasks Found
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            There are no tasks matching your filters.
          </p>

        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="crm-table-shell mt-6 overflow-visible"
    >
      <div className="crm-table-scroll overflow-visible">

        <table className="w-full min-w-[1000px] table-auto">

          {/* ================================================= */}
          {/* TABLE HEADER */}
          {/* ================================================= */}

          <thead className="sticky top-0 z-10 bg-[#25D366]">

            <tr>

              <th className="crm-th">
                Assigned To
              </th>

              <th className="crm-th min-w-[280px]">
                Task
              </th>

              <th className="crm-th">
                Priority
              </th>

              <th className="crm-th">
                Status
              </th>

              <th className="crm-th">
                Due Date
              </th>

              <th className="crm-th">
                Created
              </th>

              {isAdmin && (
                <th className="crm-th w-20 text-center">
                  Actions
                </th>
              )}

            </tr>

          </thead>

          {/* ================================================= */}
          {/* TABLE BODY */}
          {/* ================================================= */}

          <tbody className="divide-y divide-gray-100 bg-white">

            {tasks.map((task) => {

              const canUpdateStatus =
                isAdmin ||
                task.assignedToId === currentUserId;

              return (
                <tr
                  key={task.id}
                  className="transition-all duration-200 hover:bg-[#DCF8C6]/60"
                >

                  {/* ================================================= */}
                  {/* ASSIGNED TO */}
                  {/* ================================================= */}

                  <td className="crm-td">

                    {task.assignedTo ? (

                      <div className="flex items-center gap-3">

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#DCF8C6] font-semibold text-[#128C7E]">
                          {task.assignedTo.name
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="font-semibold text-slate-800">
                            {task.assignedTo.name}
                          </p>

                          <p className="break-all text-xs text-gray-500">
                            {task.assignedTo.email}
                          </p>

                        </div>

                      </div>

                    ) : (

                      <span className="italic text-gray-400">
                        Unassigned
                      </span>

                    )}

                  </td>

                  {/* ================================================= */}
                  {/* TASK */}
                  {/* ================================================= */}

                  <td className="crm-td">

                    <div className="break-words font-semibold text-slate-800">
                      {task.title}
                    </div>

                    <div className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {task.description || "-"}
                    </div>

                  </td>

                  {/* ================================================= */}
                  {/* PRIORITY */}
                  {/* ================================================= */}

                  <td className="crm-td">

                    {isAdmin ? (

                      <select
                        value={task.priority}
                        onChange={(e) =>
                          onPriorityChange(
                            task.id,
                            e.target.value
                          )
                        }
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition focus:border-[#25D366] focus:ring-2 focus:ring-[#DCF8C6] ${priorityBadge(
                          task.priority
                        )}`}
                      >

                        <option value="LOW">
                          LOW
                        </option>

                        <option value="MEDIUM">
                          MEDIUM
                        </option>

                        <option value="HIGH">
                          HIGH
                        </option>

                      </select>

                    ) : (

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>

                    )}

                  </td>

                  {/* ================================================= */}
                  {/* STATUS */}
                  {/* ================================================= */}

                  <td className="crm-td">

                    {canUpdateStatus ? (

                      <select
                        value={task.status}
                        onChange={(e) =>
                          onStatusChange(
                            task.id,
                            e.target.value
                          )
                        }
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition focus:border-[#25D366] focus:ring-2 focus:ring-[#DCF8C6] ${statusBadge(
                          task.status
                        )}`}
                      >

                        <option value="TODO">
                          TODO
                        </option>

                        <option value="IN_PROGRESS">
                          IN PROGRESS
                        </option>

                        <option value="REVIEW">
                          REVIEW
                        </option>

                        <option value="COMPLETED">
                          COMPLETED
                        </option>

                      </select>

                    ) : (

                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(
                          task.status
                        )}`}
                      >
                        {task.status?.replace(
                          "_",
                          " "
                        )}
                      </span>

                    )}

                  </td>

                  {/* ================================================= */}
                  {/* DUE DATE */}
                  {/* ================================================= */}

                  <td className="crm-td whitespace-nowrap text-slate-600">

                    {task.dueDate
                      ? new Date(
                          task.dueDate
                        ).toLocaleDateString()
                      : "-"}

                  </td>

                  {/* ================================================= */}
                  {/* CREATED */}
                  {/* ================================================= */}

                  <td className="crm-td whitespace-nowrap text-slate-600">

                    {task.createdAt
                      ? new Date(
                          task.createdAt
                        ).toLocaleDateString()
                      : "-"}

                  </td>

                  {/* ================================================= */}
                  {/* ACTIONS */}
                  {/* ================================================= */}

                  {isAdmin && (

                    <td className="crm-td">

                      <div className="relative flex justify-center">

                        {/* THREE DOT BUTTON */}

                        <button
                          ref={(element) => {
                            if (element) {
                              buttonRefs.current[
                                task.id
                              ] = element;
                            }
                          }}
                          type="button"
                          onClick={() =>
                            handleMenuToggle(
                              task.id
                            )
                          }
                          className="rounded-lg p-2 transition hover:bg-gray-100"
                        >

                          <MoreVertical
                            size={18}
                            className="text-gray-600"
                          />

                        </button>

                        {/* ================================================= */}
                        {/* DROPDOWN */}
                        {/* ================================================= */}

                        {openMenu === task.id && (

                          <div
                            ref={menuRef}
                            className={`
                              absolute
                              right-0
                              z-[9999]
                              w-44
                              overflow-hidden
                              rounded-xl
                              border
                              border-gray-200
                              bg-white
                              shadow-xl
                              ${
                                menuPosition === "up"
                                  ? "bottom-full mb-2"
                                  : "top-full mt-2"
                              }
                            `}
                          >

                            {/* VIEW */}

                            <button
                              type="button"
                              onClick={() =>
                                handleView(task)
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-gray-100"
                            >

                              <Eye size={16} />

                              <span>
                                View Details
                              </span>

                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(task)
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-gray-100"
                            >

                              <Pencil size={16} />

                              <span>
                                Edit Task
                              </span>

                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  task.id
                                )
                              }
                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                            >

                              <Trash2 size={16} />

                              <span>
                                Delete Task
                              </span>

                            </button>

                          </div>

                        )}

                      </div>

                    </td>

                  )}

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>
    </div>
  );
}