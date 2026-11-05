// // frontend/src/pages/ProposalBuilder.jsx   (NEW FILE)
// // Create / edit a proposal (one full-width form, no live preview).
// //   /proposals/new        -> create
// //   /proposals/:id/edit   -> edit
// import { useEffect, useMemo, useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { ArrowLeft, Plus, Trash2 } from "lucide-react";
// import toast from "react-hot-toast";

// import { getCustomers } from "../api/customerApi";
// import { getServices } from "../api/serviceApi";
// import {
//   createProposal,
//   getProposalById,
//   updateProposal,
// } from "../api/proposalApi";
// import {
//   CURRENCIES,
//   calculateTotals,
//   formatMoney,
// } from "../components/proposals/ProposalPreview";

// const emptyItem = () => ({
//   name: "",
//   description: "",
//   quantity: 1,
//   unitPrice: "",
//   discountPercent: 0,
//   taxPercent: 18,
// });

// const inputClass =
//   "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]";

// const toDateInput = (value) =>
//   value ? new Date(value).toISOString().slice(0, 10) : "";

// function Field({ label, children, hint }) {
//   return (
//     <label className="block">
//       <span className="mb-1 block text-sm font-medium text-gray-700">
//         {label}
//       </span>
//       {children}
//       {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
//     </label>
//   );
// }

// function ProposalBuilder() {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const isEdit = Boolean(id);

//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);

//   const [customers, setCustomers] = useState([]);
//   const [services, setServices] = useState([]);

//   const [form, setForm] = useState({
//     proposalNumber: "",
//     title: "",
//     // Optional link to a saved customer
//     customerId: "",
//     // Who the proposal is for (typed in, or filled from a customer)
//     clientName: "",
//     clientPhone: "",
//     clientEmail: "",
//     clientCompany: "",
//     currency: "INR",
//     validUntil: "",
//     introMessage: "",
//     scope: "",
//     paymentDetails: "",
//     terms: "",
//     items: [emptyItem()],
//   });

//   const setField = (name, value) =>
//     setForm((prev) => ({ ...prev, [name]: value }));

//   // ---------- load customers, services, company (+ proposal when editing) ----------
//   useEffect(() => {
//     let cancelled = false;

//     const load = async () => {
//       try {
//         const [customerRes, serviceRes] = await Promise.all([
//           getCustomers(),
//           getServices({ activeOnly: "true" }),
//         ]);

//         if (cancelled) return;

//         setCustomers(customerRes.customers || []);
//         setServices(serviceRes.services || []);

//         if (isEdit) {
//           const res = await getProposalById(id);
//           if (cancelled) return;

//           const p = res.proposal;

//           setForm({
//             proposalNumber: p.proposalNumber,
//             title: p.title || "",
//             customerId: p.customerId || "",
//             // older proposals only have the linked customer
//             clientName: p.clientName || p.customer?.name || "",
//             clientPhone: p.clientPhone || p.customer?.phone || "",
//             clientEmail: p.clientEmail || p.customer?.email || "",
//             clientCompany: p.clientCompany || p.customer?.companyName || "",
//             currency: p.currency || "INR",
//             validUntil: toDateInput(p.validUntil),
//             introMessage: p.introMessage || "",
//             scope: p.scope || "",
//             paymentDetails: p.paymentDetails || "",
//             terms: p.terms || "",
//             items:
//               Array.isArray(p.items) && p.items.length > 0
//                 ? p.items.map((it) => ({
//                     name: it.name || "",
//                     description: it.description || "",
//                     quantity: it.quantity,
//                     unitPrice: it.unitPrice,
//                     discountPercent: it.discountPercent || 0,
//                     taxPercent: it.taxPercent || 0,
//                   }))
//                 : [emptyItem()],
//           });
//         }
//       } catch (error) {
//         console.error("Load proposal builder error:", error);
//         toast.error(
//           error?.response?.data?.message || "Failed to load proposal data"
//         );

//         if (isEdit) navigate("/proposals");
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };

//     load();

