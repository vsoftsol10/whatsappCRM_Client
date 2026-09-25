
// import { useAuthStore } from "../../store/authStore";
// import {
//   User,
//   Mail,
//   Building2,
//   Shield,
// } from "lucide-react";

// import BillingSubscriptionCard from "./BillingSubscriptionCard";

// function ProfileSettings() {
//   const { user } = useAuthStore();

//   return (
//     <div className="crm-page bg-slate-50">

//       {/* Header */}

//       <div className="mb-8">
//         <h1 className="crm-title text-slate-900">
//           Profile Settings
//         </h1>

//         <p className="mt-2 text-slate-500">
//           View your personal account information and subscription details.
//         </p>
//       </div>

//       {/* ==========================================
//           PROFILE CARD
//       ========================================== */}

//       <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

//         {/* Banner */}

//         <div className="h-32 bg-gradient-to-r from-[#25D366] via-[#25D366] to-[#128C7E]" />

//         <div className="relative px-8 pb-8">

//           {/* Avatar */}

//           <div className="-mt-14 flex justify-center">

//             <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-white bg-[#25D366] text-5xl font-bold text-black shadow-lg">
//               {user?.name?.charAt(0)?.toUpperCase() || "U"}
//             </div>

//           </div>

//           {/* User Name */}

//           <div className="mt-5 text-center">

//             <h2 className="text-3xl font-bold text-slate-900">
//               {user?.name || "-"}
//             </h2>

//             <p className="mt-2 text-slate-500">
//               {user?.email || "-"}
//             </p>

//           </div>

//           {/* Information */}

//           <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">

//             {/* Full Name */}

//             <div>

//               <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
//                 <User size={16} />
//                 Full Name
//               </label>

//               <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium">
//                 {user?.name || "-"}
//               </div>

//             </div>

//             {/* Email */}

//             <div>

//               <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
//                 <Mail size={16} />
//                 Email Address
//               </label>

//               <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium break-all">
//                 {user?.email || "-"}
//               </div>

//             </div>

//             {/* Department */}

//             <div>

//               <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
//                 <Building2 size={16} />
//                 Department
//               </label>

//               <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium">
//                 {user?.department || "-"}
//               </div>

//             </div>

//             {/* Role */}

//             <div>

//               <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
//                 <Shield size={16} />
//                 User Role
//               </label>

//               <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

//                 <span className="inline-flex rounded-full bg-[#DCF8C6] px-3 py-1 text-sm font-semibold text-[#128C7E]">
//                   {user?.role || "-"}
//                 </span>

//               </div>

//             </div>

//           </div>

//         </div>

//       </div>

//       {/* ==========================================
//           BILLING & SUBSCRIPTION
//       ========================================== */}

//       <div className="mt-8">

//         <BillingSubscriptionCard />

//       </div>

//     </div>
//   );
// }

// export default ProfileSettings;

import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  Shield,
  Pencil,
  X,
  Check,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";

import BillingSubscriptionCard from "./BillingSubscriptionCard";

function ProfileSettings() {
  const { user, updateProfileAction, isLoading } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    department: user?.department || "",
    designation: user?.designation || "",
  });

  const startEditing = () => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      department: user?.department || "",
      designation: user?.designation || "",
    });
    setImageFile(null);
    setImagePreview(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    const payload = { ...form };
    if (imageFile) {
      payload.profileImage = imageFile;
    }

    const result = await updateProfileAction(payload);

    if (result.success) {
      toast.success(result.message || "Profile updated successfully.");
      setIsEditing(false);
      setImageFile(null);
      setImagePreview(null);
    } else {
      toast.error(result.message || "Failed to update profile.");
    }
  };

  const avatarSrc = imagePreview || user?.profileImage;

  return (
    <div className="crm-page bg-slate-50">

      {/* Header */}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="crm-title text-slate-900">
            Profile Settings
          </h1>

          <p className="mt-2 text-slate-500">
            {isEditing
              ? "Update your personal account information."
              : "View your personal account information and subscription details."}
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={startEditing}
            className="crm-primary-button self-start sm:self-auto"
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {/* ==========================================
          PROFILE CARD
      ========================================== */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        {/* Banner */}

        <div className="h-32 bg-gradient-to-r from-[#25D366] via-[#25D366] to-[#128C7E]" />

        <div className="relative px-8 pb-8">

          {/* Avatar */}

          <div className="-mt-14 flex justify-center">

            <div className="group relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-[#25D366] text-5xl font-bold text-black shadow-lg">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.name || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || "U"
              )}

              {isEditing && (
                <label
                  htmlFor="profile-image-input"
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <Camera size={22} />
                  <input
                    id="profile-image-input"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

          </div>

          {/* User Name */}

          <div className="mt-5 text-center">

            <h2 className="text-3xl font-bold text-slate-900">
              {user?.name || "-"}
            </h2>

            <p className="mt-2 text-slate-500">
              {user?.email || "-"}
            </p>

          </div>

          {/* Information */}

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Full Name */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <User size={16} />
                Full Name
              </label>

              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-medium focus:border-[#25D366] focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                  {user?.name || "-"}
                </div>
              )}

            </div>

            {/* Email (read-only — used for login) */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Mail size={16} />
                Email Address
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium break-all text-slate-500">
                {user?.email || "-"}
              </div>

            </div>

            {/* Phone */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Phone size={16} />
                Phone Number
              </label>

              {isEditing ? (
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-medium focus:border-[#25D366] focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                  {user?.phone || "-"}
                </div>
              )}

            </div>

            {/* Department */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Building2 size={16} />
                Department
              </label>

              {isEditing ? (
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-medium focus:border-[#25D366] focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  placeholder="Enter your department"
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                  {user?.department || "-"}
                </div>
              )}

            </div>

            {/* Designation */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Briefcase size={16} />
                Designation
              </label>

              {isEditing ? (
                <input
                  type="text"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-medium focus:border-[#25D366] focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  placeholder="Enter your designation"
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                  {user?.designation || "-"}
                </div>
              )}

            </div>

            {/* Address */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <MapPin size={16} />
                Address
              </label>

              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-medium focus:border-[#25D366] focus:outline-none focus:ring-1 focus:ring-[#25D366]"
                  placeholder="Enter your address"
                />
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                  {user?.address || "-"}
                </div>
              )}

            </div>

            {/* Role (read-only — set by your administrator) */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Shield size={16} />
                User Role
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                <span className="inline-flex rounded-full bg-[#DCF8C6] px-3 py-1 text-sm font-semibold text-[#128C7E]">
                  {user?.role || "-"}
                </span>

              </div>

            </div>

          </div>

          {/* Save / Cancel actions */}

          {isEditing && (
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="crm-primary-button"
              >
                <Check size={16} />
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ==========================================
          BILLING & SUBSCRIPTION
      ========================================== */}

      <div className="mt-8">

        <BillingSubscriptionCard />

      </div>

    </div>
  );
}

export default ProfileSettings;
