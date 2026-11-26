// // src/components/guide/ModuleGuideGate.jsx
// //
// // First-visit guide for a module.
// //
// // Wrap a module's page in a route:
// //   <ModuleGuideGate moduleId="templates"><Templates /></ModuleGuideGate>
// //
// // ONLY on the user's first login: the first module they open shows the "Your ___
// // Space Start Here" panel with the user guide video. It counts as "seen" only
// // when the user clicks the green button (if they leave by mistake - reload,
// // another menu item - it shows again). Once finished it is saved on the ACCOUNT
// // (user.moduleGuideSeenAt in the database), so it is NOT shown again for any
// // other module, and NOT again in a new browser / device.
// //
// // After that every module opens normally. The user can always open the guide again
// // from the ? icon in the top header (see ModuleGuideButton).
// //
// // All text, checklists and video links come from src/data/userGuide.js - the
// // same data as Settings -> User Guide.
// import { useMemo, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Upload } from "lucide-react";

// import { useAuthStore } from "../../store/authStore";
// import { useTourStore } from "../../store/tourStore";
// import { userGuideModules } from "../../data/userGuide";
// import GuidePanel from "./GuidePanel";
// import AddCustomer from "../../pages/AddCustomer";
// import {
//   ADD_FORM_MODULES,
//   ADMIN_ONLY_ADD,
//   GUIDE_HEADERS,
//   PRIMARY_LABELS,
//   hasSeenGuide,
//   markGuideSeen,
//   parseYouTube,
//   requestGuideOpen,
// } from "./guideUtils";

// // Modules that show the green button in the top-right of the header.
// // Instagram has no add form of its own, but its button takes the user to
// // Integrations (where the connect button lives) - so it looks like the others.
// // AppLayout renders these routes full width (no padding around the page), so
// // the guide needs the same padding the layout gives every other module.
// // Without it the title sits ~28px higher than in Tasks, Leads, etc.
// const FULL_WIDTH_GUIDE_MODULES = ["tickets", "instagram"];
// const LAYOUT_PADDING = "px-4 py-5 sm:px-5 sm:py-6";

// const HEADER_BUTTON_MODULES = ["customers", ...ADD_FORM_MODULES, "instagram"];

// // The Instagram connect card lives on Settings -> Security (not on the
// // Integrations page), so the Instagram guide buttons just open that page.
// // Modules that must open directly, without the first-visit demo video.
// // The Instagram conversations page opens straight to the inbox.
// const NO_GUIDE_MODULES = ["instagram"];

// const INSTAGRAM_PAGE = "/settings/security";

// function Gate({ moduleId, children }) {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const user = useAuthStore((state) => state.user);
//   const tourActive = useTourStore((state) => state.active);

//   const userId = user?.id ?? user?._id ?? user?.email;

//   const module = useMemo(
//     () => userGuideModules.find((item) => item.id === moduleId),
//     [moduleId]
//   );
//   const video = useMemo(() => parseYouTube(module?.video), [module]);

//   // Decided when the module is opened. The panel stays up until the user
//   // clicks the green button - only then is it saved as "seen".
//   const [show, setShow] = useState(
//     () => Boolean(userId && module && video && !tourActive && !hasSeenGuide(user))
//   );

//   // Customers first visit: add-customer form opens from the panel
//   const [showAddCustomer, setShowAddCustomer] = useState(false);

//   if (NO_GUIDE_MODULES.includes(moduleId)) return children;

//   if (!show || !module || !video) return children;

//   const finish = () => {
//     markGuideSeen(); // saved on the account -> never shown again
//     setShow(false);
//   };

//   const handleContinue = () => {
//     finish();

//     // e.g. Instagram guide: the connect button lives in Integrations
//     if (module.path && module.path !== location.pathname) navigate(module.path);
//   };

//   // First visit for every module: the module's own header, a compact guide
//   // below it and NO Skip button. The green "+ Add ..." button opens the add
//   // form; adding OR cancelling ends the guide and the module page is shown.
//   const header = GUIDE_HEADERS[moduleId] || { title: module.name, subtitle: "" };
//   const isAdmin = user?.role === "ADMIN";
//   const isInstagram = moduleId === "instagram";

//   const hasAddForm =
//     moduleId === "customers" || ADD_FORM_MODULES.includes(moduleId);
//   const canAdd = hasAddForm && (isAdmin || !ADMIN_ONLY_ADD.includes(moduleId));

//   // Instagram: always show the top button (it opens the Security page)
//   const showHeaderButton =
//     HEADER_BUTTON_MODULES.includes(moduleId) && (canAdd || isInstagram);

//   const handleInstagram = () => {
//     finish();
//     navigate(INSTAGRAM_PAGE);
//   };

//   const extraPadding = FULL_WIDTH_GUIDE_MODULES.includes(moduleId)
//     ? LAYOUT_PADDING
//     : "";

//   const handleAdd = () => {
//     if (moduleId === "customers") {
//       setShowAddCustomer(true);
//       return;
//     }

//     // Instagram: go to the page with the Instagram connect button
//     if (isInstagram) {
//       handleInstagram();
//       return;
//     }

