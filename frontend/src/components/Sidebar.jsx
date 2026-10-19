
// // src/components/Sidebar.jsx
// import { useEffect, useMemo, useState } from "react";
// import { NavLink, useLocation } from "react-router-dom";
// import { ChevronDown, X } from "lucide-react";
// import { useAuthStore } from "../store/authStore";
// import { navGroups, filterByRole, PLATFORM } from "../config/navigation";

// // Main menu items: 15px text, 40px tall
// const itemBase =
//   "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60";

// const itemState = (isActive) =>
//   isActive
//     ? "bg-[#25D366]/10 text-white"
//     : "text-slate-300 hover:bg-white/5 hover:text-white";

// function LinkItem({ item, onClose, nested = false }) {
//   const Icon = item.icon;
//   return (
//     <NavLink
//       to={item.path}
//       onClick={onClose}
//       className={({ isActive }) =>
//         `${itemBase} ${nested ? "h-9 pl-3 text-sm" : ""} ${itemState(isActive)}`
//       }
//     >
//       {({ isActive }) => (
//         <>
//           {isActive && (
//             <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#25D366]" />
//           )}
//           <Icon
//             size={nested ? 16 : 19}
//             strokeWidth={1.9}
//             className={`shrink-0 ${isActive ? "text-[#25D366]" : "text-slate-400 group-hover:text-slate-200"}`}
//           />
//           <span className="truncate">{item.name}</span>
//         </>
//       )}
//     </NavLink>
//   );
// }

// function ParentItem({ item, isOpen, hasActiveChild, onToggle, onClose }) {
//   const Icon = item.icon;
//   return (
//     <div>
//       <button
//         type="button"
//         onClick={onToggle}
//         aria-expanded={isOpen}
//         className={`${itemBase} w-full justify-between ${
//           hasActiveChild ? "text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
//         }`}
//       >
//         <span className="flex min-w-0 items-center gap-3">
//           <Icon
//             size={19}
//             strokeWidth={1.9}
//             className={hasActiveChild ? "text-[#25D366]" : "text-slate-400 group-hover:text-slate-200"}
//           />
//           <span className="truncate">{item.name}</span>
//         </span>
//         <ChevronDown
//           size={16}
//           className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
//         />
//       </button>

