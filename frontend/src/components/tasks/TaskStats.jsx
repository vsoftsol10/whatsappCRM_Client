import {
  ClipboardList,
  ListTodo,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";

export default function TaskStats({ tasks = [] }) {
  const count = (status) =>
    tasks.filter((task) => task.status === status).length;

  const stats = [
    {
      title: "Total Tasks",
      value: tasks.length,
      icon: ClipboardList,
    },
    {
      title: "Todo",
      value: count("TODO"),
      icon: ListTodo,
    },
    {
      title: "In Progress",
      value: count("IN_PROGRESS"),
      icon: LoaderCircle,
    },
    {
      title: "Completed",
      value: count("COMPLETED"),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
      {stats.map(({ title, value, icon: Icon }) => (
        <div
          key={title}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">
                {title}
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-900">
                {value}
              </h2>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <Icon size={22} className="text-green-500" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
