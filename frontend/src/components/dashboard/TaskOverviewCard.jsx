// import {
//   ClipboardList,
//   CheckCircle2,
//   Clock3,
//   LoaderCircle,
//   Eye,
// } from "lucide-react";

// export default function TaskOverviewCard({ tasks }) {
//   const total = tasks?.total ?? 0;
//   const todo = tasks?.todo ?? 0;
//   const inProgress = tasks?.inProgress ?? 0;
//   const review = tasks?.review ?? 0;
//   const completed = tasks?.completed ?? 0;

//   const completion =
//     total > 0 ? Math.round((completed / total) * 100) : 0;

//   return (
//     <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

//       {/* Background Decoration */}
//       <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-100 blur-3xl opacity-60"></div>

//       {/* Header */}
//       <div className="relative flex items-center justify-between mb-6">
//         <div>
//           <h2 className="text-xl font-bold text-gray-900">
//             Task Overview
//           </h2>

//           <p className="text-sm text-gray-500 mt-1">
//             Current task progress
//           </p>
//         </div>

//         <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
//           <ClipboardList
//             size={28}
//             className="text-blue-600"
//           />
//         </div>
//       </div>

//       {/* Total */}
//       <div className="mb-6">
//         <p className="text-sm text-gray-500">
//           Total Tasks
//         </p>

//         <h1 className="mt-1 text-5xl font-bold text-gray-900">
//           {total}
//         </h1>
//       </div>

//       {/* Progress */}
//       <div className="mb-6">

//         <div className="mb-2 flex items-center justify-between text-sm">
//           <span className="text-gray-500">
//             Completion
//           </span>

//           <span className="font-semibold text-[#128C7E]">
//             {completion}%
//           </span>
//         </div>

//         <div className="h-3 overflow-hidden rounded-full bg-gray-200">

//           <div
//             className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700"
//             style={{
//               width: `${completion}%`,
//             }}
//           />

//         </div>

//       </div>

//       {/* Status List */}
//       <div className="space-y-3">

//         <StatusItem
//           icon={<Clock3 size={18} />}
//           iconBg="bg-blue-100"
//           color="text-blue-600"
//           label="Todo"
//           value={todo}
//         />

//         <StatusItem
//           icon={<LoaderCircle size={18} />}
//           iconBg="bg-[#DCF8C6]"
//           color="text-[#25D366]"
//           label="In Progress"
//           value={inProgress}
//         />

//         <StatusItem
//           icon={<Eye size={18} />}
//           iconBg="bg-purple-100"
//           color="text-purple-600"
//           label="Review"
//           value={review}
//         />

//         <StatusItem
//           icon={<CheckCircle2 size={18} />}
//           iconBg="bg-green-100"
//           color="text-[#128C7E]"
//           label="Completed"
//           value={completed}
//         />

//       </div>

//     </div>
//   );
// }

// function StatusItem({
//   icon,
//   label,
//   value,
//   color,
//   iconBg,
// }) {
//   return (
//     <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all duration-300 hover:bg-white hover:shadow-sm">

//       <div className="flex items-center gap-3">

//         <div
//           className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
//         >
//           <div className={color}>
//             {icon}
//           </div>
//         </div>

//         <span className="font-medium text-gray-700">
//           {label}
//         </span>

//       </div>

//       <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-800">
//         {value}
//       </span>

//     </div>
//   );
// }

import { ClipboardList, CheckCircle2, LoaderCircle, Eye } from "lucide-react";

export default function TaskOverviewCard({ tasks }) {
  const total = tasks?.total ?? 0;
  const todo = tasks?.todo ?? 0;
  const inProgress = tasks?.inProgress ?? 0;
  const review = tasks?.review ?? 0;
  const completed = tasks?.completed ?? 0;

  const completion = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Task Overview</h2>
          <p className="mt-1 text-sm text-slate-600">Current task progress</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-600">Total tasks</p>
          <p className="text-2xl font-bold leading-tight text-slate-900">{total}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-700">Completion</span>
          <span className="font-semibold text-[#159A4B]">{completion}%</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={completion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Task completion"
          className="h-2.5 overflow-hidden rounded-full bg-gray-200"
        >
          <div
            className="h-full rounded-full bg-[#22C55E] transition-all duration-700 motion-reduce:transition-none"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* Status list */}
      <ul className="space-y-3">
        <StatusItem icon={ClipboardList} iconBg="bg-blue-100" color="text-blue-600" label="Todo" value={todo} />
        <StatusItem icon={LoaderCircle} iconBg="bg-amber-100" color="text-amber-600" label="In Progress" value={inProgress} />
        <StatusItem icon={Eye} iconBg="bg-violet-100" color="text-violet-600" label="Review" value={review} />
        <StatusItem icon={CheckCircle2} iconBg="bg-green-100" color="text-green-600" label="Completed" value={completed} />
      </ul>
    </div>
  );
}

function StatusItem({ icon: Icon, label, value, color, iconBg }) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
          <Icon size={19} strokeWidth={1.8} className={color} />
        </span>
        <span className="font-medium text-slate-800">{label}</span>
      </div>

      <span className="min-w-8 rounded-lg bg-gray-100 px-2.5 py-1 text-center text-sm font-semibold text-slate-800">
        {value}
      </span>
    </li>
  );
}