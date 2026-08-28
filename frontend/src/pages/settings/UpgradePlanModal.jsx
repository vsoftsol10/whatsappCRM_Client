// import {
//   X,
//   Users,
//   Contact,
//   Megaphone,
//   Bot,
//   Calendar,
//   IndianRupee,
// } from "lucide-react";

// function UpgradePlanModal({
//   isOpen,
//   onClose,
//   plan,
//   onUpgrade,
//   loading = false,
// }) {
//   if (!isOpen || !plan) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//       <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

//         {/* Header */}
//         <div className="flex items-center justify-between bg-gradient-to-r from-[#25D366] to-[#128C7E] px-6 py-5">
//           <div>
//             <h2 className="text-2xl font-bold text-white">
//               Upgrade Subscription
//             </h2>

//             <p className="mt-1 text-sm text-green-100">
//               Confirm your selected subscription plan.
//             </p>
//           </div>

//           <button
//             onClick={onClose}
//             className="rounded-xl bg-white/20 p-2 text-white transition hover:bg-white/30"
//           >
//             <X size={22} />
//           </button>
//         </div>

//         {/* Scrollable Body */}
//         <div className="flex-1 overflow-y-auto p-6">

//           {/* Selected Plan */}
//           <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
//             <div className="flex items-center justify-between">

//               <div>
//                 <p className="text-sm text-slate-500">
//                   Selected Plan
//                 </p>

//                 <h3 className="mt-1 text-3xl font-bold text-[#128C7E]">
//                   {plan.planName}
//                 </h3>
//               </div>

//               <div className="text-right">
//                 <p className="text-sm text-slate-500">
//                   Monthly Price
//                 </p>

//                 <div className="mt-1 flex items-center justify-end gap-1 text-3xl font-bold text-[#25D366]">
//                   <IndianRupee size={28} />
//                   {plan.price}
//                 </div>
//               </div>

//             </div>
//           </div>

//           {/* Plan Details */}
//           <div className="mt-6 grid gap-4 sm:grid-cols-2">

//             <div className="rounded-2xl border border-slate-200 p-4">
//               <Calendar className="mb-3 text-[#25D366]" />

//               <p className="text-sm text-slate-500">
//                 Duration
//               </p>

//               <p className="text-2xl font-bold text-slate-900">
//                 {plan.durationDays} Days
//               </p>
//             </div>

//             <div className="rounded-2xl border border-slate-200 p-4">
//               <Users className="mb-3 text-[#25D366]" />

//               <p className="text-sm text-slate-500">
//                 Users
//               </p>

//               <p className="text-2xl font-bold text-slate-900">
//                 {plan.maxUsers}
//               </p>
//             </div>

//             <div className="rounded-2xl border border-slate-200 p-4">
//               <Contact className="mb-3 text-[#25D366]" />

//               <p className="text-sm text-slate-500">
//                 Contacts
//               </p>

//               <p className="text-2xl font-bold text-slate-900">
//                 {plan.maxContacts}
//               </p>
//             </div>

//             <div className="rounded-2xl border border-slate-200 p-4">
//               <Megaphone className="mb-3 text-[#25D366]" />

//               <p className="text-sm text-slate-500">
//                 Campaigns
//               </p>

//               <p className="text-2xl font-bold text-slate-900">
//                 {plan.maxCampaigns}
//               </p>
//             </div>

//             <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
//               <Bot className="mb-3 text-[#25D366]" />

//               <p className="text-sm text-slate-500">
//                 Bots
//               </p>

//               <p className="text-2xl font-bold text-slate-900">
//                 {plan.maxBots}
//               </p>
//             </div>

//           </div>

//           {/* Features */}
//           <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">

//             <h4 className="mb-5 text-xl font-bold text-slate-800">
//               Included Features
//             </h4>

//             <div className="space-y-3">

//               {plan.features?.map((feature, index) => (
//                 <div
//                   key={index}
//                   className="flex items-start gap-3"
//                 >
//                   <div className="mt-2 h-2.5 w-2.5 rounded-full bg-[#25D366]" />

//                   <span className="text-slate-700">
//                     {feature}
//                   </span>
//                 </div>
//               ))}

//             </div>

//           </div>

//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-end gap-4 border-t bg-white px-6 py-5">

//           <button
//             onClick={onClose}
//             disabled={loading}
//             className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             Cancel
//           </button>

//           <button
//             onClick={() => onUpgrade(plan)}
//             disabled={loading}
//             className="rounded-xl bg-[#25D366] px-8 py-3 font-semibold text-black transition-all duration-300 hover:bg-[#128C7E] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {loading ? "Upgrading..." : "Upgrade Plan"}
//           </button>

//         </div>

//       </div>
//     </div>
//   );
// }

// export default UpgradePlanModal;

import {
  X,
  Users,
  Contact,
  Megaphone,
  FileText,
  Calendar,
  IndianRupee,
} from "lucide-react";

function UpgradePlanModal({
  isOpen,
  onClose,
  plan,
  onUpgrade,
  loading = false,
}) {
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#25D366] to-[#128C7E] px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Upgrade Subscription
            </h2>

            <p className="mt-1 text-sm text-green-100">
              Confirm your selected subscription plan.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/20 p-2 text-white transition hover:bg-white/30"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Selected Plan */}
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-slate-500">
                  Selected Plan
                </p>

                <h3 className="mt-1 text-3xl font-bold text-[#128C7E]">
                  {plan.planName}
                </h3>
              </div>

              <div className="text-right">
                <p className="text-sm text-slate-500">
                  Monthly Price
                </p>

                <div className="mt-1 flex items-center justify-end gap-1 text-3xl font-bold text-[#25D366]">
                  <IndianRupee size={28} />
                  {plan.price}
                </div>
              </div>

            </div>
          </div>

          {/* Plan Details */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 p-4">
              <Calendar className="mb-3 text-[#25D366]" />

              <p className="text-sm text-slate-500">
                Duration
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {plan.durationDays} Days
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <Users className="mb-3 text-[#25D366]" />

              <p className="text-sm text-slate-500">
                Users
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {plan.maxUsers}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <Contact className="mb-3 text-[#25D366]" />

              <p className="text-sm text-slate-500">
                Customers
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {plan.maxCustomers}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <Megaphone className="mb-3 text-[#25D366]" />

              <p className="text-sm text-slate-500">
                Campaigns
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {plan.maxCampaigns}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
              <FileText className="mb-3 text-[#25D366]" />

              <p className="text-sm text-slate-500">
                Templates
              </p>

              <p className="text-2xl font-bold text-slate-900">
                {plan.maxTemplates}
              </p>
            </div>

          </div>

          {/* Features */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <h4 className="mb-5 text-xl font-bold text-slate-800">
              Included Features
            </h4>

            <div className="space-y-3">

              {plan.features?.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3"
                >
                  <div className="mt-2 h-2.5 w-2.5 rounded-full bg-[#25D366]" />

                  <span className="text-slate-700">
                    {feature}
                  </span>
                </div>
              ))}

            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 border-t bg-white px-6 py-5">

          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={() => onUpgrade(plan)}
            disabled={loading}
            className="rounded-xl bg-[#25D366] px-8 py-3 font-semibold text-black transition-all duration-300 hover:bg-[#128C7E] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Upgrading..." : "Upgrade Plan"}
          </button>

        </div>

      </div>
    </div>
  );
}

export default UpgradePlanModal;