// import { useEffect, useMemo, useState } from "react";
// import { toast } from "react-hot-toast";
// import {
//   Bell,
//   Building2,
//   ChevronDown,
//   CircleAlert,
//   ClipboardList,
//   Clock,
//   LifeBuoy,
//   LoaderCircle,
//   MessageCircle,
//   Phone,
//   Users,
// } from "lucide-react";

// import {
//   getAiSettings,
//   updateAiSettings,
//   testAiSettings,
// } from "../../api/aiSettingsApi";

// // =====================================================
// // CONSTANTS
// // =====================================================

// const TONES = [
//   { id: "FRIENDLY", label: "Friendly" },
//   { id: "PROFESSIONAL", label: "Professional" },
//   { id: "CASUAL", label: "Casual" },
//   { id: "FORMAL", label: "Formal" },
// ];

// const MAX_PROMPT_LENGTH = 4000;

// const EMPTY_PROFILE = {
//   businessName: "",
//   description: "",
//   workingHours: "",
//   location: "",
//   contact: "",
//   languages: "",
//   policies: "",
//   tone: "FRIENDLY",
// };

// const EMPTY_CONTACT = {
//   enabled: false,
//   name: false,
//   phone: false,
//   email: false,
//   other: "",
//   wording: "",
// };

// const EMPTY_FORM = {
//   isEnabled: false,
//   leadCaptureEnabled: false,
//   leadAssigneeId: "",
//   leadAutoAssign: false,
//   contactRequest: EMPTY_CONTACT,
//   businessProfile: EMPTY_PROFILE,
//   systemPrompt: "",
//   historyLimit: 10,
// };

// const HOW_IT_WORKS = [
//   "A customer sends a WhatsApp message to your business.",
//   "If auto-reply is on, the AI reads the recent conversation.",
//   "It replies in your tone using only your business details.",
//   "New people are added to your CRM as leads.",
//   "When your team replies manually, the AI steps back from that chat.",
// ];

// // Map the settings coming from the server to the form shape
// const toForm = (settings) => ({
//   isEnabled: settings.isEnabled,
//   leadCaptureEnabled: Boolean(settings.leadCaptureEnabled),
//   leadAssigneeId: settings.leadAssigneeId || "",
//   leadAutoAssign: Boolean(settings.leadAutoAssign),
//   contactRequest: { ...EMPTY_CONTACT, ...(settings.contactRequest || {}) },
//   businessProfile: { ...EMPTY_PROFILE, ...(settings.businessProfile || {}) },
//   systemPrompt: settings.systemPrompt || "",
//   historyLimit: settings.historyLimit || 10,
// });

// const errorMessage = (error, fallback) =>
//   error?.response?.data?.message || fallback;

// // =====================================================
// // SMALL UI PIECES
// // =====================================================

// const inputClass =
//   "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#25D366] focus:outline-none focus:ring-4 focus:ring-[#25D366]/10 disabled:cursor-not-allowed disabled:opacity-60";

// function Card({ icon: Icon, title, subtitle, action, children }) {
//   return (
//     <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
//       <div className="flex items-start justify-between gap-4">
//         <div className="flex items-start gap-3">
//           {Icon && (
//             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
//               <Icon size={19} />
//             </div>
//           )}

//           <div className="min-w-0">
//             <h2 className="text-base font-semibold text-slate-900">{title}</h2>
//             {subtitle && (
//               <p className="mt-0.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
//                 {subtitle}
//               </p>
//             )}
//           </div>
//         </div>

//         {action}
//       </div>

//       {children && <div className="mt-5">{children}</div>}
//     </section>
//   );
// }

// function Field({ label, hint, right, children }) {
//   return (
//     <div>
//       <div className="mb-1.5 flex items-center justify-between gap-3">
//         <label className="text-sm text-slate-800">{label}</label>
//         {right}
//       </div>

//       {children}

//       {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
//     </div>
//   );
// }

// function Counter({ value, max, warn = false }) {
//   return (
//     <span
//       className={`text-xs ${
//         warn ? "font-semibold text-red-500" : "text-slate-400"
//       }`}
//     >
//       {value}/{max}
//     </span>
//   );
// }

// function SelectBox({ children, className = "", ...props }) {
//   return (
//     <div className="relative">
//       <select
//         {...props}
//         className={`${inputClass} cursor-pointer appearance-none pr-10 ${className}`}
//       >
//         {children}
//       </select>
//       <ChevronDown
//         size={16}
//         className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600"
//       />
//     </div>
//   );
// }

// function Toggle({ checked, onChange, label }) {
//   return (
//     <button
//       type="button"
//       role="switch"
//       aria-checked={checked}
//       aria-label={label}
//       onClick={() => onChange(!checked)}
//       className={`relative h-6 w-11 shrink-0 rounded-full transition ${
//         checked ? "bg-[#25D366]" : "bg-slate-300"
//       }`}
//     >
//       <span
//         className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
//           checked ? "left-[22px]" : "left-0.5"
//         }`}
//       />
//     </button>
//   );
// }

// function StatusRow({ label, children }) {
//   return (
//     <div className="flex items-center justify-between gap-3 py-2">
//       <span className="text-sm text-slate-500">{label}</span>
//       {children}
//     </div>
//   );
// }

// function StatusPill({ tone, children }) {
//   const styles = {
//     good: "bg-green-100 text-green-700",
//     off: "bg-slate-100 text-slate-600",
//     warn: "bg-amber-100 text-amber-700",
//   };
//   const dots = {
//     good: "bg-green-500",
//     off: "bg-slate-400",
//     warn: "bg-amber-500",
//   };

//   return (
//     <span
//       className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}
//     >
//       <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
//       {children}
//     </span>
//   );
// }

// function PageSkeleton() {
//   return (
//     <div>
//       <div className="mb-8 h-12 w-72 animate-pulse rounded-xl bg-slate-200" />

//       <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
//         <div className="space-y-6">
//           <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
//           <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
//         </div>

