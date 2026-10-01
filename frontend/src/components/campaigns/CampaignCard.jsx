// import {
//   Calendar,
//   Users,
//   Eye,
//   Send,
//   Edit,
//   Trash2,
//   MoreVertical,
// } from "lucide-react";

// import {
//   useEffect,
//   useRef,
//   useState,
// } from "react";

// import { useNavigate } from "react-router-dom";

// export default function CampaignCard({
//   campaign,
//   onView,
//   onSend,
//   onEdit,
//   onDelete,
//   onStatusChange,
// }) {
//   const navigate = useNavigate();

//   const [showMenu, setShowMenu] = useState(false);

//   const menuRef = useRef(null);

//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (
//         menuRef.current &&
//         !menuRef.current.contains(event.target)
//       ) {
//         setShowMenu(false);
//       }
//     }

//     document.addEventListener(
//       "mousedown",
//       handleClickOutside
//     );

//     return () => {
//       document.removeEventListener(
//         "mousedown",
//         handleClickOutside
//       );
//     };
//   }, []);

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "DRAFT":
//         return "bg-gray-100 text-gray-700";

//       case "SCHEDULED":
//         return "bg-blue-100 text-blue-700";

//       case "SENDING":
//         return "bg-[#DCF8C6] text-[#128C7E]";

//       case "COMPLETED":
//         return "bg-green-100 text-green-700";

//       case "FAILED":
//         return "bg-red-100 text-red-700";

//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   const getTypeColor = (type) => {
//     switch (type) {
//       case "PROMOTIONAL":
//         return "bg-purple-100 text-purple-700";

//       case "BROADCAST":
//         return "bg-indigo-100 text-indigo-700";

//       case "FOLLOW_UP":
//         return "bg-orange-100 text-orange-700";

//       case "ANNOUNCEMENT":
//         return "bg-cyan-100 text-cyan-700";

//       default:
//         return "bg-gray-100 text-gray-700";
//     }
//   };

//   return (
//     <div className="bg-white rounded-2xl shadow hover:shadow-lg transition-all duration-300 p-5">
//       {/* Header */}

//       <div className="flex justify-between items-start">
//         <div>
//           <h2
//             onClick={() =>
//               navigate(`/campaigns/${campaign.id}`)
//             }
//             className="text-lg font-semibold cursor-pointer hover:text-blue-600"
//           >
//             {campaign.name}
//           </h2>

//           <div className="flex gap-2 mt-3">
//             <span
//               className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
//                 campaign.type
//               )}`}
//             >
//               {campaign.type}
//             </span>

//             <select
//               value={campaign.status}
//               onChange={(e) =>
//                 onStatusChange?.(campaign.id, e.target.value)
//               }
//               onClick={(e) => e.stopPropagation()}
//               className={`px-3 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer ${getStatusColor(
//                 campaign.status
//               )}`}
//             >
//               <option value="DRAFT">DRAFT</option>
//               <option value="SCHEDULED">SCHEDULED</option>
//               <option value="SENDING">SENDING</option>
//               <option value="COMPLETED">COMPLETED</option>
//               <option value="FAILED">FAILED</option>
//             </select>
//           </div>
//         </div>

//         {/* Three Dot Menu */}

//         <div
//           className="relative"
//           ref={menuRef}
//         >
//           <button
//             onClick={() =>
//               setShowMenu(!showMenu)
//             }
//             className="p-2 rounded-lg hover:bg-gray-100 transition"
//           >
//             <MoreVertical size={20} />
//           </button>

//           {showMenu && (
//             <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50">
//               <button
//                 onClick={() => {
//                   setShowMenu(false);
//                   onView(campaign);
//                 }}
//                 className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
//               >
//                 <Eye size={18} />
//                 View Campaign
//               </button>

//               <button
//                 onClick={() => {
//                   setShowMenu(false);
//                   onSend(campaign);
//                 }}
//                 className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition"
//               >
//                 <Send size={18} />
//                 Send Campaign
//               </button>

//               <button
//                 onClick={() => {
//                   setShowMenu(false);
//                   onEdit(campaign);
//                 }}
//                 className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#DCF8C6] transition"
//               >
//                 <Edit size={18} />
//                 Edit Campaign
//               </button>

//               <button
//                 onClick={() => {
//                   setShowMenu(false);
//                   onDelete(campaign.id);
//                 }}
//                 className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition"
//               >
//                 <Trash2 size={18} />
//                 Delete Campaign
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Message */}

