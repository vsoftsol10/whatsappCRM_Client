

// import { useEffect, useState } from "react";
// import { Outlet, useLocation } from "react-router-dom";
// import Sidebar from "../components/Sidebar";
// import TopHeader from "../components/header/TopHeader";
// import { useAuthStore } from "../store/authStore";
// import { usePlanFeatureStore } from "../store/planFeatureStore";
// import useChatSocket from "../hooks/useChatSocket";
// import ProductTour from "../components/tour/ProductTour";
// import SupportChatWidget from "../components/supportBot/SupportChatWidget";

// function AppLayout() {
//   const location = useLocation();
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   const fetchMe = useAuthStore((state) => state.fetchMe);
//   const fetchFeatures = usePlanFeatureStore((state) => state.fetchFeatures);
//   const resetFeatures = usePlanFeatureStore((state) => state.reset);

//   // Live chat updates (new messages, delivery ticks) on every page
//   useChatSocket();

//   // Product tour can open/close the mobile sidebar
//   useEffect(() => {
//     const onSidebar = (e) => setIsSidebarOpen(!!e.detail?.open);
//     window.addEventListener("vatup-tour:sidebar", onSidebar);
//     return () => window.removeEventListener("vatup-tour:sidebar", onSidebar);
//   }, []);

//   // Top up the logged-in user with the latest info (company name, etc.)
//   // once per app session, without forcing a re-login.
//   useEffect(() => {
//     fetchMe();
//   }, [fetchMe]);

//   // Plan switches and limits from Super Admin. Loaded once, and again when
//   // the user comes back to this tab (at most every 30 seconds), so a plan
//   // change shows up without logging in again.
//   useEffect(() => {
//     fetchFeatures();

//     let last = Date.now();

//     const onFocus = () => {
//       if (Date.now() - last < 30000) return;
//       last = Date.now();
//       fetchFeatures();
//     };

//     window.addEventListener("focus", onFocus);

//     return () => {
//       window.removeEventListener("focus", onFocus);
//       resetFeatures();
//     };
//   }, [fetchFeatures, resetFeatures]);

//   const fullWidthPages = [
//     "/conversations",
//     "/facebook-conversations",
//     "/instagram-conversations",
//     "/tickets",
//     "/settings",
//   ];

//   const isFullWidthPage = fullWidthPages.includes(location.pathname);

//   return (
//     <div className="h-screen overflow-hidden bg-gray-100">
//       <ProductTour />

//       {/* AI Support chatbot (only shows when Super Admin enabled it for this company) */}
//       <SupportChatWidget />

//       <Sidebar
//         isOpen={isSidebarOpen}
//         onClose={() => setIsSidebarOpen(false)}
//       />

//       <div className="flex h-screen min-w-0 flex-col lg:ml-72">
//         <TopHeader
//           onMenuClick={() => setIsSidebarOpen(true)}
//         />

//         <main
//           className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 ${
//             isFullWidthPage ? "" : "px-4 py-5 sm:px-5 sm:py-6"
//           }`}
//         >
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }

// export default AppLayout;



// import { useEffect, useState } from "react";
// import { Outlet, useLocation } from "react-router-dom";
// import Sidebar from "../components/Sidebar";
// import TopHeader from "../components/header/TopHeader";
// import { useAuthStore } from "../store/authStore";
// import { usePlanFeatureStore } from "../store/planFeatureStore";
// import useChatSocket from "../hooks/useChatSocket";
// import ProductTour from "../components/tour/ProductTour";
// import SupportChatWidget from "../components/supportBot/SupportChatWidget";

// function AppLayout() {
//   const location = useLocation();
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   const fetchMe = useAuthStore((state) => state.fetchMe);
//   const fetchFeatures = usePlanFeatureStore((state) => state.fetchFeatures);
//   const resetFeatures = usePlanFeatureStore((state) => state.reset);

//   // Live chat updates (new messages, delivery ticks) on every page
//   useChatSocket();

//   // Product tour can open/close the mobile sidebar
//   useEffect(() => {
//     const onSidebar = (e) => setIsSidebarOpen(!!e.detail?.open);
//     window.addEventListener("vatup-tour:sidebar", onSidebar);
//     return () => window.removeEventListener("vatup-tour:sidebar", onSidebar);
//   }, []);

//   // Top up the logged-in user with the latest info (company name, etc.)
//   // once per app session, without forcing a re-login.
//   useEffect(() => {
//     fetchMe();
//   }, [fetchMe]);

