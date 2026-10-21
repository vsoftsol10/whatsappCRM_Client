
// import React from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// import { useAuthStore } from "./store/authStore";

// import AppLayout from "./layouts/AppLayout";
// import SaasSupportPage from "./pages/settings/SaasSupportPage";
// import Integrations from "./pages/settings/Integrations";
// import Login from "./pages/Login";
// import Dashboard from "./pages/Dashboard";
// import ManageEmployees from "./pages/ManageEmployees";
// import Customers from "./pages/Customers";
// import Leads from "./pages/Leads";
// import Campaigns from "./pages/Campaigns";
// import TicketsPage from "./pages/TicketsPage";
// import Conversations from "./pages/Conversations";
// import FacebookConversations from "./pages/FacebookConversations";
// import InstagramConversations from "./pages/InstagramConversations";
// import Tasks from "./pages/Task";
// //import Products from "./pages/Products";
// //import DealsPage from "./pages/DealsPage";
// import Settings from "./pages/settings/Settings";
// import CustomerProfile from "./pages/CustomerProfile";
// import CampaignDetails from "./pages/CampaignDetails";
// import Templates from "./pages/Templates";

// import AuditLogs from "./pages/settings/AuditLogs";
// import AiAutoReply from "./pages/settings/AiAutoReply";
// import AddCustomer from "./pages/AddCustomer";
// // import EditCustomer from "./pages/EditCustomer";

// import EditEmployee from "./pages/EditEmployee";
// import ViewEmployee from "./pages/ViewEmployee";

// import ProtectedRoute from "./components/ProtectedRoute";
// import AdminRoute from "./components/AdminRoute";

// import ForgotPassword from "./pages/ForgotPassword";
// import ResetPassword from "./pages/ResetPassword";
// import ChangePassword from "./pages/settings/ChangePassword";

// import ProfileSettings from "./pages/settings/ProfileSettings";
// import SecuritySettings from "./pages/settings/SecuritySettings";
// import Plans from "./pages/settings/Plans";

// // BACKUP
// import Backup from "./pages/Backup";

// function App() {
//   const { isAuthenticated } = useAuthStore();

//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* =====================================================
//             LOGIN
//         ====================================================== */}
//         <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />

//         <Route path="/forgot-password" element={<ForgotPassword />} />

//         <Route path="/reset-password/:token" element={<ResetPassword />} />

//         {/* =====================================================
//             PROTECTED ROUTES
//         ====================================================== */}
//         <Route element={<ProtectedRoute />}>
//           {/* =================================================
//               MAIN APP LAYOUT
//           ================================================== */}
//           <Route element={<AppLayout />}>
//             {/* =================================================
//                 DASHBOARD
//             ================================================== */}
//             <Route path="/dashboard" element={<Dashboard />} />

//             {/* =================================================
//                 CRM
//             ================================================== */}
//             <Route path="/conversations" element={<Conversations channel="WHATSAPP" key="WHATSAPP" />} />

//             <Route path="/facebook-conversations" element={<FacebookConversations />} />

//             <Route path="/instagram-conversations" element={<InstagramConversations />} />

//             <Route path="/customers" element={<Customers />} />

//             <Route path="/customers/add" element={<AddCustomer />} />

//             <Route path="/customers/:id" element={<CustomerProfile />} />

//             <Route path="/campaigns/:id" element={<CampaignDetails />} />

//             <Route path="/leads" element={<Leads />} />

//             <Route path="/campaigns" element={<Campaigns />} />

//             <Route path="/templates" element={<Templates />} />

//             <Route path="/tasks" element={<Tasks />} />

//             <Route path="/tickets" element={<TicketsPage />} />


//             {/* =================================================
//                 SETTINGS
//             ================================================== */}
//             <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />

//             <Route path="/settings/integrations" element={<Integrations />} />

//             <Route path="/settings/profile" element={<ProfileSettings />} />

//             <Route path="/settings/security" element={<SecuritySettings />} />

//             <Route path="/settings/plans" element={<Plans />} />

//             <Route path="/change-password" element={<ChangePassword />} />

//             {/* =================================================
//                 ADMIN ROUTES
//             ================================================== */}
//             <Route element={<AdminRoute />}>
//               <Route path="/employees" element={<ManageEmployees />} />

//               <Route path="/employees/edit/:id" element={<EditEmployee />} />

//               <Route path="/employees/:id" element={<ViewEmployee />} />

//               <Route path="/settings/support" element={<SaasSupportPage />} />

//               <Route path="/settings/audit-logs" element={<AuditLogs />} />

//               <Route path="/settings/ai-auto-reply" element={<AiAutoReply />} />
//               <Route path="/backup" element={<Backup />} />
//             </Route>
//           </Route>
//         </Route>

