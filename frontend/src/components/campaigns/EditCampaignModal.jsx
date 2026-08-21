import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

import useCampaignStore from "../../store/campaignStore";

export default function CreateCampaignModal({
  isOpen,
  onClose,
  campaign,
}) {
  const { editCampaign } = useCampaignStore();

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // Prevent multiple clicks while updating
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "PROMOTIONAL",
    messageContent: "",
    scheduledAt: "",
  });

  // ==================================================
  // LOAD CAMPAIGN DATA
  // ==================================================

  useEffect(() => {
    if (campaign) {
      console.log("Campaign:", campaign);

      setFormData({
        name: campaign.name || "",
        type: campaign.type || "PROMOTIONAL",
        messageContent: campaign.messageContent || "",
        scheduledAt: campaign.scheduledAt
          ? campaign.scheduledAt.slice(0, 16)
          : "",
      });

      setImagePreview(campaign.imageUrl || "");
      setImage(null);
      setIsSubmitting(false);
    }
  }, [campaign]);

  // ==================================================
  // RESET FORM
  // ==================================================

  const resetForm = () => {
    setFormData({
      name: "",
      type: "PROMOTIONAL",
      messageContent: "",
      scheduledAt: "",
    });

    setImage(null);
    setImagePreview("");

    setIsSubmitting(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==================================================
  // HANDLE INPUT CHANGE
  // ==================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==================================================
  // HANDLE IMAGE CHANGE
  // ==================================================

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate image type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image.");
      return;
    }

    // Validate image size
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Maximum image size is 15MB.");
      return;
    }

    setImage(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // ==================================================
  // REMOVE IMAGE
  // ==================================================

  const removeImage = () => {
    setImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==================================================
  // HANDLE SUBMIT
  // ==================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // IMPORTANT:
    // If already updating, don't allow another request.
    if (isSubmitting) {
      return;
    }

    // Basic validation
    if (!formData.name.trim()) {
      toast.error("Campaign name is required.");
      return;
    }

    if (!formData.messageContent.trim()) {
      toast.error("Campaign message is required.");
      return;
    }

    if (!campaign?.id) {
      toast.error("Campaign ID is missing.");
      return;
    }

    try {
      // IMPORTANT:
      // Set this BEFORE the API request.
      // This immediately changes the button to "Updating..."
      setIsSubmitting(true);

      await editCampaign(campaign.id, {
        ...formData,
        image,
      });

      toast.success("Campaign updated successfully!");

      // Reset form
      resetForm();

      // Close modal only after successful update
      onClose();
    } catch (error) {
      console.error("Failed to update campaign:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to update campaign. Please try again."
      );

      // Allow user to try again if request failed
      setIsSubmitting(false);
    }
  };

  // ==================================================
  // CLOSE MODAL
  // ==================================================

  const handleClose = () => {
    // Don't allow closing while API request is running
    if (isSubmitting) {
      return;
    }

    onClose();
  };

  // ==================================================
  // DON'T RENDER
  // ==================================================

  if (!isOpen) return null;

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">

        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">

          {/* ==========================================
              HEADER
          ========================================== */}

          <div className="bg-[#25D366] px-6 py-5 flex justify-between items-center">

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Edit Campaign
              </h2>

              <p className="text-sm text-gray-700 mt-1">
                Update campaign information
              </p>
            </div>

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className={`p-2 rounded-full transition ${
                isSubmitting
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-[#128C7E]"
              }`}
            >
              <X size={22} />
            </button>

          </div>

          {/* ==========================================
              FORM
          ========================================== */}

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5 max-h-[75vh] overflow-y-auto"
          >

            {/* ==========================================
                CAMPAIGN NAME
            ========================================== */}

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Campaign Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter campaign name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={`w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#25D366] ${
                  isSubmitting
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />
            </div>

            {/* ==========================================
                CAMPAIGN TYPE
            ========================================== */}

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Campaign Type{" "}
                <span className="text-red-500">*</span>
              </label>

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#25D366] ${
                  isSubmitting
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
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

            {/* ==========================================
                CAMPAIGN MESSAGE
            ========================================== */}

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Campaign Message{" "}
                <span className="text-red-500">*</span>
              </label>

              <textarea
                rows="5"
                name="messageContent"
                placeholder="Enter campaign message"
                value={formData.messageContent}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={`w-full rounded-lg border border-gray-300 px-4 py-3 outline-none resize-none focus:border-[#25D366] ${
                  isSubmitting
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />
            </div>

            {/* ==========================================
                SCHEDULED DATE
            ========================================== */}

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Scheduled Date & Time
              </label>

              <input
                type="datetime-local"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#25D366] ${
                  isSubmitting
                    ? "bg-gray-100 cursor-not-allowed"
                    : ""
                }`}
              />
            </div>

            {/* ==========================================
                CAMPAIGN IMAGE
            ========================================== */}

            <div>
              <label className="block mb-2 font-medium text-gray-700">
                Campaign Image
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isSubmitting}
                className="hidden"
              />

              {!imagePreview ? (

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#25D366] bg-green-50 p-8 ${
                    isSubmitting
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-green-100"
                  }`}
                >
                  <div className="text-5xl">
                    🖼️
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-gray-800">
                    Upload Campaign Image
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    JPG, PNG or WEBP
                  </p>

                  <p className="text-xs text-gray-400">
                    Maximum size: 15 MB
                  </p>
                </button>

              ) : (

                <div className="rounded-xl border p-4">

                  <img
                    src={imagePreview}
                    alt="Campaign"
                    className="max-h-72 w-full object-contain rounded-lg"
                  />

                  <div className="mt-4 flex gap-3">

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className={`rounded-lg bg-[#25D366] px-4 py-2 text-white ${
                        isSubmitting
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-[#128C7E]"
                      }`}
                    >
                      Change Image
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={removeImage}
                      className={`rounded-lg bg-red-500 px-4 py-2 text-white ${
                        isSubmitting
                          ? "cursor-not-allowed opacity-50"
                          : "hover:bg-red-600"
                      }`}
                    >
                      Remove
                    </button>

                  </div>

                </div>

              )}
            </div>

            {/* ==========================================
                BUTTONS
            ========================================== */}

            <div className="flex justify-end gap-3 pt-4 border-t mt-6">

              {/* CANCEL */}

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg border border-gray-300 text-gray-700 transition ${
                  isSubmitting
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>

              {/* UPDATE */}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg bg-[#25D366] text-gray-800 font-semibold transition flex items-center justify-center min-w-[160px] ${
                  isSubmitting
                    ? "cursor-not-allowed opacity-70"
                    : "hover:bg-[#128C7E]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-700 border-t-transparent"></span>
                    Updating...
                  </>
                ) : (
                  "Update Campaign"
                )}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}