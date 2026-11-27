// import React, { useState } from "react";
// import { useAuthStore } from "../store/authStore";
// import {
//   FiLock,
//   FiEye,
//   FiEyeOff,
//   FiLoader,
// } from "react-icons/fi";
// import {
//   useNavigate,
//   useParams,
// } from "react-router-dom";

// const ResetPassword = () => {
//   const {
//     resetPasswordAction,
//     isLoading,
//     error,
//     clearError,
//   } = useAuthStore();

//   const { token } = useParams();
//   const navigate = useNavigate();

//   const [password, setPassword] =
//     useState("");

//   const [
//     confirmPassword,
//     setConfirmPassword,
//   ] = useState("");

//   const [showPassword, setShowPassword] =
//     useState(false);

//   const [
//     showConfirmPassword,
//     setShowConfirmPassword,
//   ] = useState(false);

//   const [successMessage, setSuccessMessage] =
//     useState("");

//   const [errors, setErrors] = useState({
//     password: "",
//     confirmPassword: "",
//   });

//   // ===========================
//   // VALIDATION
//   // ===========================

//   const validateForm = () => {
//     const newErrors = {};

//     if (!password) {
//       newErrors.password =
//         "Password is required";
//     } else if (password.length < 6) {
//       newErrors.password =
//         "Password must be at least 6 characters";
//     }

//     if (!confirmPassword) {
//       newErrors.confirmPassword =
//         "Confirm Password is required";
//     } else if (
//       password !== confirmPassword
//     ) {
//       newErrors.confirmPassword =
//         "Passwords do not match";
//     }

//     setErrors(newErrors);

//     return (
//       Object.keys(newErrors).length === 0
//     );
//   };

//   // ===========================
//   // SUBMIT
//   // ===========================

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     clearError();
//     setSuccessMessage("");

//     if (!validateForm()) return;

//     const result =
//       await resetPasswordAction(
//         token,
//         password
//       );

//     if (result.success) {
//       setSuccessMessage(result.message);

//       setTimeout(() => {
//         navigate("/login");
//       }, 2000);
//     }
//   };

//   return (
//     <div
//       className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
//       style={{
//         backgroundImage:
//           "url('/images/login-bg.png')",
//       }}
//     >
//       {/* Background Overlay */}
//       <div className="absolute inset-0 bg-[#062f2b]/55"></div>

//       {/* Decorative Glow */}
//       <div className="absolute top-[-180px] left-[-180px] w-[420px] h-[420px] rounded-full bg-[#25D366]/20 blur-[120px]" />

//       <div className="absolute bottom-[-150px] right-[-120px] w-[350px] h-[350px] rounded-full bg-[#25D366]/10 blur-[120px]" />

//       {/* Container */}
//       <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-10">
//         {/* Card */}
//         <div className="w-full max-w-5xl bg-white/92 backdrop-blur-xl rounded-[34px] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.45)] grid lg:grid-cols-5">

//           {/* ================= LEFT PANEL ================= */}

//           <div className="hidden lg:flex lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#032B2A] via-[#054F4A] to-[#0E8A7A]">

//             {/* Soft Overlay */}
//             <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-black/20" />

//             {/* Grid Pattern */}
//             <div
//               className="absolute inset-0 opacity-[0.05]"
//               style={{
//                 backgroundImage: `
//                   linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
//                   linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
//                 `,
//                 backgroundSize: "42px 42px",
//               }}
//             />

//             {/* ================= Decorative Background ================= */}

//             <div className="absolute inset-0 overflow-hidden">

//               {/* Large Green Glow */}
//               <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#25D366]/20 blur-[120px]" />

//               {/* Bottom Cyan Glow */}
//               <div className="absolute -bottom-28 -right-16 w-64 h-64 rounded-full bg-[#00E5C3]/15 blur-[110px]" />

//               {/* Main Glass Shape */}
//               <div
//                 className="absolute -left-20 top-0 h-full w-[82%] bg-white/[0.05] backdrop-blur-sm"
//                 style={{
//                   clipPath:
//                     "polygon(0 0,100% 0,48% 50%,100% 100%,0 100%)",
//                 }}
//               />