//         <div className="space-y-6">
//           <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
//           <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
//         </div>
//       </div>
//     </div>
//   );
// }

// // =====================================================
// // PAGE
// // =====================================================

// export default function AiAutoReply() {
//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState("");

//   const [saved, setSaved] = useState(null); // settings as stored on the server
//   const [form, setForm] = useState(EMPTY_FORM);
//   const [companyName, setCompanyName] = useState("");
//   const [employees, setEmployees] = useState([]);

//   const [saving, setSaving] = useState(false);

//   const [testMessage, setTestMessage] = useState(
//     "Hi, what are your working hours?"
//   );
//   const [testChannel, setTestChannel] = useState("WhatsApp");
//   const [testing, setTesting] = useState(false);
//   const [testResult, setTestResult] = useState(null);
//   const [testError, setTestError] = useState("");

//   // ---------- load ----------
//   useEffect(() => {
//     const load = async () => {
//       try {
//         setLoading(true);
//         const data = await getAiSettings();

//         setSaved(data.settings);
//         setForm(toForm(data.settings));
//         setCompanyName(data.companyName || "");
//         setEmployees(data.employees || []);
//       } catch (error) {
//         console.error(error);
//         setLoadError(
//           error?.response?.status === 403
//             ? "Only admins can manage AI auto-reply settings."
//             : errorMessage(error, "Failed to load AI settings")
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     load();
//   }, []);

//   // ---------- derived ----------
//   const aiAvailable = saved?.aiAvailable !== false;

//   const dirty = useMemo(() => {
//     if (!saved) return false;
//     return JSON.stringify(form) !== JSON.stringify(toForm(saved));
//   }, [form, saved]);

//   const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

//   const updateProfile = (patch) =>
//     setForm((prev) => ({
//       ...prev,
//       businessProfile: { ...prev.businessProfile, ...patch },
//     }));

//   const updateContact = (patch) =>
//     setForm((prev) => ({
//       ...prev,
//       contactRequest: { ...prev.contactRequest, ...patch },
//     }));

//   // Turning the switch on starts with name + mobile number ticked
//   const toggleContactRequest = (value) => {
//     const current = form.contactRequest;
//     const nothingPicked =
//       !current.name && !current.phone && !current.email && !current.other;

//     updateContact(
//       value && nothingPicked
//         ? { enabled: true, name: true, phone: true }
//         : { enabled: value }
//     );
//   };

//   // ---------- actions ----------
//   const handleDiscard = () => {
//     if (!saved) return;
//     setForm(toForm(saved));
//   };

//   const validate = () => {
//     if (form.systemPrompt.length > MAX_PROMPT_LENGTH)
//       return `Extra instructions must be ${MAX_PROMPT_LENGTH} characters or fewer`;

//     const contact = form.contactRequest;

//     if (
//       contact.enabled &&
//       !contact.name &&
//       !contact.phone &&
//       !contact.email &&
//       !contact.other.trim()
//     )
//       return "Pick at least one detail for the AI to ask for";

//     if (form.isEnabled && !aiAvailable)
//       return "AI auto-reply is not available right now. Please contact support.";

//     return "";
//   };

//   const handleSave = async () => {
//     const problem = validate();

//     if (problem) {
//       toast.error(problem);
//       return;
//     }

//     try {
//       setSaving(true);

//       const data = await updateAiSettings({
//         isEnabled: form.isEnabled,
//         leadCaptureEnabled: form.leadCaptureEnabled,
//         leadAssigneeId: form.leadAssigneeId || null,
//         leadAutoAssign: form.leadAutoAssign,
//         contactRequest: form.contactRequest,
//         businessProfile: form.businessProfile,
//         systemPrompt: form.systemPrompt,
//         historyLimit: Number(form.historyLimit),
//       });

//       setSaved(data.settings);
//       setForm(toForm(data.settings));

