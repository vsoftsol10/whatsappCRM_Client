// import { useEffect, useState } from "react";
// import {
//   FaCheckCircle,
//   FaUsers,
//   FaAddressBook,
//   FaBullhorn,
//   FaRobot,
// } from "react-icons/fa";

// import { useSubscriptionStore } from "../../store/subscriptionStore";
// import UpgradePlanModal from "./UpgradePlanModal";

// function Plans() {
//   // ==========================================
//   // Subscription Store
//   // ==========================================
//   const {
//     plans,
//     plansLoading,
//     fetchPlans,
//     createUpgradeRequest,
//   } = useSubscriptionStore();

//   // ==========================================
//   // Local State
//   // ==========================================
//   const [selectedPlan, setSelectedPlan] = useState(null);
//   const [showUpgradeModal, setShowUpgradeModal] = useState(false);
//   const [upgradeLoading, setUpgradeLoading] = useState(false);

//   // ==========================================
//   // Load Plans
//   // ==========================================
//   useEffect(() => {
//     fetchPlans();
//   }, [fetchPlans]);

//   // ==========================================
//   // Handle Upgrade Request
//   // ==========================================
//   const handleUpgradeRequest = async (plan) => {
//     if (!plan) {
//       return;
//     }

//     console.log("SELECTED PLAN:", plan);
//     console.log("SELECTED PLAN ID:", plan.id);

//     setUpgradeLoading(true);

//     try {
//       const result = await createUpgradeRequest(plan.id);

//       console.log("UPGRADE REQUEST RESULT:", result);

//       if (result.success) {
//         alert(
//           "Upgrade request submitted successfully. Waiting for Super Admin approval."
//         );

//         // Close modal
//         setShowUpgradeModal(false);
//         setSelectedPlan(null);
//       } else {
//         alert(
//           result.message ||
//             "Failed to submit upgrade request."
//         );
//       }
//     } catch (error) {
//       console.error(
//         "HANDLE UPGRADE REQUEST ERROR:",
//         error
//       );

//       alert(
//         error.response?.data?.message ||
//           "Failed to submit upgrade request."
//       );
//     } finally {
//       setUpgradeLoading(false);
//     }
//   };

//   // ==========================================
//   // Loading State
//   // ==========================================
//   if (plansLoading) {
//     return (
//       <div className="min-h-[400px] rounded-3xl bg-white p-8">
//         <div className="mb-8">
//           <h1 className="crm-title text-slate-900">
//             Available Plans
//           </h1>

//           <p className="mt-2 text-slate-500">
//             Compare all subscription plans available
//             for your WhatsApp CRM.
//           </p>
//         </div>

//         <div className="mt-10 text-center text-slate-500">
//           Loading plans...
//         </div>
//       </div>
//     );
//   }

//   // ==========================================
//   // UI
//   // ==========================================
//   return (
//     <div className="w-full">
//       {/* ==========================================
//           Header
//       ========================================== */}
//       <div className="mb-8">
//         <h1 className="crm-title text-slate-900">
//           Available Plans
//         </h1>

//         <p className="mt-2 text-slate-500">
//           Compare all subscription plans available
//           for your WhatsApp CRM.
//         </p>
//       </div>

//       {/* ==========================================
//           Plans
//       ========================================== */}
//       <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
//         {plans.map((plan) => (
//           <div
//             key={plan.id}
//             className="flex min-h-[720px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
//           >
//             {/* ==========================================
//                 Plan Header
//             ========================================== */}
//             <div>
//               <div className="mb-4 flex items-center justify-between">
//                 <h2 className="text-3xl font-bold text-slate-900">
//                   {plan.planName}
//                 </h2>

//                 {plan.isTrial && (
//                   <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
//                     Trial
//                   </span>
//                 )}
//               </div>

//               {/* Price */}
//               <div className="mb-6">
//                 <span className="text-5xl font-bold text-[#25D366]">
//                   ₹{plan.price}
//                 </span>

//                 <p className="mt-2 text-sm text-slate-500">
//                   {plan.durationDays} Days
//                 </p>
//               </div>