//               {/* Second Layer */}
//               <div
//                 className="absolute -left-8 top-0 h-full w-[74%] bg-[#25D366]/[0.06]"
//                 style={{
//                   clipPath:
//                     "polygon(0 0,100% 0,36% 50%,100% 100%,0 100%)",
//                 }}
//               />

//             </div>

//             {/* Floating Glow - Top */}
//             <div className="absolute top-20 right-8 w-20 h-20 rounded-full bg-[#25D366]/20 blur-3xl animate-pulse" />

//             {/* Floating Glow - Middle */}
//             <div
//               className="absolute top-1/2 left-12 w-14 h-14 rounded-full bg-cyan-300/20 blur-2xl animate-pulse"
//               style={{ animationDelay: "1s" }}
//             />

//             {/* Floating Glow - Bottom */}
//             <div
//               className="absolute bottom-16 right-16 w-28 h-28 rounded-full bg-emerald-400/15 blur-[70px] animate-pulse"
//               style={{ animationDelay: "2s" }}
//             />

//             {/* Content */}
//             <div className="relative z-10 flex flex-col justify-center items-center text-center px-10">

//               <div className="absolute w-[380px] h-[380px] rounded-full bg-white/[0.03] blur-[90px]" />

//               <div className="relative z-10 flex flex-col items-center">

//                 {/* ================= Premium Icon ================= */}

//                 <div className="relative mb-10">

//                   {/* Outer Glow */}
//                   <div className="absolute inset-0 rounded-full bg-[#25D366]/25 blur-2xl scale-125"></div>

//                   {/* Glass Circle */}
//                   <div className="relative w-28 h-28 rounded-full border border-white/15 bg-white/10 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)] flex items-center justify-center">

//                     {/* Inner Glow */}
//                     <div className="absolute w-20 h-20 rounded-full bg-[#25D366]/15 blur-xl"></div>

//                     <FiLock
//                       className="relative z-10 text-white"
//                       size={44}
//                     />

//                   </div>

//                 </div>

//                 <h1 className="text-[42px] font-extrabold tracking-tight text-white">
//                   Reset Password
//                 </h1>

//                 <p className="mt-5 max-w-sm text-[17px] leading-8 text-white/80">
//                   Create a strong password to keep your WhatsApp CRM account secure.
//                 </p>

//                 <div className="mt-12 flex gap-3">

//                   <div className="w-3 h-3 rounded-full bg-white/90"></div>

//                   <div className="w-3 h-3 rounded-full bg-white/50"></div>

//                   <div className="w-3 h-3 rounded-full bg-white/25"></div>

//                 </div>

//               </div>

//             </div>

//           </div>

//           {/* ================= RIGHT PANEL ================= */}

//           <div className="lg:col-span-3 flex flex-col justify-center px-8 sm:px-14 lg:px-16 py-14">

//             {/* Header */}

//             <div className="flex flex-col items-center text-center mb-10">

//               <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#25D366] to-[#075E54] flex items-center justify-center shadow-xl mb-6">

//                 <FiLock className="text-white text-3xl" />

//               </div>

//               <h2 className="text-4xl font-bold text-[#075E54]">
//                 Create New Password
//               </h2>

//               <p className="mt-2 text-gray-500">
//                 Your new password must be different from your previous password.
//               </p>

//             </div>

//             {/* Error */}

//             {error && (
//               <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
//                 {error}
//               </div>
//             )}

//             {/* Success */}

//             {successMessage && (
//               <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
//                 {successMessage}
//               </div>
//             )}

//             <form
//               onSubmit={handleSubmit}
//               className="space-y-7"
//             >
//               {/* ================= NEW PASSWORD ================= */}

//               <div>
//                 <div className="flex items-center gap-4 border-b-2 border-gray-200 pb-3 transition-all duration-300 focus-within:border-[#25D366]">

