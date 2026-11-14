// src/components/PlanUsageCard.jsx
//
// "What your plan includes and how much you have used" (values set in Super Admin).
import usePlanFeatures from "../hooks/usePlanFeatures";

const LIMITS = [
  { key: "users", label: "Users" },
  { key: "customers", label: "Customers" },
  { key: "campaigns", label: "Campaigns" },
  { key: "templates", label: "Templates" },
  { key: "facebook", label: "Facebook Pages" },
  { key: "instagram", label: "Instagram accounts" },
  { key: "websiteIntegration", label: "Website integrations" },
  { key: "appIntegration", label: "App integrations" },
];

const MODULES = [
  { key: "leads", label: "Leads" },
  { key: "services", label: "Services" },
  { key: "proposals", label: "Proposals" },
  { key: "tasks", label: "Tasks" },
  { key: "tickets", label: "Tickets" },
  { key: "aiAutoReply", label: "AI Auto-Reply" },
  { key: "knowledgeBase", label: "Knowledge Base" },
  { key: "autoBackup", label: "Automatic Backup" },
  { key: "auditLog", label: "Audit Logs" },
];

export default function PlanUsageCard() {
  const { features, usage, planName, loaded } = usePlanFeatures();

  if (!loaded || !features) return null;

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">
          What your plan includes
        </h2>
        {planName && (
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {planName}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LIMITS.map(({ key, label }) => {
          const entry = features[key];
          const used = usage?.[key] ?? 0;

          if (entry && entry.enabled === false) {
            return (
              <div key={key}>
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="mt-1 text-sm text-slate-400">Not included</p>
              </div>
            );
          }

          const limit = entry?.limit ?? null;
          const percent =
            limit && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

          return (
            <div key={key}>
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-slate-700">{label}</p>
                <p className="text-sm text-slate-500">
                  {used} / {limit === null ? "Unlimited" : limit}
                </p>
              </div>

              {limit !== null && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      percent >= 100 ? "bg-red-500" : percent >= 80 ? "bg-amber-500" : "bg-[#25D366]"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
        {MODULES.map(({ key, label }) => {
          const on = features[key]?.enabled !== false;

          return (
            <span
              key={key}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                on ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400 line-through"
              }`}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
