// import { CalendarDays, Clock3, Sparkles } from "lucide-react";

// export default function DashboardHeader() {
//   const currentHour = new Date().getHours();

//   let greeting = "Good Evening";

//   if (currentHour < 12) {
//     greeting = "Good Morning";
//   } else if (currentHour < 17) {
//     greeting = "Good Afternoon";
//   }

//   const today = new Date().toLocaleDateString("en-IN", {
//     weekday: "long",
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//   });

//   return (
//     <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm p-6 mb-8">

//       {/* Background Decorations */}
//       <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-blue-100 blur-3xl opacity-60"></div>
//       <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#DCF8C6] blur-3xl opacity-60"></div>

//       <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

//         {/* Left Section */}
//         <div>
//           <div className="flex items-center gap-2 mb-3">
//             <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#DCF8C6]">
//               <Sparkles className="text-[#25D366]" size={18} />
//             </div>

//             <span className="text-[#128C7E] font-semibold text-sm">
//               {greeting}
//             </span>
//           </div>

//           <h1 className="text-4xl font-bold text-gray-900">
//             WhatsApp CRM Dashboard
//           </h1>

//           <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">
//             Monitor your customers, leads, conversations, campaigns and tasks
//             from one centralized dashboard.
//           </p>
//         </div>

//         {/* Right Section */}
//         <div className="flex flex-col gap-4">

//           {/* Today's Date */}
//           <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 shadow-sm">

//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
//               <CalendarDays
//                 size={22}
//                 className="text-blue-600"
//               />
//             </div>

//             <div>
//               <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
//                 Today's Date
//               </p>

//               <p className="font-semibold text-gray-900">
//                 {today}
//               </p>
//             </div>

//           </div>

//           {/* System Status  */}
//            {/* <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 shadow-sm">

//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100">
//               <Clock3
//                 size={22}
//                 className="text-[#128C7E]"
//               />
//             </div>

//             <div>
//               <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
//                 System Status
//               </p>

//               <p className="font-semibold text-[#128C7E] flex items-center gap-2">
//                 <span className="w-2.5 h-2.5 rounded-full bg-[#DCF8C6]0"></span>
//                 All Systems Operational
//               </p>
//             </div>

//           </div> */}

//         </div>

//       </div>
//     </div>
//   );
// }

export default function DashboardHeader() {
  const hour = new Date().getHours();

  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 17) greeting = "Good Afternoon";

  return (
    <div className="mb-6">
      <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
        {greeting}
      </h2>
      <p className="mt-1 text-sm text-slate-600 sm:text-base">
        Here&rsquo;s your WhatsApp CRM dashboard
      </p>
    </div>
  );
}