//                   <FiLock className="text-xl text-gray-400 shrink-0" />

//                   <input
//                     type={
//                       showPassword
//                         ? "text"
//                         : "password"
//                     }
//                     placeholder="New Password"
//                     value={password}
//                     onChange={(e) => {
//                       setPassword(e.target.value);

//                       setErrors((prev) => ({
//                         ...prev,
//                         password: "",
//                       }));

//                       clearError();
//                     }}
//                     className="w-full bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
//                   />

//                   <button
//                     type="button"
//                     onClick={() =>
//                       setShowPassword(
//                         !showPassword
//                       )
//                     }
//                     className="text-gray-400 hover:text-[#25D366] transition"
//                   >
//                     {showPassword ? (
//                       <FiEyeOff size={20} />
//                     ) : (
//                       <FiEye size={20} />
//                     )}
//                   </button>

//                 </div>

//                 {errors.password && (
//                   <p className="mt-2 text-sm text-red-500">
//                     {errors.password}
//                   </p>
//                 )}

//               </div>

//               {/* ================= CONFIRM PASSWORD ================= */}

//               <div>
//                 <div className="flex items-center gap-4 border-b-2 border-gray-200 pb-3 transition-all duration-300 focus-within:border-[#25D366]">

//                   <FiLock className="text-xl text-gray-400 shrink-0" />

//                   <input
//                     type={
//                       showConfirmPassword
//                         ? "text"
//                         : "password"
//                     }
//                     placeholder="Confirm Password"
//                     value={confirmPassword}
//                     onChange={(e) => {
//                       setConfirmPassword(
//                         e.target.value
//                       );

//                       setErrors((prev) => ({
//                         ...prev,
//                         confirmPassword: "",
//                       }));

//                       clearError();
//                     }}
//                     className="w-full bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
//                   />

//                   <button
//                     type="button"
//                     onClick={() =>
//                       setShowConfirmPassword(
//                         !showConfirmPassword
//                       )
//                     }
//                     className="text-gray-400 hover:text-[#25D366] transition"
//                   >
//                     {showConfirmPassword ? (
//                       <FiEyeOff size={20} />
//                     ) : (
//                       <FiEye size={20} />
//                     )}
//                   </button>

//                 </div>

//                 {errors.confirmPassword && (
//                   <p className="mt-2 text-sm text-red-500">
//                     {errors.confirmPassword}
//                   </p>
//                 )}

//               </div>

//               {/* ================= BUTTON ================= */}

//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="w-full h-12 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isLoading ? (
//                   <>
//                     <FiLoader className="animate-spin" />
//                     Resetting Password...
//                   </>
//                 ) : (
//                   "Reset Password"
//                 )}
//               </button>

//             </form>

//             {/* Divider */}

//             <div className="my-10 flex items-center">

//               <div className="flex-1 h-px bg-gray-200"></div>

//               <span className="px-4 text-xs uppercase tracking-widest text-gray-400">
//                 Secure Account
//               </span>

//               <div className="flex-1 h-px bg-gray-200"></div>

//             </div>

//             {/* Footer */}

//             <div className="text-center">

//               <p className="text-sm text-gray-500">
//                 © {new Date().getFullYear()} WhatsApp CRM
//               </p>

//               <p className="mt-2 text-xs text-gray-400">
//                 Secure Authentication • Encrypted Password Reset
//               </p>

//             </div>

//           </div>

//         </div>

//       </div>

//     </div>
//   );
// };

// export default ResetPassword;



import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiArrowRight,
  FiArrowLeft,
} from "react-icons/fi";
import {
  FaCog,
  FaChartBar,
  FaBullhorn,
  FaFileAlt,
  FaUsers,
} from "react-icons/fa";
import { IoCheckmarkDone } from "react-icons/io5";
import { Link, useNavigate, useParams } from "react-router-dom";
import vatupLogo from "../assets/vatup-logo-dark.png";