//       <div
//         className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
//           isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
//         }`}
//       >
//         <div className="overflow-hidden">
//           <div className="ml-[21px] mt-1 flex flex-col gap-1 border-l border-white/10 pl-2">
//             {item.children.map((child) => (
//               <LinkItem key={child.key} item={child} onClose={onClose} nested />
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function Sidebar({ isOpen = false, onClose = () => {} }) {
//   const user = useAuthStore((state) => state.user);
//   const { pathname } = useLocation();

//   const [logoError, setLogoError] = useState(false);
//   const [platformLogoError, setPlatformLogoError] = useState(false);
//   const [openParents, setOpenParents] = useState({});

//   const companyName = user?.companyName || "Your Company";
//   const companyInitial = companyName.charAt(0).toUpperCase();
//   const companyLogo = user?.companyLogo;
//   const hasCompanyLogo = !!companyLogo && !logoError;

//   // Reset logo error if a different logo URL arrives (e.g. after upload)
//   useEffect(() => setLogoError(false), [companyLogo]);

//   const groups = useMemo(() => filterByRole(navGroups, user?.role), [user?.role]);

//   // Flatten the groups into one list so every item gets exactly the same spacing
//   const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);

//   const isChildActive = (item) =>
//     item.children?.some((c) => pathname.startsWith(c.path)) ?? false;

//   // Auto-open the parent that contains the current route
//   useEffect(() => {
//     items.forEach((item) => {
//       if (item.children && isChildActive(item)) {
//         setOpenParents((prev) => (prev[item.key] ? prev : { ...prev, [item.key]: true }));
//       }
//     });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [pathname, items]);

//   const toggleParent = (key) =>
//     setOpenParents((prev) => ({ ...prev, [key]: !prev[key] }));

//   const showPlatformLogo = !!PLATFORM.logo && !platformLogoError;

//   return (
//     <>
//       {isOpen && (
//         <button
//           type="button"
//           aria-label="Close menu"
//           onClick={onClose}
//           className="fixed inset-0 z-40 bg-black/50 lg:hidden"
//         />
//       )}

//       {/* fixed + inset-y-0 = always exactly the viewport height, on any screen */}
//       <aside
//         className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-gradient-to-b from-[#061113] via-[#071114] to-[#02090B] text-white transition-transform duration-300 motion-reduce:transition-none lg:translate-x-0 ${
//           isOpen ? "translate-x-0" : "-translate-x-full"
//         }`}
//       >
//         {/* TENANT BRAND (customer's company) — never scrolls */}
//         <div className="shrink-0 px-3 pb-3 pt-4">
//           <div className="flex items-center gap-3 px-3">
//             <span
//               className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-bold shadow-md shadow-black/30 ${
//                 hasCompanyLogo
//                   ? "bg-white"
//                   : "bg-gradient-to-br from-[#25D366] to-[#128C7E] text-[#04130C]"
//               }`}
//             >
//               {hasCompanyLogo ? (
//                 <img
//                   src={companyLogo}
//                   alt={companyName}
//                   onError={() => setLogoError(true)}
//                   className="h-full w-full object-contain p-1"
//                 />
//               ) : (
//                 companyInitial
//               )}
//             </span>

//             <div className="min-w-0 flex-1">
//               <h1 className="truncate text-base font-semibold leading-tight" title={companyName}>
//                 {companyName}
//               </h1>
//               <p className="truncate text-xs text-slate-400">Business workspace</p>
//             </div>

//             <button
//               type="button"
//               onClick={onClose}
//               aria-label="Close menu"
//               className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
//             >
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         {/* NAV — one evenly spaced list; scrolls if the screen is short */}
//         <nav
//           aria-label="Main navigation"
//           className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-white/10 px-3 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent"
//         >
//           <div className="flex flex-col gap-1">
//             {items.map((item) =>
//               item.children ? (
//                 <ParentItem
//                   key={item.key}
//                   item={item}
//                   isOpen={!!openParents[item.key]}
//                   hasActiveChild={isChildActive(item)}
//                   onToggle={() => toggleParent(item.key)}
//                   onClose={onClose}
//                 />
//               ) : (
//                 <LinkItem key={item.key} item={item} onClose={onClose} />
//               )
//             )}
//           </div>
//         </nav>

//         {/* PLATFORM BRAND — "Powered by" + our logo, pinned to the bottom */}
//         <div className="shrink-0 border-t border-white/10 px-6 pb-5 pt-4">
//           <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
//             Powered by
//           </p>

//           {showPlatformLogo ? (
//             <img
//               src={PLATFORM.logo}
//               alt={PLATFORM.name}
//               onError={() => setPlatformLogoError(true)}
//               className="mt-2.5 h-11 w-auto max-w-full object-contain object-left"
//             />
//           ) : (
//             // Only shown if the logo file is missing or fails to load
//             <p className="mt-2.5 text-lg font-semibold tracking-tight text-slate-200">
//               {PLATFORM.name}
//             </p>
//           )}
//         </div>
//       </aside>
//     </>
//   );
// }




// src/components/Sidebar.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { navGroups, filterByRole, PLATFORM } from "../config/navigation";

// Main menu items: 15px text, 40px tall
const itemBase =
  "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/60";

const itemState = (isActive) =>
  isActive
    ? "bg-[#25D366]/10 text-white"
    : "text-slate-300 hover:bg-white/5 hover:text-white";

function LinkItem({ item, onClose, nested = false }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      data-tour={item.key}
      onClick={onClose}
      className={({ isActive }) =>
        `${itemBase} ${nested ? "h-9 pl-3 text-sm" : ""} ${itemState(isActive)}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#25D366]" />
          )}
          <Icon
            size={nested ? 16 : 19}
            strokeWidth={1.9}
            className={`shrink-0 ${isActive ? "text-[#25D366]" : "text-slate-400 group-hover:text-slate-200"}`}
          />
          <span className="truncate">{item.name}</span>
        </>
      )}
    </NavLink>
  );
}

function ParentItem({ item, isOpen, hasActiveChild, onToggle, onClose }) {
  const Icon = item.icon;
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        data-tour={item.key}
        aria-expanded={isOpen}
        className={`${itemBase} w-full justify-between ${
          hasActiveChild ? "text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon
            size={19}
            strokeWidth={1.9}
            className={hasActiveChild ? "text-[#25D366]" : "text-slate-400 group-hover:text-slate-200"}
          />
          <span className="truncate">{item.name}</span>
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="ml-[21px] mt-1 flex flex-col gap-1 border-l border-white/10 pl-2">
            {item.children.map((child) => (
              <LinkItem key={child.key} item={child} onClose={onClose} nested />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const user = useAuthStore((state) => state.user);
  const { pathname } = useLocation();

  const [logoError, setLogoError] = useState(false);
  const [platformLogoError, setPlatformLogoError] = useState(false);
  const [openParents, setOpenParents] = useState({});

  const companyName = user?.companyName || "Your Company";
  const companyInitial = companyName.charAt(0).toUpperCase();
  const companyLogo = user?.companyLogo;
  const hasCompanyLogo = !!companyLogo && !logoError;

  // Reset logo error if a different logo URL arrives (e.g. after upload)
  useEffect(() => setLogoError(false), [companyLogo]);

  const groups = useMemo(() => filterByRole(navGroups, user?.role), [user?.role]);

  // Flatten the groups into one list so every item gets exactly the same spacing
  const items = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  const isChildActive = (item) =>
    item.children?.some((c) => pathname.startsWith(c.path)) ?? false;

  // Auto-open the parent that contains the current route
  useEffect(() => {
    items.forEach((item) => {
      if (item.children && isChildActive(item)) {
        setOpenParents((prev) => (prev[item.key] ? prev : { ...prev, [item.key]: true }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, items]);

  const toggleParent = (key) =>
    setOpenParents((prev) => ({ ...prev, [key]: !prev[key] }));

  const showPlatformLogo = !!PLATFORM.logo && !platformLogoError;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* fixed + inset-y-0 = always exactly the viewport height, on any screen */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-gradient-to-b from-[#061113] via-[#071114] to-[#02090B] text-white transition-transform duration-300 motion-reduce:transition-none lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* TENANT BRAND (customer's company) — never scrolls */}
        <div className="shrink-0 px-3 pb-3 pt-4">
          <div className="flex items-center gap-3 px-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-base font-bold shadow-md shadow-black/30 ${
                hasCompanyLogo
                  ? "bg-white"
                  : "bg-gradient-to-br from-[#25D366] to-[#128C7E] text-[#04130C]"
              }`}
            >
              {hasCompanyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  onError={() => setLogoError(true)}
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                companyInitial
              )}
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-semibold leading-tight" title={companyName}>
                {companyName}
              </h1>
              <p className="truncate text-xs text-slate-400">Business workspace</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* NAV — one evenly spaced list; scrolls if the screen is short */}
        <nav
          aria-label="Main navigation"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-white/10 px-3 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-track]:bg-transparent"
        >
          <div className="flex flex-col gap-1">
            {items.map((item) =>
              item.children ? (
                <ParentItem
                  key={item.key}
                  item={item}
                  isOpen={!!openParents[item.key]}
                  hasActiveChild={isChildActive(item)}
                  onToggle={() => toggleParent(item.key)}
                  onClose={onClose}
                />
              ) : (
                <LinkItem key={item.key} item={item} onClose={onClose} />
              )
            )}
          </div>
        </nav>

        {/* PLATFORM BRAND — "Powered by" + our logo, pinned to the bottom */}
        <div className="shrink-0 border-t border-white/10 px-6 pb-5 pt-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
            Powered by
          </p>

          {showPlatformLogo ? (
            <img
              src={PLATFORM.logo}
              alt={PLATFORM.name}
              onError={() => setPlatformLogoError(true)}
              className="mt-2.5 h-11 w-auto max-w-full object-contain object-left"
            />
          ) : (
            // Only shown if the logo file is missing or fails to load
            <p className="mt-2.5 text-lg font-semibold tracking-tight text-slate-200">
              {PLATFORM.name}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}