//     return () => {
//       cancelled = true;
//     };
//   }, [id, isEdit, navigate]);

//   // Picking a saved customer fills the client fields (they can still be
//   // edited). Choosing "no customer" keeps whatever is typed.
//   const handlePickCustomer = (customerId) => {
//     const customer = customers.find((c) => c.id === customerId);

//     if (!customer) {
//       setField("customerId", "");
//       return;
//     }

//     setForm((prev) => ({
//       ...prev,
//       customerId: customer.id,
//       clientName: customer.name || "",
//       clientPhone: customer.phone || "",
//       clientEmail: customer.email || "",
//       clientCompany: customer.companyName || "",
//     }));
//   };

//   const totals = useMemo(() => calculateTotals(form.items), [form.items]);

//   // ---------- items ----------
//   const updateItem = (index, name, value) =>
//     setForm((prev) => ({
//       ...prev,
//       items: prev.items.map((it, i) =>
//         i === index ? { ...it, [name]: value } : it
//       ),
//     }));

//   const addItem = () =>
//     setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

//   const addServiceItem = (serviceId) => {
//     const service = services.find((s) => s.id === serviceId);
//     if (!service) return;

//     setForm((prev) => {
//       // Replace the first empty row instead of leaving a blank one behind
//       const firstEmpty = prev.items.findIndex(
//         (it) => !it.name.trim() && !it.unitPrice
//       );

//       const newItem = {
//         ...emptyItem(),
//         name: service.name,
//         description: service.description || "",
//       };

//       if (firstEmpty >= 0) {
//         return {
//           ...prev,
//           items: prev.items.map((it, i) => (i === firstEmpty ? newItem : it)),
//         };
//       }

//       return { ...prev, items: [...prev.items, newItem] };
//     });
//   };

//   const removeItem = (index) =>
//     setForm((prev) => ({
//       ...prev,
//       items:
//         prev.items.length === 1
//           ? [emptyItem()]
//           : prev.items.filter((_, i) => i !== index),
//     }));

//   // ---------- save ----------
//   const handleSave = async (e) => {
//     e.preventDefault();

//     if (saving) return;

//     if (!form.title.trim()) return toast.error("Proposal title is required");
//     if (!form.clientName.trim()) return toast.error("Client name is required");

//     const hasBadItem = form.items.some(
//       (it) =>
//         !it.name.trim() ||
//         !(Number(it.quantity) > 0) ||
//         it.unitPrice === "" ||
//         Number(it.unitPrice) < 0
//     );

//     if (hasBadItem) {
//       return toast.error(
//         "Every item needs a name, a quantity above 0 and a price"
//       );
//     }

//     const payload = {
//       title: form.title.trim(),
//       customerId: form.customerId || null,
//       clientName: form.clientName.trim(),
//       clientPhone: form.clientPhone.trim(),
//       clientEmail: form.clientEmail.trim(),
//       clientCompany: form.clientCompany.trim(),
//       currency: form.currency,
//       validUntil: form.validUntil || null,
//       introMessage: form.introMessage,
//       scope: form.scope,
//       paymentDetails: form.paymentDetails,
//       terms: form.terms,
//       items: form.items.map((it) => ({
//         name: it.name.trim(),
//         description: it.description.trim(),
//         quantity: Number(it.quantity),
//         unitPrice: Number(it.unitPrice),
//         discountPercent: Number(it.discountPercent) || 0,
//         taxPercent: Number(it.taxPercent) || 0,
//       })),
//     };

//     try {
//       setSaving(true);

//       if (isEdit) {
//         await updateProposal(id, payload);
//         toast.success("Proposal updated");
//       } else {
//         await createProposal(payload);
//         toast.success("Proposal created");
//       }

//       navigate("/proposals");
//     } catch (error) {
//       console.error("Save proposal error:", error);
//       toast.error(error?.response?.data?.message || "Failed to save proposal");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return <div className="p-8 text-center text-gray-500">Loading...</div>;
//   }

