import {
  Archive,
  CheckCircle2,
  Database,
} from "lucide-react";

const BackupStats = ({ backups = [] }) => {
  const totalBackups = backups.length;

  const completedBackups = backups.filter(
    (backup) => backup.status === "COMPLETED"
  ).length;

  const latestBackup = backups.length > 0 ? backups[0] : null;

  const formatDate = (date) => {
    if (!date) return "No backup yet";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const stats = [
    {
      title: "Total Backups",
      value: totalBackups,
      description: "All created backups",
      icon: Archive,
    },
    {
      title: "Completed",
      value: completedBackups,
      description: "Successfully completed",
      icon: CheckCircle2,
    },
    {
      title: "Latest Backup",
      value: latestBackup ? formatDate(latestBackup.createdAt) : "—",
      description: latestBackup
        ? latestBackup.fileName || "Manual backup"
        : "No backup created",
      icon: Database,
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>

                <h3 className="mt-2 text-2xl font-bold text-gray-900">
                  {stat.value}
                </h3>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <Icon className="h-5 w-5 text-green-600" />
              </div>
            </div>

            <p
              className="mt-3 truncate text-xs text-gray-500"
              title={stat.description}
            >
              {stat.description}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default BackupStats;