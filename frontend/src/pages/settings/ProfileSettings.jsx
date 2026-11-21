// import { useEffect, useState } from "react";
// import { useAuthStore } from "../../store/authStore";
// import {
//   Building2,
//   Pencil,
//   X,
//   Check,
//   ImageIcon,
//   Trash2,
// } from "lucide-react";
// import toast from "react-hot-toast";

// import BillingSubscriptionCard from "./BillingSubscriptionCard";
// import {
//   getCompanySettings,
//   updateCompanySettings,
// } from "../../api/companyApi";

// // ============================================================
// // SHARED UI PIECES (presentation only)
// // ============================================================

// const inputClass =
//   "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100";

// const labelClass =
//   "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400";

// const cardClass =
//   "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7";

// // "ADMIN" -> "Admin"
// const formatRole = (role) =>
//   role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "-";

// // "Aarav Sharma" -> "AS"
// const getInitials = (name) => {
//   const parts = (name || "").trim().split(/\s+/).filter(Boolean);
//   if (parts.length === 0) return "U";
//   if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
//   return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
// };

// const RoleBadge = ({ role, className = "" }) => (
//   <span
//     className={`inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 ${className}`}
//   >
//     {formatRole(role)}
//   </span>
// );

// const EditButton = ({ onClick }) => (
//   <button
//     type="button"
//     onClick={onClick}
//     className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
//   >
//     <Pencil size={14} />
//     Edit
//   </button>
// );

// const CardHeader = ({ title, subtitle, action }) => (
//   <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
//     <div>
//       <h2 className="text-lg font-bold leading-tight text-slate-900">
//         {title}
//       </h2>
//       <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
//     </div>

//     {action}
//   </div>
// );

// const ActionButtons = ({ onCancel, onSave, busy }) => (
//   <div className="mt-7 flex justify-end gap-3">
//     <button
//       type="button"
//       onClick={onCancel}
//       disabled={busy}
//       className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
//     >
//       <X size={16} />
//       Cancel
//     </button>

//     <button
//       type="button"
//       onClick={onSave}
//       disabled={busy}
//       className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
//     >
//       <Check size={16} />
//       {busy ? "Saving..." : "Save Changes"}
//     </button>
//   </div>
// );

// // ============================================================
// // COMPANY BRANDING CARD
// // (Admin only — the tab is shown only when user.role is ADMIN.
// //  Lets the admin change the company display name and logo.
// //  Saving refreshes the logged-in user via authStore.fetchMe(),
// //  which is how the new name/logo reach the Sidebar without a
// //  page reload.)
// // ============================================================
// function CompanyBrandingCard() {
//   const { fetchMe } = useAuthStore();

//   const [company, setCompany] = useState(null);
//   const [isFetching, setIsFetching] = useState(true);

//   const [isEditing, setIsEditing] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);

//   const [companyName, setCompanyName] = useState("");
//   const [logoFile, setLogoFile] = useState(null);
//   const [logoPreview, setLogoPreview] = useState(null);
//   // true when the admin clicked "Remove logo" (applied on Save Changes)
//   const [removeLogo, setRemoveLogo] = useState(false);

//   useEffect(() => {
//     let isMounted = true;

//     const loadCompany = async () => {
//       try {
//         const data = await getCompanySettings();

//         if (isMounted) {
//           setCompany(data.company);
//           setCompanyName(data.company?.companyName || "");
//         }
//       } catch (error) {
//         console.error("Failed to load company settings:", error);
//       } finally {
//         if (isMounted) setIsFetching(false);
//       }
//     };

//     loadCompany();

//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   const startEditing = () => {
//     setCompanyName(company?.companyName || "");
//     setLogoFile(null);
//     setLogoPreview(null);
//     setRemoveLogo(false);
//     setIsEditing(true);
//   };

//   const cancelEditing = () => {
//     setIsEditing(false);
//     setLogoFile(null);
//     setLogoPreview(null);
//     setRemoveLogo(false);
//   };

//   const handleLogoChange = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setLogoFile(file);
//     setLogoPreview(URL.createObjectURL(file));
//     setRemoveLogo(false); // picking a new logo cancels a pending removal
//     e.target.value = ""; // allows choosing the same file again
//   };

//   const handleRemoveLogo = () => {
//     setLogoFile(null);
//     setLogoPreview(null);
//     setRemoveLogo(true);
//   };

