// // frontend/src/components/proposals/ProposalPreview.jsx   (NEW FILE)
// // Live preview shown beside the proposal form. Shows the same layout
// // as the PDF. Also exports the totals calculation used by the form.

// export const CURRENCIES = [
//   { code: "INR", symbol: "₹", label: "INR (₹)" },
//   { code: "USD", symbol: "$", label: "USD ($)" },
//   { code: "EUR", symbol: "€", label: "EUR (€)" },
//   { code: "GBP", symbol: "£", label: "GBP (£)" },
//   { code: "AED", symbol: "AED ", label: "AED" },
// ];

// export const currencySymbol = (code) =>
//   CURRENCIES.find((c) => c.code === code)?.symbol ?? `${code} `;

// export const formatMoney = (value, currency) =>
//   `${currencySymbol(currency)}${(Number(value) || 0).toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;

// // Same formula as the backend (the backend recalculates on save anyway)
// export const calculateTotals = (items = []) => {
//   let subtotal = 0;
//   let discountTotal = 0;
//   let taxTotal = 0;

//   const lines = items.map((it) => {
//     const qty = Number(it.quantity) || 0;
//     const price = Number(it.unitPrice) || 0;
//     const discPct = Number(it.discountPercent) || 0;
//     const taxPct = Number(it.taxPercent) || 0;

//     const base = qty * price;
//     const discount = base * (discPct / 100);
//     const taxable = base - discount;
//     const tax = taxable * (taxPct / 100);

//     subtotal += base;
//     discountTotal += discount;
//     taxTotal += tax;

//     return taxable + tax;
//   });

//   return {
//     lines,
//     subtotal,
//     discountTotal,
//     taxTotal,
//     total: subtotal - discountTotal + taxTotal,
//   };
// };

// const formatDate = (d) =>
//   d
//     ? new Date(d).toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       })
//     : "";

// function ProposalPreview({ proposal, customer, company }) {
//   const totals = calculateTotals(proposal.items);
//   const cur = proposal.currency || "INR";

//   return (
//     <div className="rounded-xl border border-gray-200 bg-white p-6 text-[13px] text-gray-800 shadow-sm">
//       {/* HEADER */}
//       <div className="flex items-start justify-between gap-4">
//         <div className="flex min-w-0 items-start gap-3">
//           {company?.logo && (
//             <img
//               src={company.logo}
//               alt=""
//               className="h-12 w-12 shrink-0 object-contain"
//             />
//           )}
//           <div className="min-w-0">
//             <p className="truncate text-base font-bold">
//               {company?.companyName || "Your company"}
//             </p>
//           </div>
//         </div>

//         <div className="shrink-0 text-right">
//           <p className="text-xl font-bold text-teal-700">PROPOSAL</p>
//           <p className="text-xs text-gray-500">
//             No: {proposal.proposalNumber || "Auto-generated on save"}
//           </p>
//           <p className="text-xs text-gray-500">
//             Date: {formatDate(proposal.issueDate || new Date())}
//           </p>
//           {proposal.validUntil && (
//             <p className="text-xs text-gray-500">
//               Valid until: {formatDate(proposal.validUntil)}
//             </p>
//           )}
//         </div>
//       </div>

//       <hr className="my-4 border-gray-200" />

//       {/* PREPARED FOR */}
//       <p className="text-[10px] font-bold tracking-wide text-gray-500">
//         PREPARED FOR
//       </p>
//       {customer ? (
//         <div className="mt-1">
//           <p className="font-semibold">{customer.name}</p>
//           {customer.companyName && (
//             <p className="text-xs text-gray-500">{customer.companyName}</p>
//           )}
//           {customer.phone && (
//             <p className="text-xs text-gray-500">{customer.phone}</p>
//           )}
//         </div>
//       ) : (
//         <p className="mt-1 text-xs italic text-gray-400">
//           Select a customer
//         </p>
//       )}

//       {/* TITLE + INTRO */}
//       <h2 className="mt-5 text-lg font-bold">
//         {proposal.title || "Proposal title"}
//       </h2>

//       {proposal.introMessage && (
//         <p className="mt-2 whitespace-pre-wrap">{proposal.introMessage}</p>
//       )}

//       {proposal.scope && (
//         <>
//           <h3 className="mt-5 font-bold text-teal-700">Scope of Work</h3>
//           <p className="mt-1 whitespace-pre-wrap">{proposal.scope}</p>
//         </>
//       )}

//       {/* ITEMS */}
//       <h3 className="mt-5 font-bold text-teal-700">Pricing</h3>

