// import { FaChevronDown, FaUserCircle } from "react-icons/fa";
// import { useAuthStore } from "../../store/authStore";

// function ProfileMenu() {
//   const { user } = useAuthStore();

//   return (
//     <button className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-gray-100 sm:px-3">
//       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] sm:h-11 sm:w-11">
//         <FaUserCircle size={28} className="text-white" />
//       </div>

//       <div className="hidden min-w-0 text-left sm:block">
//         <p className="truncate text-sm font-semibold text-gray-800">
//           {user?.name || "User"}
//         </p>

//         <p className="text-xs text-gray-500">
//           {user?.role || "Employee"}
//         </p>
//       </div>

//       {/* <FaChevronDown size={12} className="text-gray-500" /> */}
//     </button>
//   );
// }

// export default ProfileMenu;



import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaUserCircle, FaSignOutAlt, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import ConfirmModal from "../common/ConfirmModal";

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
    navigate("settings/profile");
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
        <button type="button" onClick={() => setIsOpen((prev) => !prev)} className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-gray-100 sm:px-3" aria-expanded={isOpen} aria-haspopup="menu">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] sm:h-11 sm:w-11">
            <FaUserCircle size={28} className="text-white" />
          </div>

          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-sm font-semibold text-gray-800">
              {user?.name || "User"}
            </p>

            <p className="text-xs text-gray-500">
              {user?.role || "Employee"}
            </p>
          </div>

          <FaChevronDown size={12} className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <button type="button" onClick={handleProfileClick} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
              <FaUser className="text-sm" />
              Profile
            </button>

            <button type="button" onClick={handleLogoutClick} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600">
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