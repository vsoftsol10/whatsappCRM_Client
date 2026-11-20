

import { useEffect, useState } from "react";
import {
  getEmployeeById,
  updateEmployee,
} from "../api/employeeApi";
import toast from "react-hot-toast";
import {
  EmployeeModalShell,
  FormActions,
  FormField,
  FormSection,
  ROLE_OPTIONS,
  SelectInput,
  cancelButtonClass,
  fieldInputClass,
  fieldTextareaClass,
  primaryButtonClass,
} from "../components/employee/EmployeeFormParts";

function EditEmployee({ employeeId, onClose, onSuccess }) {
  const id = employeeId;

  // "status" is not shown in this form any more (it is switched from the
  // table), but it is still sent so saving never changes it by accident.
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    address: "",
    role: "USER",
    status: "ACTIVE",
  });

  const [errors, setErrors] = useState({});

  // Loading employee details
  const [loading, setLoading] = useState(true);

  // Loading update request
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================
  // FETCH EMPLOYEE
  // ============================

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);

        const data = await getEmployeeById(id);

        const employee = data.employee;

        setFormData({
          name: employee.name || "",
          email: employee.email || "",
          phone: employee.phone || "",
          department: employee.department || "",
          designation: employee.designation || "",
          address: employee.address || "",
          role: employee.role || "USER",
          status: employee.status || "ACTIVE",
        });
      } catch (error) {
        console.error("Failed to fetch employee:", error);

        toast.error(
          error.response?.data?.message ||
            "Failed to fetch employee"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEmployee();
    }
  }, [id]);

  // ============================
  // VALIDATION
  // ============================

  const validateForm = () => {
    const newErrors = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name =
        "Name must be at least 3 characters";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
      )
    ) {
      newErrors.email =
        "Enter a valid email address";
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone =
        "Phone number is required";
    } else if (
      !/^[6-9]\d{9}$/.test(formData.phone)
    ) {
      newErrors.phone =
        "Enter a valid 10-digit Indian phone number";
    }

    // Department
    if (!formData.department.trim()) {
      newErrors.department =
        "Department is required";
    }

    // Designation
    if (!formData.designation.trim()) {
      newErrors.designation =
        "Designation is required";
    }

    // Address
    if (!formData.address.trim()) {
      newErrors.address =
        "Address is required";
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
  // SUBMIT
  // ============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate API requests
    if (isSubmitting) {
      return;
    }

    // Validate
    if (!validateForm()) {
      return;
    }

    try {
      // Start loading
      setIsSubmitting(true);

      await updateEmployee(id, formData);

      // Refresh employee list
      if (onSuccess) {
        await onSuccess();
      }

      // Close modal automatically
      onClose();

      // Success message (shown AFTER the popup is closed)
      toast.success(
        "Employee updated successfully!"
      );
    } catch (error) {
      console.error(
        "Update employee error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to update employee"
      );
    } finally {
      // Stop loading
      setIsSubmitting(false);
    }
  };

  // ============================
  // RENDER
  // ============================

  return (
    <EmployeeModalShell
      title="Edit Employee"
      onClose={onClose}
      closeDisabled={isSubmitting}
    >
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-green-500" />

            <p className="text-slate-500">
              Loading employee...
            </p>
          </div>
        </div>
      ) : (
        <form className="space-y-9" onSubmit={handleSubmit}>
          {/* ================= PERSONAL INFORMATION ================= */}
          <FormSection title="Personal Information">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Full Name" required error={errors.name}>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  disabled={isSubmitting}
                  className={fieldInputClass(!!errors.name)}
                />
              </FormField>

              <FormField label="Email Address" required error={errors.email}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  disabled={isSubmitting}
                  className={fieldInputClass(!!errors.email)}
                />
              </FormField>

              <FormField label="Phone Number" required error={errors.phone}>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  maxLength={10}
                  disabled={isSubmitting}
                  className={fieldInputClass(!!errors.phone)}
                />
              </FormField>
            </div>
          </FormSection>

          {/* ================= WORK INFORMATION ================= */}
          <FormSection title="Work Information">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Department" required error={errors.department}>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Department"
                  disabled={isSubmitting}
                  className={fieldInputClass(!!errors.department)}
                />
              </FormField>

              <FormField label="Designation" required error={errors.designation}>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  placeholder="Designation (e.g. Sales Executive)"
                  disabled={isSubmitting}
                  className={fieldInputClass(!!errors.designation)}
                />
              </FormField>

              <FormField label="Role" required>
                <SelectInput
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
            </div>
          </FormSection>

          {/* ================= ADDRESS ================= */}
          <FormSection title="Address">
            <FormField label="Address" required error={errors.address}>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="5"
                placeholder="Address"
                disabled={isSubmitting}
                className={fieldTextareaClass(!!errors.address)}
              />
            </FormField>
          </FormSection>

          {/* ================= BUTTONS ================= */}
          <FormActions>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={cancelButtonClass}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={primaryButtonClass}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </FormActions>
        </form>
      )}
    </EmployeeModalShell>
  );
}

export default EditEmployee;