// ======================================================================
// Animated feature arc (left side, UI only - has nothing to do with login).
// The icons rotate along the arc automatically, the one that reaches the centre
// grows and the message bubble above it changes. No clicking needed.
// ======================================================================
const FEATURES = [
  { id: "contacts", label: "Contacts", text: "Manage customers and contacts.", Icon: FaUsers },
  { id: "automation", label: "Automation", text: "Automate repetitive workflows.", Icon: FaCog },
  { id: "analytics", label: "Analytics", text: "Track performance with meaningful insights.", Icon: FaChartBar },
  { id: "campaigns", label: "Campaigns", text: "Create and manage marketing campaigns.", Icon: FaBullhorn },
  { id: "templates", label: "Templates", text: "Manage ready-to-use message templates.", Icon: FaFileAlt },
];

// Slot centres on the arc, in a 600 x 330 box (left -> right)
const SLOTS = [
  { x: 42, y: 262 },
  { x: 151, y: 175 },
  { x: 300, y: 138 },
  { x: 449, y: 175 },
  { x: 558, y: 262 },
];

const ICON_GREEN = "#28a017";
const pct = (x) => `${(x / 600) * 100}%`;

const ArcShowcase = () => {
  const [active, setActive] = useState(3); // starts on "Campaigns"

  // Move to the next icon automatically, again and again
  useEffect(() => {
    const timer = setInterval(() => {
      setActive((a) => (a + 1) % FEATURES.length);
    }, 2600);

    return () => clearInterval(timer);
  }, []);

  const current = FEATURES[active];
  const wrapIndex = (active + 2) % FEATURES.length; // the icon that jumps from far-left to far-right

  return (
    <div className="absolute inset-0">
      {/* Arc line */}
      <svg
        className="absolute left-0 top-0 h-[330px] w-full"
        viewBox="0 0 600 330"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M42 262 C 90 196, 200 138, 300 138 C 400 138, 510 196, 558 262"
          stroke="#7ddc6b"
          strokeWidth="1.6"
        />
      </svg>

      {/* Message bubble above the centre icon */}
      <div className="absolute left-1/2 top-0 w-[210px] -translate-x-1/2">
        <div
          key={current.id}
          className="relative rounded-xl bg-[#c9f5c4] px-4 py-3 shadow-[0_8px_22px_rgba(40,160,23,0.15)]"
          style={{ animation: "vlPop .45s ease both" }}
        >
          <p className="text-[14px] font-bold text-[#0b1220]">{current.label}</p>
          <p className="mt-1 text-[12px] leading-snug text-gray-600">{current.text}</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-gray-500">
            now <IoCheckmarkDone size={14} style={{ color: ICON_GREEN }} />
          </p>
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-[#c9f5c4]" />
        </div>
      </div>

      {/* Icons */}
      {FEATURES.map((item, i) => {
        const slot = (((i - active + 2) % 5) + 5) % 5;
        const pos = SLOTS[slot];
        const isCenter = slot === 2;
        const isWrap = i === wrapIndex;
        const Icon = item.Icon;

        return (
          <div
            key={isWrap ? `${item.id}-${active}` : item.id}
            className="absolute"
            style={{
              left: pct(pos.x),
              top: pos.y,
              width: 0,
              height: 0,
              transition:
                "left .7s cubic-bezier(.4,0,.2,1), top .7s cubic-bezier(.4,0,.2,1)",
              animation: isWrap ? "vlFade .7s ease both" : undefined,
              zIndex: isCenter ? 3 : 2,
            }}
          >
            <div
              className="absolute left-1/2 top-1/2 flex items-center justify-center rounded-full bg-white"
              style={{
                width: isCenter ? 68 : 44,
                height: isCenter ? 68 : 44,
                fontSize: isCenter ? 26 : 16,
                color: ICON_GREEN,
                border: isCenter ? "3px solid #9be58a" : "1px solid #d7efcc",
                boxShadow: isCenter
                  ? "0 0 0 9px rgba(190,235,170,0.45), 0 10px 26px rgba(40,160,23,0.28)"
                  : "0 6px 18px rgba(40,160,23,0.18)",
                transform: `translate(-50%, -50%)`,
                transition:
                  "width .7s ease, height .7s ease, font-size .7s ease, box-shadow .7s ease, border .7s ease",
              }}
            >
              <Icon />
            </div>

            <span
              className="absolute left-1/2 top-[30px] -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-gray-700"
              style={{
                opacity: isCenter ? 0 : 1,
                transition: "opacity .4s ease",
              }}
            >
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Faint WhatsApp-style doodle pattern for the page background (UI only)
const DOODLES = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240" fill="none" stroke="#28a017" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".5">
    <path d="M18 22h28a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H32l-8 7v-7h-6a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4z"/>
    <path d="M118 30c-2 14 8 26 22 28l5-6-8-5-4 3c-5-2-8-6-10-11l4-3-5-8z"/>
    <rect x="196" y="22" width="30" height="22" rx="4"/><circle cx="211" cy="33" r="6"/>
    <path d="M70 100V78l16-4v22"/><circle cx="66" cy="100" r="4"/><circle cx="82" cy="96" r="4"/>
    <path d="M160 92l4.5 9.5 10.5 1.2-7.8 7.2 2.2 10.4-9.4-5.3-9.4 5.3 2.2-10.4-7.8-7.2 10.5-1.2z"/>
    <circle cx="30" cy="160" r="14"/><path d="M30 152v8l6 4"/>
    <path d="M110 160c-10-8-16-14-16-21a9 9 0 0 1 16-5 9 9 0 0 1 16 5c0 7-6 13-16 21z"/>
    <path d="M186 150l32-14-10 34-7-13z"/>
    <circle cx="70" cy="216" r="13"/><path d="M63 214h.01M77 214h.01M63 220c3 4 11 4 14 0"/>
    <path d="M150 210a16 16 0 1 0 0 .1M150 202v8h8"/>
  </svg>`
);

const ResetPassword = () => {
  const {
    resetPasswordAction,
    isLoading,
    error,
    clearError,
  } = useAuthStore();

  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errors, setErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  // ===========================
  // VALIDATION
  // ===========================

  const validateForm = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password =
        "Password is required";
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Confirm Password is required";
    } else if (
      password !== confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  // ===========================
  // SUBMIT
  // ===========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    clearError();
    setSuccessMessage("");

    if (!validateForm()) return;

    const result =
      await resetPasswordAction(
        token,
        password
      );

    if (result.success) {
      setSuccessMessage(result.message);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  };

  const inputBox =
    "flex h-[52px] items-center gap-3 rounded-xl border border-gray-200 bg-[#fafafa] px-4 transition-all duration-200 focus-within:border-[#00C565] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#00C565]/10";

  return (
    <div className="vatup-login relative flex h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-white via-[#fbfdf9] to-[#eef8e8]">
      {/* Font for this page only (falls back to the system font if blocked) */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .vatup-login, .vatup-login input, .vatup-login button {
          font-family: 'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }
        @keyframes vlPop { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes vlFade { from { opacity: 0; } to { opacity: 1; } }
        /* keep the whole page inside the screen (no scroll) on short screens */
        @media (max-height: 800px) { .vatup-left { zoom: 0.97; } }
        @media (max-height: 740px) { .vatup-left { zoom: 0.9; } }
        @media (max-height: 690px) { .vatup-left { zoom: 0.84; } }
        @media (max-height: 640px) { .vatup-left { zoom: 0.78; } }
        @media (max-height: 600px) { .vatup-left { zoom: 0.72; } }
        @media (max-height: 560px) { .vatup-left { zoom: 0.66; } }
        @media (max-height: 520px) { .vatup-left { zoom: 0.6; } }
        @media (max-height: 480px) { .vatup-left { zoom: 0.55; } }
      `}</style>

      {/* Faint chat-icon pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{ backgroundImage: `url("data:image/svg+xml,${DOODLES}")`, backgroundSize: "240px 240px" }}
      />

      {/* Soft background glows */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-[#00C565]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-[-120px] h-[380px] w-[380px] rounded-full bg-[#00C565]/10 blur-[120px]" />

      {/* Logo (top-left) */}
      <div className="relative z-20 shrink-0 px-5 pt-4 sm:px-8">
        <img
          src={vatupLogo}
          alt="Vatup CRM"
          className="h-12 w-auto object-contain sm:h-14"
        />
      </div>

      <div className="relative z-10 mx-auto grid min-h-0 w-full max-w-[1280px] flex-1 items-center gap-6 overflow-y-auto px-5 pb-6 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:overflow-hidden">

        {/* ================= LEFT : HERO (same as Login) ================= */}
        <div className="vatup-left hidden h-full min-h-0 flex-col justify-between overflow-hidden lg:flex">

          <div className="pt-10">
            <h1 className="text-[44px] font-extrabold leading-[1.1] tracking-tight text-[#0b1220] xl:text-[52px]">
              Simplify conversations.
            </h1>
            <p className="mt-4 max-w-md text-[28px] font-medium leading-[1.2] text-[#0b1220] xl:text-[32px]">
              Strengthen relationships. Grow your business.
            </p>
          </div>

          <div className="relative mx-auto mt-10 h-[450px] w-full max-w-[600px] overflow-hidden">
            <div className="absolute left-1/2 top-[285px] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-[#e6f6dd]" />

            <ArcShowcase />

            <div className="absolute inset-x-0 top-[355px] text-center">
              <p className="text-[17px] font-bold text-[#1f2937]">
                Your All-in-One CRM Solution
              </p>
              <p className="mt-2 text-[13px] text-gray-600">
                Engage <span className="mx-1 text-[#16a34a]">•</span> Nurture{" "}
                <span className="mx-1 text-[#16a34a]">•</span> Grow
              </p>
            </div>
          </div>
        </div>

        {/* ================= RIGHT : CARD ================= */}
        <div className="flex w-full items-center justify-center lg:justify-end lg:pr-6 xl:pr-12">
          <div className="w-full max-w-[420px] rounded-3xl border border-[#c8ecb9] bg-white/95 px-7 py-10 shadow-[0_20px_60px_rgba(22,163,74,0.12)] backdrop-blur sm:px-9">
            {/* Header */}
            <div className="mb-8 text-center">
              <h2 className="text-[22px] font-extrabold uppercase tracking-wide text-[#0b1220]">
                Create New Password
              </h2>
              <p className="mt-2 text-[14px] text-gray-500">
                Your new password must be different from your previous password.
              </p>
            </div>

            {/* Backend Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-3.5 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ================= NEW PASSWORD ================= */}
              <div>
                <div className={inputBox}>
                  <FiLock className="shrink-0 text-[18px] text-gray-500" />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);

                      setErrors((prev) => ({
                        ...prev,
                        password: "",
                      }));

                      clearError();
                    }}
                    className="w-full bg-transparent text-[14px] text-gray-800 outline-none placeholder:text-gray-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="shrink-0 text-gray-500 transition hover:text-[#00C565]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FiEyeOff size={19} /> : <FiEye size={19} />}
                  </button>
                </div>

                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* ================= CONFIRM PASSWORD ================= */}
              <div>
                <div className={inputBox}>
                  <FiLock className="shrink-0 text-[18px] text-gray-500" />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);

                      setErrors((prev) => ({
                        ...prev,
                        confirmPassword: "",
                      }));

                      clearError();
                    }}
                    className="w-full bg-transparent text-[14px] text-gray-800 outline-none placeholder:text-gray-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="shrink-0 text-gray-500 transition hover:text-[#00C565]"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <FiEyeOff size={19} /> : <FiEye size={19} />}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* ================= BUTTON ================= */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#00C565] text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(0,197,101,0.28)] transition-all duration-200 hover:bg-[#00b35b] hover:shadow-[0_12px_28px_rgba(0,197,101,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Reset Password
                    <FiArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 flex justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0f9a4a] transition hover:text-[#00C565] hover:underline"
              >
                <FiArrowLeft size={15} />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;