//       <div className="mt-2 overflow-x-auto">
//         <table className="w-full min-w-[420px] text-left text-xs">
//           <thead>
//             <tr className="bg-gray-100 text-[10px] uppercase text-gray-600">
//               <th className="px-2 py-2">Item</th>
//               <th className="px-2 py-2 text-right">Qty</th>
//               <th className="px-2 py-2 text-right">Price</th>
//               <th className="px-2 py-2 text-right">Disc</th>
//               <th className="px-2 py-2 text-right">Tax</th>
//               <th className="px-2 py-2 text-right">Total</th>
//             </tr>
//           </thead>
//           <tbody>
//             {proposal.items.map((it, i) => (
//               <tr key={i} className="border-b border-gray-100 align-top">
//                 <td className="px-2 py-2">
//                   <p className="font-semibold">{it.name || "Item name"}</p>
//                   {it.description && (
//                     <p className="text-[11px] text-gray-500">
//                       {it.description}
//                     </p>
//                   )}
//                 </td>
//                 <td className="px-2 py-2 text-right">{it.quantity || 0}</td>
//                 <td className="px-2 py-2 text-right">
//                   {formatMoney(it.unitPrice, cur)}
//                 </td>
//                 <td className="px-2 py-2 text-right">
//                   {Number(it.discountPercent) || 0}%
//                 </td>
//                 <td className="px-2 py-2 text-right">
//                   {Number(it.taxPercent) || 0}%
//                 </td>
//                 <td className="px-2 py-2 text-right font-medium">
//                   {formatMoney(totals.lines[i], cur)}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* TOTALS */}
//       <div className="mt-3 ml-auto w-full max-w-[240px] space-y-1 text-xs">
//         <div className="flex justify-between">
//           <span>Subtotal</span>
//           <span>{formatMoney(totals.subtotal, cur)}</span>
//         </div>
//         {totals.discountTotal > 0 && (
//           <div className="flex justify-between">
//             <span>Discount</span>
//             <span>- {formatMoney(totals.discountTotal, cur)}</span>
//           </div>
//         )}
//         <div className="flex justify-between">
//           <span>Tax</span>
//           <span>{formatMoney(totals.taxTotal, cur)}</span>
//         </div>
//         <div className="flex justify-between border-t border-gray-200 pt-1 text-sm font-bold text-teal-700">
//           <span>Total</span>
//           <span>{formatMoney(totals.total, cur)}</span>
//         </div>
//       </div>

//       {proposal.paymentDetails && (
//         <>
//           <h3 className="mt-5 font-bold text-teal-700">Payment Details</h3>
//           <p className="mt-1 whitespace-pre-wrap">
//             {proposal.paymentDetails}
//           </p>
//         </>
//       )}

//       {proposal.terms && (
//         <>
//           <h3 className="mt-5 font-bold text-teal-700">Terms &amp; Conditions</h3>
//           <p className="mt-1 whitespace-pre-wrap">{proposal.terms}</p>
//         </>
//       )}
//     </div>
//   );
// }

// export default ProposalPreview;


// Live preview of the proposal (paper-style document, same sections as the PDF).
// Also exports the currency list + totals calculation used by the form.

export const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "INR (₹)" },
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "AED", symbol: "AED ", label: "AED" },
];

export const currencySymbol = (code) =>
  CURRENCIES.find((c) => c.code === code)?.symbol ?? `${code} `;

