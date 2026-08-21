import { useEffect, useState } from "react";
import { X } from "lucide-react";

import {
  getCustomerById,
  updateCustomer,
} from "../api/customerApi";

import toast from "react-hot-toast";

function EditCustomer({
  customerId,
  onClose,
  onSuccess,
}) {
  const id = customerId;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    source: "",
    requirements: "",
    status: "ACTIVE",
  });

  const [errors, setErrors] = useState({});

  // Loading state
  const [loading, setLoading] = useState(false);

  // Loading customer data
  const [fetchingCustomer, setFetchingCustomer] =
    useState(true);

  // =========================
  // FETCH CUSTOMER
  // =========================

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setFetchingCustomer(true);

        const data = await getCustomerById(id);

        setFormData({
          name: data.customer.name || "",
          phone: data.customer.phone || "",
          email: data.customer.email || "",
          company:
            data.customer.companyName || "",
          source: data.customer.source || "",
          requirements:
            data.customer.requirements || "",
          status:
            data.customer.status || "ACTIVE",
        });
      } catch (error) {
        console.error(
          "Fetch customer error:",
          error
        );

        toast.error("Failed to fetch customer");
      } finally {
        setFetchingCustomer(false);
      }
    };

    if (id) {
      fetchCustomer();
    }
  }, [id]);

  // =========================
  // VALIDATION
  // =========================

  const validateForm = () => {
    const newErrors = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name =
        "Customer name is required";
    } else if (
      formData.name.trim().length < 3
    ) {
      newErrors.name =
        "Customer name must be at least 3 characters";
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

    // Email - optional
    if (
      formData.email.trim() &&
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
        formData.email
      )
    ) {
      newErrors.email =
        "Enter a valid email address";
    }

    // Company
    if (!formData.company.trim()) {
      newErrors.company =
        "Company name is required";
    }

    // Status
    if (!formData.status) {
      newErrors.status =
        "Status is required";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  // =========================
  // HANDLE CHANGE
  // =========================

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

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent double click
    if (loading) return;

    // Validate
    if (!validateForm()) return;

    try {
      // Start loading
      setLoading(true);

      // Update customer
      await updateCustomer(id, formData);

      // Success message
      toast.success(
        "Customer updated successfully!"
      );

      // Refresh customer list
      if (onSuccess) {
        await onSuccess();
      }

      // Close automatically
      onClose();
    } catch (error) {
      console.error(
        "Update customer error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          "Failed to update customer"
      );

      // Allow retry
      setLoading(false);
    }
  };

  // =========================
  // LOADING CUSTOMER
  // =========================

  if (fetchingCustomer) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-center p-16">
            <div className="flex items-center gap-3 text-gray-600">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />

              <span>
                Loading customer...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">

        {/* =========================
            HEADER
        ========================= */}

        <div className="flex items-center justify-between bg-[#25D366] px-5 py-5 sm:px-8 sm:py-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-black sm:text-3xl">
              Edit Customer
            </h1>

            <p className="mt-1 text-gray-800">
              Update customer information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full bg-white p-2 shadow transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        {/* =========================
            FORM
        ========================= */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-5 sm:p-8"
        >

          {/* Customer Name */}
          <div>
            <label className="block mb-2 font-semibold text-black">
              Customer Name{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border rounded-lg px-4 py-3 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.name
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

          {/* Phone */}
          <div>
            <label className="block mb-2 font-semibold text-black">
              Phone Number{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border rounded-lg px-4 py-3 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.phone
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

          {/* Email */}
          <div>
            <label className="block mb-2 font-semibold text-black">
              Email{" "}
              <span className="font-normal text-gray-400">
                (optional)
              </span>
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border rounded-lg px-4 py-3 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.email
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

          {/* Company */}
          <div>
            <label className="block mb-2 font-semibold text-black">
              Company{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter company name"
              className={`w-full border rounded-lg px-4 py-3 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.company
                  ? "border-red-500"
                  : "border-gray-300 focus:border-[#25D366]"
              }`}
            />

            {errors.company && (
              <p className="text-red-500 text-sm mt-1">
                {errors.company}
              </p>
            )}
          </div>

          {/* Source */}
          <div>
            <label className="block mb-2 font-semibold text-black">
              Source
            </label>

            <input
              type="text"
              name="source"
              value={formData.source}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter source (e.g. WhatsApp, Instagram)"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#25D366] disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block mb-2 font-semibold text-black">
              Requirements
            </label>

            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              disabled={loading}
              rows={4}
              placeholder="Enter customer requirements"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-[#25D366] resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block mb-2 font-semibold text-black">
              Status{" "}
              <span className="text-red-500">*</span>
            </label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={loading}
              className={`w-full border rounded-lg px-4 py-3 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                errors.status
                  ? "border-red-500"
                  : "border-gray-300 focus:border-[#25D366]"
              }`}
            >
              <option value="ACTIVE">
                ACTIVE
              </option>

              <option value="INACTIVE">
                INACTIVE
              </option>
            </select>

            {errors.status && (
              <p className="text-red-500 text-sm mt-1">
                {errors.status}
              </p>
            )}
          </div>

          {/* =========================
              ACTION BUTTONS
          ========================= */}

          <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:gap-4">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="crm-secondary-button disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="crm-primary-button disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-transparent" />
                  Updating...
                </span>
              ) : (
                "Update Customer"
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCustomer;