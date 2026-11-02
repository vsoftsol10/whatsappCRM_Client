
// import { 
//   MoreVertical, 
//   Eye,
//   Pencil,
//   Trash2,
//   PhoneCall,
//   BadgeCheck,
//   Trophy,
//   UserPlus,
//   CheckCircle2,
//  } from "lucide-react";
// import { useState, useEffect, useRef } from "react";


// export default function LeadCard({ 
//   lead,
//   onView,
//   onEdit,
//   onDelete,
//   onStatusChange,
//   onConvert,
//  }) {

//   const statusStyles = {
//     NEW: "bg-[#DCF8C6] text-[#128C7E]",
//     CONTACTED: "bg-blue-100 text-blue-700",
//     QUALIFIED: "bg-purple-100 text-purple-700",
//     WON: "bg-green-100 text-green-700",
//   };

//   const [showMenu, setShowMenu] = useState(false);

//   const menuRef = useRef(null);

//   useEffect(() => {
//   function handleClickOutside(event) {
//     if (
//       menuRef.current &&
//       !menuRef.current.contains(event.target)
//     ) {
//       setShowMenu(false);
//     }
//   }

//   document.addEventListener("mousedown", handleClickOutside);

//   return () => {
//     document.removeEventListener(
//       "mousedown",
//       handleClickOutside
//     );
//   };
// }, []);

//   return (
//     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition min-h-[260px]">
      
//       {/* Header */}
//       <div className="flex justify-between items-start mb-4">
//         <div>
//           <h3 className="text-lg font-bold text-gray-900">
//             {lead.name}
//           </h3>

//           <p className="text-sm text-gray-500 mt-1">
//             SOURCE
//           </p>

//           <p className="font-medium text-gray-800">
//             {lead.source || "N/A"}
//           </p>
//         </div>

//         <div ref={menuRef} className="relative">
//         <button
//           onClick={() => setShowMenu(!showMenu)}
//           className="p-2 rounded-lg hover:bg-gray-100"
//         >
//           <MoreVertical size={18} />
//         </button>
//         {lead.status === "WON" && lead.isConverted && (
//           <div className="px-4 py-2 text-sm font-medium text-[#128C7E]">
//             ✓ Converted
//           </div>
//         )}
      
//       {showMenu && (
//           <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg z-20">

//           <button
//             onClick={() => {
//               onView(lead);
//               setShowMenu(false);
//             }}
//             className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-100"
//           >
//             <Eye size={16} />
//             <span>View Details</span>
//           </button>

//           <button
//             onClick={() => {
//               onEdit(lead);
//               setShowMenu(false);
//             }}
//             className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-100"
//           >
//             <Pencil size={16} />
//             <span>Edit Lead</span>
//           </button>

//           <button
//             onClick={() => {
//               onDelete(lead.id);
//               setShowMenu(false);
//             }}
//             className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50"
//           >
//             <Trash2 size={16} />
//             <span>Delete Lead</span>
//           </button>

//           <div className="border-t" />

//           {!lead.isConverted && lead.status === "NEW" && (
//             <button
//               onClick={() => {
//                 onStatusChange(lead.id, "CONTACTED");
//                 setShowMenu(false);
//               }}
//               className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-100"
//             >
//               <PhoneCall size={16} />
//               <span>Mark Contacted</span>
//             </button>
//           )}

//           {!lead.isConverted && lead.status === "CONTACTED" && (
//             <button
//               onClick={() => {
//                 onStatusChange(lead.id, "QUALIFIED");
//                 setShowMenu(false);
//               }}
//               className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-100"
//             >
//               <BadgeCheck size={16} />
//               <span>Mark Qualified</span>
//             </button>
//           )}

//           {!lead.isConverted && lead.status === "QUALIFIED" && (
//             <button
//               onClick={() => {
//                 onStatusChange(lead.id, "WON");
//                 setShowMenu(false);
//               }}
//               className="flex w-full items-center gap-3 px-4 py-3 text-left text-[#128C7E] hover:bg-[#DCF8C6]"
//             >
//               <Trophy size={16} />
//               <span>Mark Won</span>
//             </button>
//           )}

//           {lead.status === "WON" && !lead.isConverted && (
//             <button
//               onClick={() => {
//                 console.log("Convert button clicked", lead.id);
//                 onConvert(lead.id);
//                 setShowMenu(false);
//               }}
//               className="flex w-full items-center gap-3 px-4 py-3 text-left text-[#128C7E] hover:bg-[#DCF8C6]"
//             >
//               <UserPlus size={16} />
//               <span>Convert to Customer</span>
//             </button>
//           )}

//           {lead.status === "WON" && lead.isConverted && (
//             <div className="flex items-center gap-3 px-4 py-3 text-[#128C7E]">
//               <CheckCircle2 size={16} />
//               <span>Converted</span>
//             </div>
//           )}
//                 </div>
//               )}
//             </div>
//                   </div>

//                   {/* Contact Details */}
//                   <div className="space-y-2 mb-4">
//                     <p className="text-sm text-gray-700">
//                       📞 {lead.phone || "N/A"}
//                     </p>

//                     <p className="text-sm text-gray-700 break-all">
//                       ✉️ {lead.email || "N/A"}
//                     </p>

//                     <p className="text-sm text-gray-700">
//                       👤 {lead.assignedTo?.name || "Unassigned"}
//                     </p>
//                   </div>

//                   {/* Requirements */}
//                   <div className="mb-5">
//                     <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
//                       Requirements
//                     </p>

