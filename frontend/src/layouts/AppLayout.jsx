// import { useState } from "react";
// import { Outlet, useLocation } from "react-router-dom";
// import Sidebar from "../components/Sidebar";
// import TopHeader from "../components/header/TopHeader";

// function AppLayout() {
//   const location = useLocation();
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   const fullWidthPages = [
//     "/conversations",
//     "/tickets",
//     "/settings",
//   ];

//   const isFullWidthPage = fullWidthPages.includes(location.pathname);

//   return (
//     <div className="h-screen overflow-hidden bg-gray-100">
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


import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopHeader from "../components/header/TopHeader";
import { useAuthStore } from "../store/authStore";

function AppLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchMe = useAuthStore((state) => state.fetchMe);

  // Top up the logged-in user with the latest info (company name, etc.)
  // once per app session, without forcing a re-login.
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const fullWidthPages = [
    "/conversations",
    "/tickets",
    "/settings",
  ];

  const isFullWidthPage = fullWidthPages.includes(location.pathname);

  return (
    <div className="h-screen overflow-hidden bg-gray-100">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex h-screen min-w-0 flex-col lg:ml-72">
        <TopHeader
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <main
          className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 ${
            isFullWidthPage ? "" : "px-4 py-5 sm:px-5 sm:py-6"
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
