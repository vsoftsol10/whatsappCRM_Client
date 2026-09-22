// import {
//   X,
//   Calendar,
//   Tag,
//   FileText,
//   Megaphone,
//   CheckCircle2,
// } from "lucide-react";

// export default function ViewCampaignModal({
//   isOpen,
//   onClose,
//   campaign,
// }) {
  
//   if (!isOpen || !campaign) return null;

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "COMPLETED":
//         return "bg-green-100 text-green-700";

//       case "SCHEDULED":
//         return "bg-blue-100 text-blue-700";

//       case "SENDING":
//         return "bg-[#DCF8C6] text-[#128C7E]";

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
//     <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">

//       <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

//         {/* Header */}

//         <div className="bg-gradient-to-r from-[#25D366] via-[#25D366] to-[#128C7E] px-8 py-6 flex justify-between items-start">

//           <div className="flex items-center gap-4">

//             <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center shadow-sm">

//               <Megaphone
//                 size={28}
//                 className="text-[#128C7E]"
//               />

//             </div>

//             <div>

//               <p className="text-sm font-medium text-gray-600">
//                 Campaign Details
//               </p>

//               <h2 className="text-3xl font-bold text-gray-900 mt-1">
//                 {campaign.name}
//               </h2>

//             </div>

//           </div>

//           <button
//             onClick={onClose}
//             className="p-2 rounded-xl hover:bg-white/50 transition"
//           >
//             <X size={24} />
//           </button>

//         </div>

//         {/* Body */}

//         <div className="p-8 space-y-6 bg-gray-50">

//           {/* Type & Status */}

//           <div className="grid md:grid-cols-2 gap-5">

//             <div className="bg-white rounded-2xl shadow-sm p-5">

//               <div className="flex items-center gap-3 mb-3">

//                 <Tag
//                   size={20}
//                   className="text-purple-600"
//                 />

//                 <h3 className="font-semibold text-gray-700">
//                   Campaign Type
//                 </h3>

//               </div>

//               <span
//                 className={`px-4 py-2 rounded-full text-sm font-semibold ${getTypeColor(
//                   campaign.type
//                 )}`}
//               >
//                 {campaign.type}
//               </span>

//             </div>

//             <div className="bg-white rounded-2xl shadow-sm p-5">

//               <div className="flex items-center gap-3 mb-3">

//                 <CheckCircle2
//                   size={20}
//                   className="text-[#128C7E]"
//                 />

//                 <h3 className="font-semibold text-gray-700">
//                   Campaign Status
//                 </h3>

//               </div>

//               <span
//                 className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
//                   campaign.status
//                 )}`}
//               >
//                 {campaign.status}
//               </span>

//             </div>

//           </div>

//           {/* Schedule */}

//           <div className="bg-white rounded-2xl shadow-sm p-5">

//             <div className="flex items-center gap-3 mb-3">

//               <Calendar
//                 size={20}
//                 className="text-blue-600"
//               />

//               <h3 className="font-semibold text-gray-700">
//                 Scheduled Time
//               </h3>

//             </div>

//             <p className="text-gray-700">
//               {campaign.scheduledAt
//                 ? new Date(
//                     campaign.scheduledAt
//                   ).toLocaleString()
//                 : "Not Scheduled"}
//             </p>

//           </div>

//           {/* Campaign Image */}

// <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

//   <div className="bg-gray-100 px-5 py-4 flex items-center gap-3">

//     <Megaphone
//       size={20}
//       className="text-[#25D366]"
//     />

//     <h3 className="font-semibold text-gray-800">
//       Campaign Image
//     </h3>

//   </div>

//   <div className="p-6">

//     {campaign.imageUrl ? (

//       <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">

//         <img
//           src={campaign.imageUrl}
//           alt={campaign.name}
//           className="w-full max-h-[420px] object-contain bg-white"
//         />

//       </div>

//     ) : (

//       <div className="flex flex-col items-center justify-center py-12 text-gray-500">

//         <Megaphone
//           size={40}
//           className="mb-3 text-gray-300"
//         />

//         <p className="font-medium">
//           No campaign image available
//         </p>

//       </div>

//     )}

//   </div>

// </div>

//           {/* Message */}

//           <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

//             <div className="bg-gray-100 px-5 py-4 flex items-center gap-3">

//               <FileText
//                 size={20}
//                 className="text-[#25D366]"
//               />

//               <h3 className="font-semibold text-gray-800">
//                 Message Content
//               </h3>

//             </div>

//             <div className="p-6 whitespace-pre-wrap leading-8 text-gray-700">
//               {campaign.messageContent ||
//                 "No message available."}
//             </div>

//           </div>

//         </div>

//         {/* Footer */}

//         <div className="bg-white px-8 py-5 flex justify-end shadow-inner">

//           <button
//             onClick={onClose}
//             className="px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] transition font-semibold text-gray-800"
//           >
//             Close
//           </button>

//         </div>

//       </div>

//     </div>
//   );
// }

