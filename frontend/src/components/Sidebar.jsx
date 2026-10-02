// import { useState, useEffect } from "react";
// import { NavLink, useLocation } from "react-router-dom";
// import { useAuthStore } from "../store/authStore";


// import {
//   FaTachometerAlt,
//   FaComments,
//   FaUsers,
//   FaTasks,
//   FaUserTie,
//   FaCog,
//   FaUserPlus,
//   FaTicketAlt,
//   FaBullhorn,
//   FaFileAlt,
//   FaChevronRight,
//   FaUser,
//   FaLock,
//   FaCreditCard,
//   FaBox,
//   FaHistory,
//   FaRobot,
//   FaDatabase,
//   FaPlug,
// } from "react-icons/fa";


// const sections = [

//   {
//     id: "main",
//     title: "Main",
//     items: [
//       {
//         name: "Dashboard",
//         icon: FaTachometerAlt,
//         path: "/dashboard",
//       },
//       {
//         name: "Conversations",
//         icon: FaComments,
//         path: "/conversations",
//       },
//     ],
//   },


//   {
//     id: "crm",
//     title: "CRM",
//     items: [
//       {
//         name: "Customers",
//         icon: FaUsers,
//         path: "/customers",
//       },
//       {
//         name: "Leads",
//         icon: FaUserPlus,
//         path: "/leads",
//       },
//       {
//         name: "Campaigns",
//         icon: FaBullhorn,
//         path: "/campaigns",
//       },
//       {
//         name: "Templates",
//         icon: FaFileAlt,
//         path: "/templates",
//       },
//     ],
//   },


//   {
//     id: "management",
//     title: "Management",
//     items: [
//       {
//         name: "Employees",
//         icon: FaUserTie,
//         path: "/employees",
//       },
//       {
//         name: "Tickets",
//         icon: FaTicketAlt,
//         path: "/tickets",
//       },
//     ],
//   },


//   {
//     id: "productivity",
//     title: "Productivity",
//     items: [
//       {
//         name: "Tasks",
//         icon: FaTasks,
//         path: "/tasks",
//       },
//     ],
//   },


//   {
//     id: "settings",
//     title: "Settings",
//     items: [
//       // {
//       //   name: "Profile",
//       //   icon: FaUser,
//       //   path: "/settings/profile",
//       // },
//       {
//         name: "Security",
//         icon: FaLock,
//         path: "/settings/security",
//       },
//       // {
//       //   name: "Billing & Subscription",
//       //   icon: FaCreditCard,
//       //   path: "/settings/billing",
//       // },
//       {
//         name: "Integrations",
//         icon: FaPlug,
//         path: "/settings/integrations",
//       },
//       {
//         name: "Backup & Restore",
//         icon: FaDatabase,
//         path: "/backup",
//       },
//       {
//         name: "SaaS Support",
//         icon: FaTicketAlt,
//         path: "/settings/support",
//       },
//       {
//         name: "Audit Logs",
//         icon: FaHistory,
//         path: "/settings/audit-logs",
//       },
//       {
//         name: "AI Auto-Reply",
//         icon: FaRobot,
//         path: "/settings/ai-auto-reply",
//       },

//     ],
//   },

// ];



// export default function Sidebar({
//   isOpen = false,
//   onClose = () => { },
// }) {


//   const user = useAuthStore(
//     (state) => state.user
//   );

//   const companyName = user?.companyName || "Your Company";
//   const companyInitial = companyName.charAt(0).toUpperCase();
//   const companyLogo = user?.companyLogo;
//   const [logoError, setLogoError] = useState(false);


//   const location = useLocation();


//   const [openSection, setOpenSection] = useState("main");

//   useEffect(() => {

//     const activeSection =
//       sections.find(section =>
//         section.items.some(
//           item =>
//             location.pathname.startsWith(item.path)
//         )
//       );


//     if (activeSection) {
//       setOpenSection(activeSection.id);
//     }

//   }, [location.pathname]);



//   const toggleSection = (id) => {

//     setOpenSection(prev =>
//       prev === id ? "" : id
//     );

//   };

//   const linkClass = ({ isActive }) =>

//     `group flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] transition-all duration-200 ease-out hover:scale-[1.02]
    
//     ${isActive
//       ?
//       "scale-[1.01] bg-[#00C86B] text-white font-semibold shadow-md shadow-[#00C86B]/20"
//       :
//       "bg-transparent text-slate-100 hover:bg-[#0A6E63] hover:text-white"
//     }`;




//   return (

//     <>

//       {isOpen && (

//         <button

//           type="button"

//           onClick={onClose}

//           className="fixed inset-0 z-40 bg-black/50 lg:hidden"

