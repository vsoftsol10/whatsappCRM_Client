// import { useEffect, useMemo, useState } from "react";
// import { toast } from "react-hot-toast";
// import {
//   Bot,
//   Building2,
//   Check,
//   CircleAlert,
//   Clock,
//   FileText,
//   LoaderCircle,
//   RotateCcw,
//   Save,
//   Send,
//   UserPlus,
//   Zap,
// } from "lucide-react";

// import {
//   getAiSettings,
//   updateAiSettings,
//   testAiSettings,
// } from "../../api/aiSettingsApi";

// // =====================================================
// // STATIC UI DATA
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

// const EMPTY_FORM = {
//   isEnabled: false,
//   leadCaptureEnabled: false,
//   leadAssigneeId: "",
//   businessProfile: EMPTY_PROFILE,
//   systemPrompt: "",
//   historyLimit: 10,
// };

// const toForm = (settings) => ({
//   isEnabled: settings.isEnabled,
//   leadCaptureEnabled: Boolean(settings.leadCaptureEnabled),
//   leadAssigneeId: settings.leadAssigneeId || "",
//   businessProfile: { ...EMPTY_PROFILE, ...(settings.businessProfile || {}) },
//   systemPrompt: settings.systemPrompt || "",
//   historyLimit: settings.historyLimit || 10,
// });

// const errorMessage = (error, fallback) =>
//   error?.response?.data?.message || fallback;

// // =====================================================
// // SMALL REUSABLE PIECES
// // =====================================================

// function Card({ icon: Icon, title, subtitle, action, children }) {
//   return (
//     <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
//       <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
//         <div className="flex items-start gap-3">
//           {Icon && (
//             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#128C7E]">
//               <Icon size={19} />
//             </div>
//           )}
//           <div>
//             <h2 className="text-base font-semibold text-slate-900">{title}</h2>
//             {subtitle && (
//               <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
//             )}
//           </div>
//         </div>
//         {action}
//       </div>

//       <div className="p-6">{children}</div>
//     </section>
//   );
// }

// function Field({ label, hint, right, children }) {
//   return (
//     <div>
//       <div className="mb-1.5 flex items-center justify-between gap-3">
//         <label className="text-sm font-medium text-slate-700">{label}</label>
//         {right}
//       </div>
//       {children}
//       {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
//     </div>
//   );
// }

// const inputClass =
//   "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#25D366] focus:outline-none focus:ring-4 focus:ring-[#25D366]/10";

// function Toggle({ checked, onChange, label }) {
//   return (
//     <button
//       type="button"
//       role="switch"
//       aria-checked={checked}
//       aria-label={label}
//       onClick={() => onChange(!checked)}
//       className={`relative h-7 w-12 shrink-0 rounded-full transition ${
//         checked ? "bg-[#25D366]" : "bg-slate-300"
//       }`}
//     >
//       <span
//         className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
//           checked ? "left-6" : "left-1"
//         }`}
//       />
//     </button>
//   );
// }

// function StatusRow({ label, children }) {
//   return (
//     <div className="flex items-center justify-between gap-3 py-2.5">
//       <span className="text-sm text-slate-500">{label}</span>
//       <span className="max-w-[60%] truncate text-right text-sm font-medium text-slate-800">
//         {children}
//       </span>
//     </div>
//   );
// }

// function PageSkeleton() {
//   return (
//     <div className="crm-page bg-slate-50">
//       <div className="mb-8 h-12 w-72 animate-pulse rounded-xl bg-slate-200" />
//       <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
//         <div className="space-y-6 xl:col-span-8">
//           <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
//           <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
//         </div>
//         <div className="space-y-6 xl:col-span-4">
//           <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
//           <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
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

//   // ---------- actions ----------
//   const handleDiscard = () => {
//     if (!saved) return;
//     setForm(toForm(saved));
//   };

//   const validate = () => {
//     if (form.systemPrompt.length > MAX_PROMPT_LENGTH)
//       return `Extra instructions must be ${MAX_PROMPT_LENGTH} characters or fewer`;

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
//         businessProfile: form.businessProfile,
//         systemPrompt: form.systemPrompt,
//       });

