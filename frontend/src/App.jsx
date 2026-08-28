import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useAuthStore } from "./store/authStore";

import AppLayout from "./layouts/AppLayout";
import SaasSupportPage from "./pages/settings/SaasSupportPage";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ManageEmployees from "./pages/ManageEmployees";
import Customers from "./pages/Customers";
import Leads from "./pages/Leads";
import Campaigns from "./pages/Campaigns";
import TicketsPage from "./pages/TicketsPage";
import Conversations from "./pages/Conversations";
import Tasks from "./pages/Task";
//import Products from "./pages/Products";
//import DealsPage from "./pages/DealsPage";
import Settings from "./pages/settings/Settings";
import CustomerProfile from "./pages/CustomerProfile";
import CampaignDetails from "./pages/CampaignDetails";
import Templates from "./pages/Templates";

import AuditLogs from "./pages/settings/AuditLogs";
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
import BillingSubscription from "./pages/settings/BillingSubscription";
import Plans from "./pages/settings/Plans";


function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/login"
          element={
            !isAuthenticated ? (
              <Login />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          {/* LAYOUT */}
          <Route element={<AppLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* CRM */}
            <Route
              path="/conversations"
              element={<Conversations />}
            />

            <Route path="/customers" element={<Customers />} />

            <Route
              path="/customers/add"
              element={<AddCustomer />}
            />


            <Route
              path="/customers/:id"
              element={<CustomerProfile />}
            />

            <Route
              path="/campaigns/:id"
              element={<CampaignDetails />}
            />



            <Route path="/leads" element={<Leads />} />

            <Route path="/campaigns" element={<Campaigns />} />

            <Route path="/templates" element={<Templates />} />

            <Route path="/tasks" element={<Tasks />} />

            <Route path="/tickets" element={<TicketsPage />} />

            <Route
              path="/settings"
              element={<Navigate to="/settings/profile" replace />}
            />

            <Route
              path="/settings/profile"
              element={<ProfileSettings />}
            />

            <Route
              path="/settings/security"
              element={<SecuritySettings />}
            />

            <Route
              path="/settings/billing"
              element={<BillingSubscription />}
            />

            <Route
              path="/settings/plans"
              element={<Plans />}
            />

            <Route
              path="/change-password"
              element={<ChangePassword />}
            />

            {/* ADMIN ROUTES */}
            <Route element={<AdminRoute />}>
              <Route
                path="/employees"
                element={<ManageEmployees />}
              />


              <Route
                path="/employees/edit/:id"
                element={<EditEmployee />}
              />

              <Route path="/employees/:id" element={<ViewEmployee />} />

              <Route
                path="/settings/support"
                element={<SaasSupportPage />}
              />

              <Route
                path="/settings/audit-logs"
                element={<AuditLogs />}
              />

            </Route>
          </Route>
        </Route>

        {/* ROOT */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;