import { Link } from "react-router-dom";
import { Lock, ChevronRight } from "lucide-react";

function SecuritySettings() {
  return (
    <div className="crm-page bg-slate-50">

      {/* Header */}

      <div className="mb-8">
        <h1 className="crm-title text-slate-900">
          Security Settings
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your account password and security settings.
        </p>
      </div>

      {/* Security Card */}

      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">

            <div className="rounded-2xl bg-[#DCF8C6] p-4">

              <Lock
                size={28}
                className="text-[#25D366]"
              />

            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Password & Security
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Keep your account secure by updating your password regularly.
              </p>

            </div>

          </div>

          <Link
            to="/change-password"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-semibold text-black transition hover:bg-[#128C7E]"
          >
            Change Password

            <ChevronRight size={18} />
          </Link>

        </div>

      </div>

    </div>
  );
}

export default SecuritySettings;