//       setTestResult({ ...data, question: testMessage });
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
//       <div className="crm-page bg-slate-50">
//         <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
//           <CircleAlert size={20} className="mt-0.5 shrink-0" />
//           <p className="text-sm font-medium">{loadError}</p>
//         </div>
//       </div>
//     );
//   }

//   const isLive = Boolean(saved?.isEnabled);

//   // =====================================================
//   // RENDER
//   // =====================================================
//   return (
//     <div className="crm-page bg-slate-50">
//       {/* ================= HEADER ================= */}
//       <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
//         <div className="flex items-center gap-4">
//           <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#128C7E]">
//             <Bot size={24} />
//           </div>

//           <div>
//             <h1 className="crm-title text-slate-900">AI Auto-Reply</h1>
//             <p className="mt-1 text-sm text-slate-500 sm:text-base">
//               Let our built-in AI answer your customers' WhatsApp messages
//               automatically, using your business details.
//             </p>
//           </div>
//         </div>

//         {/* master switch */}
//         <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
//           <div>
//             <p className="text-sm font-semibold text-slate-900">
//               Auto-reply {form.isEnabled ? "enabled" : "disabled"}
//             </p>
//             <p className="text-xs text-slate-500">
//               Master switch for your whole CRM
//             </p>
//           </div>

//           <Toggle
//             checked={form.isEnabled}
//             onChange={(value) => update({ isEnabled: value })}
//             label="Enable AI auto-reply"
//           />
//         </div>
//       </div>

//       {/* ================= MAIN GRID ================= */}
//       <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
//         {/* ============ LEFT: CONFIGURATION ============ */}
//         <div className="space-y-6 xl:col-span-8">
//           {/* ---------- BUSINESS PROFILE ---------- */}
//           <Card
//             icon={Building2}
//             title="Business profile"
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
//                 hint="Describe your products or services, prices and who you serve. Example: We sell organic tea. 250g pack ₹180, 500g pack ₹320."
//                 right={
//                   <span className="text-xs text-slate-400">
//                     {form.businessProfile.description.length} / 1000
//                   </span>
//                 }
//               >
//                 <textarea
//                   rows={4}
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
//                 hint="Delivery, refunds, payment methods, offers, FAQs. The AI will not invent anything that is not written here."
//                 right={
//                   <span className="text-xs text-slate-400">
//                     {form.businessProfile.policies.length} / 1500
//                   </span>
//                 }
//               >
//                 <textarea
//                   rows={5}
//                   value={form.businessProfile.policies}
//                   onChange={(e) => updateProfile({ policies: e.target.value })}
//                   maxLength={1500}
//                   className={`${inputClass} resize-y leading-relaxed`}
//                 />
//               </Field>

//               <Field label="Tone of replies">
//                 <div className="flex flex-wrap gap-2">
//                   {TONES.map((tone) => (
//                     <button
//                       key={tone.id}
//                       type="button"
//                       onClick={() => updateProfile({ tone: tone.id })}
//                       className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
//                         form.businessProfile.tone === tone.id
//                           ? "border-[#25D366] bg-[#25D366]/10 text-[#128C7E]"
//                           : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
//                       }`}
//                     >
//                       {tone.label}
//                     </button>
//                   ))}
//                 </div>
//               </Field>

//               {!form.businessProfile.description.trim() &&
//                 !form.businessProfile.policies.trim() && (
//                   <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
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

//           {/* ---------- BEHAVIOUR ---------- */}
//           <Card
//             icon={FileText}
//             title="Extra instructions (optional)"
//             subtitle="Special rules on top of your business profile, for example how to greet customers or what never to say."
//           >
//             <div className="space-y-6">
//               <Field
//                 label="Instructions"
//                 right={
//                   <span
//                     className={`text-xs ${
//                       form.systemPrompt.length > MAX_PROMPT_LENGTH
//                         ? "font-semibold text-red-500"
//                         : "text-slate-400"
//                     }`}
//                   >
//                     {form.systemPrompt.length} / {MAX_PROMPT_LENGTH}
//                   </span>
//                 }
//               >
//                 <textarea
//                   rows={6}
//                   value={form.systemPrompt}
//                   onChange={(e) => update({ systemPrompt: e.target.value })}
//                   placeholder="Example: Greet every customer with Vanakkam. Never discuss competitor brands."
//                   className={`${inputClass} resize-y leading-relaxed`}
//                 />
//               </Field>

