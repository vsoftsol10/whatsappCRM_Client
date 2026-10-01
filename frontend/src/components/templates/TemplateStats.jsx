// import {
//   FileText,
//   CheckCircle,
//   XCircle,
//   Layers,
// } from "lucide-react";

// export default function TemplateStats({
//   templates = [],
// }) {
//   const totalTemplates = templates.length;

//   const draftTemplates = templates.filter(
//     (template) => template.status === "DRAFT"
//   ).length;

//   const activeTemplates = templates.filter(
//     (template) => template.status === "ACTIVE"
//   ).length;

//   const inactiveTemplates = templates.filter(
//     (template) => template.status === "INACTIVE"
//   ).length;

//   const stats = [
//     {
//       title: "Total Templates",
//       value: totalTemplates,
//       icon: Layers,
//     },
//     {
//       title: "Draft",
//       value: draftTemplates,
//       icon: FileText,
//     },
//     {
//       title: "Active",
//       value: activeTemplates,
//       icon: CheckCircle,
//     },
//     {
//       title: "Inactive",
//       value: inactiveTemplates,
//       icon: XCircle,
//     },
//   ];

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
//       {stats.map((stat) => {
//         const Icon = stat.icon;

//         return (
//           <div
//             key={stat.title}
//             className="
//               bg-white
//               rounded-2xl
//               border
//               border-gray-200
//               p-5
//               shadow-sm
//               transition-all
//               duration-200
//               hover:border-[#25D366]
//               hover:bg-[#DCF8C6]
//               hover:shadow-lg
//             "
//           >
//             <div className="flex items-start justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-500">
//                   {stat.title}
//                 </p>

//                 <h2 className="mt-3 text-3xl font-bold text-gray-900">
//                   {stat.value}
//                 </h2>
//               </div>

//               <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DCF8C6]">
//                 <Icon
//                   size={24}
//                   className="text-[#25D366]"
//                 />
//               </div>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }


import {
  FileText,
  CheckCircle,
  Layers,
  Clock,
} from "lucide-react";

export default function TemplateStats({
  templates = [],
}) {
  // Count templates by their real status
  const countByStatus = (status) =>
    templates.filter(
      (template) => template.status === status
    ).length;

  const totalTemplates = templates.length;
  const draftTemplates = countByStatus("DRAFT");
  const pendingTemplates = countByStatus("PENDING");
  const approvedTemplates = countByStatus("APPROVED");

  const stats = [
    {
      title: "Total Templates",
      value: totalTemplates,
      icon: Layers,
    },
    {
      title: "Draft",
      value: draftTemplates,
      icon: FileText,
    },
    {
      title: "Pending",
      value: pendingTemplates,
      icon: Clock,
    },
    {
      title: "Approved",
      value: approvedTemplates,
      icon: CheckCircle,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="
              bg-white
              rounded-2xl
              border
              border-gray-200
              p-5
              shadow-sm
              transition-all
              duration-200
              hover:border-[#25D366]
              hover:bg-[#DCF8C6]
              hover:shadow-lg
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>

                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                  {stat.value}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DCF8C6]">
                <Icon
                  size={24}
                  className="text-[#25D366]"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
