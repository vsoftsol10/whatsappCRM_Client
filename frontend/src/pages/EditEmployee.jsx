

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

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const data = await getEmployeeById(id);

        setFormData({
          name: data.employee.name || "",
          email: data.employee.email || "",
          phone: data.employee.phone || "",
          department: data.employee.department || "",
          designation: data.employee.designation || "",
          address: data.employee.address || "",
          status: data.employee.status || "ACTIVE",
        });
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch employee");
      }
    };

    fetchEmployee();
  }, [id]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Enter a valid 10-digit Indian phone number";
    }

    if (!formData.department.trim()) {
      newErrors.department = "Department is required";
    }

    if (!formData.designation.trim()) {
      newErrors.designation = "Designation is required";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await updateEmployee(id, formData);

      toast.success("Employee updated successfully!");

      if (onSuccess) {
        await onSuccess();
      }

      onClose();
    } catch (error) {
      console.log("Backend response:", error.response?.data);
      console.error(error);

      toast.error(
        error.response?.data?.message ||
        "Failed to update employee"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">

        {/* Header */}
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
            className="rounded-full bg-white p-2 shadow transition hover:bg-gray-100"
          >
            <X size={22} />
          </button>

        </div>

        <form
          className="space-y-8 p-5 sm:p-8"
          onSubmit={handleSubmit}
        >

          {/* Personal Information */}
          <div>

            <h2 className="text-xl font-bold text-black border-b-2 border-[#25D366] pb-2 mb-5">
              Personal Information
            </h2>

            <div className="space-y-5">

              <div>
                <label className="block mb-2 font-semibold text-black">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className={`w-full border-2 rounded-xl px-4 py-3 outline-none ${errors.name
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                    }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 font-semibold text-black">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email Address"
                  className={`w-full border-2 rounded-xl px-4 py-3 outline-none ${errors.email
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                    }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 font-semibold text-black">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className={`w-full border-2 rounded-xl px-4 py-3 outline-none ${errors.phone
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                    }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phone}
                  </p>
                )}
              </div>

            </div>

          </div>

          {/* Work Information */}
          <div>

            <h2 className="text-xl font-bold text-black border-b-2 border-[#25D366] pb-2 mb-5">
              Work Information
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              <div>
                <label className="block mb-2 font-semibold text-black">
                  Department <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Department"
                  className={`w-full border-2 rounded-xl px-4 py-3 outline-none ${errors.department
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                    }`}
                />
                {errors.department && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.department}
                  </p>
                )}
              </div>

              <div>
                <label className="block mb-2 font-semibold text-black">
                  Designation <span className="text-red-500">*</span>
                </label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className={`w-full border-2 rounded-xl px-4 py-3 outline-none ${errors.designation
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                    }`}
                >
                  <option value="">Select Designation</option>
                  <option value="Sales Agent">Sales Agent</option>
                  <option value="Support Agent">Support Agent</option>
                </select>

                {errors.designation && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.designation}
                  </p>
                )}
              </div>

              <div>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border-2 rounded-xl px-4 py-3 outline-none border-gray-300 focus:border-[#25D366]"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

            </div>

          </div>

          {/* Additional Information */}
          <div>

            <h2 className="text-xl font-bold text-black border-b-2 border-[#25D366] pb-2 mb-5">
              Address
            </h2>

            <div>
              <label className="block mb-2 font-semibold text-black">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="4"
                placeholder="Address"
                className={`w-full border-2 rounded-xl px-4 py-3 outline-none resize-none ${errors.address
                  ? "border-red-500"
                  : "border-gray-300 focus:border-[#25D366]"
                  }`}
              />

              {errors.address && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.address}
                </p>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:gap-4">

            <button
              type="button"
              onClick={onClose}
              className="crm-secondary-button"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="crm-primary-button"
            >
              Update Employee
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}

export default EditEmployee;