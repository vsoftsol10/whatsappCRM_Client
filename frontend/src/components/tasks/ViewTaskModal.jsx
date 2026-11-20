import { Pencil } from "lucide-react";

import WorkNotes from "../common/WorkNotes";
import {
  getTaskWorkNotes,
  addTaskWorkNote,
  updateTaskWorkNote,
  deleteTaskWorkNote,
} from "../../api/taskApi";
import {
  TaskModalShell,
  TaskFormFields,
} from "./taskUi";
import {
  secondaryButtonClass,
} from "./taskHelpers";

export default function ViewTaskModal({
  isOpen,
  onClose,
  task,
  onEdit,
  canEdit = false,
}) {
  if (!isOpen || !task) return null;

  const formData = {
    title: task.title || "",
    description: task.description || "",
    priority: task.priority || "MEDIUM",
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    assignedToId: task.assignedToId || "",
  };

  // Only the assigned employee is needed to display the name
  const employees = task.assignedTo
    ? [{ id: task.assignedToId, name: task.assignedTo.name }]
    : [];

  return (
    <TaskModalShell
      title="View Task"
      onClose={onClose}
      headerExtra={
        canEdit && onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-green-500 bg-green-100 px-5 text-sm font-semibold text-green-700 transition hover:bg-green-200"
          >
            <Pencil size={16} />
            Edit
          </button>
        ) : null
      }
      footer={
        <button
          type="button"
          onClick={onClose}
          className={secondaryButtonClass}
        >
          Close
        </button>
      }
    >
      <TaskFormFields
        formData={formData}
        employees={employees}
        onChange={() => {}}
        disabled
        createdAt={task.createdAt}
      />

      {/* WORK NOTES */}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <WorkNotes
          entityId={task.id}
          getNotes={getTaskWorkNotes}
          addNote={addTaskWorkNote}
          editNote={updateTaskWorkNote}
          removeNote={deleteTaskWorkNote}
        />
      </div>
    </TaskModalShell>
  );
}
