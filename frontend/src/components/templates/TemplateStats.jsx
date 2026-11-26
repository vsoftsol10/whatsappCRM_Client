// import { FileText, CheckCircle, Layers, Clock } from "lucide-react";

// export default function TemplateStats({ templates = [] }) {
//   const countByStatus = (status) =>
//     templates.filter((template) => template.status === status).length;

//   const stats = [
//     { title: "Total Templates", value: templates.length, icon: Layers },
//     { title: "Draft", value: countByStatus("DRAFT"), icon: FileText },
//     { title: "Pending", value: countByStatus("PENDING"), icon: Clock },
//     { title: "Approved", value: countByStatus("APPROVED"), icon: CheckCircle },
//   ];

//   return (
//     <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//       {stats.map((stat) => {
//         const Icon = stat.icon;

//         return (
//           <div
//             key={stat.title}
//             className="flex items-start justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
//           >
//             <div>
//               <p className="text-xs font-medium text-slate-500">
//                 {stat.title}
//               </p>

//               <p className="mt-2 text-3xl font-bold text-slate-900">
//                 {stat.value}
//               </p>
//             </div>

//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
//               <Icon size={22} className="text-green-600" />
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }


import { FileText, CheckCircle, Layers, Clock } from "lucide-react";

export default function TemplateStats({ templates = [] }) {
  const countByStatus = (status) =>
    templates.filter((template) => template.status === status).length;

  const stats = [
    { title: "Total Templates", value: templates.length, icon: Layers },
    { title: "Draft", value: countByStatus("DRAFT"), icon: FileText },
    { title: "Pending", value: countByStatus("PENDING"), icon: Clock },
    { title: "Approved", value: countByStatus("APPROVED"), icon: CheckCircle },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 xl:gap-5">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">
                {stat.title}
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {stat.value}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <Icon size={22} className="text-green-600" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
