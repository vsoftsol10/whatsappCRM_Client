import { useAuthStore } from "../../store/authStore";
import {
  User,
  Mail,
  Building2,
  Shield,
} from "lucide-react";

function ProfileSettings() {
  const { user } = useAuthStore();

  return (
    <div className="crm-page bg-slate-50">

      {/* Header */}

      <div className="mb-8">
        <h1 className="crm-title text-slate-900">
          Profile Settings
        </h1>

        <p className="mt-2 text-slate-500">
          View your personal account information.
        </p>
      </div>

      {/* Main Card */}

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

        {/* Banner */}

        <div className="h-32 bg-gradient-to-r from-[#25D366] via-[#25D366] to-[#128C7E]" />

        <div className="relative px-8 pb-8">

          {/* Avatar */}

          <div className="-mt-14 flex justify-center">

            <div className="flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-white bg-[#25D366] text-5xl font-bold text-black shadow-lg">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

          </div>

          {/* User Name */}

          <div className="mt-5 text-center">

            <h2 className="text-3xl font-bold text-slate-900">
              {user?.name || "-"}
            </h2>

            <p className="mt-2 text-slate-500">
              {user?.email || "-"}
            </p>

          </div>

          {/* Information */}

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* Full Name */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <User size={16} />
                Full Name
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                {user?.name || "-"}
              </div>

            </div>

            {/* Email */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Mail size={16} />
                Email Address
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium break-all">
                {user?.email || "-"}
              </div>

            </div>

            {/* Department */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Building2 size={16} />
                Department
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium">
                {user?.department || "-"}
              </div>

            </div>

            {/* Role */}

            <div>

              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                <Shield size={16} />
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

      </div>

    </div>
  );
}

export default ProfileSettings;