//       toast.success("AI settings saved");
//     } catch (error) {
//       console.error(error);
//       toast.error(errorMessage(error, "Failed to save AI settings"));
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleTest = async () => {
//     try {
//       setTesting(true);
//       setTestResult(null);
//       setTestError("");

//       const data = await testAiSettings({
//         message: testMessage,
//         channel: testChannel,
//         contactRequest: form.contactRequest,
//         businessProfile: form.businessProfile,
//         systemPrompt: form.systemPrompt,
//       });

//       setTestResult({
//         ...data,
//         question: testMessage,
//         time: new Date().toLocaleTimeString("en-IN", {
//           hour: "2-digit",
//           minute: "2-digit",
//           hour12: false,
//         }),
//       });
//     } catch (error) {
//       console.error(error);
//       setTestError(errorMessage(error, "The test failed. Please try again."));
//     } finally {
//       setTesting(false);
//     }
//   };

//   // ---------- states ----------
//   if (loading) return <PageSkeleton />;

//   if (loadError) {
//     return (
//       <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
//         <CircleAlert size={20} className="mt-0.5 shrink-0" />
//         <p className="text-sm font-medium">{loadError}</p>
//       </div>
//     );
//   }

//   const isLive = Boolean(saved?.isEnabled);
//   const memoryPercent = ((form.historyLimit - 1) / 49) * 100;

//   return (
//     <div>
//       {/* ================= HEADER ================= */}
//       <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//         <div>
//           <div className="flex items-center gap-4">
//             <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
//               AI Auto-Reply
//             </h1>

//             {/* master switch for the whole CRM */}
//             <Toggle
//               checked={form.isEnabled}
//               onChange={(value) => update({ isEnabled: value })}
//               label="Enable AI auto-reply for your whole CRM"
//             />
//           </div>

//           <p className="mt-1 text-sm text-slate-500">
//             Let our built-in AI answer your customers&apos; WhatsApp messages
//             automatically, using your business details.
//           </p>
//         </div>

//         <div className="flex shrink-0 items-center gap-3">
//           {dirty && (
//             <span className="hidden items-center gap-2 text-sm font-medium text-slate-600 md:flex">
//               <span className="h-2 w-2 rounded-full bg-amber-500" />
//               Unsaved changes
//             </span>
//           )}

//           <button
//             type="button"
//             onClick={handleDiscard}
//             disabled={!dirty || saving}
//             className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             Discard
//           </button>

//           <button
//             type="button"
//             onClick={handleSave}
//             disabled={!dirty || saving}
//             className="flex items-center gap-2 rounded-lg bg-[#22C55E] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-50"
//           >
//             {saving && <LoaderCircle size={16} className="animate-spin" />}
//             {saving ? "Saving..." : "Save changes"}
//           </button>
//         </div>
//       </div>

//       {/* ================= MAIN GRID ================= */}
//       <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
//         {/* ============ LEFT: CONFIGURATION ============ */}
//         <div className="space-y-6">
//           {/* ---------- BUSINESS PROFILE ---------- */}
//           <Card
//             icon={Building2}
//             title="Business Profile"
//             subtitle="The AI answers customers using only these details. The more accurate they are, the better the replies."
//           >
//             <div className="space-y-5">
//               <Field label="Business name">
//                 <input
//                   type="text"
//                   value={form.businessProfile.businessName}
//                   onChange={(e) => updateProfile({ businessName: e.target.value })}
//                   maxLength={100}
//                   placeholder={companyName || "Your business name"}
//                   className={inputClass}
//                 />
//               </Field>

//               <Field
//                 label="What does your business do?"
//                 hint="Describe your products, services and who you serve. Example: We sell organic tea. 250g pack ₹180, 500g pack ₹320."
//                 right={
//                   <Counter
//                     value={form.businessProfile.description.length}
//                     max={1000}
//                   />
//                 }
//               >
//                 <textarea
//                   rows={3}
//                   value={form.businessProfile.description}
//                   onChange={(e) => updateProfile({ description: e.target.value })}
//                   maxLength={1000}
//                   className={`${inputClass} resize-y leading-relaxed`}
//                 />
//               </Field>

//               <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
//                 <Field label="Working hours">
//                   <input
//                     type="text"
//                     value={form.businessProfile.workingHours}
//                     onChange={(e) => updateProfile({ workingHours: e.target.value })}
//                     maxLength={200}
//                     placeholder="Mon–Sat, 9 AM – 7 PM"
//                     className={inputClass}
//                   />
//                 </Field>

//                 <Field label="Languages">
//                   <input
//                     type="text"
//                     value={form.businessProfile.languages}
//                     onChange={(e) => updateProfile({ languages: e.target.value })}
//                     maxLength={200}
//                     placeholder="Tamil, English"
//                     className={inputClass}
//                   />
//                 </Field>

//                 <Field label="Location">
//                   <input
//                     type="text"
//                     value={form.businessProfile.location}
//                     onChange={(e) => updateProfile({ location: e.target.value })}
//                     maxLength={300}
//                     placeholder="Shop address or service area"
//                     className={inputClass}
//                   />
//                 </Field>

//                 <Field label="Contact details">
//                   <input
//                     type="text"
//                     value={form.businessProfile.contact}
//                     onChange={(e) => updateProfile({ contact: e.target.value })}
//                     maxLength={300}
//                     placeholder="Phone, email or website"
//                     className={inputClass}
//                   />
//                 </Field>
//               </div>

//               <Field
//                 label="Policies and key information"
//                 hint="Pricing, refunds, delivery. The AI only states what you write here."
//                 right={
//                   <Counter
//                     value={form.businessProfile.policies.length}
//                     max={1500}
//                   />
//                 }
//               >
//                 <textarea
//                   rows={3}
//                   value={form.businessProfile.policies}
//                   onChange={(e) => updateProfile({ policies: e.target.value })}
//                   maxLength={1500}
//                   className={`${inputClass} resize-y leading-relaxed`}
//                 />
//               </Field>

//               <Field label="Tone of replies">
//                 <div className="flex flex-wrap gap-3">
//                   {TONES.map((tone) => (
//                     <button
//                       key={tone.id}
//                       type="button"
//                       onClick={() => updateProfile({ tone: tone.id })}
//                       aria-pressed={form.businessProfile.tone === tone.id}
//                       className={`rounded-full border px-6 py-2 text-sm font-medium transition ${
//                         form.businessProfile.tone === tone.id
//                           ? "border-[#25D366] bg-green-50 text-green-700"
//                           : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
//                       }`}
//                     >
//                       {tone.label}
//                     </button>
//                   ))}
//                 </div>
//               </Field>

//               {!form.businessProfile.description.trim() &&
//                 !form.businessProfile.policies.trim() && (
//                   <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
//                     <CircleAlert size={16} className="mt-0.5 shrink-0" />
//                     <span>
//                       Add what your business does (and your policies) so the AI
//                       can answer accurately. Until then it replies with a
//                       generic support message.
//                     </span>
//                   </div>
//                 )}
//             </div>
//           </Card>

//           {/* ---------- EXTRA INSTRUCTIONS ---------- */}
//           <Card
//             icon={ClipboardList}
//             title="Extra instructions (optional)"
//             subtitle="Special rules on top of your business profile, for example how to greet customers or when to hand over to a person."
//           >
//             <div className="space-y-6">
//               <Field
//                 label="Instructions"
//                 hint="Keep instructions short and specific."
//                 right={
//                   <Counter
//                     value={form.systemPrompt.length}
//                     max={MAX_PROMPT_LENGTH}
//                     warn={form.systemPrompt.length > MAX_PROMPT_LENGTH}
//                   />
//                 }
//               >
//                 <textarea
//                   rows={3}
//                   value={form.systemPrompt}
//                   onChange={(e) => update({ systemPrompt: e.target.value })}
//                   placeholder="Example: Greet every customer with Vanakkam. Never discuss competitor brands."
//                   className={`${inputClass} resize-y leading-relaxed`}
//                 />
//               </Field>

//               <Field
//                 label="Conversation memory"
//                 hint="How many recent messages the AI reads before replying. More gives better context."
//                 right={
//                   <span className="text-xs text-slate-500">
//                     Last {form.historyLimit} messages
//                   </span>
//                 }
//               >
//                 <input
//                   type="range"
//                   min={1}
//                   max={50}
//                   value={form.historyLimit}
//                   onChange={(e) =>
//                     update({ historyLimit: Number(e.target.value) })
//                   }
//                   aria-label="Conversation memory (number of recent messages)"
//                   style={{
//                     background: `linear-gradient(to right, #25D366 ${memoryPercent}%, #E2E8F0 ${memoryPercent}%)`,
//                   }}
//                   className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#25D366] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[#25D366] [&::-webkit-slider-thumb]:shadow"
//                 />
//               </Field>
//             </div>
//           </Card>

//           {/* ---------- LEAD CAPTURE ---------- */}
//           <Card
//             icon={Users}
//             title="Lead capture"
//             subtitle="When a new person asks about your products or services, the AI creates a lead in your CRM and assigns it to your team."
//             action={
//               <Toggle
//                 checked={form.leadCaptureEnabled}
//                 onChange={(value) => update({ leadCaptureEnabled: value })}
//                 label="Create leads automatically"
//               />
//             }
//           >
//             <Field
//               label="Assign new leads to"
//               hint="Admins are always notified of a new lead. Choose Auto-assign to share new leads fairly between all active employees. If you pick nobody, an admin assigns it later from the Leads page."
//             >
//               <SelectBox
//                 value={form.leadAutoAssign ? "__AUTO__" : form.leadAssigneeId}
//                 onChange={(e) =>
//                   e.target.value === "__AUTO__"
//                     ? update({ leadAutoAssign: true, leadAssigneeId: "" })
//                     : update({
//                         leadAutoAssign: false,
//                         leadAssigneeId: e.target.value,
//                       })
//                 }
//                 disabled={!form.leadCaptureEnabled}
//               >
//                 <option value="">Unassigned</option>
//                 <option value="__AUTO__">
//                   Auto-assign (share between all employees)
//                 </option>
//                 {employees.map((employee) => (
//                   <option key={employee.id} value={employee.id}>
//                     {employee.name}
//                   </option>
//                 ))}
//               </SelectBox>
//             </Field>
//           </Card>

//           {/* ---------- ASK FOR CONTACT DETAILS ---------- */}
//           <Card
//             icon={Phone}
//             title="Ask for contact details"
//             subtitle="When a customer shows interest, the AI answers first, then politely asks once for the details you pick, so your team can contact them."
//             action={
//               <Toggle
//                 checked={form.contactRequest.enabled}
//                 onChange={toggleContactRequest}
//                 label="Ask customers for contact details"
//               />
//             }
//           >
//             <div className="space-y-5">
//               <Field label="What should the AI ask for?">
//                 <div className="flex flex-wrap gap-x-6 gap-y-2">
//                   {[
//                     { key: "name", label: "Name" },
//                     { key: "phone", label: "Mobile number" },
//                     { key: "email", label: "Email" },
//                   ].map((item) => (
//                     <label
//                       key={item.key}
//                       className="flex items-center gap-2 text-sm text-slate-700"
//                     >
//                       <input
//                         type="checkbox"
//                         checked={form.contactRequest[item.key]}
//                         onChange={(e) =>
//                           updateContact({ [item.key]: e.target.checked })
//                         }
//                         disabled={!form.contactRequest.enabled}
//                         className="h-4 w-4 accent-[#25D366] disabled:cursor-not-allowed"
//                       />
//                       {item.label}
//                     </label>
//                   ))}
//                 </div>
//               </Field>

//               <Field
//                 label="Something else (optional)"
//                 hint="For example: college name and course interested in, or your preferred call time."
//               >
//                 <input
//                   type="text"
//                   value={form.contactRequest.other}
//                   onChange={(e) => updateContact({ other: e.target.value })}
//                   maxLength={200}
//                   disabled={!form.contactRequest.enabled}
//                   placeholder="College name and course interested in"
//                   className={inputClass}
//                 />
//               </Field>

//               <Field
//                 label="How should it ask? (optional)"
//                 hint="Leave empty and the AI uses its own polite wording. If you write a line, the AI follows it and adapts it to the chat."
//               >
//                 <textarea
//                   rows={2}
//                   value={form.contactRequest.wording}
//                   onChange={(e) => updateContact({ wording: e.target.value })}
//                   maxLength={300}
//                   disabled={!form.contactRequest.enabled}
//                   placeholder="Sure, I can help with that! May I have your name and mobile number so our team can call you with the details?"
//                   className={`${inputClass} resize-none`}
//                 />
//               </Field>

//               <ul className="space-y-1.5 text-xs text-slate-500">
//                 <li>The AI asks only once and never pressures the customer.</li>
//                 <li>
//                   On WhatsApp the AI already knows the customer&apos;s number,
//                   so it will not ask for it there. It is asked on Instagram and
//                   Facebook.
//                 </li>
//                 <li>
//                   Use &ldquo;Test your setup&rdquo; on the right to see how it
//                   behaves before you save.
//                 </li>
//               </ul>
//             </div>
//           </Card>
//         </div>

//         {/* ============ RIGHT: STATUS + TEST ============ */}
//         <div className="space-y-6">
//           {/* ---------- LIVE STATUS ---------- */}
//           <Card icon={Bell} title="Live status">
//             <div className="divide-y divide-slate-100">
//               <StatusRow label="Auto-reply">
//                 <StatusPill tone={isLive ? "good" : "off"}>
//                   {isLive ? "On" : "Off"}
//                 </StatusPill>
//               </StatusRow>

//               <StatusRow label="AI service">
//                 <StatusPill tone={aiAvailable ? "good" : "warn"}>
//                   {aiAvailable ? "Available" : "Unavailable"}
//                 </StatusPill>
//               </StatusRow>
//             </div>

//             {saved?.lastError && (
//               <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
//                 <div className="flex items-start gap-2.5">
//                   <CircleAlert size={17} className="mt-0.5 shrink-0 text-red-500" />

//                   <div className="min-w-0">
//                     <p className="text-sm font-semibold text-red-700">
//                       Last auto-reply failed
//                     </p>
//                     <p className="mt-1 break-words text-xs text-red-600">
//                       {saved.lastError}
//                     </p>

//                     {saved.lastErrorAt && (
//                       <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-400">
//                         <Clock size={11} />
//                         {new Date(saved.lastErrorAt).toLocaleString()}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </Card>

//           {/* ---------- TEST ---------- */}
//           <Card
//             icon={MessageCircle}
//             title="Test your setup"
//             subtitle="Simulate a customer message. Nothing is sent to a real customer."
//           >
//             <div className="space-y-3">
//               <Field label="Sample customer message">
//                 <input
//                   type="text"
//                   value={testMessage}
//                   onChange={(e) => setTestMessage(e.target.value)}
//                   maxLength={500}
//                   placeholder="Hi, what are your working hours?"
//                   className={inputClass}
//                 />
//               </Field>

//               <SelectBox
//                 value={testChannel}
//                 onChange={(e) => setTestChannel(e.target.value)}
//                 aria-label="Test as channel"
//               >
//                 <option value="WhatsApp">Whatsapp</option>
//                 <option value="Instagram">Instagram</option>
//                 <option value="Messenger">Facebook Messenger</option>
//               </SelectBox>

//               <div className="flex justify-center pt-1">
//                 <button
//                   type="button"
//                   onClick={handleTest}
//                   disabled={testing || !testMessage.trim()}
//                   className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-8 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {testing && <LoaderCircle size={15} className="animate-spin" />}
//                   {testing ? "Waiting for the AI..." : "Send Test message"}
//                 </button>
//               </div>

//               {/* result */}
//               {(testResult || testError) && (
//                 <div className="space-y-2 rounded-lg bg-[#EDE6DD] p-3">
//                   {testResult && (
//                     <>
//                       <div className="flex justify-start">
//                         <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm">
//                           {testResult.question}
//                           <p className="mt-1 text-right text-[10px] text-slate-500">
//                             {testResult.time}
//                           </p>
//                         </div>
//                       </div>

//                       <div className="flex justify-end">
//                         <div className="max-w-[85%] whitespace-pre-wrap rounded-xl rounded-tr-sm bg-[#D9FDD3] px-3.5 py-2 text-sm text-slate-800 shadow-sm">
//                           {testResult.reply}
//                           <p
//                             className="mt-1 text-right text-[10px] text-slate-500"
//                             title={
//                               testResult.latencyMs
//                                 ? `Replied in ${(testResult.latencyMs / 1000).toFixed(1)}s`
//                                 : undefined
//                             }
//                           >
//                             {testResult.time}
//                           </p>
//                           {testResult.handoff && (
//                             <p className="mt-1 text-right text-[10px] font-semibold text-amber-600">
//                               The AI would hand this chat to your team
//                             </p>
//                           )}
//                         </div>
//                       </div>
//                     </>
//                   )}

//                   {testError && (
//                     <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
//                       <CircleAlert size={15} className="mt-0.5 shrink-0" />
//                       <span className="break-words">{testError}</span>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </Card>

//           {/* ---------- HOW IT WORKS ---------- */}
//           <Card icon={LifeBuoy} title="How it works">
//             <ol className="space-y-3.5">
//               {HOW_IT_WORKS.map((step, index) => (
//                 <li key={step} className="flex gap-3 text-sm text-slate-500">
//                   <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
//                     {index + 1}
//                   </span>
//                   <span className="pt-0.5">{step}</span>
//                 </li>
//               ))}
//             </ol>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Bell,
  Building2,
  ChevronDown,
  CircleAlert,
  ClipboardList,
  Clock,
  LifeBuoy,
  LoaderCircle,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";

import {
  getAiSettings,
  updateAiSettings,
  testAiSettings,
} from "../../api/aiSettingsApi";

// =====================================================
// CONSTANTS
// =====================================================

const TONES = [
  { id: "FRIENDLY", label: "Friendly" },
  { id: "PROFESSIONAL", label: "Professional" },
  { id: "CASUAL", label: "Casual" },
  { id: "FORMAL", label: "Formal" },
];

const MAX_PROMPT_LENGTH = 4000;

const EMPTY_PROFILE = {
  businessName: "",
  description: "",
  workingHours: "",
  location: "",
  contact: "",
  languages: "",
  policies: "",
  tone: "FRIENDLY",
};

const EMPTY_CONTACT = {
  enabled: false,
  name: false,
  phone: false,
  email: false,
  other: "",
  wording: "",
};

const EMPTY_FORM = {
  isEnabled: false,
  leadCaptureEnabled: false,
  leadAssigneeId: "",
  leadAutoAssign: false,
  contactRequest: EMPTY_CONTACT,
  businessProfile: EMPTY_PROFILE,
  systemPrompt: "",
  historyLimit: 10,
};

const HOW_IT_WORKS = [
  "A customer sends a WhatsApp message to your business.",
  "If auto-reply is on, the AI reads the recent conversation.",
  "It replies in your tone using only your business details.",
  "New people are added to your CRM as leads.",
  "When your team replies manually, the AI steps back from that chat.",
];

// Map the settings coming from the server to the form shape
const toForm = (settings) => ({
  isEnabled: settings.isEnabled,
  leadCaptureEnabled: Boolean(settings.leadCaptureEnabled),
  leadAssigneeId: settings.leadAssigneeId || "",
  leadAutoAssign: Boolean(settings.leadAutoAssign),
  contactRequest: { ...EMPTY_CONTACT, ...(settings.contactRequest || {}) },
  businessProfile: { ...EMPTY_PROFILE, ...(settings.businessProfile || {}) },
  systemPrompt: settings.systemPrompt || "",
  historyLimit: settings.historyLimit || 10,
});

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

// =====================================================
// SMALL UI PIECES
// =====================================================

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#25D366] focus:outline-none focus:ring-4 focus:ring-[#25D366]/10 disabled:cursor-not-allowed disabled:opacity-60";

function Card({ icon: Icon, title, subtitle, action, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <Icon size={19} />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {action}
      </div>

      {children && <div className="mt-5">{children}</div>}
    </section>
  );
}

function Field({ label, hint, right, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="text-sm text-slate-800">{label}</label>
        {right}
      </div>

      {children}

      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Counter({ value, max, warn = false }) {
  return (
    <span
      className={`text-xs ${
        warn ? "font-semibold text-red-500" : "text-slate-400"
      }`}
    >
      {value}/{max}
    </span>
  );
}

function SelectBox({ children, className = "", ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${inputClass} cursor-pointer appearance-none pr-10 ${className}`}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600"
      />
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-[#25D366]" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function StatusRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      {children}
    </div>
  );
}

function StatusPill({ tone, children }) {
  const styles = {
    good: "bg-green-100 text-green-700",
    off: "bg-slate-100 text-slate-600",
    warn: "bg-amber-100 text-amber-700",
  };
  const dots = {
    good: "bg-green-500",
    off: "bg-slate-400",
    warn: "bg-amber-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
      {children}
    </span>
  );
}

function PageSkeleton() {
  return (
    <div>
      <div className="mb-8 h-12 w-72 animate-pulse rounded-xl bg-slate-200" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
        </div>

        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PAGE
// =====================================================

export default function AiAutoReply() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [saved, setSaved] = useState(null); // settings as stored on the server
  const [form, setForm] = useState(EMPTY_FORM);
  const [companyName, setCompanyName] = useState("");
  const [employees, setEmployees] = useState([]);

  const [saving, setSaving] = useState(false);

  const [testMessage, setTestMessage] = useState(
    "Hi, what are your working hours?"
  );
  const [testChannel, setTestChannel] = useState("WhatsApp");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState("");

  // ---------- load ----------
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getAiSettings();

        setSaved(data.settings);
        setForm(toForm(data.settings));
        setCompanyName(data.companyName || "");
        setEmployees(data.employees || []);
      } catch (error) {
        console.error(error);
        setLoadError(
          error?.response?.status === 403
            ? "Only admins can manage AI auto-reply settings."
            : errorMessage(error, "Failed to load AI settings")
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // ---------- derived ----------
  const aiAvailable = saved?.aiAvailable !== false;

  const dirty = useMemo(() => {
    if (!saved) return false;
    return JSON.stringify(form) !== JSON.stringify(toForm(saved));
  }, [form, saved]);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const updateProfile = (patch) =>
    setForm((prev) => ({
      ...prev,
      businessProfile: { ...prev.businessProfile, ...patch },
    }));

  const updateContact = (patch) =>
    setForm((prev) => ({
      ...prev,
      contactRequest: { ...prev.contactRequest, ...patch },
    }));

  // Turning the switch on starts with name + mobile number ticked
  const toggleContactRequest = (value) => {
    const current = form.contactRequest;
    const nothingPicked =
      !current.name && !current.phone && !current.email && !current.other;

    updateContact(
      value && nothingPicked
        ? { enabled: true, name: true, phone: true }
        : { enabled: value }
    );
  };

  // ---------- actions ----------
  const handleDiscard = () => {
    if (!saved) return;
    setForm(toForm(saved));
  };

  const validate = () => {
    if (form.systemPrompt.length > MAX_PROMPT_LENGTH)
      return `Extra instructions must be ${MAX_PROMPT_LENGTH} characters or fewer`;

    const contact = form.contactRequest;

    if (
      contact.enabled &&
      !contact.name &&
      !contact.phone &&
      !contact.email &&
      !contact.other.trim()
    )
      return "Pick at least one detail for the AI to ask for";

    if (form.isEnabled && !aiAvailable)
      return "AI auto-reply is not available right now. Please contact support.";

    return "";
  };

  const handleSave = async () => {
    const problem = validate();

    if (problem) {
      toast.error(problem);
      return;
    }

    try {
      setSaving(true);

      const data = await updateAiSettings({
        isEnabled: form.isEnabled,
        leadCaptureEnabled: form.leadCaptureEnabled,
        leadAssigneeId: form.leadAssigneeId || null,
        leadAutoAssign: form.leadAutoAssign,
        contactRequest: form.contactRequest,
        businessProfile: form.businessProfile,
        systemPrompt: form.systemPrompt,
        historyLimit: Number(form.historyLimit),
      });

      setSaved(data.settings);
      setForm(toForm(data.settings));

      toast.success("AI settings saved");
    } catch (error) {
      console.error(error);
      toast.error(errorMessage(error, "Failed to save AI settings"));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setTestError("");

      const data = await testAiSettings({
        message: testMessage,
        channel: testChannel,
        contactRequest: form.contactRequest,
        businessProfile: form.businessProfile,
        systemPrompt: form.systemPrompt,
      });

      setTestResult({
        ...data,
        question: testMessage,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      });
    } catch (error) {
      console.error(error);
      setTestError(errorMessage(error, "The test failed. Please try again."));
    } finally {
      setTesting(false);
    }
  };

  // ---------- states ----------
  if (loading) return <PageSkeleton />;

  if (loadError) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <CircleAlert size={20} className="mt-0.5 shrink-0" />
        <p className="text-sm font-medium">{loadError}</p>
      </div>
    );
  }

  const isLive = Boolean(saved?.isEnabled);
  const memoryPercent = ((form.historyLimit - 1) / 49) * 100;

  return (
    <div>
      {/* ================= HEADER ================= */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Heading removed - the "AI Auto-Reply" tab above already names this
            page. The master switch for the whole CRM stays. */}
        <div className="flex items-center gap-3">
          <Toggle
            checked={form.isEnabled}
            onChange={(value) => update({ isEnabled: value })}
            label="Enable AI auto-reply for your whole CRM"
          />
          <span className="text-sm font-medium text-slate-700">
            Enable AI auto-reply
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {dirty && (
            <span className="hidden items-center gap-2 text-sm font-medium text-slate-600 md:flex">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}

          <button
            type="button"
            onClick={handleDiscard}
            disabled={!dirty || saving}
            className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-2 rounded-lg bg-[#22C55E] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <LoaderCircle size={16} className="animate-spin" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* ============ LEFT: CONFIGURATION ============ */}
        <div className="space-y-6">
          {/* ---------- BUSINESS PROFILE ---------- */}
          <Card
            icon={Building2}
            title="Business Profile"
            subtitle="The AI answers customers using only these details. The more accurate they are, the better the replies."
          >
            <div className="space-y-5">
              <Field label="Business name">
                <input
                  type="text"
                  value={form.businessProfile.businessName}
                  onChange={(e) => updateProfile({ businessName: e.target.value })}
                  maxLength={100}
                  placeholder={companyName || "Your business name"}
                  className={inputClass}
                />
              </Field>

              <Field
                label="What does your business do?"
                hint="Describe your products, services and who you serve. Example: We sell organic tea. 250g pack ₹180, 500g pack ₹320."
                right={
                  <Counter
                    value={form.businessProfile.description.length}
                    max={1000}
                  />
                }
              >
                <textarea
                  rows={3}
                  value={form.businessProfile.description}
                  onChange={(e) => updateProfile({ description: e.target.value })}
                  maxLength={1000}
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </Field>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Working hours">
                  <input
                    type="text"
                    value={form.businessProfile.workingHours}
                    onChange={(e) => updateProfile({ workingHours: e.target.value })}
                    maxLength={200}
                    placeholder="Mon–Sat, 9 AM – 7 PM"
                    className={inputClass}
                  />
                </Field>

                <Field label="Languages">
                  <input
                    type="text"
                    value={form.businessProfile.languages}
                    onChange={(e) => updateProfile({ languages: e.target.value })}
                    maxLength={200}
                    placeholder="Tamil, English"
                    className={inputClass}
                  />
                </Field>

                <Field label="Location">
                  <input
                    type="text"
                    value={form.businessProfile.location}
                    onChange={(e) => updateProfile({ location: e.target.value })}
                    maxLength={300}
                    placeholder="Shop address or service area"
                    className={inputClass}
                  />
                </Field>

                <Field label="Contact details">
                  <input
                    type="text"
                    value={form.businessProfile.contact}
                    onChange={(e) => updateProfile({ contact: e.target.value })}
                    maxLength={300}
                    placeholder="Phone, email or website"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field
                label="Policies and key information"
                hint="Pricing, refunds, delivery. The AI only states what you write here."
                right={
                  <Counter
                    value={form.businessProfile.policies.length}
                    max={1500}
                  />
                }
              >
                <textarea
                  rows={3}
                  value={form.businessProfile.policies}
                  onChange={(e) => updateProfile({ policies: e.target.value })}
                  maxLength={1500}
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </Field>

              <Field label="Tone of replies">
                <div className="flex flex-wrap gap-3">
                  {TONES.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => updateProfile({ tone: tone.id })}
                      aria-pressed={form.businessProfile.tone === tone.id}
                      className={`rounded-full border px-6 py-2 text-sm font-medium transition ${
                        form.businessProfile.tone === tone.id
                          ? "border-[#25D366] bg-green-50 text-green-700"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </Field>

              {!form.businessProfile.description.trim() &&
                !form.businessProfile.policies.trim() && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
                    <CircleAlert size={16} className="mt-0.5 shrink-0" />
                    <span>
                      Add what your business does (and your policies) so the AI
                      can answer accurately. Until then it replies with a
                      generic support message.
                    </span>
                  </div>
                )}
            </div>
          </Card>

          {/* ---------- EXTRA INSTRUCTIONS ---------- */}
          <Card
            icon={ClipboardList}
            title="Extra instructions (optional)"
            subtitle="Special rules on top of your business profile, for example how to greet customers or when to hand over to a person."
          >
            <div className="space-y-6">
              <Field
                label="Instructions"
                hint="Keep instructions short and specific."
                right={
                  <Counter
                    value={form.systemPrompt.length}
                    max={MAX_PROMPT_LENGTH}
                    warn={form.systemPrompt.length > MAX_PROMPT_LENGTH}
                  />
                }
              >
                <textarea
                  rows={3}
                  value={form.systemPrompt}
                  onChange={(e) => update({ systemPrompt: e.target.value })}
                  placeholder="Example: Greet every customer with Vanakkam. Never discuss competitor brands."
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </Field>

              <Field
                label="Conversation memory"
                hint="How many recent messages the AI reads before replying. More gives better context."
                right={
                  <span className="text-xs text-slate-500">
                    Last {form.historyLimit} messages
                  </span>
                }
              >
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={form.historyLimit}
                  onChange={(e) =>
                    update({ historyLimit: Number(e.target.value) })
                  }
                  aria-label="Conversation memory (number of recent messages)"
                  style={{
                    background: `linear-gradient(to right, #25D366 ${memoryPercent}%, #E2E8F0 ${memoryPercent}%)`,
                  }}
                  className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#25D366] [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-[#25D366] [&::-webkit-slider-thumb]:shadow"
                />
              </Field>
            </div>
          </Card>

          {/* ---------- LEAD CAPTURE ---------- */}
          <Card
            icon={Users}
            title="Lead capture"
            subtitle="When a new person asks about your products or services, the AI creates a lead in your CRM and assigns it to your team."
            action={
              <Toggle
                checked={form.leadCaptureEnabled}
                onChange={(value) => update({ leadCaptureEnabled: value })}
                label="Create leads automatically"
              />
            }
          >
            <Field
              label="Assign new leads to"
              hint="Admins are always notified of a new lead. Choose Auto-assign to share new leads fairly between all active employees. If you pick nobody, an admin assigns it later from the Leads page."
            >
              <SelectBox
                value={form.leadAutoAssign ? "__AUTO__" : form.leadAssigneeId}
                onChange={(e) =>
                  e.target.value === "__AUTO__"
                    ? update({ leadAutoAssign: true, leadAssigneeId: "" })
                    : update({
                        leadAutoAssign: false,
                        leadAssigneeId: e.target.value,
                      })
                }
                disabled={!form.leadCaptureEnabled}
              >
                <option value="">Unassigned</option>
                <option value="__AUTO__">
                  Auto-assign (share between all employees)
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </SelectBox>
            </Field>
          </Card>

          {/* ---------- ASK FOR CONTACT DETAILS ---------- */}
          <Card
            icon={Phone}
            title="Ask for contact details"
            subtitle="When a customer shows interest, the AI answers first, then politely asks once for the details you pick, so your team can contact them."
            action={
              <Toggle
                checked={form.contactRequest.enabled}
                onChange={toggleContactRequest}
                label="Ask customers for contact details"
              />
            }
          >
            <div className="space-y-5">
              <Field label="What should the AI ask for?">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {[
                    { key: "name", label: "Name" },
                    { key: "phone", label: "Mobile number" },
                    { key: "email", label: "Email" },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={form.contactRequest[item.key]}
                        onChange={(e) =>
                          updateContact({ [item.key]: e.target.checked })
                        }
                        disabled={!form.contactRequest.enabled}
                        className="h-4 w-4 accent-[#25D366] disabled:cursor-not-allowed"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </Field>

              <Field
                label="Something else (optional)"
                hint="For example: college name and course interested in, or your preferred call time."
              >
                <input
                  type="text"
                  value={form.contactRequest.other}
                  onChange={(e) => updateContact({ other: e.target.value })}
                  maxLength={200}
                  disabled={!form.contactRequest.enabled}
                  placeholder="College name and course interested in"
                  className={inputClass}
                />
              </Field>

              <Field
                label="How should it ask? (optional)"
                hint="Leave empty and the AI uses its own polite wording. If you write a line, the AI follows it and adapts it to the chat."
              >
                <textarea
                  rows={2}
                  value={form.contactRequest.wording}
                  onChange={(e) => updateContact({ wording: e.target.value })}
                  maxLength={300}
                  disabled={!form.contactRequest.enabled}
                  placeholder="Sure, I can help with that! May I have your name and mobile number so our team can call you with the details?"
                  className={`${inputClass} resize-none`}
                />
              </Field>

              <ul className="space-y-1.5 text-xs text-slate-500">
                <li>The AI asks only once and never pressures the customer.</li>
                <li>
                  On WhatsApp the AI already knows the customer&apos;s number,
                  so it will not ask for it there. It is asked on Instagram and
                  Facebook.
                </li>
                <li>
                  Use &ldquo;Test your setup&rdquo; on the right to see how it
                  behaves before you save.
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {/* ============ RIGHT: STATUS + TEST ============ */}
        <div className="space-y-6">
          {/* ---------- LIVE STATUS ---------- */}
          <Card icon={Bell} title="Live status">
            <div className="divide-y divide-slate-100">
              <StatusRow label="Auto-reply">
                <StatusPill tone={isLive ? "good" : "off"}>
                  {isLive ? "On" : "Off"}
                </StatusPill>
              </StatusRow>

              <StatusRow label="AI service">
                <StatusPill tone={aiAvailable ? "good" : "warn"}>
                  {aiAvailable ? "Available" : "Unavailable"}
                </StatusPill>
              </StatusRow>
            </div>

            {saved?.lastError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-2.5">
                  <CircleAlert size={17} className="mt-0.5 shrink-0 text-red-500" />

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-red-700">
                      Last auto-reply failed
                    </p>
                    <p className="mt-1 break-words text-xs text-red-600">
                      {saved.lastError}
                    </p>

                    {saved.lastErrorAt && (
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-red-400">
                        <Clock size={11} />
                        {new Date(saved.lastErrorAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ---------- TEST ---------- */}
          <Card
            icon={MessageCircle}
            title="Test your setup"
            subtitle="Simulate a customer message. Nothing is sent to a real customer."
          >
            <div className="space-y-3">
              <Field label="Sample customer message">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  maxLength={500}
                  placeholder="Hi, what are your working hours?"
                  className={inputClass}
                />
              </Field>

              <SelectBox
                value={testChannel}
                onChange={(e) => setTestChannel(e.target.value)}
                aria-label="Test as channel"
              >
                <option value="WhatsApp">Whatsapp</option>
                <option value="Instagram">Instagram</option>
                <option value="Messenger">Facebook Messenger</option>
              </SelectBox>

              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing || !testMessage.trim()}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-8 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {testing && <LoaderCircle size={15} className="animate-spin" />}
                  {testing ? "Waiting for the AI..." : "Send Test message"}
                </button>
              </div>

              {/* result */}
              {(testResult || testError) && (
                <div className="space-y-2 rounded-lg bg-[#EDE6DD] p-3">
                  {testResult && (
                    <>
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm">
                          {testResult.question}
                          <p className="mt-1 text-right text-[10px] text-slate-500">
                            {testResult.time}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap rounded-xl rounded-tr-sm bg-[#D9FDD3] px-3.5 py-2 text-sm text-slate-800 shadow-sm">
                          {testResult.reply}
                          <p
                            className="mt-1 text-right text-[10px] text-slate-500"
                            title={
                              testResult.latencyMs
                                ? `Replied in ${(testResult.latencyMs / 1000).toFixed(1)}s`
                                : undefined
                            }
                          >
                            {testResult.time}
                          </p>
                          {testResult.handoff && (
                            <p className="mt-1 text-right text-[10px] font-semibold text-amber-600">
                              The AI would hand this chat to your team
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {testError && (
                    <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs text-red-600">
                      <CircleAlert size={15} className="mt-0.5 shrink-0" />
                      <span className="break-words">{testError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* ---------- HOW IT WORKS ---------- */}
          <Card icon={LifeBuoy} title="How it works">
            <ol className="space-y-3.5">
              {HOW_IT_WORKS.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-slate-500">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}