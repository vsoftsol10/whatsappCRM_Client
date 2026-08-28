import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { createEmployee } from "../../api/employeeApi";
import toast from "react-hot-toast";

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
        if (!formData.designation) {
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

            console.log("========== ADD EMPLOYEE ==========");
            console.log("Sending employee data:", formData);

            const response = await createEmployee(formData);

            console.log("========== CREATE SUCCESS ==========");
            console.log("Response:", response);

            toast.success(
                response?.message || "Employee created successfully!"
            );

            // Refresh employee list
            onSuccess?.();

            // Close popup
            onClose();

        } catch (error) {
            console.error("========== CREATE FAILED ==========");
            console.error("Error:", error);
            console.error("Status:", error?.response?.status);
            console.error("Response:", error?.response?.data);

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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            {/* ===========================
                MODAL
            =========================== */}
            <div
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* ===========================
                    HEADER
                =========================== */}
                <div className="sticky top-0 z-10 flex items-center gap-4 bg-[#25D366] px-5 py-5 sm:px-8 sm:py-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow transition hover:bg-gray-100"
                    >
                        <FiArrowLeft size={20} />
                    </button>

                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-black sm:text-3xl">
                            Add Employee
                        </h1>

                        <p className="mt-1 text-sm text-gray-800 sm:text-base">
                            Create a new employee account
                        </p>
                    </div>
                </div>

                {/* ===========================
                    FORM
                =========================== */}
                <form
                    className="space-y-8 p-5 sm:p-8"
                    onSubmit={handleSubmit}
                >
                    {/* ===========================
                        PERSONAL INFORMATION
                    =========================== */}
                    <div>
                        <h2 className="mb-5 border-b-2 border-[#25D366] pb-2 text-xl font-bold text-black">
                            Personal Information
                        </h2>

                        <div className="space-y-5">

                            {/* Name */}
                            <div>
                                <label className="mb-2 block font-semibold text-black">
                                    Full Name{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Full Name"
                                    className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition ${
                                        errors.name
                                            ? "border-red-500"
                                            : "border-gray-300 focus:border-[#25D366]"
                                    }`}
                                />

                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-2 block font-semibold text-black">
                                    Email Address{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Email Address"
                                    className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition ${
                                        errors.email
                                            ? "border-red-500"
                                            : "border-gray-300 focus:border-[#25D366]"
                                    }`}
                                />

                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="mb-2 block font-semibold text-black">
                                    Phone Number{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Phone Number"
                                    maxLength={10}
                                    className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition ${
                                        errors.phone
                                            ? "border-red-500"
                                            : "border-gray-300 focus:border-[#25D366]"
                                    }`}
                                />

                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ===========================
                        WORK INFORMATION
                    =========================== */}
                    <div>
                        <h2 className="mb-5 border-b-2 border-[#25D366] pb-2 text-xl font-bold text-black">
                            Work Information
                        </h2>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                            {/* Department */}
                            <div>
                                <label className="mb-2 block font-semibold text-black">
                                    Department{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    placeholder="Department"
                                    className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition ${
                                        errors.department
                                            ? "border-red-500"
                                            : "border-gray-300 focus:border-[#25D366]"
                                    }`}
                                />

                                {errors.department && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.department}
                                    </p>
                                )}
                            </div>

                            {/* Designation */}
                            <div>
                                <label className="mb-2 block font-semibold text-black">
                                    Designation{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <select
                                    name="designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition ${
                                        errors.designation
                                            ? "border-red-500"
                                            : "border-gray-300 focus:border-[#25D366]"
                                    }`}
                                >
                                    <option value="">
                                        Select Designation
                                    </option>

                                    <option value="Sales Agent">
                                        Sales Agent
                                    </option>

                                    <option value="Support Agent">
                                        Support Agent
                                    </option>

                                    <option value="Technical">
                                        Technical
                                    </option>

                                    <option value="Marketing">
                                        Marketing
                                    </option>

                                    <option value="Manager">
                                        Manager
                                    </option>

                                    <option value="HR">
                                        HR
                                    </option>

                                    <option value="Finance">
                                        Finance
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>
                                </select>

                                {errors.designation && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.designation}
                                    </p>
                                )}
                            </div>

                            {/* Role */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block font-semibold text-black">
                                    Role{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition ${
                                        errors.role
                                            ? "border-red-500"
                                            : "border-gray-300 focus:border-[#25D366]"
                                    }`}
                                >
                                    <option value="USER">
                                        USER
                                    </option>

                                    <option value="ADMIN">
                                        ADMIN
                                    </option>
                                </select>

                                {errors.role && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.role}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ===========================
                        ADDRESS
                    =========================== */}
                    <div>
                        <h2 className="mb-5 border-b-2 border-[#25D366] pb-2 text-xl font-bold text-black">
                            Address
                        </h2>

                        <div>
                            <label className="mb-2 block font-semibold text-black">
                                Address{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Address"
                                className={`w-full resize-none rounded-xl border-2 px-4 py-3 outline-none transition ${
                                    errors.address
                                        ? "border-red-500"
                                        : "border-gray-300 focus:border-[#25D366]"
                                }`}
                            />

                            {errors.address && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.address}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ===========================
                        ACTION BUTTONS
                    =========================== */}
                    <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end sm:gap-4">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="crm-secondary-button"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="crm-primary-button"
                        >
                            {isSubmitting
                                ? "Creating..."
                                : "Create Employee"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddEmployeeModal;