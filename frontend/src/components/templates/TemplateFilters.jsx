// import { Search } from "lucide-react";

// export default function TemplateFilters({
//   search,
//   setSearch,
//   statusFilter,
//   setStatusFilter,
// }) {
//   const statuses = [
//     "ALL",
//     "DRAFT",
//     "ACTIVE",
//     "INACTIVE",
//   ];

//   return (
//     <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      
//       {/* SEARCH */}

//       <div className="relative mb-4">
//         <Search
//           size={18}
//           className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//         />

//         <input
//           type="text"
//           placeholder="Search templates..."
//           value={search}
//           onChange={(e) =>
//             setSearch(e.target.value)
//           }
//           className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
//         />
//       </div>

//       {/* STATUS FILTERS */}

//       <div className="flex flex-wrap gap-2">
//         {statuses.map((status) => (
//           <button
//             key={status}
//             onClick={() =>
//               setStatusFilter(status)
//             }
//             className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
//               statusFilter === status
//                 ? "bg-[#25D366] text-black"
//                 : "bg-gray-100 text-gray-700 hover:bg-gray-200"
//             }`}
//           >
//             {status}
//           </button>
//         ))}
//       </div>

//     </div>
//   );
// }

import { Search } from "lucide-react";

export default function TemplateFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}) {
  const statuses = [
    "ALL",
    "DRAFT",
    "PENDING",
    "APPROVED",
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      
      {/* SEARCH */}

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* STATUS FILTERS */}

      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() =>
              setStatusFilter(status)
            }
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              statusFilter === status
                ? "bg-[#25D366] text-black"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

    </div>
  );
}
