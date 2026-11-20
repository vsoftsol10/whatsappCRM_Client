

import { useState } from "react";
import { createEmployee } from "../../api/employeeApi";
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
} from "./EmployeeFormParts";

function AddEmployeeModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        address: "",
        role: "USER",
    });

    const [errors, setErrors] = useState({
        name: "",
        email: "",
        phone: "",
        department: "",
        designation: "",
        address: "",
        role: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // ===========================
    // HANDLE CHANGE
    // ===========================
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

    // ===========================
    // VALIDATION
    // ===========================
    const validateForm = () => {
        const newErrors = {};

        // Name
        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        } else if (formData.name.trim().length < 3) {
            newErrors.name = "Name must be at least 3 characters";
        }

        // Email
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                formData.email.trim()
            )
        ) {
            newErrors.email = "Enter a valid email address";
        }

        // Phone
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
            newErrors.phone = "Enter a valid 10-digit phone number";
        }

        // Department
        if (!formData.department.trim()) {
            newErrors.department = "Department is required";
        }

        // Designation
        if (!formData.designation.trim()) {
            newErrors.designation = "Designation is required";
        }

        // Role
        if (!formData.role) {
            newErrors.role = "Role is required";
        }

        // Address
        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // ===========================
    // SUBMIT
    // ===========================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) {
            return;
        }

        const isValid = validateForm();

        if (!isValid) {
            toast.error("Please correct the highlighted fields");
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await createEmployee(formData);

            // Refresh employee list
            onSuccess?.();

            // Close popup
            onClose();

            // Success message (shown AFTER the popup is closed)
            toast.success(
                response?.message || "Employee created successfully!"
            );

        } catch (error) {
            console.error("Create employee failed:", error);

            // 403 errors are already handled by apiClient interceptor
            if (error?.response?.status === 403) {
                onClose();
                return;
            }

            toast.error(
                error?.response?.data?.message ||
                "Failed to create employee"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <EmployeeModalShell
            title="Add Employee"
            onClose={onClose}
            onBackdropClick={onClose}
        >
            <form className="space-y-9" onSubmit={handleSubmit}>
                {/* ===========================
                    PERSONAL INFORMATION
                =========================== */}
                <FormSection title="Personal Information">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Full Name" required error={errors.name}>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Full Name"
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
                                className={fieldInputClass(!!errors.phone)}
                            />
                        </FormField>
                    </div>
                </FormSection>

                {/* ===========================
                    WORK INFORMATION
                =========================== */}
                <FormSection title="Work Information">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <FormField label="Department" required error={errors.department}>
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                placeholder="Department"
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
                                className={fieldInputClass(!!errors.designation)}
                            />
                        </FormField>

                        <FormField label="Role" required error={errors.role}>
                            <SelectInput
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                hasError={!!errors.role}
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

                {/* ===========================
                    ADDRESS
                =========================== */}
                <FormSection title="Address">
                    <FormField label="Address" required error={errors.address}>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows="5"
                            placeholder="Address"
                            className={fieldTextareaClass(!!errors.address)}
                        />
                    </FormField>
                </FormSection>

                {/* ===========================
                    ACTION BUTTONS
                =========================== */}
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
                        {isSubmitting ? "Creating..." : "Create Employee"}
                    </button>
                </FormActions>
            </form>
        </EmployeeModalShell>
    );
}

export default AddEmployeeModal;