//   const handleSave = async () => {
//     if (!companyName.trim()) {
//       toast.error("Company name is required.");
//       return;
//     }

//     setIsSaving(true);

//     try {
//       const payload = { companyName: companyName.trim() };
//       if (logoFile) {
//         payload.logo = logoFile;
//       } else if (removeLogo) {
//         // Backend must delete the stored logo when it receives this flag.
//         payload.removeLogo = true;
//       }

//       const data = await updateCompanySettings(payload);

//       setCompany(data.company);
//       setIsEditing(false);
//       setLogoFile(null);
//       setLogoPreview(null);
//       setRemoveLogo(false);

//       toast.success(data.message || "Company branding updated successfully.");

//       // The company logo is also the profile avatar, so update it in the
//       // auth store right away (works for a new logo AND for "Remove logo").
//       const currentUser = useAuthStore.getState().user;
//       useAuthStore.setState({
//         user: { ...currentUser, companyLogo: data.company?.logo || null },
//       });

//       // Pulls the fresh companyName/companyLogo into the auth store
//       // (and localStorage), so the Sidebar re-renders immediately.
//       fetchMe();
//     } catch (error) {
//       toast.error(
//         error?.response?.data?.message || "Failed to update company branding."
//       );
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const logoSrc = removeLogo ? null : logoPreview || company?.logo;

//   return (
//     <div className={cardClass}>
//       <CardHeader
//         title="Company Branding"
//         subtitle={
//           isEditing
//             ? "Update your company name and logo."
//             : "This name and logo appear in the sidebar for your whole team."
//         }
//         action={
//           !isEditing && !isFetching ? (
//             <EditButton onClick={startEditing} />
//           ) : null
//         }
//       />

//       {isFetching ? (
//         <div className="flex items-center justify-center py-10 text-sm text-slate-400">
//           Loading company branding...
//         </div>
//       ) : (
//         <>
//           <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
//             {/* Company name */}
//             <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
//               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
//                 <Building2 size={18} />
//               </div>

//               <div className="min-w-0 flex-1">
//                 <p className="text-[11px] text-slate-500">Company Name</p>

//                 {isEditing ? (
//                   <input
//                     type="text"
//                     value={companyName}
//                     onChange={(e) => setCompanyName(e.target.value)}
//                     className={`${inputClass} mt-1`}
//                     placeholder="Enter your company name"
//                   />
//                 ) : (
//                   <p className="truncate text-sm font-semibold text-slate-900">
//                     {company?.companyName || "-"}
//                   </p>
//                 )}
//               </div>
//             </div>

//             {/* Logo */}
//             <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
//               <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sky-50 text-sky-600">
//                 {logoSrc ? (
//                   <img
//                     src={logoSrc}
//                     alt={companyName || "Company logo"}
//                     className="h-full w-full bg-white object-cover"
//                   />
//                 ) : (
//                   <ImageIcon size={18} />
//                 )}
//               </div>

//               <div className="min-w-0 flex-1">
//                 <p className="text-sm font-semibold text-slate-900">Logo</p>

//                 {isEditing ? (
//                   <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
//                     <label
//                       htmlFor="company-logo-input"
//                       className="inline-flex cursor-pointer items-center gap-1.5 text-green-700 hover:underline"
//                     >
//                       <ImageIcon size={13} />
//                       {logoSrc ? "Change logo" : "Upload logo"}
//                       <input
//                         id="company-logo-input"
//                         type="file"
//                         accept="image/png, image/jpeg, image/webp"
//                         onChange={handleLogoChange}
//                         className="hidden"
//                       />
//                     </label>

//                     {logoSrc && (
//                       <button
//                         type="button"
//                         onClick={handleRemoveLogo}
//                         className="inline-flex items-center gap-1.5 text-red-500 hover:underline"
//                       >
//                         <Trash2 size={13} />
//                         Remove logo
//                       </button>
//                     )}
//                   </div>
//                 ) : (
//                   <p className="text-xs text-slate-500">PNG, JPG or WEBP</p>
//                 )}
//               </div>
//             </div>
//           </div>

//           {isEditing && (
//             <ActionButtons
//               onCancel={cancelEditing}
//               onSave={handleSave}
//               busy={isSaving}
//             />
//           )}
//         </>
//       )}
//     </div>
//   );
// }

// // ============================================================
// // PROFILE SETTINGS PAGE
// // ============================================================
// function ProfileSettings() {
//   const { user, updateProfileAction, isLoading } = useAuthStore();

