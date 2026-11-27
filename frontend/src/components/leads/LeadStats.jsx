
// import { Users, UserPlus, PhoneCall, Trophy } from "lucide-react";

// export default function LeadStats({
//   totalLeads,
//   newLeads,
//   contactedLeads,
//   wonLeads,
// }) {
//   const stats = [
//     { title: "Total Leads", value: totalLeads, icon: Users },
//     { title: "New", value: newLeads, icon: UserPlus },
//     { title: "Contacted", value: contactedLeads, icon: PhoneCall },
//     { title: "Won", value: wonLeads, icon: Trophy },
//   ];

//   return (
//     <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 xl:gap-5">
//       {stats.map((stat) => {
//         const Icon = stat.icon;

//         return (
//           <div
//             key={stat.title}
//             className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
//           >
//             <div className="min-w-0">
//               <p className="text-xs font-medium text-slate-500">
//                 {stat.title}
//               </p>

//               <p className="mt-2 text-3xl font-bold text-slate-900">
//                 {stat.value ?? 0}
//               </p>
//             </div>

//             <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
//               <Icon size={20} className="text-green-500" />
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }




import { Users, UserPlus, PhoneCall, Trophy } from "lucide-react";

export default function LeadStats({
  totalLeads,
  newLeads,
  contactedLeads,
  wonLeads,
}) {
  const stats = [
    { title: "Total Leads", value: totalLeads, icon: Users },
    { title: "New", value: newLeads, icon: UserPlus },
    { title: "Contacted", value: contactedLeads, icon: PhoneCall },
    { title: "Won", value: wonLeads, icon: Trophy },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 xl:gap-5">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:justify-between sm:gap-3 sm:p-5"
          >
            <div className="contents sm:block sm:min-w-0">
              <p className="col-start-1 row-start-1 min-h-[2rem] text-xs font-medium text-slate-500 sm:min-h-0">
                {stat.title}
              </p>

              <p className="col-span-2 row-start-2 text-2xl font-bold text-slate-900 sm:mt-2 sm:text-3xl">
                {stat.value ?? 0}
              </p>
            </div>

            <div className="col-start-2 row-start-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100">
              <Icon size={20} className="text-green-500" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