//     // the module page opens its own add form as soon as it appears
//     requestGuideOpen(moduleId);
//     finish();
//   };

//   // modules with an add form: open it. Others (e.g. Backup): the old behaviour.
//   const primaryAction = isInstagram
//     ? handleInstagram
//     : canAdd
//     ? handleAdd
//     : hasAddForm
//     ? finish
//     : handleContinue;

//   // Instagram: shorter label on the bottom button so "Explore How its work"
//   // stays on the same row (right side) like every other module. The top
//   // button keeps the full "+ Add Instagram Integration" text.
//   const primaryLabel =
//     hasAddForm && !canAdd
//       ? "Got it"
//       : isInstagram
//       ? "+ Add Instagram"
//       : PRIMARY_LABELS[module.id] || `Open ${module.name}`;

//   // Instagram: "Your Instagram Space Start Here" (same style as the other
//   // modules) instead of "Your Instagram Integration Space Start Here".
//   const panelModule = isInstagram ? { ...module, name: header.title } : module;

//   // No min-h-screen here (the old crm-page wrapper forced a full-screen height
//   // inside the already-scrolling content area, which made this page scroll).
//   return (
//     <div className={extraPadding}>
//     <div className="bg-gray-50 px-4 py-2 text-gray-900 sm:px-6 lg:px-8">
//       <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//         <div className="min-w-0">
//           <h1 className="crm-title">
//             {header.title}
//           </h1>
//           {header.subtitle && (
//             <p className="crm-subtitle">{header.subtitle}</p>
//           )}
//         </div>

//         {showHeaderButton && (
//           <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
//             {moduleId === "customers" && (
//               <button
//                 type="button"
//                 onClick={finish}
//                 className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-green-500 bg-white px-6 text-[14px] font-bold text-green-600 transition hover:bg-green-50 sm:w-auto"
//               >
//                 <Upload size={16} />
//                 Import Customers
//               </button>
//             )}

//             <button
//               type="button"
//               onClick={handleAdd}
//               className="inline-flex h-11 w-full min-w-[138px] items-center justify-center rounded-xl bg-[#22C55E] px-6 text-[14px] font-bold text-white transition hover:bg-green-600 sm:w-auto"
//             >
//               {PRIMARY_LABELS[module.id]}
//             </button>
//           </div>
//         )}
//       </div>

//       <div>
//         <GuidePanel
//           module={panelModule}
//           video={video}
//           variant="page"
//           embedded
//           primaryLabel={primaryLabel}
//           onPrimary={primaryAction}
//         />
//       </div>

//       {showAddCustomer && (
//         <AddCustomer onClose={finish} onSuccess={async () => {}} />
//       )}
//     </div>
//     </div>
//   );
// }

// // key={moduleId} makes sure every module gets its own fresh "first visit" check
// export default function ModuleGuideGate({ moduleId, children }) {
//   return (
//     <Gate key={moduleId} moduleId={moduleId}>
//       {children}
//     </Gate>
//   );
// }



// src/components/guide/ModuleGuideGate.jsx
//
// First-visit guide for a module.
//
// Wrap a module's page in a route:
//   <ModuleGuideGate moduleId="templates"><Templates /></ModuleGuideGate>
//
// ONLY on the user's first login: the first module they open shows the "Your ___
// Space Start Here" panel with the user guide video. It counts as "seen" only
// when the user clicks the green button (if they leave by mistake - reload,
// another menu item - it shows again). Once finished it is saved on the ACCOUNT
// (user.moduleGuideSeenAt in the database), so it is NOT shown again for any
// other module, and NOT again in a new browser / device.
//
// After that every module opens normally. The user can always open the guide again
// from the ? icon in the top header (see ModuleGuideButton).
//
// All text, checklists and video links come from src/data/userGuide.js - the
// same data as Settings -> User Guide.
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";

import { useAuthStore } from "../../store/authStore";
import { useTourStore } from "../../store/tourStore";
import { userGuideModules } from "../../data/userGuide";
import GuidePanel from "./GuidePanel";
import AddCustomer from "../../pages/AddCustomer";
import {
  ADD_FORM_MODULES,
  ADMIN_ONLY_ADD,
  GUIDE_HEADERS,
  PRIMARY_LABELS,
  hasSeenGuide,
  markGuideSeen,
  parseYouTube,
  requestGuideOpen,
} from "./guideUtils";

// Modules that show the green button in the top-right of the header.
// Instagram has no add form of its own, but its button takes the user to
// Integrations (where the connect button lives) - so it looks like the others.
// AppLayout renders these routes full width (no padding around the page), so
// the guide needs the same padding the layout gives every other module.
// Without it the title sits ~28px higher than in Tasks, Leads, etc.
const FULL_WIDTH_GUIDE_MODULES = ["instagram"];
const LAYOUT_PADDING = "px-4 py-5 sm:px-6 sm:py-6 lg:px-8";

const HEADER_BUTTON_MODULES = ["customers", ...ADD_FORM_MODULES, "instagram"];

