import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useTaskStore from "../../store/taskStore";
import useEmployeeStore from "../../store/employeeStore";
import {
  TaskModalShell,
  TaskFormFields,
} from "./taskUi";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "./taskHelpers";

const EMPTY_FORM = {
  title: "",
  description: "",
  priority: "MEDIUM",
  dueDate: "",
  assignedToId: "",
};

export default function CreateTaskModal({
  isOpen,
  onClose,
}) {
  const { addTask } = useTaskStore();

  const { employees, fetchEmployees } = useEmployeeStore();

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [errors, setErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================
  // FETCH EMPLOYEES
  // ============================

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

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

    if (isSubmitting) return;

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      await addTask(formData);

      setFormData(EMPTY_FORM);

      setErrors({});

      // Close after successful creation
      onClose();

      // Success message (shown AFTER the popup is closed)
      toast.success("Task created successfully!");
    } catch (error) {
      console.error("Failed to create task:", error);

      // Inactive company
      if (error?.response?.status === 403) {
        // apiClient already showed the toast
        onClose();
        return;
      }

      // Other errors
      toast.error(
        error?.response?.data?.message ||
          "Failed to create task"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================
  // CLOSE MODAL
  // ============================

  const handleClose = () => {
    // Don't allow closing while creating
    if (isSubmitting) return;

    onClose();
  };

  if (!isOpen) return null;

  return (
    <TaskModalShell
      title="Add Task"
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
      />
    </TaskModalShell>
  );
}
