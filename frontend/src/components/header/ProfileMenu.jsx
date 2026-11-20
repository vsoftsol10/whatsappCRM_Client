import { useEffect, useRef, useState } from "react";
import { FaUserCircle, FaSignOutAlt, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import ConfirmModal from "../common/ConfirmModal";

// ============================================================
// AVATAR
// Shows the COMPANY LOGO (user.companyLogo) - there is no separate
// profile photo any more. When an admin changes the company logo in
// Profile Settings, it shows up here too.
// Falls back to the user's initial in a green circle, and finally to
// the generic icon if no name exists.
// Background: WHITE when a logo is shown (so transparent PNGs look
// clean), GREEN only for the initial / icon fallback.
// ============================================================
function ProfileAvatar({ user, size = "h-11 w-11" }) {
  const [imgError, setImgError] = useState(false);

  const logoSrc = user?.companyLogo;

  // A new logo gets a fresh chance to load
  useEffect(() => {
    setImgError(false);
  }, [logoSrc]);

  const hasImage = !!logoSrc && !imgError;
  const initial = user?.name?.charAt(0)?.toUpperCase();

  return (
    <div
      className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full ${
        hasImage ? "bg-white ring-2 ring-gray-100" : "bg-[#159A4B]"
      }`}
    >
      {hasImage ? (
        <img
          src={logoSrc}
          alt={user?.companyName || "Company logo"}
          onError={() => setImgError(true)}
          className="h-full w-full object-contain p-1"
        />
      ) : initial ? (
        <span className="text-lg font-semibold text-white">{initial}</span>
      ) : (
        <FaUserCircle size={28} className="text-white" />
      )}
    </div>
  );
}

function ProfileMenu() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setIsOpen(false);
    navigate("/settings/profile");
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <>
      <div ref={menuRef} className="relative">
        {/* Avatar only, as in the design. Name and role are in the menu. */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-full transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A4B]/50"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`Account menu for ${user?.name || "user"}`}
        >
          <ProfileAvatar user={user} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500">
                {user?.role || "Employee"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleProfileClick}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              <FaUser className="text-sm" />
              Profile
            </button>

            <button
              type="button"
              onClick={handleLogoutClick}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600"
            >
              <FaSignOutAlt className="text-sm" />
              Logout
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}

export default ProfileMenu;