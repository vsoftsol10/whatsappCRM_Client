
// import { useNavigate } from "react-router-dom";

// export default function DashboardStatCard({ title, value, icon: Icon, path }) {
//   const navigate = useNavigate();

//   return (
//     <button
//       type="button"
//       onClick={() => path && navigate(path)}
//       aria-label={`${title}: ${value ?? 0}. Open ${title}`}
//       className="flex w-full items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-[#159A4B]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A4B]/50"
//     >
//       <div className="min-w-0">
//         <p className="truncate text-base font-medium text-[#159A4B]">{title}</p>
//         <p className="mt-3 text-4xl font-bold leading-none text-slate-900">
//           {value ?? 0}
//         </p>
//       </div>

//       <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#159A4B]/10">
//         {Icon && <Icon size={26} strokeWidth={1.8} className="text-[#159A4B]" />}
//       </span>
//     </button>
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
      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:gap-4 sm:p-5 text-left shadow-sm transition-colors hover:border-[#159A4B]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A4B]/50"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium sm:text-base text-[#159A4B]">{title}</p>
        <p className="mt-3 text-3xl font-bold sm:text-4xl leading-none text-slate-900">
          {value ?? 0}
        </p>
      </div>

      <span className="flex h-11 w-11 shrink-0 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#159A4B]/10">
        {Icon && <Icon size={26} strokeWidth={1.8} className="text-[#159A4B]" />}
      </span>
    </button>
  );
}