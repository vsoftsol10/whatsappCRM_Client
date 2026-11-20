import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

import useTaskStore from "../../store/taskStore";
import { addTaskWorkNote } from "../../api/taskApi";
import AddWorkNote from "../common/AddWorkNote";
import {
  TaskModalShell,
  TaskFormFields,
} from "./taskUi";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "./taskHelpers";

export default function EditTaskModal({
  isOpen,
  onClose,
  task,
}) {
  const { editTask, employees, fetchEmployees } =
    useTaskStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    assignedToId: "",
  });

  const [errors, setErrors] = useState({});
  const submitLock = useRef(false);
  const [loadingEmployees, setLoadingEmployees] =
    useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================
  // FETCH EMPLOYEES
  // ============================

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoadingEmployees(true);
        await fetchEmployees();
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEmployees(false);
      }
    };

    if (isOpen) {
      loadEmployees();
    }
  }, [isOpen]);

  // ============================
  // SYNC TASK INTO FORM
  // ============================

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "MEDIUM",
        dueDate: task.dueDate
          ? task.dueDate.split("T")[0]
          : "",
        assignedToId: task.assignedToId || "",
      });

      setErrors({});
    }
  }, [task]);

  // ============================
  // VALIDATION
  // ============================

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title =
        "Task title must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.priority) {
      newErrors.priority = "Priority is required";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    if (!formData.assignedToId) {
      newErrors.assignedToId = "Please select an employee";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ============================
  // HANDLE CHANGE
  // ============================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // ============================
  // HANDLE SUBMIT
  // ============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submit immediately
    if (submitLock.current) return;

    // Lock immediately before any async operation
    submitLock.current = true;
    setIsSubmitting(true);

    if (!validateForm()) {
      submitLock.current = false;
      setIsSubmitting(false);
      return;
    }

    try {
      await editTask(task.id, formData);

      setErrors({});

      onClose();

      // Success message (shown AFTER the popup is closed)
      toast.success("Task updated successfully!");
    } catch (error) {
      console.error("Failed to update task:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to update task"
      );
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  // ============================
  // CLOSE MODAL
  // ============================

  const handleClose = () => {
    // Don't close while update is happening
    if (isSubmitting) return;

    onClose();
  };

  if (!isOpen || !task) return null;

  return (
    <TaskModalShell
      title="Edit Task"
      onClose={handleClose}
      closeDisabled={isSubmitting}
      onSubmit={handleSubmit}
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className={secondaryButtonClass}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className={primaryButtonClass}
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save Task"
            )}
          </button>
        </>
      }
    >
      <TaskFormFields
        formData={formData}
        errors={errors}
        onChange={handleChange}
        employees={employees}
        disabled={isSubmitting}
        loadingEmployees={loadingEmployees}
      />

      {/* WORK NOTE */}

      <div className="mt-6 border-t border-slate-100 pt-5">
        <AddWorkNote
          entityId={task.id}
          addNote={addTaskWorkNote}
        />
      </div>
    </TaskModalShell>
  );
}