//               <Field
//                 label="Conversation memory"
//                 hint="How many recent messages (both sides) the AI reads before replying. More memory means better context but higher cost."
//                 right={
//                   <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
//                     {form.historyLimit} messages
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
//                   className="w-full accent-[#25D366]"
//                 />
//                 <div className="mt-1 flex justify-between text-[11px] text-slate-400">
//                   <span>1</span>
//                   <span>50</span>
//                 </div>
//               </Field>
//             </div>
//           </Card>

//           {/* ---------- LEAD CAPTURE ---------- */}
//           <Card
//             icon={UserPlus}
//             title="Lead capture"
//             subtitle="When a new person asks about your products or services, the AI creates a lead in your CRM so your team can follow up."
//             action={
//               <Toggle
//                 checked={form.leadCaptureEnabled}
//                 onChange={(value) => update({ leadCaptureEnabled: value })}
//                 label="Create leads automatically"
//               />
//             }
//           >
//             <div className="space-y-5">
//               <Field
//                 label="Assign new leads to"
//                 hint="Admins are always notified of a new lead. If you pick nobody, an admin assigns it later from the Leads page."
//               >
//                 <select
//                   value={form.leadAssigneeId}
//                   onChange={(e) => update({ leadAssigneeId: e.target.value })}
//                   disabled={!form.leadCaptureEnabled}
//                   className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
//                 >
//                   <option value="">Unassigned</option>
//                   {employees.map((employee) => (
//                     <option key={employee.id} value={employee.id}>
//                       {employee.name}
//                     </option>
//                   ))}
//                 </select>
//               </Field>

//               <ul className="space-y-1.5 text-xs text-slate-500">
//                 <li>
//                   Only real enquiries become leads, not greetings, spam or
//                   support questions.
//                 </li>
//                 <li>
//                   Existing customers, and numbers that already have a lead from
//                   the last 30 days, are skipped.
//                 </li>
//                 <li>
//                   New leads show the source &ldquo;WhatsApp AI&rdquo; on your
//                   Leads page, with a short summary of what the customer wants.
//                 </li>
//                 <li>Works while AI auto-reply is on for the chat.</li>
//               </ul>
//             </div>
//           </Card>
//         </div>

//         {/* ============ RIGHT: STATUS + TEST ============ */}
//         <div className="space-y-6 xl:col-span-4">
//           {/* ---------- STATUS ---------- */}
//           <Card icon={Zap} title="Live status">
//             <div className="divide-y divide-slate-100">
//               <StatusRow label="Auto-reply">
//                 <span
//                   className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
//                     isLive
//                       ? "bg-emerald-50 text-emerald-700"
//                       : "bg-slate-100 text-slate-600"
//                   }`}
//                 >
//                   <span
//                     className={`h-1.5 w-1.5 rounded-full ${
//                       isLive ? "bg-emerald-500" : "bg-slate-400"
//                     }`}
//                   />
//                   {isLive ? "Active" : "Off"}
//                 </span>
//               </StatusRow>

//               <StatusRow label="AI service">
//                 {aiAvailable ? (
//                   <span className="text-emerald-600">Available</span>
//                 ) : (
//                   <span className="text-amber-600">Unavailable</span>
//                 )}
//               </StatusRow>
//             </div>

//             {saved?.lastError && (
//               <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
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
//             icon={Send}
//             title="Test your setup"
//             subtitle="Sends one sample message to the AI. Nothing goes to WhatsApp."
//           >
//             <div className="space-y-3">
//               <Field label="Sample customer message">
//                 <input
//                   type="text"
//                   value={testMessage}
//                   onChange={(e) => setTestMessage(e.target.value)}
//                   maxLength={500}
//                   className={inputClass}
//                 />
//               </Field>

//               <button
//                 type="button"
//                 onClick={handleTest}
//                 disabled={testing || !testMessage.trim()}
//                 className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366] px-4 py-2.5 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/10 disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 {testing ? (
//                   <LoaderCircle size={16} className="animate-spin" />
//                 ) : (
//                   <Send size={16} />
//                 )}
//                 {testing ? "Waiting for the AI..." : "Send test message"}
//               </button>

