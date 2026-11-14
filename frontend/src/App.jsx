

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom"; // CHANGED (added useSearchParams)

import { useAuthStore } from "./store/authStore";

import AppLayout from "./layouts/AppLayout";
import SettingsLayout from "./layouts/SettingsLayout";
import SaasSupportPage from "./pages/settings/SaasSupportPage";
import UserGuide from "./pages/settings/UserGuide";
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
import Services from "./pages/Services";
import Proposals from "./pages/Proposals";
import ProposalBuilder from "./pages/ProposalBuilder";

import AuditLogs from "./pages/settings/AuditLogs";
import AiAutoReply from "./pages/settings/AiAutoReply";
import KnowledgeBase from "./pages/settings/KnowledgeBase";
import AddCustomer from "./pages/AddCustomer";
// import EditCustomer from "./pages/EditCustomer";

import EditEmployee from "./pages/EditEmployee";
import ViewEmployee from "./pages/ViewEmployee";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import FeatureRoute from "./components/FeatureRoute";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/settings/ChangePassword";

import ProfileSettings from "./pages/settings/ProfileSettings";
import SecuritySettings from "./pages/settings/SecuritySettings";
import Plans from "./pages/settings/Plans";

// BACKUP
import Backup from "./pages/Backup";


// ======================================================
// NEW: LOGIN ROUTE
// ------------------------------------------------------
// The employee e-mail links to /login?company=XXXX.
// If another user (e.g. the company admin) is still logged
// in on the SAME browser, the old code redirected straight
// to the dashboard, so the new employee never saw the login
// page.
//
// Now: when the page is opened with ?company=... and an old
// session exists, the old session is cleared ONCE and the
// page reloads, so the login form is shown.
// Plain /login while logged in still goes to the dashboard.
// ======================================================
const LoginRoute = () => {
  const { isAuthenticated } = useAuthStore();
  const [searchParams] = useSearchParams();

  const isInviteLink = !!searchParams.get("company");

  // Decided only once, when this page is first opened.
  // (After a successful login the URL still has ?company=...,
  //  so without this the new user would be logged out again.)
  const [mustResetSession] = React.useState(
    () => isInviteLink && isAuthenticated
  );

  React.useEffect(() => {
    if (mustResetSession) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Full reload clears every store, so the new user never
      // sees the previous user's data. Same URL (keeps ?company=)
      window.location.replace(
        window.location.pathname + window.location.search
      );
    }
  }, [mustResetSession]);

  // Old session is being cleared - render nothing for a moment
  if (mustResetSession) return null;

  return !isAuthenticated ? (
    <Login />
  ) : (
    <Navigate to="/dashboard" replace />
  );
};


function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* =====================================================
            LOGIN
        ====================================================== */}
        {/* CHANGED: now uses LoginRoute */}
        <Route path="/login" element={<LoginRoute />} />

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

            <Route path="/facebook-conversations" element={<FeatureRoute feature="facebook"><FacebookConversations /></FeatureRoute>} />

            <Route path="/instagram-conversations" element={<FeatureRoute feature="instagram"><InstagramConversations /></FeatureRoute>} />

            <Route path="/customers" element={<Customers />} />

            <Route path="/customers/add" element={<AddCustomer />} />

            <Route path="/customers/:id" element={<CustomerProfile />} />

            <Route path="/campaigns/:id" element={<FeatureRoute feature="campaigns"><CampaignDetails /></FeatureRoute>} />

            <Route path="/leads" element={<FeatureRoute feature="leads"><Leads /></FeatureRoute>} />

            <Route path="/campaigns" element={<FeatureRoute feature="campaigns"><Campaigns /></FeatureRoute>} />

            <Route path="/templates" element={<FeatureRoute feature="templates"><Templates /></FeatureRoute>} />

            <Route path="/services" element={<FeatureRoute feature="services"><Services /></FeatureRoute>} />

            <Route path="/proposals" element={<FeatureRoute feature="proposals"><Proposals /></FeatureRoute>} />

            <Route path="/proposals/new" element={<FeatureRoute feature="proposals"><ProposalBuilder /></FeatureRoute>} />

            <Route path="/proposals/:id/edit" element={<FeatureRoute feature="proposals"><ProposalBuilder /></FeatureRoute>} />

            <Route path="/tasks" element={<FeatureRoute feature="tasks"><Tasks /></FeatureRoute>} />

            <Route path="/tickets" element={<FeatureRoute feature="tickets"><TicketsPage /></FeatureRoute>} />


            {/* =================================================
                SETTINGS
                One sidebar link -> one page with tabs (SettingsLayout)
            ================================================== */}
            <Route path="/settings" element={<Navigate to="/settings/security" replace />} />

            <Route path="/settings/profile" element={<ProfileSettings />} />

            {/* old URL kept so existing links still work */}
            <Route path="/settings/plans" element={<Navigate to="/plans" replace />} />

            <Route path="/change-password" element={<ChangePassword />} />

            {/* old URL kept so existing bookmarks still work */}
            <Route path="/backup" element={<Navigate to="/settings/backup" replace />} />

            <Route element={<SettingsLayout />}>
              <Route path="/settings/security" element={<SecuritySettings />} />

              <Route path="/settings/integrations" element={<Integrations />} />

              <Route path="/settings/user-guide" element={<UserGuide />} />

              {/* ADMIN-only tabs */}
              <Route element={<AdminRoute />}>
                <Route path="/settings/backup" element={<Backup />} />

                <Route path="/settings/support" element={<SaasSupportPage />} />

                <Route path="/settings/audit-logs" element={<FeatureRoute feature="auditLog"><AuditLogs /></FeatureRoute>} />

                <Route path="/settings/ai-auto-reply" element={<FeatureRoute feature="aiAutoReply"><AiAutoReply /></FeatureRoute>} />
                <Route path="/settings/knowledge-base" element={<FeatureRoute feature="knowledgeBase"><KnowledgeBase /></FeatureRoute>} />
              </Route>
            </Route>

            {/* =================================================
                ADMIN ROUTES
            ================================================== */}
            <Route element={<AdminRoute />}>
              <Route path="/plans" element={<Plans />} />

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