// import { ClipboardList, FolderOpen, LoaderCircle, CheckCircle2, Lock } from "lucide-react";

// // Resolved has its own card: it is a real status, so without it the
// // card numbers would not add up to "All Tickets".
// function TicketStats({ ticketCounts }) {
//   const stats = [
//     { key: "ALL", label: "All Tickets", count: ticketCounts.total, icon: ClipboardList },
//     { key: "OPEN", label: "Open", count: ticketCounts.open, icon: FolderOpen },
//     { key: "IN_PROGRESS", label: "In Progress", count: ticketCounts.inProgress, icon: LoaderCircle },
//     { key: "RESOLVED", label: "Resolved", count: ticketCounts.resolved, icon: CheckCircle2 },
//     { key: "CLOSED", label: "Closed", count: ticketCounts.closed, icon: Lock },
//   ];

//   return (
//     <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
//       {stats.map((item) => {
//         const Icon = item.icon;

//         return (
//           <div
//             key={item.key}
//             className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
//           >
//             <div className="min-w-0">
//               <p className="text-sm text-slate-500">{item.label}</p>

//               <p className="mt-2 text-4xl font-bold text-slate-900">
//                 {item.count}
//               </p>
//             </div>

//             <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100">
//               <Icon size={22} className="text-green-600" />
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// export default TicketStats;




import { ClipboardList, FolderOpen, LoaderCircle, CheckCircle2 } from "lucide-react";

// Resolved has its own card: it is a real status, so without it the
// card numbers would not add up to "All Tickets".
function TicketStats({ ticketCounts }) {
  const stats = [
    { key: "ALL", label: "All Tickets", count: ticketCounts.total, icon: ClipboardList },
    { key: "OPEN", label: "Open", count: ticketCounts.open, icon: FolderOpen },
    { key: "IN_PROGRESS", label: "In Progress", count: ticketCounts.inProgress, icon: LoaderCircle },
    { key: "RESOLVED", label: "Resolved", count: ticketCounts.resolved, icon: CheckCircle2 },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.key}
            className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-sm text-slate-500">{item.label}</p>

              <p className="mt-2 text-4xl font-bold text-slate-900">
                {item.count}
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100">
              <Icon size={22} className="text-green-600" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default TicketStats;