//   const [activeTab, setActiveTab] = useState("personal");

//   const [isEditing, setIsEditing] = useState(false);

//   // If the company logo file fails to load, fall back to the initials
//   const [logoError, setLogoError] = useState(false);

//   const [form, setForm] = useState({
//     name: user?.name || "",
//     phone: user?.phone || "",
//     address: user?.address || "",
//     department: user?.department || "",
//     designation: user?.designation || "",
//   });

//   const isAdmin = user?.role === "ADMIN";

//   const tabs = [
//     { key: "personal", label: "Personal Information" },
//     ...(isAdmin ? [{ key: "branding", label: "Company Branding" }] : []),
//     { key: "billing", label: "Subscription & Billing" },
//   ];

//   const startEditing = () => {
//     setForm({
//       name: user?.name || "",
//       phone: user?.phone || "",
//       address: user?.address || "",
//       department: user?.department || "",
//       designation: user?.designation || "",
//     });
//     setIsEditing(true);
//   };

//   const cancelEditing = () => {
//     setIsEditing(false);
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSave = async () => {
//     if (!form.name.trim()) {
//       toast.error("Name is required.");
//       return;
//     }

//     const payload = { ...form };

//     const result = await updateProfileAction(payload);

//     if (result.success) {
//       toast.success(result.message || "Profile updated successfully.");
//       setIsEditing(false);
//     } else {
//       toast.error(result.message || "Failed to update profile.");
//     }
//   };

//   // There is no separate profile photo: the avatar IS the company logo.
//   // Change the logo in the Company Branding tab and it updates here.
//   const avatarSrc = logoError ? null : user?.companyLogo;

//   // A new logo gets a fresh chance to load
//   useEffect(() => {
//     setLogoError(false);
//   }, [user?.companyLogo]);

//   const heroSubline = [user?.designation, user?.department, user?.email]
//     .filter(Boolean)
//     .join(" · ");

//   // Read-only value or input, depending on edit mode
//   const renderField = ({ label, name, placeholder, value }) => (
//     <div>
//       <label className={labelClass}>{label}</label>

//       {isEditing ? (
//         <input
//           type="text"
//           name={name}
//           value={form[name]}
//           onChange={handleChange}
//           className={inputClass}
//           placeholder={placeholder}
//         />
//       ) : (
//         <p className="break-words text-sm font-medium text-slate-900">
//           {value || "-"}
//         </p>
//       )}
//     </div>
//   );

//   return (
//     <div className="crm-page bg-slate-50">
//       {/* ===================== TITLE ===================== */}
//       <div className="mb-6">
//         <h1 className="text-[28px] font-bold leading-tight text-slate-900">
//           Profile Settings
//         </h1>

//         <p className="mt-1 text-xs text-slate-500">
//           Manage your personal account information
//           {isAdmin ? ", company branding" : ""} and subscription details.
//         </p>
//       </div>

//       {/* ===================== PROFILE HERO ===================== */}
//       <div className="mb-6 flex items-center gap-5 rounded-2xl border border-green-100 bg-green-50/70 px-6 py-5">
//         <div className="shrink-0">
//           <div
//             className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-lg font-bold ${
//               avatarSrc
//                 ? "bg-white ring-2 ring-white"
//                 : "bg-green-100 text-green-900"
//             }`}
//           >
//             {avatarSrc ? (
//               <img
//                 src={avatarSrc}
//                 alt={user?.companyName || "Company logo"}
//                 onError={() => setLogoError(true)}
//                 className="h-full w-full object-contain p-1"
//               />
//             ) : (
//               getInitials(user?.name)
//             )}
//           </div>
//         </div>

//         <div className="min-w-0">
//           <div className="flex flex-wrap items-center gap-2.5">
//             <h2 className="truncate text-xl font-bold text-slate-900">
//               {user?.name || "-"}
//             </h2>

//             {user?.role && <RoleBadge role={user.role} />}
//           </div>

//           <p className="mt-1 truncate text-xs text-slate-600">
//             {heroSubline || "-"}
//           </p>
//         </div>
//       </div>

//       {/* ===================== TABS ===================== */}
//       <div className="mb-6 flex overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-white px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//         {tabs.map((tab) => {
//           const isActive = activeTab === tab.key;

//           return (
//             <button
//               key={tab.key}
//               type="button"
//               onClick={() => setActiveTab(tab.key)}
//               aria-current={isActive ? "page" : undefined}
//               className={`shrink-0 border-b-2 px-5 py-3.5 text-sm transition ${
//                 isActive
//                   ? "border-green-800 font-semibold text-slate-900"
//                   : "border-transparent font-medium text-slate-500 hover:text-slate-800"
//               }`}
//             >
//               {tab.label}
//             </button>
//           );
//         })}
//       </div>

//       {/* ===================== PERSONAL INFORMATION ===================== */}
//       {activeTab === "personal" && (
//         <div className={cardClass}>
//           <CardHeader
//             title="Personal Information"
//             subtitle={
//               isEditing
//                 ? "Update your personal account information."
//                 : "Your personal details and role information."
//             }
//             action={!isEditing ? <EditButton onClick={startEditing} /> : null}
//           />

//           <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
//             {renderField({
//               label: "Full Name",
//               name: "name",
//               placeholder: "Enter your full name",
//               value: user?.name,
//             })}

//             {/* Email (read-only — used for login) */}
//             <div>
//               <label className={labelClass}>Email Address</label>
//               <p className="break-all text-sm font-medium text-slate-900">
//                 {user?.email || "-"}
//               </p>
//             </div>

//             {renderField({
//               label: "Phone Number",
//               name: "phone",
//               placeholder: "Enter your phone number",
//               value: user?.phone,
//             })}

//             {renderField({
//               label: "Department",
//               name: "department",
//               placeholder: "Enter your department",
//               value: user?.department,
//             })}

//             {renderField({
//               label: "Designation",
//               name: "designation",
//               placeholder: "Enter your designation",
//               value: user?.designation,
//             })}

//             {/* Role (read-only — set by your administrator) */}
//             <div>
//               <label className={labelClass}>User Role</label>
//               {user?.role ? (
//                 <RoleBadge role={user.role} />
//               ) : (
//                 <p className="text-sm font-medium text-slate-900">-</p>
//               )}
//             </div>

//             <div className="md:col-span-3">
//               {renderField({
//                 label: "Address",
//                 name: "address",
//                 placeholder: "Enter your address",
//                 value: user?.address,
//               })}
//             </div>
//           </div>

//           {isEditing && (
//             <ActionButtons
//               onCancel={cancelEditing}
//               onSave={handleSave}
//               busy={isLoading}
//             />
//           )}
//         </div>
//       )}

//       {/* ===================== COMPANY BRANDING (admin only) ===================== */}
//       {activeTab === "branding" && isAdmin && <CompanyBrandingCard />}

//       {/* ===================== BILLING & SUBSCRIPTION ===================== */}
//       {activeTab === "billing" && <BillingSubscriptionCard />}
//     </div>
//   );
// }

// export default ProfileSettings;



import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  Building2,
  Pencil,
  X,
  Check,
  ImageIcon,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import BillingSubscriptionCard from "./BillingSubscriptionCard";
import {
  getCompanySettings,
  updateCompanySettings,
} from "../../api/companyApi";

// ============================================================
// SHARED UI PIECES (presentation only)
// ============================================================

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400";

const cardClass =
  "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7";

// "ADMIN" -> "Admin"
const formatRole = (role) =>
  role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "-";

// "Aarav Sharma" -> "AS"
const getInitials = (name) => {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

const RoleBadge = ({ role, className = "" }) => (
  <span
    className={`inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 ${className}`}
  >
    {formatRole(role)}
  </span>
);

const EditButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100"
  >
    <Pencil size={14} />
    Edit
  </button>
);

const CardHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h2 className="text-lg font-bold leading-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
    </div>

    {action}
  </div>
);

