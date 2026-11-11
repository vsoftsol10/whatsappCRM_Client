// import { useMemo, useState } from "react";
// import { X } from "lucide-react";

// const CYCLE_OPTIONS = [1, 3, 6, 12];
// const GST_RATE = 0.18;

// const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

// // "1 month", "3 months", "1 year", "14 days" ...
// const durationLabel = (durationDays, cycles = 1) => {
//   const d = Number(durationDays);

//   if (d >= 28 && d <= 31) {
//     return cycles === 12
//       ? "1 year"
//       : `${cycles} month${cycles > 1 ? "s" : ""}`;
//   }
//   if (d >= 365 && d <= 366) {
//     return `${cycles} year${cycles > 1 ? "s" : ""}`;
//   }
//   return `${d * cycles} days`;
// };

// // Same rule the server uses:
// // same plan + still running  -> add on top of the current expiry
// // otherwise                  -> start today
// const calcValidUntil = (plan, cycles, currentPlanId, currentSub) => {
//   const now = new Date();

//   const stillRunning =
//     currentPlanId === plan.id &&
//     currentSub?.status === "ACTIVE" &&
//     currentSub?.expiryDate &&
//     new Date(currentSub.expiryDate) > now;

//   const from = new Date(stillRunning ? currentSub.expiryDate : now);
//   from.setDate(from.getDate() + plan.durationDays * cycles);

//   return from;
// };

// const selectCls =
//   "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] disabled:opacity-60";

// function ModalBody({
//   mode,
//   plans,
//   currentPlanId,
//   currentSub,
//   initialPlanId,
//   paying,
//   onClose,
//   onPay,
// }) {
//   const [planId, setPlanId] = useState(initialPlanId);
//   const [cycles, setCycles] = useState(1);

//   const plan = useMemo(
//     () => plans.find((p) => p.id === planId) || plans[0],
//     [plans, planId]
//   );

//   if (!plan) return null;

//   const amount = Number(plan.price) * cycles;
//   const tax = Math.round(amount * GST_RATE);
//   const total = amount + tax;
//   const validUntil = calcValidUntil(plan, cycles, currentPlanId, currentSub);

//   const isCurrent = plan.id === currentPlanId;

//   const rows = [
//     ["Plan", plan.planName],
//     ["Duration", durationLabel(plan.durationDays, cycles)],
//     [
//       "Valid Until",
//       validUntil.toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       }),
//     ],
//     ["Price", money(amount)],
//     ["GST (18%)", money(tax)],
//   ];

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
//       <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
//         {/* Header */}
//         <div className="flex items-start justify-between border-b border-slate-200 pb-4">
//           <div>
//             <h2 className="text-xl font-bold text-slate-900">
//               {mode === "renew" ? "Renew Plan" : "Change Plan"}
//             </h2>
//             <p className="mt-1 text-sm text-slate-500">
//               Continue your current plan or switch to another one.
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={onClose}
//             disabled={paying}
//             aria-label="Close"
//             className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
//           >
//             <X size={16} />
//           </button>
//         </div>

//         {/* Plan */}
//         <h3 className="mt-5 text-base font-bold text-slate-900">Plan</h3>

//         <label className="mt-3 block text-sm text-slate-600">Plan</label>
//         <select
//           value={plan.id}
//           onChange={(e) => setPlanId(Number(e.target.value))}
//           disabled={paying}
//           className={`${selectCls} mt-1`}
//         >
//           {plans.map((p) => (
//             <option key={p.id} value={p.id}>
//               {p.planName} ({money(p.price)})
//               {p.id === currentPlanId ? " - Current" : ""}
//             </option>
//           ))}
//         </select>

//         <label className="mt-4 block text-sm text-slate-600">Duration</label>
//         <select
//           value={cycles}
//           onChange={(e) => setCycles(Number(e.target.value))}
//           disabled={paying}
//           className={`${selectCls} mt-1`}
//         >
//           {CYCLE_OPTIONS.map((n) => (
//             <option key={n} value={n}>
//               {durationLabel(plan.durationDays, n)}
//             </option>
//           ))}
//         </select>

//         {/* Summary */}
//         <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
//           {rows.map(([label, value]) => (
//             <div key={label} className="flex items-center justify-between">
//               <span className="text-slate-700">{label}</span>
//               <span className="font-semibold text-slate-900">{value}</span>
//             </div>
//           ))}

//           <div className="flex items-center justify-between border-t border-slate-200 pt-3">
//             <span className="text-slate-700">Total</span>
//             <span className="text-base font-bold text-slate-900">
//               {money(total)}
//             </span>
//           </div>
//         </div>

