import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  Shield,
  Lock,
  ChevronRight,
} from "lucide-react";
import BillingSubscriptionCard from "./BillingSubscriptionCard";

function Settings() {
  const { user } = useAuthStore();

  return (
    <div className="crm-page bg-slate-50">

      {/* ================= HEADER ================= */}

      <div className="mb-8">
        <h1 className="crm-title text-slate-900">
          Settings
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your profile information and account security.
        </p>
      </div>

      {/* ================= MAIN GRID ================= */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* ================= LEFT PROFILE CARD ================= */}

        <div className="xl:col-span-1">

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            {/* Banner */}

            <div className="h-28 bg-gradient-to-r from-[#25D366] via-[#25D366] to-[#128C7E]"></div>

            <div className="relative px-6 pb-6">

              {/* Avatar */}

              <div className="-mt-12 flex justify-center">

                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-[#25D366] text-4xl font-bold text-black shadow-lg">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

              </div>

              {/* User */}

              <div className="mt-5 text-center">

                <h2 className="text-2xl font-bold text-slate-900">
                  {user?.name || "User"}
                </h2>

                <p className="mt-1 break-all text-sm text-slate-500">
                  {user?.email || "-"}
                </p>

              </div>

              {/* Info */}

              <div className="mt-8 space-y-4">

                {/* Department */}

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">

                  <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-[#DCF8C6] p-2">

                      <Building2
                        size={18}
                        className="text-[#25D366]"
                      />

                    </div>

                    <span className="text-sm text-slate-500">
                      Department
                    </span>

                  </div>

                  <span className="font-semibold text-slate-800">
                    {user?.department || "-"}
                  </span>

                </div>

                {/* Role */}

                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">

                  <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-green-100 p-2">

                      <Shield
                        size={18}
                        className="text-[#128C7E]"
                      />

                    </div>

                    <span className="text-sm text-slate-500">
                      Role
                    </span>

                  </div>

                  <span className="rounded-full bg-[#DCF8C6] px-3 py-1 text-xs font-semibold text-[#128C7E]">
                    {user?.role || "-"}
                  </span>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ================= RIGHT CONTENT ================= */}

        <div className="space-y-6 xl:col-span-2">
                    {/* ================= PROFILE INFORMATION ================= */}

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

            <div className="mb-8 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-900">
                  Profile Information
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your personal account information.
                </p>

              </div>

            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* Full Name */}

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">

                  <User size={16} />

                  Full Name

                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-800">
                  {user?.name || "-"}
                </div>

              </div>

              {/* Email */}

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">

                  <Mail size={16} />

                  Email Address

                </label>

                <div className="break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-800">
                  {user?.email || "-"}
                </div>

              </div>

              {/* Department */}

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">

                  <Building2 size={16} />

                  Department

                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-800">
                  {user?.department || "-"}
                </div>

              </div>

              {/* Role */}

              <div>

                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">

                  <ShieldCheck size={16} />

                  User Role

                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                  <span className="inline-flex rounded-full bg-[#DCF8C6] px-3 py-1 text-sm font-semibold text-[#128C7E]">
                    {user?.role || "-"}
                  </span>

                </div>

              </div>

            </div>

          </div>

                    {/* ================= SECURITY CARD ================= */}

          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-4">

                <div className="rounded-2xl bg-[#DCF8C6] p-4">

                  <Lock
                    size={26}
                    className="text-[#25D366]"
                  />

                </div>

                <div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Password & Security
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Keep your account secure by updating your password
                    regularly.
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

          <BillingSubscriptionCard />

        </div>

      </div>

    </div>
  );
}

export default Settings;
  