//               {/* ==========================================
//                   Plan Limits
//               ========================================== */}
//               <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
//                 {/* Users */}
//                 <div className="flex items-center gap-3">
//                   <FaUsers className="text-[#25D366]" />

//                   <span className="text-slate-700">
//                     {plan.maxUsers} Users
//                   </span>
//                 </div>

//                 {/* Contacts */}
//                 <div className="flex items-center gap-3">
//                   <FaAddressBook className="text-[#25D366]" />

//                   <span className="text-slate-700">
//                     {plan.maxContacts} Contacts
//                   </span>
//                 </div>

//                 {/* Campaigns */}
//                 <div className="flex items-center gap-3">
//                   <FaBullhorn className="text-[#25D366]" />

//                   <span className="text-slate-700">
//                     {plan.maxCampaigns} Campaigns
//                   </span>
//                 </div>

//                 {/* Bots */}
//                 <div className="flex items-center gap-3">
//                   <FaRobot className="text-[#25D366]" />

//                   <span className="text-slate-700">
//                     {plan.maxBots} Bots
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* ==========================================
//                 Features
//             ========================================== */}
//             <div className="mt-6 flex-1 border-t border-slate-200 pt-5">
//               <h3 className="mb-4 text-lg font-semibold text-slate-900">
//                 Features
//               </h3>

//               <div className="space-y-3">
//                 {Array.isArray(plan.features) &&
//                   plan.features.map((feature, index) => (
//                     <div
//                       key={index}
//                       className="flex items-start gap-3"
//                     >
//                       <FaCheckCircle className="mt-1 shrink-0 text-[#25D366]" />

//                       <span className="text-sm leading-6 text-slate-600">
//                         {feature}
//                       </span>
//                     </div>
//                   ))}
//               </div>
//             </div>

//             {/* ==========================================
//                 Choose Plan Button
//             ========================================== */}
//             <button
//               type="button"
//               onClick={() => {
//                 console.log(
//                   "CHOOSE PLAN:",
//                   plan
//                 );

//                 setSelectedPlan(plan);
//                 setShowUpgradeModal(true);
//               }}
//               disabled={upgradeLoading}
//               className="mt-auto rounded-2xl bg-[#25D366] py-3 font-semibold text-black transition-all duration-300 hover:bg-[#128C7E] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               Choose Plan
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* ==========================================
//           Upgrade Request Modal
//       ========================================== */}
//       <UpgradePlanModal
//         isOpen={showUpgradeModal}
//         plan={selectedPlan}
//         loading={upgradeLoading}
//         onClose={() => {
//           if (!upgradeLoading) {
//             setShowUpgradeModal(false);
//             setSelectedPlan(null);
//           }
//         }}
//         onUpgrade={handleUpgradeRequest}
//       />
//     </div>
//   );
// }

// export default Plans;

import { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaUsers,
  FaAddressBook,
  FaBullhorn,
  FaFileAlt,
} from "react-icons/fa";

import { useSubscriptionStore } from "../../store/subscriptionStore";
import UpgradePlanModal from "./UpgradePlanModal";

