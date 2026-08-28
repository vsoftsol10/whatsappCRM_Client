import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import useTaskStore from "../../store/taskStore";
import useEmployeeStore from "../../store/employeeStore";

export default function CreateTaskModal({
  isOpen,
  onClose,
}) {
  const { addTask } = useTaskStore();

  const {
    employees,
    fetchEmployees,
  } = useEmployeeStore();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    assignedToId: "",
  });

  const [errors, setErrors] = useState({});

  // ============================
  // SUBMITTING STATE
  // ============================

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
      newErrors.description =
        "Description is required";
    }

    if (!formData.priority) {
      newErrors.priority = "Priority is required";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    if (!formData.assignedToId) {
      newErrors.assignedToId =
        "Please select an employee";
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

    toast.success("Task created successfully!");

    setFormData({
      title: "",
      description: "",
      priority: "MEDIUM",
      dueDate: "",
      assignedToId: "",
    });

    setErrors({});

    // Close after successful creation
    onClose();

  } catch (error) {
    console.error(
      "Failed to create task:",
      error
    );

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
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">

      <div className="min-h-screen flex items-center justify-center p-4">

        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* ================= HEADER ================= */}

          <div className="bg-[#25D366] px-6 py-5 flex justify-between items-center">

            <h2 className="text-2xl font-bold text-gray-800">
              Create Task
            </h2>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={`p-2 rounded-full transition ${isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-[#128C7E]"
                }`}
            >
              <X size={22} />
            </button>

          </div>

          {/* ================= FORM ================= */}

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5 max-h-[75vh] overflow-y-auto"
          >

            {/* ================= TITLE ================= */}

            <div>

              <label className="block mb-2 font-medium text-gray-700">
                Task Title{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                name="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.title
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } ${isSubmitting
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                  }`}
              />

              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title}
                </p>
              )}

            </div>

            {/* ================= DESCRIPTION ================= */}

            <div>

              <label className="block mb-2 font-medium text-gray-700">
                Description{" "}
                <span className="text-red-500">*</span>
              </label>

              <textarea
                name="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.description
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } ${isSubmitting
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                  }`}
              />

              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}

            </div>

            {/* ================= PRIORITY ================= */}

            <div>

              <label className="block mb-2 font-medium text-gray-700">
                Priority{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.priority
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } ${isSubmitting
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                  }`}
              >
                <option value="LOW">
                  Low
                </option>

                <option value="MEDIUM">
                  Medium
                </option>

                <option value="HIGH">
                  High
                </option>

              </select>

              {errors.priority && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.priority}
                </p>
              )}

            </div>

            {/* ================= DUE DATE ================= */}

            <div>

              <label className="block mb-2 font-medium text-gray-700">
                Due Date{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.dueDate
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } ${isSubmitting
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                  }`}
              />

              {errors.dueDate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.dueDate}
                </p>
              )}

            </div>

            {/* ================= ASSIGNED TO ================= */}

            <div>

              <label className="block mb-2 font-medium text-gray-700">
                Assign Employee{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="assignedToId"
                value={formData.assignedToId}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${errors.assignedToId
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                  } ${isSubmitting
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                  }`}
              >

                <option value="">
                  Select Employee
                </option>

                {(employees ?? []).map((emp) => (
                  <option
                    key={emp.id}
                    value={emp.id}
                  >
                    {emp.name}
                  </option>
                ))}

              </select>

              {errors.assignedToId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.assignedToId}
                </p>
              )}

            </div>

            {/* ================= BUTTONS ================= */}

            <div className="flex justify-end gap-3 pt-4 border-t mt-6">

              {/* CANCEL */}

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg border border-gray-300 text-gray-700 transition ${isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-100"
                  }`}
              >
                Cancel
              </button>

              {/* CREATE */}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg text-gray-800 font-semibold transition flex items-center justify-center gap-2 ${isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#25D366] hover:bg-[#128C7E]"
                  }`}
              >

                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></span>
                    Creating...
                  </>
                ) : (
                  "Create Task"
                )}

              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}