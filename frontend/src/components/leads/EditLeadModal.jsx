import { useState, useEffect } from "react";

import { X } from "lucide-react";

import useLeadStore from "../../store/leadStore";

import toast from "react-hot-toast";

import { addLeadWorkNote } from "../../api/leadApi";

import AddWorkNote from "../common/AddWorkNote";

export default function EditLeadModal({
  isOpen,
  onClose,
  lead,
  employees = [],
}) {
  const { editLead } = useLeadStore();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    source: "",
    company: "",
    requirements: "",
    status: "NEW",
    assignedToId: "",
  });

  const [errors, setErrors] = useState({});

  // Loading state for Update button
  const [isUpdating, setIsUpdating] = useState(false);

  // --------------------------------------------------
  // LOAD SELECTED LEAD DATA
  // --------------------------------------------------

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        source: lead.source || "",
        requirements: lead.requirements || "",
        status: lead.status || "NEW",
        assignedToId: lead.assignedToId || "",
      });

      setErrors({});
      setIsUpdating(false);
    }
  }, [lead]);

  // --------------------------------------------------
  // VALIDATION
  // --------------------------------------------------

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
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
        formData.email.trim()
      )
    ) {
      newErrors.email = "Enter a valid email address";
    }

    // Phone
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone =
        "Enter a valid 10-digit Indian phone number";
    }

    // Source
    if (!formData.source.trim()) {
      newErrors.source = "Source is required";
    }

    // Requirements
    if (!formData.requirements.trim()) {
      newErrors.requirements =
        "Requirements are required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // --------------------------------------------------
  // HANDLE INPUT CHANGE
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts correcting the field
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // --------------------------------------------------
  // HANDLE SUBMIT
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Don't submit again while update is already running
    if (isUpdating) return;

    // Validation happens ONLY when Update Lead is clicked
    if (!validateForm()) {
      return;
    }

    try {
      // Start loading
      setIsUpdating(true);

      // API update
      await editLead(lead.id, formData);

      // Success message
      toast.success("Lead updated successfully");

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        source: "",
        requirements: "",
        status: "NEW",
        assignedToId: "",
      });

      // Clear errors
      setErrors({});

      // Close modal
      onClose();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to update lead"
      );

      // Allow user to try again
      setIsUpdating(false);
    }
  };

  // Don't render modal when closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-[#25D366] px-6 py-5 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Edit Lead
              </h2>

              <p className="text-sm text-gray-700 mt-1">
                Update lead information
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="p-2 rounded-full bg-white hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={22} />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5 max-h-[75vh] overflow-y-auto"
          >

            {/* Name */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                type="text"
                placeholder="Enter lead name"
                disabled={isUpdating}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.name
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                } ${
                  isUpdating
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />

              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Email{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                disabled={isUpdating}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.email
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                } ${
                  isUpdating
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />

              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Phone Number{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                maxLength={10}
                disabled={isUpdating}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.phone
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                } ${
                  isUpdating
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />

              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Company */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Company
              </label>

              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter company name"
                disabled={isUpdating}
                className={`w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#25D366] ${
                  isUpdating
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />
            </div>

            {/* Source */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Source{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                disabled={isUpdating}
                className={`w-full rounded-lg border px-4 py-3 outline-none ${
                  errors.source
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                } ${
                  isUpdating
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              >
                <option value="">
                  Select Source
                </option>

                <option value="Website">
                  Website
                </option>

                <option value="WhatsApp">
                  WhatsApp
                </option>

                <option value="Facebook">
                  Facebook
                </option>

                <option value="Instagram">
                  Instagram
                </option>

                <option value="Referral">
                  Referral
                </option>
              </select>

              {errors.source && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.source}
                </p>
              )}
            </div>

            {/* Assign Employee */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Assign Employee
              </label>

              <select
                name="assignedToId"
                value={formData.assignedToId}
                onChange={handleChange}
                disabled={isUpdating}
                className={`w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#25D366] ${
                  isUpdating
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              >
                <option value="">
                  Unassigned
                </option>

                {employees.map((employee) => (
                  <option
                    key={employee.id}
                    value={employee.id}
                  >
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Status{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isUpdating}
                className={`w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#25D366] ${
                  isUpdating
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              >
                <option value="NEW">
                  New
                </option>

                <option value="CONTACTED">
                  Contacted
                </option>

                <option value="QUALIFIED">
                  Qualified
                </option>

                <option value="WON">
                  Won
                </option>
              </select>
            </div>

            {/* Requirements */}
            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Requirements{" "}
                <span className="text-red-500">*</span>
              </label>

              <textarea
                rows="4"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="Enter lead requirements"
                disabled={isUpdating}
                className={`w-full rounded-lg border px-4 py-3 outline-none resize-none ${
                  errors.requirements
                    ? "border-red-500"
                    : "border-gray-300 focus:border-[#25D366]"
                } ${
                  isUpdating
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />

              {errors.requirements && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.requirements}
                </p>
              )}
            </div>

            {/* Work Note */}
            {lead?.id && !isUpdating && (
              <div className="border-t pt-4">
                <AddWorkNote
                  entityId={lead.id}
                  addNote={addLeadWorkNote}
                />
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">

              <button
                type="button"
                onClick={onClose}
                disabled={isUpdating}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-3 rounded-lg bg-[#25D366] hover:bg-[#128C7E] text-gray-800 font-semibold transition disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px]"
              >
                {isUpdating ? "Updating..." : "Update Lead"}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}