function Plans() {
  // ==========================================
  // Subscription Store
  // ==========================================
  const {
    plans,
    plansLoading,
    fetchPlans,
    createUpgradeRequest,
  } = useSubscriptionStore();

  // ==========================================
  // Local State
  // ==========================================
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // ==========================================
  // Load Plans
  // ==========================================
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // ==========================================
  // Handle Upgrade Request
  // ==========================================
  const handleUpgradeRequest = async (plan) => {
    if (!plan) {
      return;
    }

    console.log("SELECTED PLAN:", plan);
    console.log("SELECTED PLAN ID:", plan.id);

    setUpgradeLoading(true);

    try {
      const result = await createUpgradeRequest(plan.id);

      console.log("UPGRADE REQUEST RESULT:", result);

      if (result.success) {
        alert(
          "Upgrade request submitted successfully. Waiting for Super Admin approval."
        );

        // Close modal
        setShowUpgradeModal(false);
        setSelectedPlan(null);
      } else {
        alert(
          result.message ||
            "Failed to submit upgrade request."
        );
      }
    } catch (error) {
      console.error(
        "HANDLE UPGRADE REQUEST ERROR:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to submit upgrade request."
      );
    } finally {
      setUpgradeLoading(false);
    }
  };

  // ==========================================
  // Loading State
  // ==========================================
  if (plansLoading) {
    return (
      <div className="min-h-[400px] rounded-3xl bg-white p-8">
        <div className="mb-8">
          <h1 className="crm-title text-slate-900">
            Available Plans
          </h1>

          <p className="mt-2 text-slate-500">
            Compare all subscription plans available
            for your WhatsApp CRM.
          </p>
        </div>

        <div className="mt-10 text-center text-slate-500">
          Loading plans...
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="w-full">
      {/* ==========================================
          Header
      ========================================== */}
      <div className="mb-8">
        <h1 className="crm-title text-slate-900">
          Available Plans
        </h1>

        <p className="mt-2 text-slate-500">
          Compare all subscription plans available
          for your WhatsApp CRM.
        </p>
      </div>

      {/* ==========================================
          Plans
      ========================================== */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex min-h-[720px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
          >
            {/* ==========================================
                Plan Header
            ========================================== */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-900">
                  {plan.planName}
                </h2>

                {plan.isTrial && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    Trial
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold text-[#25D366]">
                  ₹{plan.price}
                </span>

                <p className="mt-2 text-sm text-slate-500">
                  {plan.durationDays} Days
                </p>
              </div>

              {/* ==========================================
                  Plan Limits
              ========================================== */}
              <div className="space-y-4 rounded-2xl bg-slate-50 p-5">
                {/* Users */}
                <div className="flex items-center gap-3">
                  <FaUsers className="text-[#25D366]" />

                  <span className="text-slate-700">
                    {plan.maxUsers} Users
                  </span>
                </div>

                {/* Customers */}
                <div className="flex items-center gap-3">
                  <FaAddressBook className="text-[#25D366]" />

                  <span className="text-slate-700">
                    {plan.maxCustomers} Customers
                  </span>
                </div>

                {/* Campaigns */}
                <div className="flex items-center gap-3">
                  <FaBullhorn className="text-[#25D366]" />

                  <span className="text-slate-700">
                    {plan.maxCampaigns} Campaigns
                  </span>
                </div>

                {/* Templates */}
                <div className="flex items-center gap-3">
                  <FaFileAlt className="text-[#25D366]" />

                  <span className="text-slate-700">
                    {plan.maxTemplates} Templates
                  </span>
                </div>
              </div>
            </div>

            {/* ==========================================
                Features
            ========================================== */}
            <div className="mt-6 flex-1 border-t border-slate-200 pt-5">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">
                Features
              </h3>

              <div className="space-y-3">
                {Array.isArray(plan.features) &&
                  plan.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3"
                    >
                      <FaCheckCircle className="mt-1 shrink-0 text-[#25D366]" />

                      <span className="text-sm leading-6 text-slate-600">
                        {feature}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* ==========================================
                Choose Plan Button
            ========================================== */}
            <button
              type="button"
              onClick={() => {
                console.log(
                  "CHOOSE PLAN:",
                  plan
                );

                setSelectedPlan(plan);
                setShowUpgradeModal(true);
              }}
              disabled={upgradeLoading}
              className="mt-auto rounded-2xl bg-[#25D366] py-3 font-semibold text-black transition-all duration-300 hover:bg-[#128C7E] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Choose Plan
            </button>
          </div>
        ))}
      </div>

      {/* ==========================================
          Upgrade Request Modal
      ========================================== */}
      <UpgradePlanModal
        isOpen={showUpgradeModal}
        plan={selectedPlan}
        loading={upgradeLoading}
        onClose={() => {
          if (!upgradeLoading) {
            setShowUpgradeModal(false);
            setSelectedPlan(null);
          }
        }}
        onUpgrade={handleUpgradeRequest}
      />
    </div>
  );
}

export default Plans;