//   // Plan switches and limits from Super Admin. Loaded once, and again when
//   // the user comes back to this tab (at most every 30 seconds), so a plan
//   // change shows up without logging in again.
//   useEffect(() => {
//     fetchFeatures();

//     let last = Date.now();

//     const onFocus = () => {
//       if (Date.now() - last < 30000) return;
//       last = Date.now();
//       fetchFeatures();
//     };

//     window.addEventListener("focus", onFocus);

//     return () => {
//       window.removeEventListener("focus", onFocus);
//       resetFeatures();
//     };
//   }, [fetchFeatures, resetFeatures]);

//   const fullWidthPages = [
//     "/conversations",
//     "/facebook-conversations",
//     "/instagram-conversations",
//     "/tickets",
//     "/settings",
//   ];

//   const isFullWidthPage = fullWidthPages.includes(location.pathname);

//   return (
//     <div className="h-screen h-dvh overflow-hidden bg-gray-100">
//       <ProductTour />

//       {/* AI Support chatbot (only shows when Super Admin enabled it for this company) */}
//       <SupportChatWidget />

//       <Sidebar
//         isOpen={isSidebarOpen}
//         onClose={() => setIsSidebarOpen(false)}
//       />

//       <div className="flex h-screen h-dvh min-w-0 flex-col md:ml-56 lg:ml-64 xl:ml-72">
//         <TopHeader
//           onMenuClick={() => setIsSidebarOpen(true)}
//         />

//         <main
//           className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 ${
//             isFullWidthPage ? "" : "px-4 py-5 sm:px-5 sm:py-6"
//           }`}
//         >
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }

// export default AppLayout;



import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopHeader from "../components/header/TopHeader";
import { useAuthStore } from "../store/authStore";
import { usePlanFeatureStore } from "../store/planFeatureStore";
import useChatSocket from "../hooks/useChatSocket";
import ProductTour from "../components/tour/ProductTour";
import SupportChatWidget from "../components/supportBot/SupportChatWidget";

function AppLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchMe = useAuthStore((state) => state.fetchMe);
  const fetchFeatures = usePlanFeatureStore((state) => state.fetchFeatures);
  const resetFeatures = usePlanFeatureStore((state) => state.reset);

  // Live chat updates (new messages, delivery ticks) on every page
  useChatSocket();

  // Product tour can open/close the mobile sidebar
  useEffect(() => {
    const onSidebar = (e) => setIsSidebarOpen(!!e.detail?.open);
    window.addEventListener("vatup-tour:sidebar", onSidebar);
    return () => window.removeEventListener("vatup-tour:sidebar", onSidebar);
  }, []);

  // Top up the logged-in user with the latest info (company name, etc.)
  // once per app session, without forcing a re-login.
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Plan switches and limits from Super Admin. Loaded once, and again when
  // the user comes back to this tab (at most every 30 seconds), so a plan
  // change shows up without logging in again.
  useEffect(() => {
    fetchFeatures();

    let last = Date.now();

    const onFocus = () => {
      if (Date.now() - last < 30000) return;
      last = Date.now();
      fetchFeatures();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      resetFeatures();
    };
  }, [fetchFeatures, resetFeatures]);

  const fullWidthPages = [
    "/conversations",
    "/facebook-conversations",
    "/instagram-conversations",
  ];

  // Chat screens run edge-to-edge. EVERY other module gets the same space
  // from the sidebar, the header and the screen edges (same as the header:
  // 16px mobile / 24px tablet / 32px laptop).
  const isFullWidthPage = fullWidthPages.includes(location.pathname);

  // The pages used to add their own padding on top of the layout padding
  // (so each module had a different gap). Neutralise it here so the layout
  // is the only place that decides the spacing.
  const PAGE_RESET =
    "[&>div:not([role=status])]:min-h-0! [&>div:not([role=status])]:bg-transparent! [&>div:not([role=status])]:p-0!";

  return (
    <div className="h-screen h-dvh overflow-hidden bg-gray-100">
      <ProductTour />

      {/* AI Support chatbot (only shows when Super Admin enabled it for this company) */}
      <SupportChatWidget />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex h-screen h-dvh min-w-0 flex-col md:ml-56 lg:ml-64 xl:ml-72">
        <TopHeader
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 ${
            isFullWidthPage
              ? ""
              : `px-4 py-5 sm:px-6 sm:py-6 lg:px-8 ${PAGE_RESET}`
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;