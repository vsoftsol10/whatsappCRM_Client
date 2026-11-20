// // import GlobalSearch from "./GlobalSearch";
// // import NotificationButton from "./NotificationButton";
// // import ProfileMenu from "./ProfileMenu";
// // import { Menu } from "lucide-react";

// // function TopHeader({ onMenuClick }) {
// //   return (
// //     <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6 lg:h-20 lg:px-8">
// //       {/* Left */}
// //       <div className="flex min-w-0 flex-1 items-center gap-3">
// //         <button
// //           type="button"
// //           onClick={onMenuClick}
// //           className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-[#DCF8C6] lg:hidden"
// //           aria-label="Open sidebar"
// //         >
// //           <Menu size={20} />
// //         </button>

// //         <GlobalSearch />
// //       </div>

// //       {/* Right */}
// //       <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:ml-8 lg:gap-6">
// //         <NotificationButton />

// //         <div className="hidden h-10 w-px bg-gray-300 sm:block"></div>

// //         <ProfileMenu />
// //       </div>
// //     </header>
// //   );
// // }

// // export default TopHeader;


// import { useLocation } from "react-router-dom";
// import { Menu } from "lucide-react";
// import GlobalSearch from "./GlobalSearch";
// import NotificationButton from "./NotificationButton";
// import ProfileMenu from "./ProfileMenu";
// import { navGroups, settingsTabs } from "../../config/navigation";

// // Page title for the header: "Welcome" on the dashboard, otherwise the
// // name of the page you are on (Customers, Leads, Security ...).
// function usePageTitle() {
//   const { pathname } = useLocation();

//   if (pathname === "/dashboard" || pathname === "/") return "Welcome";

//   const pages = [
//     ...navGroups.flatMap((g) =>
//       g.items.flatMap((item) => (item.children ? item.children : [item]))
//     ),
//     ...settingsTabs,
//   ].filter((page) => page.path);

//   // Longest matching path wins, so /settings/security beats /settings
//   const match = pages
//     .filter((page) => pathname === page.path || pathname.startsWith(`${page.path}/`))
//     .sort((a, b) => b.path.length - a.path.length)[0];

//   return match?.name || "Vatup CRM";
// }

// function TopHeader({ onMenuClick }) {
//   const title = usePageTitle();

//   return (
//     <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
//       {/* Left: menu button (mobile) + page title */}
//       <div className="flex min-w-0 items-center gap-3">
//         <button
//           type="button"
//           onClick={onMenuClick}
//           className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-[#159A4B]/10 lg:hidden"
//           aria-label="Open sidebar"
//         >
//           <Menu size={20} />
//         </button>

//         <h1 className="hidden truncate text-2xl font-bold text-slate-900 sm:block lg:text-3xl">
//           {title}
//         </h1>
//       </div>

//       {/* Middle: search */}
//       <div className="flex min-w-0 flex-1 justify-center lg:px-6">
//         <GlobalSearch />
//       </div>

//       {/* Right: bell + profile */}
//       <div className="flex shrink-0 items-center gap-2 sm:gap-4">
//         <NotificationButton />

//         <div className="hidden h-9 w-px bg-gray-200 sm:block" />

//         <ProfileMenu />
//       </div>
//     </header>
//   );
// }

// export default TopHeader;

import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import GlobalSearch from "./GlobalSearch";
import NotificationButton from "./NotificationButton";
import ModuleGuideButton from "../guide/ModuleGuideButton";
import ProfileMenu from "./ProfileMenu";
import { navGroups, settingsTabs } from "../../config/navigation";
import useConversationStore from "../../store/conversationStore";
import { getConversationName } from "../../utils/conversationDisplay";

// Page title for the header: "Welcome" on the dashboard, otherwise the
// name of the page you are on (Customers, Leads, Security ...).
function usePageTitle() {
  const { pathname } = useLocation();
  const selectedConversation = useConversationStore((s) => s.selectedConversation);

  // On the WhatsApp page, show the name of the customer you are chatting with
  if (pathname === "/conversations" && selectedConversation) {
    return getConversationName(selectedConversation);
  }

  if (pathname === "/dashboard" || pathname === "/") return "Welcome";

  const pages = [
    ...navGroups.flatMap((g) =>
      g.items.flatMap((item) => (item.children ? item.children : [item]))
    ),
    ...settingsTabs,
  ].filter((page) => page.path);

  // Longest matching path wins, so /settings/security beats /settings
  const match = pages
    .filter((page) => pathname === page.path || pathname.startsWith(`${page.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return match?.name || "Vatup CRM";
}

function TopHeader({ onMenuClick }) {
  const title = usePageTitle();

  return (
    <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* Left: menu button (mobile) + page title */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-[#159A4B]/10 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <h1 className="hidden truncate text-2xl font-bold text-slate-900 sm:block lg:text-3xl">
          {title}
        </h1>
      </div>

      {/* Middle: search */}
      <div className="flex min-w-0 flex-1 justify-center lg:px-6">
        <GlobalSearch />
      </div>

      {/* Right: bell + profile */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <ModuleGuideButton />

        <NotificationButton />

        <div className="hidden h-9 w-px bg-gray-200 sm:block" />

        <ProfileMenu />
      </div>
    </header>
  );
}

export default TopHeader;