//                     <p className="text-sm text-gray-700 line-clamp-3">
//                       {lead.requirements ||
//                         lead.notes ||
//                         "No requirements provided"}
//                     </p>
//                   </div>

//                   {/* Footer */}
//                   <div className="flex justify-between items-center mt-auto">
//                     {lead.isConverted ? (
//                       <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#DCF8C6] text-[#128C7E]">
//                         Converted
//                       </span>
//                     ) : (
//                       <span
//                         className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                           statusStyles[lead.status] ||
//                           "bg-gray-100 text-gray-700"
//                         }`}
//                       >
//                         {lead.status}
//                       </span>
//                     )}

//                     <span className="text-xs text-gray-400">
//                       Lead
//                     </span>
//                   </div>
//                 </div>
//         );
//       }



import { 
  MoreVertical, 
  Eye,
  Pencil,
  Trash2,
  PhoneCall,
  BadgeCheck,
  Trophy,
  UserPlus,
  CheckCircle2,
 } from "lucide-react";
import { useState, useEffect, useRef } from "react";


export default function LeadCard({ 
  lead,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onConvert,
  // Optional multi-select (bulk delete). If not passed, the card
  // looks and behaves exactly as before.
  selected = false,
  onToggleSelect,
 }) {

  const statusStyles = {
    NEW: "bg-[#DCF8C6] text-[#128C7E]",
    CONTACTED: "bg-blue-100 text-blue-700",
    QUALIFIED: "bg-purple-100 text-purple-700",
    WON: "bg-green-100 text-green-700",
  };

  const [showMenu, setShowMenu] = useState(false);

  const menuRef = useRef(null);

  useEffect(() => {
  function handleClickOutside(event) {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target)
    ) {
      setShowMenu(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener(
      "mousedown",
      handleClickOutside
    );
  };
}, []);

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition min-h-[260px] ${
        selected ? "ring-2 ring-[#25D366]" : ""
      }`}
    >
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="flex items-center gap-3 text-lg font-bold text-gray-900">
            {typeof onToggleSelect === "function" && (
              <input
                type="checkbox"
                aria-label={`Select ${lead.name}`}
                checked={selected}
                onChange={() => onToggleSelect(lead.id)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-[#25D366]"
              />
            )}
            {lead.name}
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            SOURCE
          </p>

          <p className="font-medium text-gray-800">
            {lead.source || "N/A"}
          </p>
        </div>

        <div ref={menuRef} className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <MoreVertical size={18} />
        </button>
        {lead.status === "WON" && lead.isConverted && (
          <div className="px-4 py-2 text-sm font-medium text-[#128C7E]">
            ✓ Converted
          </div>
        )}
      
      {showMenu && (
          <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg z-20">

          <button
            onClick={() => {
              onView(lead);
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-100"
          >
            <Eye size={16} />
            <span>View Details</span>
          </button>

          <button
            onClick={() => {
              onEdit(lead);
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-100"
          >
            <Pencil size={16} />
            <span>Edit Lead</span>
          </button>

          <button
            onClick={() => {
              onDelete(lead.id);
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} />
            <span>Delete Lead</span>
          </button>

          <div className="border-t" />

          {!lead.isConverted && lead.status === "NEW" && (
            <button
              onClick={() => {
                onStatusChange(lead.id, "CONTACTED");
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-100"
            >
              <PhoneCall size={16} />
              <span>Mark Contacted</span>
            </button>
          )}

          {!lead.isConverted && lead.status === "CONTACTED" && (
            <button
              onClick={() => {
                onStatusChange(lead.id, "QUALIFIED");
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-100"
            >
              <BadgeCheck size={16} />
              <span>Mark Qualified</span>
            </button>
          )}

          {!lead.isConverted && lead.status === "QUALIFIED" && (
            <button
              onClick={() => {
                onStatusChange(lead.id, "WON");
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-[#128C7E] hover:bg-[#DCF8C6]"
            >
              <Trophy size={16} />
              <span>Mark Won</span>
            </button>
          )}

          {lead.status === "WON" && !lead.isConverted && (
            <button
              onClick={() => {
                console.log("Convert button clicked", lead.id);
                onConvert(lead.id);
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-[#128C7E] hover:bg-[#DCF8C6]"
            >
              <UserPlus size={16} />
              <span>Convert to Customer</span>
            </button>
          )}

          {lead.status === "WON" && lead.isConverted && (
            <div className="flex items-center gap-3 px-4 py-3 text-[#128C7E]">
              <CheckCircle2 size={16} />
              <span>Converted</span>
            </div>
          )}
                </div>
              )}
            </div>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-700">
                      📞 {lead.phone || "N/A"}
                    </p>

                    <p className="text-sm text-gray-700 break-all">
                      ✉️ {lead.email || "N/A"}
                    </p>

                    <p className="text-sm text-gray-700">
                      👤 {lead.assignedTo?.name || "Unassigned"}
                    </p>
                  </div>

                  {/* Requirements */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      Requirements
                    </p>

                    <p className="text-sm text-gray-700 line-clamp-3">
                      {lead.requirements ||
                        lead.notes ||
                        "No requirements provided"}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center mt-auto">
                    {lead.isConverted ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#DCF8C6] text-[#128C7E]">
                        Converted
                      </span>
                    ) : (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          statusStyles[lead.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {lead.status}
                      </span>
                    )}

                    <span className="text-xs text-gray-400">
                      Lead
                    </span>
                  </div>
                </div>
        );
      }