//               <p className="text-xs text-slate-400">
//                 Uses the prompt on this page, even if you have not saved it
//                 yet.
//               </p>

//               {/* result */}
//               {(testResult || testError) && (
//                 <div className="mt-2 space-y-2 rounded-2xl bg-[#ECE5DD] p-3">
//                   {testResult && (
//                     <>
//                       <div className="flex justify-start">
//                         <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm">
//                           {testResult.question}
//                         </div>
//                       </div>

//                       <div className="flex justify-end">
//                         <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#D9FDD3] px-3.5 py-2 text-sm text-slate-800 shadow-sm">
//                           {testResult.reply}
//                           <p className="mt-1 text-right text-[10px] text-slate-500">
//                             {(testResult.latencyMs / 1000).toFixed(1)}s
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
//                     <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-600">
//                       <CircleAlert size={15} className="mt-0.5 shrink-0" />
//                       <span className="break-words">{testError}</span>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </Card>

//           {/* ---------- HOW IT WORKS ---------- */}
//           <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
//             <h3 className="text-sm font-semibold text-slate-900">
//               How it works
//             </h3>

//             <ol className="mt-4 space-y-3.5">
//               {[
//                 "A customer sends you a WhatsApp message.",
//                 "If auto-reply and the chat's Bot switch are ON, the AI reads the recent conversation.",
//                 "It writes a reply using your business profile and sends it on WhatsApp.",
//                 "If it cannot answer, it tells the customer your team will reply, switches the Bot OFF for that chat and notifies your team.",
//                 "When an agent replies manually, the Bot switch for that chat turns OFF automatically.",
//               ].map((step, index) => (
//                 <li key={step} className="flex gap-3 text-sm text-slate-600">
//                   <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-xs font-bold text-[#128C7E]">
//                     {index + 1}
//                   </span>
//                   <span className="pt-0.5">{step}</span>
//                 </li>
//               ))}
//             </ol>
//           </div>
//         </div>
//       </div>

//       {/* ================= SAVE BAR ================= */}
//       <div className="sticky bottom-4 z-10 mt-6">
//         <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-3.5 shadow-lg backdrop-blur sm:flex-row sm:items-center">
//           <div className="flex items-center gap-2 text-sm">
//             {dirty ? (
//               <>
//                 <span className="h-2 w-2 rounded-full bg-amber-500" />
//                 <span className="font-medium text-slate-700">
//                   You have unsaved changes
//                 </span>
//               </>
//             ) : (
//               <>
//                 <Check size={16} className="text-emerald-500" />
//                 <span className="text-slate-500">All changes saved</span>
//               </>
//             )}
//           </div>

//           <div className="flex items-center gap-3">
//             <button
//               type="button"
//               onClick={handleDiscard}
//               disabled={!dirty || saving}
//               className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               <RotateCcw size={15} />
//               Discard
//             </button>

//             <button
//               type="button"
//               onClick={handleSave}
//               disabled={!dirty || saving}
//               className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               {saving ? (
//                 <LoaderCircle size={16} className="animate-spin" />
//               ) : (
//                 <Save size={16} />
//               )}
//               {saving ? "Saving..." : "Save changes"}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }





import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Bot,
  Building2,
  Check,
  CircleAlert,
  Clock,
  FileText,
  LoaderCircle,
  Phone,
  RotateCcw,
  Save,
  Send,
  UserPlus,
  Zap,
} from "lucide-react";

import {
  getAiSettings,
  updateAiSettings,
  testAiSettings,
} from "../../api/aiSettingsApi";

// =====================================================
// STATIC UI DATA
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
// SMALL REUSABLE PIECES
// =====================================================