//         {!isCurrent && (
//           <p className="mt-3 text-xs text-slate-500">
//             Your new plan starts today. The remaining days of your current plan
//             are not carried over.
//           </p>
//         )}

//         {/* Buttons */}
//         <div className="mt-6 flex items-center justify-end gap-3">
//           <button
//             type="button"
//             onClick={onClose}
//             disabled={paying}
//             className="rounded-lg border border-slate-800 px-6 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             Cancel
//           </button>

//           <button
//             type="button"
//             onClick={() => onPay({ planId: plan.id, cycles })}
//             disabled={paying}
//             className="rounded-lg bg-[#22c55e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {paying ? "Processing..." : "Pay & Continue"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Mounted only while open, so it starts fresh every time it opens
// function PaymentConfirmModal({ isOpen, ...props }) {
//   if (!isOpen || !props.plans?.length) return null;

//   return <ModalBody {...props} />;
// }

// export default PaymentConfirmModal;


import { useMemo, useState } from "react";
import { X } from "lucide-react";

// Duration comes from the plan (set in Super Admin) - always 1 period
const CYCLES = 1;

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

// "1 month", "3 months", "1 year", "14 days" ...
const durationLabel = (durationDays, cycles = 1) => {
  const d = Number(durationDays);

  if (d >= 28 && d <= 31) {
    return cycles === 12
      ? "1 year"
      : `${cycles} month${cycles > 1 ? "s" : ""}`;
  }
  if (d >= 365 && d <= 366) {
    return `${cycles} year${cycles > 1 ? "s" : ""}`;
  }
  return `${d * cycles} days`;
};

// Same rule the server uses:
// same plan + still running  -> add on top of the current expiry
// otherwise                  -> start today
const calcValidUntil = (plan, cycles, currentPlanId, currentSub) => {
  const now = new Date();

  const stillRunning =
    currentPlanId === plan.id &&
    currentSub?.status === "ACTIVE" &&
    currentSub?.expiryDate &&
    new Date(currentSub.expiryDate) > now;

  const from = new Date(stillRunning ? currentSub.expiryDate : now);
  from.setDate(from.getDate() + plan.durationDays * cycles);

  return from;
};

const selectCls =
  "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] disabled:opacity-60";

function ModalBody({
  mode,
  plans,
  currentPlanId,
  currentSub,
  initialPlanId,
  paying,
  onClose,
  onPay,
}) {
  const [planId, setPlanId] = useState(initialPlanId);
  const cycles = CYCLES;

  const plan = useMemo(
    () => plans.find((p) => p.id === planId) || plans[0],
    [plans, planId]
  );

  if (!plan) return null;

  const total = Number(plan.price) * cycles;
  const validUntil = calcValidUntil(plan, cycles, currentPlanId, currentSub);

  const isCurrent = plan.id === currentPlanId;

  const rows = [
    ["Plan", plan.planName],
    ["Duration", durationLabel(plan.durationDays, cycles)],
    [
      "Valid Until",
      validUntil.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    ],
    ["Price", money(total)],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {mode === "renew" ? "Renew Plan" : "Change Plan"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Continue your current plan or switch to another one.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={paying}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Plan */}
        <h3 className="mt-5 text-base font-bold text-slate-900">Plan</h3>

        <label className="mt-3 block text-sm text-slate-600">Plan</label>
        <select
          value={plan.id}
          onChange={(e) => setPlanId(Number(e.target.value))}
          disabled={paying}
          className={`${selectCls} mt-1`}
        >
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.planName} ({money(p.price)})
              {p.id === currentPlanId ? " - Current" : ""}
            </option>
          ))}
        </select>

        {/* Summary */}
        <div className="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-slate-700">{label}</span>
              <span className="font-semibold text-slate-900">{value}</span>
            </div>
          ))}

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <span className="text-slate-700">Total</span>
            <span className="text-base font-bold text-slate-900">
              {money(total)}
            </span>
          </div>
        </div>

        {!isCurrent && (
          <p className="mt-3 text-xs text-slate-500">
            Your new plan starts today. The remaining days of your current plan
            are not carried over.
          </p>
        )}

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={paying}
            className="rounded-lg border border-slate-800 px-6 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onPay({ planId: plan.id, cycles })}
            disabled={paying}
            className="rounded-lg bg-[#22c55e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paying ? "Processing..." : "Pay & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Mounted only while open, so it starts fresh every time it opens
function PaymentConfirmModal({ isOpen, ...props }) {
  if (!isOpen || !props.plans?.length) return null;

  return <ModalBody {...props} />;
}

export default PaymentConfirmModal;