//       <div className="mt-5">
//         <p className="text-gray-600 line-clamp-3">
//           {campaign.messageContent}
//         </p>
//       </div>

//       {/* Audience */}

//       <div className="flex items-center gap-2 mt-5">
//         <Users
//           size={16}
//           className="text-gray-500"
//         />

//         <span className="text-sm text-gray-700">
//           Audience :{" "}
//           {campaign.recipients?.length ||
//             campaign.audienceCount ||
//             0}
//         </span>
//       </div>

//       {/* Schedule */}

//       <div className="flex items-center gap-2 mt-3">
//         <Calendar
//           size={16}
//           className="text-gray-500"
//         />

//         <span className="text-sm text-gray-700">
//           {campaign.scheduledAt
//             ? new Date(
//                 campaign.scheduledAt
//               ).toLocaleString()
//             : "Not Scheduled"}
//         </span>
//       </div>
//     </div>
//   );
// }


import {
  Calendar,
  Users,
  Eye,
  Send,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { getCampaignMessageText } from "../../utils/campaignMessage";

export default function CampaignCard({
  campaign,
  onView,
  onSend,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const navigate = useNavigate();

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

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-700";

      case "SCHEDULED":
        return "bg-blue-100 text-blue-700";

      case "SENDING":
        return "bg-[#DCF8C6] text-[#128C7E]";

      case "COMPLETED":
        return "bg-green-100 text-green-700";

      case "FAILED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "PROMOTIONAL":
        return "bg-purple-100 text-purple-700";

      case "BROADCAST":
        return "bg-indigo-100 text-indigo-700";

      case "FOLLOW_UP":
        return "bg-orange-100 text-orange-700";

      case "ANNOUNCEMENT":
        return "bg-cyan-100 text-cyan-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-lg transition-all duration-300 p-5">
      {/* Header */}

      <div className="flex justify-between items-start">
        <div>
          <h2
            onClick={() =>
              navigate(`/campaigns/${campaign.id}`)
            }
            className="text-lg font-semibold cursor-pointer hover:text-blue-600"
          >
            {campaign.name}
          </h2>

          <div className="flex gap-2 mt-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(
                campaign.type
              )}`}
            >
              {campaign.type}
            </span>

            <select
              value={campaign.status}
              onChange={(e) =>
                onStatusChange?.(campaign.id, e.target.value)
              }
              onClick={(e) => e.stopPropagation()}
              className={`px-3 py-1 rounded-full text-xs font-medium border-none outline-none cursor-pointer ${getStatusColor(
                campaign.status
              )}`}
            >
              <option value="DRAFT">DRAFT</option>
              <option value="SCHEDULED">SCHEDULED</option>
              <option value="SENDING">SENDING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        {/* Three Dot Menu */}

        <div
          className="relative"
          ref={menuRef}
        >
          <button
            onClick={() =>
              setShowMenu(!showMenu)
            }
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <MoreVertical size={20} />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onView(campaign);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
              >
                <Eye size={18} />
                View Campaign
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onSend(campaign);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition"
              >
                <Send size={18} />
                Send Campaign
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(campaign);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#DCF8C6] transition"
              >
                <Edit size={18} />
                Edit Campaign
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(campaign.id);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 size={18} />
                Delete Campaign
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message */}

      <div className="mt-5">
        <p className="text-gray-600 line-clamp-3">
          {getCampaignMessageText(campaign)}
        </p>
        {campaign.template?.name && (
          <p className="mt-2 text-xs text-gray-400">
            Template: {campaign.template.name}
          </p>
        )}
      </div>

      {/* Audience */}

      <div className="flex items-center gap-2 mt-5">
        <Users
          size={16}
          className="text-gray-500"
        />

        <span className="text-sm text-gray-700">
          Audience :{" "}
          {campaign.recipients?.length ||
            campaign.audienceCount ||
            0}
        </span>
      </div>

      {/* Schedule */}

      <div className="flex items-center gap-2 mt-3">
        <Calendar
          size={16}
          className="text-gray-500"
        />

        <span className="text-sm text-gray-700">
          {campaign.scheduledAt
            ? new Date(
                campaign.scheduledAt
              ).toLocaleString()
            : "Not Scheduled"}
        </span>
      </div>
    </div>
  );
}