//   return (
//     <div className="p-4 sm:p-6">
//       {/* TOP BAR */}
//       <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
//         <div className="flex items-center gap-3">
//           <button
//             type="button"
//             onClick={() => navigate("/proposals")}
//             className="rounded-full bg-white p-2 shadow transition hover:bg-gray-100"
//             aria-label="Back to proposals"
//           >
//             <ArrowLeft size={18} />
//           </button>
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">
//               {isEdit ? "Edit Proposal" : "New Proposal"}
//             </h1>
//             {isEdit && (
//               <p className="text-sm text-gray-500">{form.proposalNumber}</p>
//             )}
//           </div>
//         </div>

//         <div className="flex gap-2">
//           <button
//             type="button"
//             onClick={() => navigate("/proposals")}
//             className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
//           >
//             Cancel
//           </button>
//           <button
//             type="button"
//             onClick={handleSave}
//             disabled={saving}
//             className="rounded-lg bg-[#25D366] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#1ebe5a] disabled:opacity-60"
//           >
//             {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Proposal"}
//           </button>
//         </div>
//       </div>

//       <div className="mx-auto max-w-4xl">
//         {/* ================= FORM ================= */}
//         <form onSubmit={handleSave} className="space-y-5">
//           <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//             <h2 className="font-semibold text-gray-900">Client details</h2>

//             <Field
//               label="Choose an existing customer (optional)"
//               hint="Fills the fields below. You can also leave this empty and type the details yourself."
//             >
//               <select
//                 className={inputClass}
//                 value={form.customerId}
//                 onChange={(e) => handlePickCustomer(e.target.value)}
//               >
//                 <option value="">Not a saved customer / type details below</option>
//                 {customers.map((c) => (
//                   <option key={c.id} value={c.id}>
//                     {c.name} - {c.phone}
//                   </option>
//                 ))}
//               </select>
//             </Field>

//             <div className="grid gap-4 sm:grid-cols-2">
//               <Field label="Client name *">
//                 <input
//                   className={inputClass}
//                   value={form.clientName}
//                   maxLength={150}
//                   placeholder="e.g. Ravi Kumar"
//                   onChange={(e) => setField("clientName", e.target.value)}
//                 />
//               </Field>

//               <Field label="Company name">
//                 <input
//                   className={inputClass}
//                   value={form.clientCompany}
//                   maxLength={150}
//                   placeholder="Optional"
//                   onChange={(e) => setField("clientCompany", e.target.value)}
//                 />
//               </Field>

//               <Field
//                 label="Phone (WhatsApp)"
//                 hint="Needed to send on WhatsApp. Add the country code for non-Indian numbers."
//               >
//                 <input
//                   type="tel"
//                   className={inputClass}
//                   value={form.clientPhone}
//                   maxLength={20}
//                   placeholder="e.g. 9876543210"
//                   onChange={(e) => setField("clientPhone", e.target.value)}
//                 />
//               </Field>

//               <Field label="Email">
//                 <input
//                   type="email"
//                   className={inputClass}
//                   value={form.clientEmail}
//                   maxLength={150}
//                   placeholder="Optional"
//                   onChange={(e) => setField("clientEmail", e.target.value)}
//                 />
//               </Field>
//             </div>
//           </div>

//           <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//             <h2 className="font-semibold text-gray-900">Basic details</h2>

//             <Field label="Proposal title *">
//               <input
//                 className={inputClass}
//                 value={form.title}
//                 maxLength={150}
//                 placeholder="e.g. Website Design & Development"
//                 onChange={(e) => setField("title", e.target.value)}
//               />
//             </Field>

//             <div className="grid gap-4 sm:grid-cols-2">
//               <Field label="Currency">
//                 <select
//                   className={inputClass}
//                   value={form.currency}
//                   onChange={(e) => setField("currency", e.target.value)}
//                 >
//                   {CURRENCIES.map((c) => (
//                     <option key={c.code} value={c.code}>
//                       {c.label}
//                     </option>
//                   ))}
//                 </select>
//               </Field>