const ActionButtons = ({ onCancel, onSave, busy }) => (
  <div className="mt-7 flex justify-end gap-3">
    <button
      type="button"
      onClick={onCancel}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <X size={16} />
      Cancel
    </button>

    <button
      type="button"
      onClick={onSave}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Check size={16} />
      {busy ? "Saving..." : "Save Changes"}
    </button>
  </div>
);

// ============================================================
// COMPANY BRANDING CARD
// (Admin only — the tab is shown only when user.role is ADMIN.
//  Lets the admin change the company display name and logo.
//  Saving refreshes the logged-in user via authStore.fetchMe(),
//  which is how the new name/logo reach the Sidebar without a
//  page reload.)
// ============================================================
function CompanyBrandingCard() {
  const { fetchMe } = useAuthStore();

  const [company, setCompany] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  // true when the admin clicked "Remove logo" (applied on Save Changes)
  const [removeLogo, setRemoveLogo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadCompany = async () => {
      try {
        const data = await getCompanySettings();

        if (isMounted) {
          setCompany(data.company);
          setCompanyName(data.company?.companyName || "");
        }
      } catch (error) {
        console.error("Failed to load company settings:", error);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    loadCompany();

    return () => {
      isMounted = false;
    };
  }, []);

  const startEditing = () => {
    setCompanyName(company?.companyName || "");
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(false);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setRemoveLogo(false); // picking a new logo cancels a pending removal
    e.target.value = ""; // allows choosing the same file again
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoveLogo(true);
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error("Company name is required.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = { companyName: companyName.trim() };
      if (logoFile) {
        payload.logo = logoFile;
      } else if (removeLogo) {
        // Backend must delete the stored logo when it receives this flag.
        payload.removeLogo = true;
      }

      const data = await updateCompanySettings(payload);

      setCompany(data.company);
      setIsEditing(false);
      setLogoFile(null);
      setLogoPreview(null);
      setRemoveLogo(false);

      toast.success(data.message || "Company branding updated successfully.");

      // The company logo is also the profile avatar, so update it in the
      // auth store right away (works for a new logo AND for "Remove logo").
      const currentUser = useAuthStore.getState().user;
      useAuthStore.setState({
        user: { ...currentUser, companyLogo: data.company?.logo || null },
      });

      // Pulls the fresh companyName/companyLogo into the auth store
      // (and localStorage), so the Sidebar re-renders immediately.
      fetchMe();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update company branding."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const logoSrc = removeLogo ? null : logoPreview || company?.logo;

  return (
    <div className={cardClass}>
      <CardHeader
        title="Company Branding"
        subtitle={
          isEditing
            ? "Update your company name and logo."
            : "This name and logo appear in the sidebar for your whole team."
        }
        action={
          !isEditing && !isFetching ? (
            <EditButton onClick={startEditing} />
          ) : null
        }
      />

      {isFetching ? (
        <div className="flex items-center justify-center py-10 text-sm text-slate-400">
          Loading company branding...
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Company name */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <Building2 size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-500">Company Name</p>

                {isEditing ? (
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={`${inputClass} mt-1`}
                    placeholder="Enter your company name"
                  />
                ) : (
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {company?.companyName || "-"}
                  </p>
                )}
              </div>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sky-50 text-sky-600">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt={companyName || "Company logo"}
                    className="h-full w-full bg-white object-cover"
                  />
                ) : (
                  <ImageIcon size={18} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">Logo</p>

                {isEditing ? (
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
                    <label
                      htmlFor="company-logo-input"
                      className="inline-flex cursor-pointer items-center gap-1.5 text-green-700 hover:underline"
                    >
                      <ImageIcon size={13} />
                      {logoSrc ? "Change logo" : "Upload logo"}
                      <input
                        id="company-logo-input"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>

                    {logoSrc && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="inline-flex items-center gap-1.5 text-red-500 hover:underline"
                      >
                        <Trash2 size={13} />
                        Remove logo
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">PNG, JPG or WEBP</p>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <ActionButtons
              onCancel={cancelEditing}
              onSave={handleSave}
              busy={isSaving}
            />
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// PROFILE SETTINGS PAGE
// ============================================================
function ProfileSettings() {
  const { user, updateProfileAction, isLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState("personal");

  const [isEditing, setIsEditing] = useState(false);

  // If the company logo file fails to load, fall back to the initials
  const [logoError, setLogoError] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    department: user?.department || "",
    designation: user?.designation || "",
  });

  const isAdmin = user?.role === "ADMIN";

  const tabs = [
    { key: "personal", label: "Personal Information" },
    ...(isAdmin ? [{ key: "branding", label: "Company Branding" }] : []),
    { key: "billing", label: "Subscription & Billing" },
  ];

  const startEditing = () => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      address: user?.address || "",
      department: user?.department || "",
      designation: user?.designation || "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }

    const payload = { ...form };

    const result = await updateProfileAction(payload);

    if (result.success) {
      toast.success(result.message || "Profile updated successfully.");
      setIsEditing(false);
    } else {
      toast.error(result.message || "Failed to update profile.");
    }
  };

  // There is no separate profile photo: the avatar IS the company logo.
  // Change the logo in the Company Branding tab and it updates here.
  const avatarSrc = logoError ? null : user?.companyLogo;

  // A new logo gets a fresh chance to load
  useEffect(() => {
    setLogoError(false);
  }, [user?.companyLogo]);

  const heroSubline = [user?.designation, user?.department, user?.email]
    .filter(Boolean)
    .join(" · ");

  // Read-only value or input, depending on edit mode
  const renderField = ({ label, name, placeholder, value }) => (
    <div>
      <label className={labelClass}>{label}</label>

      {isEditing ? (
        <input
          type="text"
          name={name}
          value={form[name]}
          onChange={handleChange}
          className={inputClass}
          placeholder={placeholder}
        />
      ) : (
        <p className="break-words text-sm font-medium text-slate-900">
          {value || "-"}
        </p>
      )}
    </div>
  );

  return (
    <div className="crm-page bg-slate-50">
      {/* ===================== TITLE ===================== */}
      <div className="mb-6">
        <h1 className="crm-title">
          Profile Settings
        </h1>

        <p className="crm-subtitle">
          Manage your personal account information
          {isAdmin ? ", company branding" : ""} and subscription details.
        </p>
      </div>

      {/* ===================== PROFILE HERO ===================== */}
      <div className="mb-6 flex items-center gap-5 rounded-2xl border border-green-100 bg-green-50/70 px-6 py-5">
        <div className="shrink-0">
          <div
            className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-lg font-bold ${
              avatarSrc
                ? "bg-white ring-2 ring-white"
                : "bg-green-100 text-green-900"
            }`}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user?.companyName || "Company logo"}
                onError={() => setLogoError(true)}
                className="h-full w-full object-contain p-1"
              />
            ) : (
              getInitials(user?.name)
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="truncate text-xl font-bold text-slate-900">
              {user?.name || "-"}
            </h2>

            {user?.role && <RoleBadge role={user.role} />}
          </div>

          <p className="mt-1 truncate text-xs text-slate-600">
            {heroSubline || "-"}
          </p>
        </div>
      </div>

      {/* ===================== TABS ===================== */}
      <div className="mb-6 flex overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-white px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 border-b-2 px-5 py-3.5 text-sm transition ${
                isActive
                  ? "border-green-800 font-semibold text-slate-900"
                  : "border-transparent font-medium text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===================== PERSONAL INFORMATION ===================== */}
      {activeTab === "personal" && (
        <div className={cardClass}>
          <CardHeader
            title="Personal Information"
            subtitle={
              isEditing
                ? "Update your personal account information."
                : "Your personal details and role information."
            }
            action={!isEditing ? <EditButton onClick={startEditing} /> : null}
          />

          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
            {renderField({
              label: "Full Name",
              name: "name",
              placeholder: "Enter your full name",
              value: user?.name,
            })}

            {/* Email (read-only — used for login) */}
            <div>
              <label className={labelClass}>Email Address</label>
              <p className="break-all text-sm font-medium text-slate-900">
                {user?.email || "-"}
              </p>
            </div>

            {renderField({
              label: "Phone Number",
              name: "phone",
              placeholder: "Enter your phone number",
              value: user?.phone,
            })}

            {renderField({
              label: "Department",
              name: "department",
              placeholder: "Enter your department",
              value: user?.department,
            })}

            {renderField({
              label: "Designation",
              name: "designation",
              placeholder: "Enter your designation",
              value: user?.designation,
            })}

            {/* Role (read-only — set by your administrator) */}
            <div>
              <label className={labelClass}>User Role</label>
              {user?.role ? (
                <RoleBadge role={user.role} />
              ) : (
                <p className="text-sm font-medium text-slate-900">-</p>
              )}
            </div>

            <div className="md:col-span-3">
              {renderField({
                label: "Address",
                name: "address",
                placeholder: "Enter your address",
                value: user?.address,
              })}
            </div>
          </div>

          {isEditing && (
            <ActionButtons
              onCancel={cancelEditing}
              onSave={handleSave}
              busy={isLoading}
            />
          )}
        </div>
      )}

      {/* ===================== COMPANY BRANDING (admin only) ===================== */}
      {activeTab === "branding" && isAdmin && <CompanyBrandingCard />}

      {/* ===================== BILLING & SUBSCRIPTION ===================== */}
      {activeTab === "billing" && <BillingSubscriptionCard />}
    </div>
  );
}

export default ProfileSettings;