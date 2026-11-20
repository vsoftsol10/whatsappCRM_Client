import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
} from "lucide-react";

export default function EmployeeStats({
  totalEmployees,
  activeEmployees,
  inactiveEmployees,
  adminEmployees,
}) {
  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: Users,
    },
    {
      title: "Active",
      value: activeEmployees,
      icon: UserCheck,
    },
    {
      title: "Inactive",
      value: inactiveEmployees,
      icon: UserX,
    },
    {
      title: "Admins",
      value: adminEmployees,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                {stat.title}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {stat.value}
              </p>
            </div>

            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <Icon size={22} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