//               <Field label="Valid until">
//                 <input
//                   type="date"
//                   className={inputClass}
//                   value={form.validUntil}
//                   onChange={(e) => setField("validUntil", e.target.value)}
//                 />
//               </Field>
//             </div>

//             <Field label="Intro message">
//               <textarea
//                 rows={3}
//                 className={inputClass}
//                 value={form.introMessage}
//                 maxLength={5000}
//                 placeholder="A short greeting that opens the proposal"
//                 onChange={(e) => setField("introMessage", e.target.value)}
//               />
//             </Field>

//             <Field label="Scope of work">
//               <textarea
//                 rows={4}
//                 className={inputClass}
//                 value={form.scope}
//                 maxLength={5000}
//                 placeholder="What you will deliver"
//                 onChange={(e) => setField("scope", e.target.value)}
//               />
//             </Field>
//           </div>

//           {/* ITEMS */}
//           <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//             <div className="flex flex-wrap items-center justify-between gap-2">
//               <h2 className="font-semibold text-gray-900">Items</h2>

//               {services.length > 0 && (
//                 <select
//                   className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
//                   value=""
//                   onChange={(e) => addServiceItem(e.target.value)}
//                 >
//                   <option value="">+ Add from services</option>
//                   {services.map((s) => (
//                     <option key={s.id} value={s.id}>
//                       {s.name}
//                     </option>
//                   ))}
//                 </select>
//               )}
//             </div>

//             {form.items.map((item, index) => (
//               <div
//                 key={index}
//                 className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
//               >
//                 <div className="flex items-start gap-2">
//                   <input
//                     className={inputClass}
//                     placeholder="Item name *"
//                     value={item.name}
//                     maxLength={200}
//                     onChange={(e) => updateItem(index, "name", e.target.value)}
//                   />
//                   <button
//                     type="button"
//                     onClick={() => removeItem(index)}
//                     className="rounded-lg p-2 text-red-500 hover:bg-red-50"
//                     aria-label="Remove item"
//                   >
//                     <Trash2 size={16} />
//                   </button>
//                 </div>

//                 <input
//                   className={inputClass}
//                   placeholder="Description (optional)"
//                   value={item.description}
//                   maxLength={1000}
//                   onChange={(e) =>
//                     updateItem(index, "description", e.target.value)
//                   }
//                 />

//                 <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
//                   <Field label="Qty">
//                     <input
//                       type="number"
//                       min="0"
//                       step="any"
//                       className={inputClass}
//                       value={item.quantity}
//                       onChange={(e) =>
//                         updateItem(index, "quantity", e.target.value)
//                       }
//                     />
//                   </Field>
//                   <Field label="Price">
//                     <input
//                       type="number"
//                       min="0"
//                       step="any"
//                       className={inputClass}
//                       value={item.unitPrice}
//                       onChange={(e) =>
//                         updateItem(index, "unitPrice", e.target.value)
//                       }
//                     />
//                   </Field>
//                   <Field label="Discount %">
//                     <input
//                       type="number"
//                       min="0"
//                       max="100"
//                       step="any"
//                       className={inputClass}
//                       value={item.discountPercent}
//                       onChange={(e) =>
//                         updateItem(index, "discountPercent", e.target.value)
//                       }
//                     />
//                   </Field>
//                   <Field label="Tax / GST %">
//                     <input
//                       type="number"
//                       min="0"
//                       max="100"
//                       step="any"
//                       className={inputClass}
//                       value={item.taxPercent}
//                       onChange={(e) =>
//                         updateItem(index, "taxPercent", e.target.value)
//                       }
//                     />
//                   </Field>
//                 </div>

//                 <p className="text-right text-sm text-gray-600">
//                   Line total:{" "}
//                   <span className="font-semibold text-gray-900">
//                     {formatMoney(totals.lines[index], form.currency)}
//                   </span>
//                 </p>
//               </div>
//             ))}

//             <button
//               type="button"
//               onClick={addItem}
//               className="flex items-center gap-1 rounded-lg border border-dashed border-gray-400 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
//             >
//               <Plus size={16} /> Add item
//             </button>