import { useState } from "react";
import {
  X,
  Calendar,
  Tag,
  FileText,
  Megaphone,
  CheckCircle2,
  RotateCcw,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { resendCampaign } from "../../api/campaignApi"; // 👈 NEW

export default function ViewCampaignModal({
  isOpen,
  onClose,
  campaign,
  onResendSuccess, // 👈 NEW — optional callback so the parent list/page can refresh
}) {

  const [resending, setResending] = useState(false); // 👈 NEW

  if (!isOpen || !campaign) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";

      case "SCHEDULED":
        return "bg-blue-100 text-blue-700";

      case "SENDING":
        return "bg-[#DCF8C6] text-[#128C7E]";

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

  // ==================================================
  // RESEND CAMPAIGN  👈 NEW
  // ==================================================
  // Only meaningful for a campaign that already finished — the
  // backend itself blocks resending anything still SENDING, or
  // anything that was never sent at all (DRAFT/SCHEDULED should
  // use the normal "Send Campaign" flow instead).

  const canResend =
    campaign.status === "COMPLETED" ||
    campaign.status === "FAILED";

  const handleResend = async () => {
    if (resending) return;

    try {
      setResending(true);

      const response = await resendCampaign(campaign.id);

      toast.success("Campaign resent successfully!");

      if (onResendSuccess) {
        onResendSuccess(response?.data);
      }

      onClose();
    } catch (error) {
      console.error("Failed to resend campaign:", error);

      toast.error(
        error?.response?.data?.message || "Failed to resend campaign."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Header */}

        <div className="bg-gradient-to-r from-[#25D366] via-[#25D366] to-[#128C7E] px-8 py-6 flex justify-between items-start">

          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-2xl bg-white/60 flex items-center justify-center shadow-sm">

              <Megaphone
                size={28}
                className="text-[#128C7E]"
              />

            </div>

            <div>

              <p className="text-sm font-medium text-gray-600">
                Campaign Details
              </p>

              <h2 className="text-3xl font-bold text-gray-900 mt-1">
                {campaign.name}
              </h2>

            </div>

          </div>

          <button
            onClick={onClose}
            disabled={resending}
            className={`p-2 rounded-xl transition ${
              resending
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-white/50"
            }`}
          >
            <X size={24} />
          </button>

        </div>

        {/* Body */}

        <div className="p-8 space-y-6 bg-gray-50">

          {/* Type & Status */}

          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-white rounded-2xl shadow-sm p-5">

              <div className="flex items-center gap-3 mb-3">

                <Tag
                  size={20}
                  className="text-purple-600"
                />

                <h3 className="font-semibold text-gray-700">
                  Campaign Type
                </h3>

              </div>

              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getTypeColor(
                  campaign.type
                )}`}
              >
                {campaign.type}
              </span>

            </div>

            <div className="bg-white rounded-2xl shadow-sm p-5">

              <div className="flex items-center gap-3 mb-3">

                <CheckCircle2
                  size={20}
                  className="text-[#128C7E]"
                />

                <h3 className="font-semibold text-gray-700">
                  Campaign Status
                </h3>

              </div>

              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                  campaign.status
                )}`}
              >
                {campaign.status}
              </span>

            </div>

          </div>

          {/* Schedule */}

          <div className="bg-white rounded-2xl shadow-sm p-5">

            <div className="flex items-center gap-3 mb-3">

              <Calendar
                size={20}
                className="text-blue-600"
              />

              <h3 className="font-semibold text-gray-700">
                Scheduled Time
              </h3>

            </div>

            <p className="text-gray-700">
              {campaign.scheduledAt
                ? new Date(
                    campaign.scheduledAt
                  ).toLocaleString()
                : "Not Scheduled"}
            </p>

          </div>

          {/* Campaign Image */}

<div className="bg-white rounded-2xl shadow-sm overflow-hidden">

  <div className="bg-gray-100 px-5 py-4 flex items-center gap-3">

    <Megaphone
      size={20}
      className="text-[#25D366]"
    />

    <h3 className="font-semibold text-gray-800">
      Campaign Image
    </h3>

  </div>

  <div className="p-6">

    {campaign.imageUrl ? (

      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">

        <img
          src={campaign.imageUrl}
          alt={campaign.name}
          className="w-full max-h-[420px] object-contain bg-white"
        />

      </div>

    ) : (

      <div className="flex flex-col items-center justify-center py-12 text-gray-500">

        <Megaphone
          size={40}
          className="mb-3 text-gray-300"
        />

        <p className="font-medium">
          No campaign image available
        </p>

      </div>

    )}

  </div>

</div>

          {/* Message */}

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

            <div className="bg-gray-100 px-5 py-4 flex items-center gap-3">

              <FileText
                size={20}
                className="text-[#25D366]"
              />

              <h3 className="font-semibold text-gray-800">
                Message Content
              </h3>

            </div>

            <div className="p-6 whitespace-pre-wrap leading-8 text-gray-700">
              {campaign.messageContent ||
                "No message available."}
            </div>

          </div>

        </div>

        {/* Footer */}

        <div className="bg-white px-8 py-5 flex items-center justify-end gap-3 shadow-inner">

          {/* 👈 NEW: Resend button — only shown once the campaign has
              actually finished (COMPLETED or FAILED). The backend
              enforces this too, so this is just keeping the button
              from appearing somewhere it would immediately error. */}
          {canResend && (
            <button
              onClick={handleResend}
              disabled={resending}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white transition ${
                resending
                  ? "cursor-not-allowed bg-[#128C7E]/60"
                  : "bg-[#128C7E] hover:bg-[#0e6b5e]"
              }`}
            >
              {resending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Resending...
                </>
              ) : (
                <>
                  <RotateCcw size={18} />
                  Resend Campaign
                </>
              )}
            </button>
          )}

          <button
            onClick={onClose}
            disabled={resending}
            className={`px-6 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#128C7E] transition font-semibold text-gray-800 ${
              resending ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}