//         {/* =====================================================
//             ROOT
//         ====================================================== */}
//         <Route path="/" element={<Navigate to="/dashboard" replace />} />

//         {/* =====================================================
//             FALLBACK
//         ====================================================== */}
//         <Route path="*" element={<Navigate to="/dashboard" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;





import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "./store/authStore";

import AppLayout from "./layouts/AppLayout";
import SettingsLayout from "./layouts/SettingsLayout";
import SaasSupportPage from "./pages/settings/SaasSupportPage";
import Integrations from "./pages/settings/Integrations";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ManageEmployees from "./pages/ManageEmployees";
import Customers from "./pages/Customers";
import Leads from "./pages/Leads";
import Campaigns from "./pages/Campaigns";
import TicketsPage from "./pages/TicketsPage";
import Conversations from "./pages/Conversations";
import FacebookConversations from "./pages/FacebookConversations";
import InstagramConversations from "./pages/InstagramConversations";
import Tasks from "./pages/Task";
//import Products from "./pages/Products";
//import DealsPage from "./pages/DealsPage";
import Settings from "./pages/settings/Settings";
import CustomerProfile from "./pages/CustomerProfile";
import CampaignDetails from "./pages/CampaignDetails";
import Templates from "./pages/Templates";

import AuditLogs from "./pages/settings/AuditLogs";
import AiAutoReply from "./pages/settings/AiAutoReply";
import AddCustomer from "./pages/AddCustomer";
// import EditCustomer from "./pages/EditCustomer";

import EditEmployee from "./pages/EditEmployee";
import ViewEmployee from "./pages/ViewEmployee";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/settings/ChangePassword";

import ProfileSettings from "./pages/settings/ProfileSettings";
import SecuritySettings from "./pages/settings/SecuritySettings";
import Plans from "./pages/settings/Plans";

// BACKUP
import Backup from "./pages/Backup";

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            LOGIN
        ====================================================== */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* =====================================================
            PROTECTED ROUTES
        ====================================================== */}
        <Route element={<ProtectedRoute />}>
          {/* =================================================
              MAIN APP LAYOUT
          ================================================== */}
          <Route element={<AppLayout />}>
            {/* =================================================
                DASHBOARD
            ================================================== */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* =================================================
                CRM
            ================================================== */}
            <Route path="/conversations" element={<Conversations channel="WHATSAPP" key="WHATSAPP" />} />

            <Route path="/facebook-conversations" element={<FacebookConversations />} />

            <Route path="/instagram-conversations" element={<InstagramConversations />} />

            <Route path="/customers" element={<Customers />} />

            <Route path="/customers/add" element={<AddCustomer />} />

            <Route path="/customers/:id" element={<CustomerProfile />} />

            <Route path="/campaigns/:id" element={<CampaignDetails />} />

            <Route path="/leads" element={<Leads />} />

            <Route path="/campaigns" element={<Campaigns />} />

            <Route path="/templates" element={<Templates />} />

            <Route path="/tasks" element={<Tasks />} />

            <Route path="/tickets" element={<TicketsPage />} />


            {/* =================================================
                SETTINGS
                One sidebar link -> one page with tabs (SettingsLayout)
            ================================================== */}
            <Route path="/settings" element={<Navigate to="/settings/security" replace />} />

            <Route path="/settings/profile" element={<ProfileSettings />} />

            <Route path="/settings/plans" element={<Plans />} />

            <Route path="/change-password" element={<ChangePassword />} />

            {/* old URL kept so existing bookmarks still work */}
            <Route path="/backup" element={<Navigate to="/settings/backup" replace />} />

            <Route element={<SettingsLayout />}>
              <Route path="/settings/security" element={<SecuritySettings />} />

              <Route path="/settings/integrations" element={<Integrations />} />

              {/* ADMIN-only tabs */}
              <Route element={<AdminRoute />}>
                <Route path="/settings/backup" element={<Backup />} />

                <Route path="/settings/support" element={<SaasSupportPage />} />

                <Route path="/settings/audit-logs" element={<AuditLogs />} />

                <Route path="/settings/ai-auto-reply" element={<AiAutoReply />} />
              </Route>
            </Route>

            {/* =================================================
                ADMIN ROUTES
            ================================================== */}
            <Route element={<AdminRoute />}>
              <Route path="/employees" element={<ManageEmployees />} />

              <Route path="/employees/edit/:id" element={<EditEmployee />} />

              <Route path="/employees/:id" element={<ViewEmployee />} />
            </Route>
          </Route>
        </Route>

        {/* =====================================================
            ROOT
        ====================================================== */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* =====================================================
            FALLBACK
        ====================================================== */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