export const formatMoney = (value, currency) =>
  `${currencySymbol(currency)}${(Number(value) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Same formula as the backend (the backend recalculates on save anyway)
export const calculateTotals = (items = []) => {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;

  const lines = items.map((it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.unitPrice) || 0;
    const discPct = Number(it.discountPercent) || 0;
    const taxPct = Number(it.taxPercent) || 0;

    const base = qty * price;
    const discount = base * (discPct / 100);
    const taxable = base - discount;
    const tax = taxable * (taxPct / 100);

    subtotal += base;
    discountTotal += discount;
    taxTotal += tax;

    return taxable + tax;
  });

  return {
    lines,
    subtotal,
    discountTotal,
    taxTotal,
    total: subtotal - discountTotal + taxTotal,
  };
};

export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

function Section({ title, children }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full bg-[#128C7E]" />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
          {title}
        </h3>
      </div>
      <div className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">
        {children}
      </div>
    </section>
  );
}

// `proposal` uses the builder form shape (clientName, clientCompany, ...).
// Older saved proposals can pass `customer` as a fallback.
function ProposalPreview({ proposal, customer, company }) {
  const items = proposal.items || [];
  const totals = calculateTotals(items);
  const cur = proposal.currency || "INR";

  const clientName = proposal.clientName || customer?.name || "";
  const clientCompany = proposal.clientCompany || customer?.companyName || "";
  const clientPhone = proposal.clientPhone || customer?.phone || "";
  const clientEmail = proposal.clientEmail || customer?.email || "";

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-800 shadow-lg">
      {/* brand strip */}
      <div className="h-2 bg-gradient-to-r from-[#25D366] to-[#128C7E]" />

      <div className="p-6 sm:p-8">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {company?.logo ? (
              <img
                src={company.logo}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/15 text-lg font-bold text-[#128C7E]">
                {(company?.companyName || "C").charAt(0).toUpperCase()}
              </div>
            )}
            <p className="truncate text-base font-bold text-gray-900">
              {company?.companyName || "Your company"}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-2xl font-extrabold tracking-wide text-[#128C7E]">
              PROPOSAL
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              {proposal.proposalNumber || "No. auto-generated on save"}
            </p>
          </div>
        </div>

        {/* META */}
        <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Prepared for
            </p>
            {clientName ? (
              <div className="mt-1.5 space-y-0.5">
                <p className="text-sm font-semibold text-gray-900">
                  {clientName}
                </p>
                {clientCompany && (
                  <p className="text-xs text-gray-600">{clientCompany}</p>
                )}
                {clientPhone && (
                  <p className="text-xs text-gray-500">{clientPhone}</p>
                )}
                {clientEmail && (
                  <p className="break-all text-xs text-gray-500">
                    {clientEmail}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1.5 text-xs italic text-gray-400">
                Client name appears here
              </p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Issue date
            </p>
            <p className="mt-1.5 text-sm font-medium">
              {formatDate(proposal.issueDate || new Date())}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Valid until
            </p>
            <p className="mt-1.5 text-sm font-medium">
              {proposal.validUntil ? formatDate(proposal.validUntil) : "-"}
            </p>
          </div>
        </div>

        {/* TITLE */}
        <h2 className="mt-7 text-xl font-bold leading-snug text-gray-900">
          {proposal.title || (
            <span className="font-medium italic text-gray-300">
              Proposal title
            </span>
          )}
        </h2>

        {proposal.introMessage && (
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">
            {proposal.introMessage}
          </p>
        )}

        {proposal.scope && (
          <Section title="Scope of work">{proposal.scope}</Section>
        )}

        {/* PRICING */}
        <section className="mt-6">
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-[#128C7E]" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Pricing
            </h3>
          </div>

          <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[460px] text-left text-xs">
              <thead>
                <tr className="bg-[#128C7E] text-[10px] uppercase tracking-wide text-white">
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Price</th>
                  <th className="px-3 py-2 text-right font-semibold">Disc</th>
                  <th className="px-3 py-2 text-right font-semibold">Tax</th>
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr
                    key={i}
                    className={`align-top ${i % 2 ? "bg-gray-50/70" : "bg-white"}`}
                  >
                    <td className="px-3 py-2.5">
                      <p
                        className={`font-semibold ${
                          it.name ? "text-gray-900" : "italic text-gray-300"
                        }`}
                      >
                        {it.name || "Item name"}
                      </p>
                      {it.description && (
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {it.description}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {it.quantity || 0}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      {formatMoney(it.unitPrice, cur)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {Number(it.discountPercent) || 0}%
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {Number(it.taxPercent) || 0}%
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-gray-900">
                      {formatMoney(totals.lines[i], cur)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS */}
          <div className="ml-auto mt-3 w-full max-w-[260px] space-y-1.5 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoney(totals.subtotal, cur)}</span>
            </div>
            {totals.discountTotal > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>- {formatMoney(totals.discountTotal, cur)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatMoney(totals.taxTotal, cur)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-[#25D366]/15 px-3 py-2 text-sm font-bold text-[#0b6b5e]">
              <span>Total</span>
              <span>{formatMoney(totals.total, cur)}</span>
            </div>
          </div>
        </section>

        {proposal.paymentDetails && (
          <Section title="Payment details">{proposal.paymentDetails}</Section>
        )}

        {proposal.terms && (
          <Section title="Terms & conditions">{proposal.terms}</Section>
        )}

        <p className="mt-8 border-t border-gray-100 pt-3 text-center text-[10px] text-gray-400">
          Thank you for your business
        </p>
      </div>
    </div>
  );
}

export default ProposalPreview;
