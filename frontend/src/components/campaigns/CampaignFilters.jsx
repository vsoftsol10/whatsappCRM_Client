// export default function CampaignFilters({
//   statusFilter,
//   setStatusFilter,
// }) {
//   const statuses = [
//     "ALL",
//     "DRAFT",
//     "SCHEDULED",
//     "SENDING",
//     "COMPLETED",
//     "FAILED",
//   ];

//   return (
//     <div className="mb-8">
//       <div className="flex flex-wrap gap-4">
//         {statuses.map((status) => (
//           <button
//             key={status}
//             onClick={() => setStatusFilter(status)}
//             className={`
//               min-w-[80px]
//               rounded-xl
//               border
//               px-5
//               py-2
//               text-base
//               font-medium
//               transition-all
//               duration-200
//               ${
//                 statusFilter === status
//                   ? "border-[#25D366] bg-[#25D366] text-black shadow-md"
//                   : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-[#25D366]"
//               }
//             `}
//           >
//             {status}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// }




import { Search, X } from "lucide-react";

export default function CampaignFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}) {
  const statuses = [
    "ALL",
    "DRAFT",
    "SCHEDULED",
    "SENDING",
    "COMPLETED",
    "FAILED",
  ];

  return (
    <div className="mb-8 flex flex-wrap items-center gap-4">
      {/* SEARCH */}
      {setSearch && (
        <div className="relative w-full max-w-xs sm:w-72">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-11 pr-10 text-base outline-none transition focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/30"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-3">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`
              min-w-[80px]
              rounded-xl
              border
              px-5
              py-2
              text-base
              font-medium
              transition-all
              duration-200
              ${
                statusFilter === status
                  ? "border-[#25D366] bg-[#25D366] text-black shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-[#25D366]"
              }
            `}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}