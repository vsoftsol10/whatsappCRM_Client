import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { changePasswordAction, isLoading } = useAuthStore();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await changePasswordAction({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setMessage(
        response.message || "Password changed successfully"
      );

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to change password"
      );
    }
  };

  return (
    <div className="crm-page">
      <div className="mx-auto max-w-2xl">

        {/* Header */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">

          <button
            type="button"
            onClick={() => navigate("/settings")}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm transition hover:bg-[#25D366]"
          >
            <FiArrowLeft size={20} />
          </button>

          <div className="min-w-0">
            <h1 className="crm-title">
              Change Password
            </h1>

            <p className="crm-subtitle">
              Update your account password to keep your account secure.
            </p>
          </div>

        </div>

        {/* Card */}
        <div className="crm-page-surface p-5 sm:p-8">

          {message && (
            <div className="mb-6 rounded-xl border border-green-300 bg-[#DCF8C6] px-4 py-3 text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  placeholder="Enter current password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="crm-input pr-12"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(!showCurrentPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#25D366]"
                >
                  {showCurrentPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="crm-input pr-12"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(!showNewPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#25D366]"
                >
                  {showNewPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="crm-input pr-12"
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#25D366]"
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="crm-primary-button w-full"
              >
                {isLoading ? "Updating Password..." : "Update Password"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;