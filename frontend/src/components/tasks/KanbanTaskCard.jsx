import { Eye, Pencil, Trash2, User } from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import RowActionsMenu from "../common/RowActionsMenu";
import {
  Pill,
  PillSelect,
} from "./taskUi";
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  formatDate,
  priorityTone,
  statusTone,
  optionLabel,
} from "./taskHelpers";

export default function KanbanTaskCard({
  task,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
}) {
  const { user } = useAuthStore();

  const isAdmin = user?.role === "ADMIN";

  const currentUserId = user?.id || user?.userId;

  const canUpdateStatus =
    isAdmin || task.assignedToId === currentUserId;

  const menuItems = [
    {
      key: "view",
      label: "View",
      icon: Eye,
      onClick: () => onView?.(task),
    },
  ];

  if (isAdmin) {
    menuItems.push(
      {
        key: "edit",
        label: "Edit",
        icon: Pencil,
        onClick: () => onEdit?.(task),
      },
      {
        key: "delete",
        label: "Delete",
        icon: Trash2,
        danger: true,
        onClick: () => onDelete?.(task.id),
      }
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      {/* TITLE + MENU */}

      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onView?.(task)}
          className="min-w-0 break-words text-left text-[15px] font-semibold text-slate-900 hover:text-green-600"
        >
          {task.title}
        </button>

        <div className="shrink-0 [&>button]:bg-slate-100 [&>button]:text-slate-600">
          <RowActionsMenu
            ariaLabel={`Actions for ${task.title}`}
            items={menuItems}
          />
        </div>
      </div>

      {/* DUE DATE */}

      <p className="mt-5 text-sm text-slate-500">
        Due date{" "}
        <span className="ml-1 font-semibold text-slate-900">
          {formatDate(task.dueDate, { utc: true })}
        </span>
      </p>

      {/* FOOTER */}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isAdmin ? (
          <PillSelect
            label="Priority"
            value={task.priority}
            options={PRIORITY_OPTIONS}
            tone={priorityTone(task.priority)}
            onChange={(value) =>
              onPriorityChange?.(task.id, value)
            }
          />
        ) : (
          <Pill tone={priorityTone(task.priority)}>
            {optionLabel(PRIORITY_OPTIONS, task.priority)}
          </Pill>
        )}

        {canUpdateStatus ? (
          <PillSelect
            label="Status"
            value={task.status}
            options={STATUS_OPTIONS}
            tone={statusTone(task.status)}
            onChange={(value) =>
              onStatusChange?.(task.id, value)
            }
          />
        ) : (
          <Pill tone={statusTone(task.status)}>
            {optionLabel(STATUS_OPTIONS, task.status)}
          </Pill>
        )}

        <span className="ml-auto flex items-center gap-1.5 text-sm text-slate-500">
          <User size={14} />
          {task.assignedTo?.name || "Unassigned"}
        </span>
      </div>
    </div>
  );
}
