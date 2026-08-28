import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

import { getCustomers } from "../../api/customerApi";
import useCampaignStore from "../../store/campaignStore";

export default function CreateCampaignModal({
  isOpen,
  onClose,
  aiCampaign,
}) {
  const { addCampaign } = useCampaignStore();

  const [customers, setCustomers] = useState([]);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // =========================
  // SUBMITTING STATE
  // =========================
  const [submitting, setSubmitting] = useState(false);

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "PROMOTIONAL",
    messageContent: "",
    scheduledAt: "",
  });

  // =========================
  // RESET MODAL
  // =========================

  const resetForm = () => {
    setFormData({
      name: "",
      type: "PROMOTIONAL",
      messageContent: "",
      scheduledAt: "",
    });

    setSelectedCustomers([]);

    setImage(null);
    setImagePreview("");

    setSubmitting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================
  // LOAD WHEN MODAL OPENS
  // =========================

  useEffect(() => {
    if (!isOpen) return;

    fetchCustomers();

    if (!aiCampaign) {
      resetForm();
    }
  }, [isOpen]);

  // =========================
  // AUTO FILL FROM AI
  // =========================

  useEffect(() => {
    if (!aiCampaign) return;

    setFormData({
      name: aiCampaign.name || "",
      type: aiCampaign.type || "PROMOTIONAL",
      messageContent: aiCampaign.messageContent || "",
      scheduledAt: "",
    });
  }, [aiCampaign]);

  // =========================
  // FETCH CUSTOMERS
  // =========================

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true);

      const response = await getCustomers();

      console.log("Customers Response:", response);

      let customerList = [];

      if (Array.isArray(response)) {
        customerList = response;
      } else if (Array.isArray(response.data)) {
        customerList = response.data;
      } else if (Array.isArray(response.customers)) {
        customerList = response.customers;
      } else if (Array.isArray(response.data?.customers)) {
        customerList = response.data.customers;
      }

      setCustomers(customerList);
    } catch (error) {
      console.error(error);

      toast.error("Failed to load customers.");

      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // =========================
  // HANDLE INPUT CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // IMAGE UPLOAD
  // =========================

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Please select an image.");
    }

    if (file.size > 15 * 1024 * 1024) {
      return toast.error("Maximum image size is 15MB.");
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================
  // TOGGLE CUSTOMER
  // =========================

  const toggleCustomer = (id) => {
    setSelectedCustomers((prev) =>
      prev.includes(id)
        ? prev.filter((customerId) => customerId !== id)
        : [...prev, id]
    );
  };

  // =========================
  // SELECT ALL CUSTOMERS
  // =========================

  const handleSelectAll = () => {
    const allCustomerIds = customers.map(
      (customer) => customer.id
    );

    setSelectedCustomers(allCustomerIds);
  };

  // =========================
  // CLEAR ALL CUSTOMERS
  // =========================

  const handleClearAll = () => {
    setSelectedCustomers([]);
  };

  // =========================
  // SUBMIT CAMPAIGN
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --------------------------------
    // IMPORTANT:
    // Prevent duplicate submissions
    // --------------------------------
    if (submitting) {
      return;
    }

    // =========================
    // VALIDATION
    // =========================

    if (!formData.name.trim()) {
      return toast.error("Campaign name is required.");
    }

    if (!formData.messageContent.trim()) {
      return toast.error("Campaign message is required.");
    }

    // =========================
    // START SUBMITTING
    // =========================

    setSubmitting(true);

    try {
      const campaign = await addCampaign({
        ...formData,
        customerIds: selectedCustomers,
        image,
      });

      console.log("Campaign:", campaign);

      toast.success(
        'Campaign created successfully. Use "Send Campaign" to send it.'
      );

      // =========================
      // RESET FORM
      // =========================

      resetForm();

      // =========================
      // CLOSE MODAL
      // =========================

      onClose();
    } catch (error) {
      console.error("Create campaign failed:", error);

      // =========================
      // PLAN LIMIT REACHED
      // =========================
      if (error?.response?.status === 403) {
        setSubmitting(false);

        // Close modal automatically
        onClose();

        return;
      }

      // =========================
      // OTHER ERRORS
      // =========================
      toast.error(
        error?.response?.data?.message ||
        "Unable to create campaign."
      );

      setSubmitting(false);
    }
  };

  // =========================
  // CLOSE MODAL
  // =========================

  const handleClose = () => {
    // Don't allow closing while submitting
    if (submitting) {
      return;
    }

    onClose();
  };

  // =========================
  // DON'T RENDER
  // =========================

  if (!isOpen) return null;

  // =========================
  // UI
  // =========================

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

          {/* =========================
              HEADER
          ========================= */}

          <div className="flex items-center justify-between bg-[#25D366] px-6 py-5">

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Create Campaign
              </h2>

              <p className="mt-1 text-sm text-gray-700">
                Create and schedule a marketing campaign
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className={`rounded-full p-2 transition ${submitting
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-[#128C7E]"
                }`}
            >
              <X size={22} />
            </button>
          </div>

          {/* =========================
              FORM
          ========================= */}

          <form
            onSubmit={handleSubmit}
            className="max-h-[75vh] space-y-5 overflow-y-auto p-6"
          >

            {/* Campaign Name */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Campaign Name
                <span className="text-red-500"> *</span>
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter campaign name"
                required
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#25D366] disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            {/* Campaign Type */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Campaign Type
              </label>

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#25D366] disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="PROMOTIONAL">
                  Promotional
                </option>

                <option value="BROADCAST">
                  Broadcast
                </option>

                <option value="FOLLOW_UP">
                  Follow Up
                </option>

                <option value="ANNOUNCEMENT">
                  Announcement
                </option>
              </select>
            </div>

            {/* Message */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Campaign Message
                <span className="text-red-500"> *</span>
              </label>

              <textarea
                rows={5}
                name="messageContent"
                value={formData.messageContent}
                onChange={handleChange}
                placeholder="Type your campaign message..."
                disabled={submitting}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#25D366] disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            {/* Schedule */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Schedule Date & Time
              </label>

              <input
                type="datetime-local"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleChange}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#25D366] disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            {/* Campaign Image */}

            <div>
              <label className="mb-2 block font-medium text-gray-700">
                Campaign Image
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={submitting}
                className="hidden"
              />

              {!imagePreview ? (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={submitting}
                  className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#25D366] bg-green-50 p-8 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="text-6xl">🖼️</div>

                  <h3 className="mt-4 text-lg font-semibold text-gray-800">
                    Upload Campaign Image
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    JPG, PNG or WEBP
                  </p>

                  <p className="text-xs text-gray-400">
                    Maximum size: 15 MB
                  </p>
                </button>
              ) : (
                <div className="rounded-xl border border-gray-300 p-4">

                  <img
                    src={imagePreview}
                    alt="Campaign Preview"
                    className="max-h-72 w-full rounded-lg object-contain"
                  />

                  <div className="mt-4 flex gap-3">

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={submitting}
                      className="rounded-lg bg-[#25D366] px-5 py-2 font-semibold text-white hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Change Image
                    </button>

                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={submitting}
                      className="rounded-lg bg-red-500 px-5 py-2 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove Image
                    </button>

                  </div>
                </div>
              )}
            </div>

            {/* Customers */}

            <div>
              <div className="mb-2 flex items-center justify-between">

                <label className="font-medium text-gray-700">
                  Select Customers
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    (optional)
                  </span>
                </label>

                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={submitting}
                    className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={submitting}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear All
                  </button>

                </div>
              </div>

              <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">

                {loadingCustomers ? (
                  <div className="py-8 text-center text-gray-500">
                    Loading customers...
                  </div>
                ) : customers.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No customers found.
                  </div>
                ) : (
                  <>
                    <div className="max-h-56 space-y-2 overflow-y-auto">

                      {customers.map((customer) => (
                        <label
                          key={customer.id}
                          className={`flex items-center gap-3 rounded-lg p-2 transition ${submitting
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer hover:bg-white"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(
                              customer.id
                            )}
                            onChange={() =>
                              toggleCustomer(customer.id)
                            }
                            disabled={submitting}
                            className="h-4 w-4 accent-[#25D366]"
                          />

                          <div className="flex-1">
                            <p className="font-medium text-gray-800">
                              {customer.name}
                            </p>

                            <p className="text-sm text-gray-500">
                              {customer.phone || "No Phone"}
                            </p>
                          </div>
                        </label>
                      ))}

                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-3">

                      <span className="text-sm font-medium text-gray-600">
                        Selected Customers
                      </span>

                      <span className="rounded-full bg-[#DCF8C6] px-3 py-1 text-sm font-semibold text-[#128C7E]">
                        {selectedCustomers.length}
                      </span>

                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}

            <div className="mt-6 flex items-center justify-between border-t pt-5">

              <div>
                {image && (
                  <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
                    ✓ Image Selected
                  </div>
                )}
              </div>

              <div className="flex gap-3">

                {/* Cancel */}

                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                {/* Create Campaign */}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`rounded-lg px-6 py-3 font-semibold text-white transition ${submitting
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-[#25D366] hover:bg-[#128C7E]"
                    }`}
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Creating...
                    </span>
                  ) : (
                    "Create Campaign"
                  )}
                </button>

              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}