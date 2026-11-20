import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";

import { useAuthStore } from "./store/authStore";

// Pages that are needed straight away (login screen + route guards)
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import FeatureRoute from "./components/FeatureRoute";

// ======================================================
// LAZY LOADING
// ------------------------------------------------------
// Every page below is downloaded only when it is opened,
// so the first load (login screen) is much smaller.
// Used in the routes exactly like before:  <Dashboard />
// See src/utils/lazyWithRetry.js
// ======================================================
import { lazyPage } from "./utils/lazyWithRetry";

const AppLayout = lazyPage(() => import("./layouts/AppLayout"), { fullScreen: true });
const SettingsLayout = lazyPage(() => import("./layouts/SettingsLayout"));
const SaasSupportPage = lazyPage(() => import("./pages/settings/SaasSupportPage"));
const UserGuide = lazyPage(() => import("./pages/settings/UserGuide"));
const Integrations = lazyPage(() => import("./pages/settings/Integrations"));
const Dashboard = lazyPage(() => import("./pages/Dashboard"));
const ManageEmployees = lazyPage(() => import("./pages/ManageEmployees"));
const Customers = lazyPage(() => import("./pages/Customers"));
const Leads = lazyPage(() => import("./pages/Leads"));
const Campaigns = lazyPage(() => import("./pages/Campaigns"));
const TicketsPage = lazyPage(() => import("./pages/TicketsPage"));
const Conversations = lazyPage(() => import("./pages/Conversations"));
const FacebookConversations = lazyPage(() => import("./pages/FacebookConversations"));
const InstagramConversations = lazyPage(() => import("./pages/InstagramConversations"));
const Tasks = lazyPage(() => import("./pages/Task"));
const CustomerProfile = lazyPage(() => import("./pages/CustomerProfile"));
const CampaignDetails = lazyPage(() => import("./pages/CampaignDetails"));
const Templates = lazyPage(() => import("./pages/Templates"));
const Services = lazyPage(() => import("./pages/Services"));
const Proposals = lazyPage(() => import("./pages/Proposals"));
const ProposalBuilder = lazyPage(() => import("./pages/ProposalBuilder"));
const AuditLogs = lazyPage(() => import("./pages/settings/AuditLogs"));
const AiAutoReply = lazyPage(() => import("./pages/settings/AiAutoReply"));
const KnowledgeBase = lazyPage(() => import("./pages/settings/KnowledgeBase"));
const AddCustomer = lazyPage(() => import("./pages/AddCustomer"));
const EditEmployee = lazyPage(() => import("./pages/EditEmployee"));
const ViewEmployee = lazyPage(() => import("./pages/ViewEmployee"));
const ForgotPassword = lazyPage(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyPage(() => import("./pages/ResetPassword"));
const ChangePassword = lazyPage(() => import("./pages/settings/ChangePassword"));
const ProfileSettings = lazyPage(() => import("./pages/settings/ProfileSettings"));
const SecuritySettings = lazyPage(() => import("./pages/settings/SecuritySettings"));
const Plans = lazyPage(() => import("./pages/settings/Plans"));
const Backup = lazyPage(() => import("./pages/Backup"));


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