//             <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Subtotal</span>
//                 <span>{formatMoney(totals.subtotal, form.currency)}</span>
//               </div>
//               {totals.discountTotal > 0 && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">Discount</span>
//                   <span>- {formatMoney(totals.discountTotal, form.currency)}</span>
//                 </div>
//               )}
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Tax</span>
//                 <span>{formatMoney(totals.taxTotal, form.currency)}</span>
//               </div>
//               <div className="flex justify-between border-t border-gray-200 pt-1 text-base font-bold">
//                 <span>Total</span>
//                 <span>{formatMoney(totals.total, form.currency)}</span>
//               </div>
//             </div>
//           </div>

//           {/* PAYMENT + TERMS */}
//           <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
//             <h2 className="font-semibold text-gray-900">Payment &amp; terms</h2>

//             <Field
//               label="Payment details"
//               hint="Bank name, account number, IFSC, UPI id etc."
//             >
//               <textarea
//                 rows={3}
//                 className={inputClass}
//                 value={form.paymentDetails}
//                 maxLength={5000}
//                 onChange={(e) => setField("paymentDetails", e.target.value)}
//               />
//             </Field>

//             <Field label="Terms & conditions">
//               <textarea
//                 rows={4}
//                 className={inputClass}
//                 value={form.terms}
//                 maxLength={5000}
//                 placeholder="e.g. 50% advance, balance on delivery"
//                 onChange={(e) => setField("terms", e.target.value)}
//               />
//             </Field>
//           </div>

//           <div className="flex justify-end gap-2 pb-6">
//             <button
//               type="button"
//               onClick={() => navigate("/proposals")}
//               className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={saving}
//               className="rounded-lg bg-[#25D366] px-5 py-2 text-sm font-semibold text-black transition hover:bg-[#1ebe5a] disabled:opacity-60"
//             >
//               {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Proposal"}
//             </button>
//           </div>
//         </form>

//       </div>
//     </div>
//   );
// }

// export default ProposalBuilder;



// Create / edit a proposal: fill the form, click Preview, then Save from the preview.
//   /proposals/new        -> create
//   /proposals/:id/edit   -> edit
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  FileText,
  Package,
  Pencil,
  Plus,
  Save,
  ScrollText,
  Trash2,
  User,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { getCustomers } from "../api/customerApi";
import { getServices } from "../api/serviceApi";
import { getCompanySettings } from "../api/companyApi";
import {
  createProposal,
  getProposalById,
  updateProposal,
} from "../api/proposalApi";
import ProposalPreview, {
  CURRENCIES,
  calculateTotals,
  formatMoney,
} from "../components/proposals/ProposalPreview";

const emptyItem = () => ({
  name: "",
  description: "",
  quantity: 1,
  unitPrice: "",
  discountPercent: 0,
  taxPercent: 18,
});

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/25";

const toDateInput = (value) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function Card({ icon: Icon, title, subtitle, action, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C7E]">
            <Icon size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </div>
  );
}

function ProposalBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [company, setCompany] = useState(null);

  // preview shown before saving
  const [showPreview, setShowPreview] = useState(false);

  const [form, setForm] = useState({
    proposalNumber: "",
    title: "",
    // Optional link to a saved customer
    customerId: "",
    // Who the proposal is for (typed in, or filled from a customer)
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientCompany: "",
    currency: "INR",
    validUntil: "",
    introMessage: "",
    scope: "",
    paymentDetails: "",
    terms: "",
    items: [emptyItem()],
  });

  const setField = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  // ---------- load customers, services, company (+ proposal when editing) ----------
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [customerRes, serviceRes] = await Promise.all([
          getCustomers(),
          getServices({ activeOnly: "true" }),
        ]);

        if (cancelled) return;

        // branding is only used by the preview, so never block on it
        getCompanySettings()
          .then((res) => !cancelled && setCompany(res.company || null))
          .catch(() => {});

        setCustomers(customerRes.customers || []);
        setServices(serviceRes.services || []);

        if (isEdit) {
          const res = await getProposalById(id);
          if (cancelled) return;

          const p = res.proposal;

          setForm({
            proposalNumber: p.proposalNumber,
            title: p.title || "",
            customerId: p.customerId || "",
            // older proposals only have the linked customer
            clientName: p.clientName || p.customer?.name || "",
            clientPhone: p.clientPhone || p.customer?.phone || "",
            clientEmail: p.clientEmail || p.customer?.email || "",
            clientCompany: p.clientCompany || p.customer?.companyName || "",
            currency: p.currency || "INR",
            validUntil: toDateInput(p.validUntil),
            introMessage: p.introMessage || "",
            scope: p.scope || "",
            paymentDetails: p.paymentDetails || "",
            terms: p.terms || "",
            items:
              Array.isArray(p.items) && p.items.length > 0
                ? p.items.map((it) => ({
                    name: it.name || "",
                    description: it.description || "",
                    quantity: it.quantity,
                    unitPrice: it.unitPrice,
                    discountPercent: it.discountPercent || 0,
                    taxPercent: it.taxPercent || 0,
                  }))
                : [emptyItem()],
          });
        }
      } catch (error) {
        console.error("Load proposal builder error:", error);
        toast.error(
          error?.response?.data?.message || "Failed to load proposal data"
        );

        if (isEdit) navigate("/proposals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate]);

  // Picking a saved customer fills the client fields (they can still be
  // edited). Choosing "no customer" keeps whatever is typed.
  const handlePickCustomer = (customerId) => {
    const customer = customers.find((c) => c.id === customerId);

    if (!customer) {
      setField("customerId", "");
      return;
    }

    setForm((prev) => ({
      ...prev,
      customerId: customer.id,
      clientName: customer.name || "",
      clientPhone: customer.phone || "",
      clientEmail: customer.email || "",
      clientCompany: customer.companyName || "",
    }));
  };

  const totals = useMemo(() => calculateTotals(form.items), [form.items]);

  // Closing the full-screen preview with Esc
  useEffect(() => {
    if (!showPreview) return undefined;
    const onKey = (e) => e.key === "Escape" && !saving && setShowPreview(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPreview, saving]);

  // ---------- items ----------
  const updateItem = (index, name, value) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === index ? { ...it, [name]: value } : it
      ),
    }));

  const addItem = () =>
    setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));

  const addServiceItem = (serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    setForm((prev) => {
      // Replace the first empty row instead of leaving a blank one behind
      const firstEmpty = prev.items.findIndex(
        (it) => !it.name.trim() && !it.unitPrice
      );

      const newItem = {
        ...emptyItem(),
        name: service.name,
        description: service.description || "",
      };

      if (firstEmpty >= 0) {
        return {
          ...prev,
          items: prev.items.map((it, i) => (i === firstEmpty ? newItem : it)),
        };
      }

      return { ...prev, items: [...prev.items, newItem] };
    });
  };

  const removeItem = (index) =>
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length === 1
          ? [emptyItem()]
          : prev.items.filter((_, i) => i !== index),
    }));

  // ---------- validate + build payload ----------
  const buildPayload = () => {
    if (!form.title.trim()) {
      toast.error("Proposal title is required");
      return null;
    }
    if (!form.clientName.trim()) {
      toast.error("Client name is required");
      return null;
    }

    const hasBadItem = form.items.some(
      (it) =>
        !it.name.trim() ||
        !(Number(it.quantity) > 0) ||
        it.unitPrice === "" ||
        Number(it.unitPrice) < 0
    );

    if (hasBadItem) {
      toast.error("Every item needs a name, a quantity above 0 and a price");
      return null;
    }

    return {
      title: form.title.trim(),
      customerId: form.customerId || null,
      clientName: form.clientName.trim(),
      clientPhone: form.clientPhone.trim(),
      clientEmail: form.clientEmail.trim(),
      clientCompany: form.clientCompany.trim(),
      currency: form.currency,
      validUntil: form.validUntil || null,
      introMessage: form.introMessage,
      scope: form.scope,
      paymentDetails: form.paymentDetails,
      terms: form.terms,
      items: form.items.map((it) => ({
        name: it.name.trim(),
        description: it.description.trim(),
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        discountPercent: Number(it.discountPercent) || 0,
        taxPercent: Number(it.taxPercent) || 0,
      })),
    };
  };

  // Form submit / "Preview" button: validate first, then show the preview
  const handlePreview = (e) => {
    e?.preventDefault();
    if (buildPayload()) setShowPreview(true);
  };

  // ---------- save (from inside the preview) ----------
  const handleSave = async () => {
    if (saving) return;

    const payload = buildPayload();
    if (!payload) {
      setShowPreview(false);
      return;
    }

    try {
      setSaving(true);

      if (isEdit) {
        await updateProposal(id, payload);
        toast.success("Proposal updated");
      } else {
        await createProposal(payload);
        toast.success("Proposal created");
      }

      navigate("/proposals");
    } catch (error) {
      console.error("Save proposal error:", error);
      toast.error(error?.response?.data?.message || "Failed to save proposal");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  const previewButton = (
    <button
      type="submit"
      className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-[#1ebe5a]"
    >
      <Eye size={16} />
      Preview
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* TOP BAR */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/proposals")}
            className="rounded-full border border-gray-200 bg-white p-2 shadow-sm transition hover:bg-gray-100"
            aria-label="Back to proposals"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? "Edit Proposal" : "New Proposal"}
            </h1>
            <p className="text-sm text-gray-500">
              {isEdit && form.proposalNumber
                ? form.proposalNumber
                : "Fill in the details, then preview before saving"}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* ================= FORM ================= */}
        <form onSubmit={handlePreview} className="space-y-5">
          <Card
            icon={User}
            title="Client details"
            subtitle="Who is this proposal for?"
          >
            <Field
              label="Existing customer"
              hint="Optional. Fills the fields below, which you can still edit."
            >
              <select
                className={inputClass}
                value={form.customerId}
                onChange={(e) => handlePickCustomer(e.target.value)}
              >
                <option value="">Not a saved customer / type details below</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client name *">
                <input
                  className={inputClass}
                  value={form.clientName}
                  maxLength={150}
                  placeholder="e.g. Ravi Kumar"
                  onChange={(e) => setField("clientName", e.target.value)}
                />
              </Field>

              <Field label="Company name">
                <input
                  className={inputClass}
                  value={form.clientCompany}
                  maxLength={150}
                  placeholder="Optional"
                  onChange={(e) => setField("clientCompany", e.target.value)}
                />
              </Field>

              <Field
                label="Phone (WhatsApp)"
                hint="Needed to send on WhatsApp. Add the country code for non-Indian numbers."
              >
                <input
                  type="tel"
                  className={inputClass}
                  value={form.clientPhone}
                  maxLength={20}
                  placeholder="e.g. 9876543210"
                  onChange={(e) => setField("clientPhone", e.target.value)}
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={form.clientEmail}
                  maxLength={150}
                  placeholder="Optional"
                  onChange={(e) => setField("clientEmail", e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <Card
            icon={FileText}
            title="Proposal details"
            subtitle="Title, validity and what you will deliver"
          >
            <Field label="Proposal title *">
              <input
                className={inputClass}
                value={form.title}
                maxLength={150}
                placeholder="e.g. Website Design & Development"
                onChange={(e) => setField("title", e.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Currency">
                <select
                  className={inputClass}
                  value={form.currency}
                  onChange={(e) => setField("currency", e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Valid until">
                <input
                  type="date"
                  className={inputClass}
                  value={form.validUntil}
                  onChange={(e) => setField("validUntil", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Intro message">
              <textarea
                rows={3}
                className={inputClass}
                value={form.introMessage}
                maxLength={5000}
                placeholder="A short greeting that opens the proposal"
                onChange={(e) => setField("introMessage", e.target.value)}
              />
            </Field>

            <Field label="Scope of work">
              <textarea
                rows={4}
                className={inputClass}
                value={form.scope}
                maxLength={5000}
                placeholder="What you will deliver"
                onChange={(e) => setField("scope", e.target.value)}
              />
            </Field>
          </Card>

          {/* ITEMS */}
          <Card
            icon={Package}
            title="Items & pricing"
            subtitle={`${form.items.length} item${
              form.items.length > 1 ? "s" : ""
            }`}
            action={
              services.length > 0 && (
                <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
                  value=""
                  onChange={(e) => addServiceItem(e.target.value)}
                >
                  <option value="">+ Add from services</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )
            }
          >
            {form.items.map((item, index) => (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-[11px] font-bold text-white">
                    {index + 1}
                  </span>
                  <input
                    className={inputClass}
                    placeholder="Item name *"
                    value={item.name}
                    maxLength={200}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <input
                  className={inputClass}
                  placeholder="Description (optional)"
                  value={item.description}
                  maxLength={1000}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Field label="Qty">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={inputClass}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, "quantity", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Price">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={inputClass}
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(index, "unitPrice", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Discount %">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      className={inputClass}
                      value={item.discountPercent}
                      onChange={(e) =>
                        updateItem(index, "discountPercent", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Tax / GST %">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      className={inputClass}
                      value={item.taxPercent}
                      onChange={(e) =>
                        updateItem(index, "taxPercent", e.target.value)
                      }
                    />
                  </Field>
                </div>

                <p className="text-right text-sm text-gray-500">
                  Line total{" "}
                  <span className="ml-1 font-bold text-gray-900">
                    {formatMoney(totals.lines[index], form.currency)}
                  </span>
                </p>
              </div>
            ))}

            <button
              type="button"
              onClick={addItem}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-[#25D366] hover:bg-[#25D366]/5 hover:text-[#128C7E]"
            >
              <Plus size={16} /> Add item
            </button>

            <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatMoney(totals.subtotal, form.currency)}</span>
              </div>
              {totals.discountTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span>- {formatMoney(totals.discountTotal, form.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatMoney(totals.taxTotal, form.currency)}</span>
              </div>
              <div className="flex justify-between rounded-lg bg-[#25D366]/15 px-3 py-2 text-base font-bold text-[#0b6b5e]">
                <span>Total</span>
                <span>{formatMoney(totals.total, form.currency)}</span>
              </div>
            </div>
          </Card>

          {/* PAYMENT + TERMS */}
          <Card
            icon={ScrollText}
            title="Payment & terms"
            subtitle="How and when you get paid"
          >
            <Field
              label="Payment details"
              hint="Bank name, account number, IFSC, UPI id etc."
            >
              <textarea
                rows={3}
                className={inputClass}
                value={form.paymentDetails}
                maxLength={5000}
                onChange={(e) => setField("paymentDetails", e.target.value)}
              />
            </Field>

            <Field label="Terms & conditions">
              <textarea
                rows={4}
                className={inputClass}
                value={form.terms}
                maxLength={5000}
                placeholder="e.g. 50% advance, balance on delivery"
                onChange={(e) => setField("terms", e.target.value)}
              />
            </Field>
          </Card>

          <div className="flex flex-wrap justify-end gap-2 pb-6">
            <button
              type="button"
              onClick={() => navigate("/proposals")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            {previewButton}
          </div>
        </form>
      </div>

      {/* ================= PREVIEW BEFORE SAVE ================= */}
      {showPreview && (
        <div
          className="fixed inset-0 z-[10000] flex flex-col bg-black/60 p-3 sm:p-6"
          onClick={() => !saving && setShowPreview(false)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-gray-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Proposal preview
                </h2>
                <p className="text-xs text-gray-500">
                  Check everything, then save. Nothing is saved until you click Save.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowPreview(false)}
                  className="rounded-full p-2 hover:bg-gray-100 disabled:opacity-50"
                  aria-label="Close preview"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <ProposalPreview proposal={form} company={company} />
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                <Pencil size={14} /> Back to edit
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-[#1ebe5a] disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Proposal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProposalBuilder;


