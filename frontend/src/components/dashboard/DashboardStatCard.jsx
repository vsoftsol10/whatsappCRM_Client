// import { ArrowUpRight } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// export default function DashboardStatCard({
//   title,
//   value,
//   subtitle,
//   icon: Icon,
//   iconBg = "bg-[#DCF8C6]",
//   iconColor = "text-[#25D366]",
//   borderColor = "from-[#25D366] to-[#128C7E]",
//   path,
// }) {
//   const navigate = useNavigate();

//   return (
//     <div
//       onClick={() => path && navigate(path)}
//       className="
//         group
//         relative
//         overflow-hidden
//         rounded-2xl
//         border
//         border-gray-200
//         bg-white
//         p-5
//         shadow-sm
//         transition-all
//         duration-300
//         hover:-translate-y-1
//         hover:shadow-lg
//         hover:border-blue-200
//         cursor-pointer
//       "
//     >
//       {/* Gradient Top Border */}
//       <div
//         className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${borderColor}`}
//       />

//       {/* Decorative Background */}
//       <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gray-100 blur-3xl opacity-70"></div>

//       <div className="relative flex items-start justify-between">
//         {/* Left */}
//         <div>
//           <p className="text-sm font-medium text-gray-500">
//             {title}
//           </p>

//           <h2 className="mt-2 text-3xl font-bold text-gray-900">
//             {value ?? 0}
//           </h2>

//           {subtitle && (
//             <p className="mt-2 text-sm text-gray-500">
//               {subtitle}
//             </p>
//           )}
//         </div>

//         {/* Right Icon */}
//         <div
//           className={`
//             flex
//             h-14
//             w-14
//             items-center
//             justify-center
//             rounded-2xl
//             ${iconBg}
//             transition-transform
//             duration-300
//             group-hover:scale-110
//           `}
//         >
//           {Icon && (
//             <Icon
//               size={28}
//               className={iconColor}
//             />
//           )}
//         </div>
//       </div>

//       {/* Bottom */}
//       <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
//         <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
//           Live Data
//         </span>

//         <ArrowUpRight
//           size={18}
//           className="text-gray-400 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-blue-600"
//         />
//       </div>
//     </div>
//   );
// }

import { useNavigate } from "react-router-dom";

export default function DashboardStatCard({ title, value, icon: Icon, path }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => path && navigate(path)}
      aria-label={`${title}: ${value ?? 0}. Open ${title}`}
      className="flex w-full items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-[#159A4B]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A4B]/50"
    >
      <div className="min-w-0">
        <p className="truncate text-base font-medium text-[#159A4B]">{title}</p>
        <p className="mt-3 text-4xl font-bold leading-none text-slate-900">
          {value ?? 0}
        </p>
      </div>

      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#159A4B]/10">
        {Icon && <Icon size={26} strokeWidth={1.8} className="text-[#159A4B]" />}
      </span>
    </button>
  );
}