//         />

//       )}



//       <aside

//         className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] flex-col border-r border-white/10 bg-gradient-to-b from-[#061113] via-[#071114] to-[#02090B] p-5 text-white shadow-xl shadow-black/20 transition-transform duration-300 lg:translate-x-0

// ${isOpen ? "translate-x-0" : "-translate-x-full"}

// `}

//       >


//         {/* BRAND */}

//         <div className="border-b border-white/10 pb-4">

//           {/* Their company — the tenant's brand, shown big */}

//           <div className="flex items-center gap-3">

//             <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-lg font-bold text-black shadow-md shadow-black/20">
//               {companyLogo && !logoError ? (
//                 <img
//                   src={companyLogo}
//                   alt={companyName}
//                   onError={() => setLogoError(true)}
//                   className="h-full w-full object-cover"
//                 />
//               ) : (
//                 companyInitial
//               )}
//             </span>

//             <div className="min-w-0">
//               <h1
//                 className="truncate text-lg font-bold leading-tight text-white"
//                 title={companyName}
//               >
//                 {companyName}
//               </h1>

//               <p className="truncate text-xs text-slate-400">
//                 Business Messaging Platform
//               </p>
//             </div>

//           </div>


//           {/* Our platform — small, "powered by" branding */}

//           <div className="mt-4 flex items-center gap-1.5 border-t border-white/5 pt-3 text-slate-500">

//             <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[9px] text-[#25D366]">
//               <FaComments />
//             </span>

//             <span className="text-[11px] tracking-wide">
//               Powered by
//               <span className="ml-1 font-semibold text-slate-400">
//                 WhatsApp
//               </span>
//               <span className="ml-1 font-semibold text-[#25D366]">
//                 CRM
//               </span>
//             </span>

//           </div>

//         </div>




//         {/* MENU */}


//         <div className="mt-6 flex-1">


//           <div className="space-y-5">


//             {
//               sections.map(section => (


//                 <div
//                   key={section.id}
//                   className="border-b border-white/10 pb-4"
//                 >


//                   <button

//                     onClick={() => toggleSection(section.id)}

//                     className="mb-2 flex w-full items-center justify-between px-1 py-1"

//                   >


//                     <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#25D366]">

//                       {section.title}

//                     </span>



//                     <FaChevronRight

//                       className={`text-xs text-slate-600 transition-transform

// ${openSection === section.id
//                           ?
//                           "rotate-90"
//                           :
//                           ""
//                         }

// `}

//                     />


//                   </button>




//                   <div

//                     className={`grid transition-all duration-300

// ${openSection === section.id

//                         ?
//                         "grid-rows-[1fr] opacity-100"

//                         :

//                         "grid-rows-[0fr] opacity-0"

//                       }

// `}

//                   >


//                     <div className="overflow-hidden">


//                       <div className="flex flex-col gap-2">


//                         {

//                           section.items

//                             .filter(item => {

//                               if (
//                                 (item.path === "/employees" ||
//                                   item.path === "/settings/support" ||
//                                   item.path === "/settings/audit-logs" ||
//                                   item.path === "/settings/ai-auto-reply") &&
//                                 user?.role !== "ADMIN"
//                               ) {
//                                 return false;
//                               }

//                               return true;
//                             })


//                             .map(item => {


//                               const Icon = item.icon;


//                               return (

//                                 <NavLink

//                                   key={item.path}

//                                   to={item.path}

//                                   className={linkClass}

//                                   onClick={onClose}

//                                 >


//                                   <Icon className="text-sm" />


//                                   {item.name}


//                                 </NavLink>

//                               );


//                             })


//                         }



//                       </div>


//                     </div>


//                   </div>




//                 </div>


//               ))


//             }


//           </div>


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
import { navGroups, filterByRole } from "../config/navigation";

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
  const [openParents, setOpenParents] = useState({});

  const companyName = user?.companyName || "Your Company";
  const companyInitial = companyName.charAt(0).toUpperCase();
  const companyLogo = user?.companyLogo;

  // true only when a logo exists AND it loaded without error
  const showLogo = Boolean(companyLogo) && !logoError;

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
            {/* Logo box — WHITE when a logo is shown, green gradient only for the letter fallback */}
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-base font-bold shadow-md shadow-black/30 ${
                showLogo
                  ? "bg-white"
                  : "bg-gradient-to-br from-[#25D366] to-[#128C7E] text-[#04130C]"
              }`}
            >
              {showLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName}
                  onError={() => setLogoError(true)}
                  className="h-full w-full object-cover"
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
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-white/10 px-3 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/15"
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
      </aside>
    </>
  );
}