// The Instagram connect card lives on Settings -> Security (not on the
// Integrations page), so the Instagram guide buttons just open that page.
// Modules that must open directly, without the first-visit demo video.
// The Instagram conversations page opens straight to the inbox.
const NO_GUIDE_MODULES = ["instagram"];

const INSTAGRAM_PAGE = "/settings/security";

function Gate({ moduleId, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const tourActive = useTourStore((state) => state.active);

  const userId = user?.id ?? user?._id ?? user?.email;

  const module = useMemo(
    () => userGuideModules.find((item) => item.id === moduleId),
    [moduleId]
  );
  const video = useMemo(() => parseYouTube(module?.video), [module]);

  // Decided when the module is opened. The panel stays up until the user
  // clicks the green button - only then is it saved as "seen".
  const [show, setShow] = useState(
    () => Boolean(userId && module && video && !tourActive && !hasSeenGuide(user))
  );

  // Customers first visit: add-customer form opens from the panel
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  if (NO_GUIDE_MODULES.includes(moduleId)) return children;

  if (!show || !module || !video) return children;

  const finish = () => {
    markGuideSeen(); // saved on the account -> never shown again
    setShow(false);
  };

  const handleContinue = () => {
    finish();

    // e.g. Instagram guide: the connect button lives in Integrations
    if (module.path && module.path !== location.pathname) navigate(module.path);
  };

  // First visit for every module: the module's own header, a compact guide
  // below it and NO Skip button. The green "+ Add ..." button opens the add
  // form; adding OR cancelling ends the guide and the module page is shown.
  const header = GUIDE_HEADERS[moduleId] || { title: module.name, subtitle: "" };
  const isAdmin = user?.role === "ADMIN";
  const isInstagram = moduleId === "instagram";

  const hasAddForm =
    moduleId === "customers" || ADD_FORM_MODULES.includes(moduleId);
  const canAdd = hasAddForm && (isAdmin || !ADMIN_ONLY_ADD.includes(moduleId));

  // Instagram: always show the top button (it opens the Security page)
  const showHeaderButton =
    HEADER_BUTTON_MODULES.includes(moduleId) && (canAdd || isInstagram);

  const handleInstagram = () => {
    finish();
    navigate(INSTAGRAM_PAGE);
  };

  const extraPadding = FULL_WIDTH_GUIDE_MODULES.includes(moduleId)
    ? LAYOUT_PADDING
    : "";

  const handleAdd = () => {
    if (moduleId === "customers") {
      setShowAddCustomer(true);
      return;
    }

    // Instagram: go to the page with the Instagram connect button
    if (isInstagram) {
      handleInstagram();
      return;
    }

    // the module page opens its own add form as soon as it appears
    requestGuideOpen(moduleId);
    finish();
  };

  // modules with an add form: open it. Others (e.g. Backup): the old behaviour.
  const primaryAction = isInstagram
    ? handleInstagram
    : canAdd
    ? handleAdd
    : hasAddForm
    ? finish
    : handleContinue;

  // Instagram: shorter label on the bottom button so "Explore How its work"
  // stays on the same row (right side) like every other module. The top
  // button keeps the full "+ Add Instagram Integration" text.
  const primaryLabel =
    hasAddForm && !canAdd
      ? "Got it"
      : isInstagram
      ? "+ Add Instagram"
      : PRIMARY_LABELS[module.id] || `Open ${module.name}`;

  // Instagram: "Your Instagram Space Start Here" (same style as the other
  // modules) instead of "Your Instagram Integration Space Start Here".
  const panelModule = isInstagram ? { ...module, name: header.title } : module;

  // No min-h-screen here (the old crm-page wrapper forced a full-screen height
  // inside the already-scrolling content area, which made this page scroll).
  return (
    <div className={extraPadding}>
    <div className="bg-gray-50 py-2 text-gray-900">
      <div className="mb-12 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="crm-title">
            {header.title}
          </h1>
          {header.subtitle && (
            <p className="crm-subtitle">{header.subtitle}</p>
          )}
        </div>

        {showHeaderButton && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {moduleId === "customers" && (
              <button
                type="button"
                onClick={finish}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-green-500 bg-white px-6 text-[14px] font-bold text-green-600 transition hover:bg-green-50 sm:w-auto"
              >
                <Upload size={16} />
                Import Customers
              </button>
            )}

            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex h-11 w-full min-w-[138px] items-center justify-center rounded-xl bg-[#22C55E] px-6 text-[14px] font-bold text-white transition hover:bg-green-600 sm:w-auto"
            >
              {PRIMARY_LABELS[module.id]}
            </button>
          </div>
        )}
      </div>

      <div>
        <GuidePanel
          module={panelModule}
          video={video}
          variant="page"
          embedded
          primaryLabel={primaryLabel}
          onPrimary={primaryAction}
        />
      </div>

      {showAddCustomer && (
        <AddCustomer onClose={finish} onSuccess={async () => {}} />
      )}
    </div>
    </div>
  );
}

// key={moduleId} makes sure every module gets its own fresh "first visit" check
export default function ModuleGuideGate({ moduleId, children }) {
  return (
    <Gate key={moduleId} moduleId={moduleId}>
      {children}
    </Gate>
  );
}