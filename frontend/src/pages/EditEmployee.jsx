import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  getEmployeeById,
  updateEmployee,
} from "../api/employeeApi";
import toast from "react-hot-toast";

function EditEmployee({ employeeId, onClose, onSuccess }) {
  const id = employeeId;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    designation: "",
    address: "",
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

      toast.success(
        "Employee updated successfully!"
      );

      // Refresh employee list
      if (onSuccess) {
        await onSuccess();
      }

      // Close modal automatically
      onClose();
    } catch (error) {
      console.log(
        "Backend response:",
        error.response?.data
      );

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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">

        {/* ================= HEADER ================= */}

        <div className="flex items-center justify-between bg-[#25D366] px-5 py-5 sm:px-8 sm:py-6">

          <div>
            <h1 className="text-2xl font-bold text-black sm:text-3xl">
              Edit Employee
            </h1>

            <p className="mt-1 text-gray-800">
              Update employee information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full bg-white p-2 shadow transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={22} />
          </button>

        </div>

        {/* ================= LOADING EMPLOYEE ================= */}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">

              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#25D366]" />

              <p className="text-gray-500">
                Loading employee...
              </p>

            </div>
          </div>
        ) : (

          /* ================= FORM ================= */

          <form
            className="space-y-8 p-5 sm:p-8"
            onSubmit={handleSubmit}
          >

            {/* ================= PERSONAL INFORMATION ================= */}

            <div>

              <h2 className="mb-5 border-b-2 border-[#25D366] pb-2 text-xl font-bold text-black">
                Personal Information
              </h2>

              <div className="space-y-5">

                {/* NAME */}

                <div>
                  <label className="mb-2 block font-semibold text-black">
                    Full Name{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full Name"
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 ${
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

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block font-semibold text-black">
                    Email Address{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 ${
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

                {/* PHONE */}

                <div>
                  <label className="mb-2 block font-semibold text-black">
                    Phone Number{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 ${
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

            {/* ================= WORK INFORMATION ================= */}

            <div>

              <h2 className="mb-5 border-b-2 border-[#25D366] pb-2 text-xl font-bold text-black">
                Work Information
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {/* DEPARTMENT */}

                <div>
                  <label className="mb-2 block font-semibold text-black">
                    Department{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Department"
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 ${
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

                {/* DESIGNATION */}

                <div>
                  <label className="mb-2 block font-semibold text-black">
                    Designation{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={`w-full rounded-xl border-2 px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 ${
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

                {/* STATUS */}

                <div>
                  <label className="mb-2 block font-semibold text-black">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 outline-none focus:border-[#25D366] disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </div>

              </div>
            </div>

            {/* ================= ADDRESS ================= */}

            <div>

              <h2 className="mb-5 border-b-2 border-[#25D366] pb-2 text-xl font-bold text-black">
                Address
              </h2>

              <div>

                <label className="mb-2 block font-semibold text-black">
                  Address{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Address"
                  disabled={isSubmitting}
                  className={`w-full resize-none rounded-xl border-2 px-4 py-3 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 ${
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

            {/* ================= BUTTONS ================= */}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:gap-4">

              {/* CANCEL */}

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="crm-secondary-button disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              {/* UPDATE */}

              <button
                type="submit"
                disabled={isSubmitting}
                className="crm-primary-button flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
              >

                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-transparent" />

                    Updating...
                  </>
                ) : (
                  "Update Employee"
                )}

              </button>

            </div>

          </form>
        )}

      </div>
    </div>
  );
}

export default EditEmployee;