function Card({ icon: Icon, title, subtitle, action, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#128C7E]">
              <Icon size={19} />
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, right, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {right}
      </div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-[#25D366] focus:outline-none focus:ring-4 focus:ring-[#25D366]/10";

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
        checked ? "bg-[#25D366]" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function StatusRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="max-w-[60%] truncate text-right text-sm font-medium text-slate-800">
        {children}
      </span>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="crm-page bg-slate-50">
      <div className="mb-8 h-12 w-72 animate-pulse rounded-xl bg-slate-200" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="h-64 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
        </div>
        <div className="space-y-6 xl:col-span-4">
          <div className="h-56 animate-pulse rounded-3xl bg-slate-200" />
          <div className="h-72 animate-pulse rounded-3xl bg-slate-200" />
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

      setTestResult({ ...data, question: testMessage });
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
      <div className="crm-page bg-slate-50">
        <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          <CircleAlert size={20} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{loadError}</p>
        </div>
      </div>
    );
  }

  const isLive = Boolean(saved?.isEnabled);

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="crm-page bg-slate-50">
      {/* ================= HEADER ================= */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#128C7E]">
            <Bot size={24} />
          </div>

          <div>
            <h1 className="crm-title text-slate-900">AI Auto-Reply</h1>
            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Let our built-in AI answer your customers' WhatsApp messages
              automatically, using your business details.
            </p>
          </div>
        </div>

        {/* master switch */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Auto-reply {form.isEnabled ? "enabled" : "disabled"}
            </p>
            <p className="text-xs text-slate-500">
              Master switch for your whole CRM
            </p>
          </div>

          <Toggle
            checked={form.isEnabled}
            onChange={(value) => update({ isEnabled: value })}
            label="Enable AI auto-reply"
          />
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* ============ LEFT: CONFIGURATION ============ */}
        <div className="space-y-6 xl:col-span-8">
          {/* ---------- BUSINESS PROFILE ---------- */}
          <Card
            icon={Building2}
            title="Business profile"
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
                hint="Describe your products or services, prices and who you serve. Example: We sell organic tea. 250g pack ₹180, 500g pack ₹320."
                right={
                  <span className="text-xs text-slate-400">
                    {form.businessProfile.description.length} / 1000
                  </span>
                }
              >
                <textarea
                  rows={4}
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
                hint="Delivery, refunds, payment methods, offers, FAQs. The AI will not invent anything that is not written here."
                right={
                  <span className="text-xs text-slate-400">
                    {form.businessProfile.policies.length} / 1500
                  </span>
                }
              >
                <textarea
                  rows={5}
                  value={form.businessProfile.policies}
                  onChange={(e) => updateProfile({ policies: e.target.value })}
                  maxLength={1500}
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </Field>

              <Field label="Tone of replies">
                <div className="flex flex-wrap gap-2">
                  {TONES.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => updateProfile({ tone: tone.id })}
                      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                        form.businessProfile.tone === tone.id
                          ? "border-[#25D366] bg-[#25D366]/10 text-[#128C7E]"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </Field>

              {!form.businessProfile.description.trim() &&
                !form.businessProfile.policies.trim() && (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
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

          {/* ---------- BEHAVIOUR ---------- */}
          <Card
            icon={FileText}
            title="Extra instructions (optional)"
            subtitle="Special rules on top of your business profile, for example how to greet customers or what never to say."
          >
            <div className="space-y-6">
              <Field
                label="Instructions"
                right={
                  <span
                    className={`text-xs ${
                      form.systemPrompt.length > MAX_PROMPT_LENGTH
                        ? "font-semibold text-red-500"
                        : "text-slate-400"
                    }`}
                  >
                    {form.systemPrompt.length} / {MAX_PROMPT_LENGTH}
                  </span>
                }
              >
                <textarea
                  rows={6}
                  value={form.systemPrompt}
                  onChange={(e) => update({ systemPrompt: e.target.value })}
                  placeholder="Example: Greet every customer with Vanakkam. Never discuss competitor brands."
                  className={`${inputClass} resize-y leading-relaxed`}
                />
              </Field>

              <Field
                label="Conversation memory"
                hint="How many recent messages (both sides) the AI reads before replying. More memory means better context but higher cost."
                right={
                  <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {form.historyLimit} messages
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
                  className="w-full accent-[#25D366]"
                />
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>1</span>
                  <span>50</span>
                </div>
              </Field>
            </div>
          </Card>

          {/* ---------- LEAD CAPTURE ---------- */}
          <Card
            icon={UserPlus}
            title="Lead capture"
            subtitle="When a new person asks about your products or services, the AI creates a lead in your CRM so your team can follow up."
            action={
              <Toggle
                checked={form.leadCaptureEnabled}
                onChange={(value) => update({ leadCaptureEnabled: value })}
                label="Create leads automatically"
              />
            }
          >
            <div className="space-y-5">
              <Field
                label="Assign new leads to"
                hint="Admins are always notified of a new lead. Choose Auto-assign to share new leads fairly between all active employees. If you pick nobody, an admin assigns it later from the Leads page."
              >
                <select
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
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
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
                </select>
              </Field>

              <ul className="space-y-1.5 text-xs text-slate-500">
                <li>
                  Only real enquiries become leads, not greetings, spam or
                  support questions.
                </li>
                <li>
                  Existing customers, and numbers that already have a lead from
                  the last 30 days, are skipped.
                </li>
                <li>
                  New leads show the source &ldquo;WhatsApp AI&rdquo; on your
                  Leads page, with a short summary of what the customer wants.
                </li>
                <li>Works while AI auto-reply is on for the chat.</li>
              </ul>
            </div>
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
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-60`}
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
                  className={`${inputClass} resize-none disabled:cursor-not-allowed disabled:opacity-60`}
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
        <div className="space-y-6 xl:col-span-4">
          {/* ---------- STATUS ---------- */}
          <Card icon={Zap} title="Live status">
            <div className="divide-y divide-slate-100">
              <StatusRow label="Auto-reply">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isLive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isLive ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {isLive ? "Active" : "Off"}
                </span>
              </StatusRow>

              <StatusRow label="AI service">
                {aiAvailable ? (
                  <span className="text-emerald-600">Available</span>
                ) : (
                  <span className="text-amber-600">Unavailable</span>
                )}
              </StatusRow>
            </div>

            {saved?.lastError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
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
            icon={Send}
            title="Test your setup"
            subtitle="Sends one sample message to the AI. Nothing goes to WhatsApp."
          >
            <div className="space-y-3">
              <Field label="Sample customer message">
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  maxLength={500}
                  className={inputClass}
                />
              </Field>

              <Field label="Test as">
                <select
                  value={testChannel}
                  onChange={(e) => setTestChannel(e.target.value)}
                  className={inputClass}
                >
                  <option value="WhatsApp">WhatsApp chat</option>
                  <option value="Instagram">Instagram chat</option>
                  <option value="Messenger">Facebook Messenger chat</option>
                </select>
              </Field>

              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !testMessage.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#25D366] px-4 py-2.5 text-sm font-semibold text-[#128C7E] transition hover:bg-[#25D366]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {testing ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {testing ? "Waiting for the AI..." : "Send test message"}
              </button>

              <p className="text-xs text-slate-400">
                Uses the prompt on this page, even if you have not saved it
                yet.
              </p>

              {/* result */}
              {(testResult || testError) && (
                <div className="mt-2 space-y-2 rounded-2xl bg-[#ECE5DD] p-3">
                  {testResult && (
                    <>
                      <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 text-sm text-slate-800 shadow-sm">
                          {testResult.question}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-[#D9FDD3] px-3.5 py-2 text-sm text-slate-800 shadow-sm">
                          {testResult.reply}
                          <p className="mt-1 text-right text-[10px] text-slate-500">
                            {(testResult.latencyMs / 1000).toFixed(1)}s
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
                    <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-600">
                      <CircleAlert size={15} className="mt-0.5 shrink-0" />
                      <span className="break-words">{testError}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* ---------- HOW IT WORKS ---------- */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">
              How it works
            </h3>

            <ol className="mt-4 space-y-3.5">
              {[
                "A customer sends you a WhatsApp message.",
                "If auto-reply and the chat's Bot switch are ON, the AI reads the recent conversation.",
                "It writes a reply using your business profile and sends it on WhatsApp.",
                "If it cannot answer, it tells the customer your team will reply, switches the Bot OFF for that chat and notifies your team.",
                "When an agent replies manually, the Bot switch for that chat turns OFF automatically.",
              ].map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25D366]/10 text-xs font-bold text-[#128C7E]">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* ================= SAVE BAR ================= */}
      <div className="sticky bottom-4 z-10 mt-6">
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-3.5 shadow-lg backdrop-blur sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm">
            {dirty ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="font-medium text-slate-700">
                  You have unsaved changes
                </span>
              </>
            ) : (
              <>
                <Check size={16} className="text-emerald-500" />
                <span className="text-slate-500">All changes saved</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={!dirty || saving}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={15} />
              Discard
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || saving}
              className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128C7E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



