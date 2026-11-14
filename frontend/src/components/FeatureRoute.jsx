// src/components/FeatureRoute.jsx
//
// Opens the page only when the company's plan includes the feature.
//
//   <Route path="/leads" element={<FeatureRoute feature="leads"><Leads /></FeatureRoute>} />
import { Link, Outlet } from "react-router-dom";
import { Lock } from "lucide-react";
import usePlanFeatures from "../hooks/usePlanFeatures";
import { useAuthStore } from "../store/authStore";

const LABELS = {
  leads: "Leads",
  services: "Services",
  proposals: "Proposals",
  tasks: "Tasks",
  tickets: "Tickets",
  campaigns: "Campaigns",
  templates: "Templates",
  facebook: "Facebook Messenger",
  instagram: "Instagram",
  aiAutoReply: "AI Auto-Reply",
  knowledgeBase: "Knowledge Base",
  autoBackup: "Automatic Backup",
  auditLog: "Audit Logs",
};

export function FeatureLocked({ feature }) {
  const { planName } = usePlanFeatures();
  const isAdmin = useAuthStore((state) => state.user?.role === "ADMIN");
  const label = LABELS[feature] || "This feature";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Lock className="h-7 w-7" />
        </div>

        <h2 className="text-xl font-semibold text-slate-900">
          {label} is not in your plan
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {planName ? `Your ${planName} plan does not include ${label}. ` : ""}
          {isAdmin
            ? "Upgrade your plan to start using it."
            : "Please ask your company admin to upgrade the plan."}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {isAdmin && (
            <Link
              to="/plans"
              className="rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#128C7E]"
            >
              View plans
            </Link>
          )}

          <Link
            to="/dashboard"
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function FeatureRoute({ feature, children }) {
  const { can, loaded } = usePlanFeatures();

  if (!loaded) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">Loading...</div>
    );
  }

  if (!can(feature)) return <FeatureLocked feature={feature} />;

  return children ?? <Outlet />;
}
