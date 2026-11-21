// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { toast } from "react-hot-toast";
// import {
//   ChevronDown,
//   CircleAlert,
//   Eye,
//   Filter,
//   Library,
//   LoaderCircle,
//   Pencil,
//   Plus,
//   Search,
//   Send,
//   Trash2,
//   Upload,
//   X,
// } from "lucide-react";

// import {
//   getKnowledgeBase,
//   createKnowledgeEntry,
//   updateKnowledgeEntry,
//   deleteKnowledgeEntry,
//   deleteAllKnowledge,
// } from "../../api/knowledgeBaseApi";
// import { updateAiSettings, testAiSettings } from "../../api/aiSettingsApi";
// import ConfirmModal from "../../components/common/ConfirmModal";
// import RowActionsMenu from "../../components/common/RowActionsMenu";
// import CustomerPagination from "../../components/customers/CustomerPagination";
// import StatusToggle from "../../components/customers/StatusToggle";
// import KnowledgeImportModal from "./KnowledgeImportModal";

// // =====================================================
// // LIMITS (same as the server)
// // =====================================================
// const LIMITS = { title: 200, category: 60, keywords: 300, content: 4000 };
// const CATEGORY_SUGGESTIONS = ["General", "Pricing", "Delivery", "Policies", "Services", "Timings"];

// const EMPTY_FORM = { title: "", category: "", keywords: "", content: "", isActive: true };

// const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

// const inputClass =
//   "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 read-only:cursor-default read-only:focus:border-slate-200 read-only:focus:ring-0";

// const thClass = "whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-600";
// const tdClass = "px-5 py-4 text-sm text-slate-700";

// // =====================================================
// // USAGE BADGE  (entries used / limit, water-fill circle)
// // =====================================================
// function UsageBadge({ used, limit }) {
//   const ratio = limit > 0 ? Math.min(used / limit, 1) : 0;
//   // keep a little wave visible even when only a few entries are used
//   const fill = Math.max(ratio * 100, 16);

//   return (
//     <div
//       title={`${used} of ${limit} entries used`}
//       aria-label={`${used} of ${limit} entries used`}
//       className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-green-500 bg-white"
//     >
//       <div
//         className="absolute inset-x-0 bottom-0 bg-green-500 transition-all duration-500"
//         style={{ height: `${fill}%` }}
//       >
//         <svg
//           viewBox="0 0 100 12"
//           preserveAspectRatio="none"
//           className="absolute -top-2.5 left-0 h-3 w-full fill-green-500"
//           aria-hidden="true"
//         >
//           <path d="M0 12 Q 12.5 0 25 6 T 50 6 T 75 6 T 100 6 V12 Z" />
//         </svg>
//       </div>
//       <span className="relative z-10 -mt-3 text-[11px] font-medium text-slate-800">
//         {used}/{limit}
//       </span>
//     </div>
//   );
// }

// // =====================================================
// // ADD / VIEW / EDIT MODAL
// // mode: "add" | "view" | "edit"
// // =====================================================
// function EntryModal({ entry, mode, saving, onSave, onClose, onEdit }) {
//   const [form, setForm] = useState(
//     entry
//       ? {
//           title: entry.title,
//           category: entry.category || "",
//           keywords: entry.keywords || "",
//           content: entry.content,
//           isActive: entry.isActive,
//         }
//       : EMPTY_FORM
//   );

//   const readOnly = mode === "view";
//   const heading = mode === "add" ? "Add Entry" : mode === "view" ? "View Entry" : "Edit Entry";

//   useEffect(() => {
//     const onKey = (event) => {
//       if (event.key === "Escape" && !saving) onClose();
//     };

//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [onClose, saving]);

//   const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

//   const submit = (event) => {
//     event.preventDefault();
//     if (readOnly) return;

//     const title = form.title.trim();
//     const content = form.content.trim();

//     if (!title) return toast.error("Please enter a title");
//     if (!content) return toast.error("Please enter the answer / content");

//     onSave({
//       title,
//       content,
//       category: form.category.trim() || "General",
//       keywords: form.keywords.trim(),
//       isActive: form.isActive,
//     });
//   };

//   return (
//     <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4">
//       <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
//         {/* HEADER */}
//         <div className="flex items-center justify-between gap-4 border-b border-slate-300 pb-5">
//           <h2 className="min-w-0 flex-1 truncate text-2xl font-bold text-slate-900">{heading}</h2>

//           <div className="flex shrink-0 items-center gap-3">
//             {readOnly && (
//               <button
//                 type="button"
//                 onClick={onEdit}
//                 className="inline-flex h-11 items-center gap-2 rounded-full border border-green-500 bg-green-50 px-5 text-base font-medium text-green-700 transition hover:bg-green-100"
//               >
//                 <Pencil size={18} />
//                 Edit
//               </button>
//             )}

//             <button
//               type="button"
//               onClick={onClose}
//               disabled={saving}
//               aria-label="Close"
//               className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
//             >
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         <form onSubmit={submit} className="mt-6 space-y-6">
//           <div>
//             <div className="mb-2 flex items-center justify-between">
//               <label className="text-base text-slate-900">
//                 Title / question <span className="text-red-500">*</span>
//               </label>
//               <span className="text-xs text-slate-500">
//                 {form.title.length}/{LIMITS.title}
//               </span>
//             </div>
//             <input
//               value={form.title}
//               onChange={set("title")}
//               maxLength={LIMITS.title}
//               readOnly={readOnly}
//               placeholder="e.g. Delivery charges and timing"
//               className={inputClass}
//               autoFocus={!readOnly}
//             />
//           </div>

//           <div>
//             <div className="mb-2 flex items-center justify-between">
//               <label className="text-base text-slate-900">
//                 Answer / Content <span className="text-red-500">*</span>
//               </label>
//               <span className="text-xs text-slate-500">
//                 {form.content.length}/{LIMITS.content}
//               </span>
//             </div>
//             <textarea
//               value={form.content}
//               onChange={set("content")}
//               maxLength={LIMITS.content}
//               readOnly={readOnly}
//               rows={6}
//               placeholder="e.g. Delivery inside the city is Rs 40. Orders above Rs 500 ship free. Delivery takes 1-2 days."
//               className={`${inputClass} resize-y`}
//             />
//           </div>

//           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
//             <div>
//               <label className="mb-2 block text-base text-slate-900">Category</label>
//               <input
//                 value={form.category}
//                 onChange={set("category")}
//                 maxLength={LIMITS.category}
//                 readOnly={readOnly}
//                 list="kb-categories"
//                 placeholder="General"
//                 className={inputClass}
//               />
//               <datalist id="kb-categories">
//                 {CATEGORY_SUGGESTIONS.map((name) => (
//                   <option key={name} value={name} />
//                 ))}
//               </datalist>
//             </div>

//             <div>
//               <label className="mb-2 block text-base text-slate-900">
//                 Also known as (keywords)
//               </label>
//               <input
//                 value={form.keywords}
//                 onChange={set("keywords")}
//                 maxLength={LIMITS.keywords}
//                 readOnly={readOnly}
//                 placeholder="Shipping, courier, delivery fee"
//                 className={inputClass}
//               />
//             </div>
//           </div>

//           <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
//             <div>
//               <p className="text-lg font-medium text-slate-900">Active</p>
//               <p className="text-base text-slate-500">Inactive entries are never used by the AI</p>
//             </div>
//             <StatusToggle
//               checked={form.isActive}
//               disabled={readOnly}
//               onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))}
//               label="Entry active"
//             />
//           </div>

//           <div className="flex justify-end gap-3 pt-1">
//             <button
//               type="button"
//               onClick={onClose}
//               disabled={saving}
//               className="h-12 rounded-xl border border-slate-200 bg-white px-8 text-base font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
//             >
//               Close
//             </button>
//             <button
//               type="submit"
//               disabled={saving || readOnly}
//               className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-10 text-base font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               {saving && <LoaderCircle size={16} className="animate-spin" />}
//               Save
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // =====================================================
// // TRY DEMO MODAL  (Try it + Tips)
// // =====================================================
// function DemoModal({ useKb, onClose }) {
//   const [message, setMessage] = useState("");
//   const [testing, setTesting] = useState(false);
//   const [result, setResult] = useState(null);

//   useEffect(() => {
//     const onKey = (event) => {
//       if (event.key === "Escape") onClose();
//     };

//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [onClose]);

//   const handleTest = async () => {
//     const text = message.trim();

//     if (!text) return toast.error("Type a customer question to try");
//     if (testing) return;

//     setTesting(true);
//     setResult(null);

//     try {
//       const data = await testAiSettings({ message: text });
//       setResult({
//         reply: data.reply,
//         handoff: Boolean(data.handoff),
//         matches: data.kbMatches || [],
//       });
//     } catch (error) {
//       toast.error(errorMessage(error, "The test failed"));
//     } finally {
//       setTesting(false);
//     }
//   };

//   return (
//     <div
//       className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4"
//       onClick={onClose}
//     >
//       <div
//         className="relative max-h-[92vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
//         onClick={(event) => event.stopPropagation()}
//       >
//         <button
//           type="button"
//           onClick={onClose}
//           aria-label="Close"
//           className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
//         >
//           <X size={18} />
//         </button>

//         {/* TRY IT */}
//         <section className="rounded-3xl border border-slate-200 bg-white p-6">
//           <h2 className="pr-12 text-2xl font-bold text-slate-900">Try it</h2>
//           <p className="mt-2 text-base text-slate-500">See how the AI answers a customer question</p>

//           <label className="mt-6 block text-base text-slate-900" htmlFor="kb-demo-message">
//             Sample customer message
//           </label>
//           <input
//             id="kb-demo-message"
//             value={message}
//             onChange={(event) => setMessage(event.target.value)}
//             onKeyDown={(event) => {
//               if (event.key === "Enter") handleTest();
//             }}
//             maxLength={500}
//             placeholder="Hi, what are your working hours?"
//             className={`${inputClass} mt-3`}
//           />

//           <button
//             type="button"
//             onClick={handleTest}
//             disabled={testing}
//             className="mx-auto mt-5 flex h-14 w-full max-w-sm items-center justify-center gap-3 rounded-xl bg-black px-6 text-base font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
//           >
//             {testing ? <LoaderCircle size={20} className="animate-spin" /> : <Send size={20} />}
//             Send test message
//           </button>

//           {result && (
//             <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
//               <p className="text-lg text-slate-900">AI reply</p>
//               <p className="mt-2 whitespace-pre-line break-words text-base text-slate-800">
//                 {result.reply}
//               </p>

//               {result.handoff && (
//                 <p className="mt-3 text-sm font-medium text-amber-700">
//                   The AI would pass this chat to your team.
//                 </p>
//               )}

//               <p className="mt-3 text-xs text-slate-500">
//                 {result.matches.length > 0
//                   ? `Entries used: ${result.matches.map((match) => match.title).join(", ")}`
//                   : `No entries matched${useKb ? "" : " (knowledge base is off)"}.`}
//               </p>
//             </div>
//           )}
//         </section>

//         {/* TIPS */}
//         <section className="rounded-3xl border border-slate-200 bg-white p-6">
//           <h3 className="border-b border-slate-300 px-1 pb-4 text-sm font-semibold text-slate-900">
//             Tips
//           </h3>
//           <ul className="mt-5 list-disc space-y-4 pl-8 pr-2 text-base text-slate-900">
//             <li>One topic per entry works best (delivery, refunds, timings).</li>
//             <li>Add keywords for other words customer use like &ldquo;shipping&rdquo; or &ldquo;courier&rdquo;.</li>
//             <li>If nothing matches the AI hands the chat to your team instead of guessing.</li>
//             <li>
//               Switch the AI itself on or off in{" "}
//               <Link
//                 to="/settings/ai-auto-reply"
//                 className="font-medium text-green-700 underline underline-offset-2 hover:text-green-800"
//               >
//                 AI Auto-Reply
//               </Link>
//             </li>
//           </ul>
//         </section>
//       </div>
//     </div>
//   );
// }

// // =====================================================
// // PAGE
// // =====================================================
// export default function KnowledgeBase() {
//   const [entries, setEntries] = useState([]);
//   const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
//   const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, limit: 300 });
//   const [useKb, setUseKb] = useState(true);

//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState("");

//   const [searchInput, setSearchInput] = useState("");
//   const [search, setSearch] = useState("");
//   const [status, setStatus] = useState("all");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(5);

//   const [modal, setModal] = useState(null); // null | { entry: object|null, mode: "add"|"view"|"edit" }
//   const [saving, setSaving] = useState(false);
//   const [deleteTarget, setDeleteTarget] = useState(null);
//   const [switching, setSwitching] = useState(false);

//   const [showImport, setShowImport] = useState(false);
//   const [showDemo, setShowDemo] = useState(false);
//   const [showDeleteAll, setShowDeleteAll] = useState(false);
//   const [deleteAllText, setDeleteAllText] = useState("");
//   const [deletingAll, setDeletingAll] = useState(false);

//   // Bump this to fetch the list again (after add / edit / delete)
//   const [reloadKey, setReloadKey] = useState(0);
//   const reload = () => setReloadKey((key) => key + 1);

//   // Load the list. `cancelled` drops the answer of an older request when the
//   // admin types or clicks quickly, so a slow response can't overwrite a newer one.
//   useEffect(() => {
//     let cancelled = false;

//     getKnowledgeBase({ search, status, page, limit: pageSize })
//       .then((data) => {
//         if (cancelled) return;

//         setEntries(data.entries || []);
//         setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
//         setStats(data.stats || { total: 0, active: 0, inactive: 0, limit: 300 });
//         setUseKb(data.useKnowledgeBase !== false);
//         setLoadError("");
//       })
//       .catch((error) => {
//         if (cancelled) return;
//         setLoadError(errorMessage(error, "Failed to load the knowledge base"));
//       })
//       .finally(() => {
//         if (!cancelled) setLoading(false);
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [search, status, page, pageSize, reloadKey]);

//   // Search as the admin types (small delay so we don't call the server on every key)
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setSearch(searchInput.trim());
//       setPage(1);
//     }, 350);

//     return () => clearTimeout(timer);
//   }, [searchInput]);

//   // ---------- master switch ----------
//   const handleSwitch = async (next) => {
//     setSwitching(true);
//     setUseKb(next);

//     try {
//       await updateAiSettings({ useKnowledgeBase: next });
//       toast.success(next ? "AI will use your knowledge base" : "AI will ignore the knowledge base");
//     } catch (error) {
//       setUseKb(!next);
//       toast.error(errorMessage(error, "Failed to update the setting"));
//     } finally {
//       setSwitching(false);
//     }
//   };

//   // ---------- add / edit ----------
//   const handleSave = async (payload) => {
//     setSaving(true);

//     try {
//       if (modal?.entry) {
//         await updateKnowledgeEntry(modal.entry.id, payload);
//         toast.success("Entry updated");
//       } else {
//         await createKnowledgeEntry(payload);
//         toast.success("Entry added");
//       }

//       setModal(null);
//       reload();
//     } catch (error) {
//       toast.error(errorMessage(error, "Failed to save the entry"));
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ---------- active on/off ----------
//   const handleToggleEntry = async (entry) => {
//     const next = !entry.isActive;

//     // flip it on screen right away, put it back if the server says no
//     setEntries((prev) => prev.map((row) => (row.id === entry.id ? { ...row, isActive: next } : row)));

//     try {
//       await updateKnowledgeEntry(entry.id, { isActive: next });
//       reload();
//     } catch (error) {
//       setEntries((prev) =>
//         prev.map((row) => (row.id === entry.id ? { ...row, isActive: entry.isActive } : row))
//       );
//       toast.error(errorMessage(error, "Failed to update the entry"));
//     }
//   };

//   // ---------- delete ----------
//   const handleDelete = async () => {
//     const target = deleteTarget;
//     setDeleteTarget(null);

//     if (!target) return;

//     try {
//       await deleteKnowledgeEntry(target.id);
//       toast.success("Entry deleted");

//       // Deleted the last row of a page -> go back one page
//       if (entries.length === 1 && page > 1) setPage(page - 1);
//       else reload();
//     } catch (error) {
//       toast.error(errorMessage(error, "Failed to delete the entry"));
//     }
//   };

//   // ---------- delete everything (typed confirmation) ----------
//   const handleDeleteAll = async () => {
//     setDeletingAll(true);

//     try {
//       const data = await deleteAllKnowledge();
//       toast.success(data.message || "All entries deleted");
//       setShowDeleteAll(false);
//       setDeleteAllText("");
//       setPage(1);
//       reload();
//     } catch (error) {
//       toast.error(errorMessage(error, "Failed to delete the entries"));
//     } finally {
//       setDeletingAll(false);
//     }
//   };

//   // 3-dot menu for one row
//   const rowMenuItems = (entry) => [
//     { key: "view", label: "View", icon: Eye, onClick: () => setModal({ entry, mode: "view" }) },
//     { key: "edit", label: "Edit", icon: Pencil, onClick: () => setModal({ entry, mode: "edit" }) },
//     {
//       key: "delete",
//       label: "Delete",
//       icon: Trash2,
//       danger: true,
//       onClick: () => setDeleteTarget(entry),
//     },
//   ];

//   // ---------- render ----------
//   if (loading) {
//     return (
//       <div className="crm-page">
//         <div className="mb-8 h-12 w-72 animate-pulse rounded-xl bg-slate-200" />
//         <div className="space-y-4">
//           <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
//           <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
//         </div>
//       </div>
//     );
//   }

//   if (loadError && entries.length === 0 && stats.total === 0) {
//     return (
//       <div className="crm-page">
//         <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
//           <CircleAlert size={20} className="mt-0.5 shrink-0" />
//           <div>
//             <p className="text-sm font-medium">{loadError}</p>
//             <button
//               type="button"
//               onClick={() => {
//                 setLoading(true);
//                 reload();
//               }}
//               className="mt-2 text-sm font-semibold underline"
//             >
//               Try again
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const filtering = Boolean(search) || status !== "all";

//   return (
//     <div className="crm-page">
//       {/* ================= HEADER ================= */}
//       <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//         <div className="min-w-0">
//           <h1 className="crm-title">Knowledge base</h1>
//           <p className="crm-subtitle">
//             Teach the AI your business. It answers customers from these entries only for your company.
//           </p>
//         </div>

//         <div className="flex flex-col gap-3 sm:flex-row">
//           <button
//             type="button"
//             onClick={() => setShowImport(true)}
//             className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-green-500 bg-white px-6 text-sm font-semibold text-green-600 transition hover:bg-green-50"
//           >
//             <Upload size={16} />
//             Import
//           </button>

//           <button
//             type="button"
//             onClick={() => setShowDemo(true)}
//             className="inline-flex h-12 items-center justify-center rounded-xl bg-green-500 px-7 text-sm font-semibold text-white transition hover:bg-green-600"
//           >
//             Try Demo
//           </button>
//         </div>
//       </div>

//       {/* usage badge + master switch */}
//       <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
//         <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
//           <div>
//             <p className="text-sm font-medium text-slate-900">Use in AI replies</p>
//             <p className="text-xs text-slate-500">{useKb ? "On" : "Off"}</p>
//           </div>
//           <StatusToggle
//             checked={useKb}
//             onChange={handleSwitch}
//             disabled={switching}
//             label="Use the knowledge base in AI replies"
//           />
//         </div>

//         <UsageBadge used={stats.total} limit={stats.limit} />
//       </div>

//       {!useKb && (
//         <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
//           <CircleAlert size={18} className="mt-0.5 shrink-0" />
//           <p>The knowledge base is switched off, so the AI is not using these entries.</p>
//         </div>
//       )}

//       {/* ================= SEARCH + FILTER + ADD ================= */}
//       <div className="mb-6 flex flex-col gap-3 sm:flex-row">
//         <div className="relative min-w-0 flex-1">
//           <Search
//             size={18}
//             className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
//           />
//           <input
//             value={searchInput}
//             onChange={(event) => setSearchInput(event.target.value)}
//             placeholder="Search entries..."
//             aria-label="Search entries"
//             className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
//           />
//           {searchInput && (
//             <button
//               type="button"
//               onClick={() => setSearchInput("")}
//               aria-label="Clear search"
//               title="Clear search"
//               className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
//             >
//               <X size={14} />
//             </button>
//           )}
//         </div>

//         <div className="relative sm:w-52">
//           <Filter
//             size={18}
//             className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
//           />
//           <select
//             aria-label="Filter by status"
//             value={status}
//             onChange={(event) => {
//               setStatus(event.target.value);
//               setPage(1);
//             }}
//             className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
//           >
//             <option value="all">All Status</option>
//             <option value="active">Active</option>
//             <option value="inactive">Inactive</option>
//           </select>
//           <ChevronDown
//             size={18}
//             className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
//           />
//         </div>

//         <button
//           type="button"
//           onClick={() => setModal({ entry: null, mode: "add" })}
//           className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-6 text-sm font-semibold text-white transition hover:bg-green-600"
//         >
//           <Plus size={16} />
//           Add Entry
//         </button>
//       </div>

//       {/* ================= TABLE ================= */}
//       <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//         <div className="overflow-x-auto">
//           <table className="w-full min-w-[760px] text-left">
//             <thead className="bg-green-100">
//               <tr>
//                 <th className={thClass}>Title</th>
//                 <th className={`${thClass} text-center`}>Description</th>
//                 <th className={`${thClass} text-center`}>Category</th>
//                 <th className={`${thClass} text-center uppercase`}>Status</th>
//                 <th className={`${thClass} text-center uppercase`}>Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {entries.length === 0 ? (
//                 <tr>
//                   <td colSpan={5} className="px-5 py-14 text-center">
//                     <Library size={36} className="mx-auto mb-2 text-slate-300" />
//                     <p className="font-medium text-slate-700">
//                       {filtering ? "No entries match your search" : "Your knowledge base is empty"}
//                     </p>
//                     <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
//                       {filtering
//                         ? "Try a different word or clear the filter."
//                         : "Add your prices, policies, timings and common answers. The AI will use them when customers ask."}
//                     </p>
//                   </td>
//                 </tr>
//               ) : (
//                 entries.map((entry) => (
//                   <tr
//                     key={entry.id}
//                     className="border-t border-slate-200 transition hover:bg-slate-50"
//                   >
//                     <td className={`${tdClass} max-w-[260px]`}>
//                       <button
//                         type="button"
//                         onClick={() => setModal({ entry, mode: "view" })}
//                         className="line-clamp-2 break-words text-left font-semibold text-slate-900 transition hover:text-green-600 hover:underline"
//                       >
//                         {entry.title}
//                       </button>
//                     </td>

//                     <td className={`${tdClass} max-w-[320px] text-center`}>
//                       <p className="line-clamp-2 whitespace-pre-line break-words">{entry.content}</p>
//                     </td>

//                     <td className={`${tdClass} text-center`}>{entry.category}</td>

//                     <td className={tdClass}>
//                       <div className="flex justify-center">
//                         <StatusToggle
//                           checked={entry.isActive}
//                           onChange={() => handleToggleEntry(entry)}
//                           label={`Entry "${entry.title}" active`}
//                         />
//                       </div>
//                     </td>

//                     <td className={tdClass}>
//                       <div className="flex justify-center">
//                         <RowActionsMenu
//                           ariaLabel={`Actions for ${entry.title}`}
//                           items={rowMenuItems(entry)}
//                         />
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* ================= PAGINATION ================= */}
//       {entries.length > 0 && (
//         <CustomerPagination
//           currentPage={pagination.page || page}
//           totalPages={pagination.totalPages || 1}
//           pageSize={pageSize}
//           onPageChange={(next) =>
//             setPage(Math.min(Math.max(1, next), pagination.totalPages || 1))
//           }
//           onPageSizeChange={(size) => {
//             setPageSize(size);
//             setPage(1);
//           }}
//         />
//       )}

//       {stats.total > 0 && (
//         <div className="mt-4 text-right">
//           <button
//             type="button"
//             onClick={() => {
//               setDeleteAllText("");
//               setShowDeleteAll(true);
//             }}
//             className="text-xs font-medium text-slate-400 transition hover:text-red-600"
//           >
//             Delete all entries...
//           </button>
//         </div>
//       )}

//       {/* ================= MODALS ================= */}
//       {modal && (
//         <EntryModal
//           key={modal.entry?.id ?? "new"}
//           entry={modal.entry}
//           mode={modal.mode}
//           saving={saving}
//           onSave={handleSave}
//           onClose={() => setModal(null)}
//           onEdit={() => setModal((prev) => (prev ? { ...prev, mode: "edit" } : prev))}
//         />
//       )}

//       {showDemo && <DemoModal useKb={useKb} onClose={() => setShowDemo(false)} />}

//       {showImport && (
//         <KnowledgeImportModal
//           onClose={() => setShowImport(false)}
//           onImported={() => {
//             setPage(1);
//             reload();
//           }}
//         />
//       )}

//       {showDeleteAll && (
//         <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4">
//           <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
//             <h2 className="text-xl font-bold text-slate-900">Delete all entries?</h2>
//             <p className="mt-2 text-sm text-slate-600">
//               This removes all {stats.total} entries of your knowledge base. The AI will stop using
//               them. This cannot be undone.
//             </p>
//             <p className="mt-4 text-sm text-slate-700">
//               Type <b>DELETE ALL</b> to confirm:
//             </p>
//             <input
//               value={deleteAllText}
//               onChange={(event) => setDeleteAllText(event.target.value)}
//               className={`${inputClass} mt-2`}
//               autoFocus
//             />
//             <div className="mt-6 flex justify-end gap-3">
//               <button
//                 type="button"
//                 onClick={() => setShowDeleteAll(false)}
//                 disabled={deletingAll}
//                 className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="button"
//                 onClick={handleDeleteAll}
//                 disabled={deleteAllText !== "DELETE ALL" || deletingAll}
//                 className="inline-flex h-12 items-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
//               >
//                 {deletingAll && <LoaderCircle size={16} className="animate-spin" />}
//                 Delete everything
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <ConfirmModal
//         isOpen={Boolean(deleteTarget)}
//         title="Delete this entry?"
//         message={`"${deleteTarget?.title || ""}" will be removed and the AI will stop using it.`}
//         confirmText="Delete"
//         onConfirm={handleDelete}
//         onCancel={() => setDeleteTarget(null)}
//       />
//     </div>
//   );
// }



import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ChevronDown,
  CircleAlert,
  Eye,
  Filter,
  Library,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  getKnowledgeBase,
  createKnowledgeEntry,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
  deleteAllKnowledge,
} from "../../api/knowledgeBaseApi";
import { updateAiSettings, testAiSettings } from "../../api/aiSettingsApi";
import ConfirmModal from "../../components/common/ConfirmModal";
import RowActionsMenu from "../../components/common/RowActionsMenu";
import CustomerPagination from "../../components/customers/CustomerPagination";
import StatusToggle from "../../components/customers/StatusToggle";
import KnowledgeImportModal from "./KnowledgeImportModal";

// =====================================================
// LIMITS (same as the server)
// =====================================================
const LIMITS = { title: 200, category: 60, keywords: 300, content: 4000 };
const CATEGORY_SUGGESTIONS = ["General", "Pricing", "Delivery", "Policies", "Services", "Timings"];

const EMPTY_FORM = { title: "", category: "", keywords: "", content: "", isActive: true };

const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100 read-only:cursor-default read-only:focus:border-slate-200 read-only:focus:ring-0";

const thClass = "whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-600";
const tdClass = "px-5 py-4 text-sm text-slate-700";

// =====================================================
// USAGE BADGE  (entries used / limit, water-fill circle)
// =====================================================
function UsageBadge({ used, limit }) {
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 0;
  // keep a little wave visible even when only a few entries are used
  const fill = Math.max(ratio * 100, 16);

  return (
    <div
      title={`${used} of ${limit} entries used`}
      aria-label={`${used} of ${limit} entries used`}
      className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-green-500 bg-white"
    >
      <div
        className="absolute inset-x-0 bottom-0 bg-green-500 transition-all duration-500"
        style={{ height: `${fill}%` }}
      >
        <svg
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
          className="absolute -top-2.5 left-0 h-3 w-full fill-green-500"
          aria-hidden="true"
        >
          <path d="M0 12 Q 12.5 0 25 6 T 50 6 T 75 6 T 100 6 V12 Z" />
        </svg>
      </div>
      <span className="relative z-10 -mt-3 text-[11px] font-medium text-slate-800">
        {used}/{limit}
      </span>
    </div>
  );
}

// =====================================================
// ADD / VIEW / EDIT MODAL
// mode: "add" | "view" | "edit"
// =====================================================
function EntryModal({ entry, mode, saving, onSave, onClose, onEdit }) {
  const [form, setForm] = useState(
    entry
      ? {
          title: entry.title,
          category: entry.category || "",
          keywords: entry.keywords || "",
          content: entry.content,
          isActive: entry.isActive,
        }
      : EMPTY_FORM
  );

  const readOnly = mode === "view";
  const heading = mode === "add" ? "Add Entry" : mode === "view" ? "View Entry" : "Edit Entry";

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    if (readOnly) return;

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title) return toast.error("Please enter a title");
    if (!content) return toast.error("Please enter the answer / content");

    onSave({
      title,
      content,
      category: form.category.trim() || "General",
      keywords: form.keywords.trim(),
      isActive: form.isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-300 pb-5">
          <h2 className="min-w-0 flex-1 truncate text-2xl font-bold text-slate-900">{heading}</h2>

          <div className="flex shrink-0 items-center gap-3">
            {readOnly && (
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-green-500 bg-green-50 px-5 text-base font-medium text-green-700 transition hover:bg-green-100"
              >
                <Pencil size={18} />
                Edit
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-base text-slate-900">
                Title / question <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-500">
                {form.title.length}/{LIMITS.title}
              </span>
            </div>
            <input
              value={form.title}
              onChange={set("title")}
              maxLength={LIMITS.title}
              readOnly={readOnly}
              placeholder="e.g. Delivery charges and timing"
              className={inputClass}
              autoFocus={!readOnly}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-base text-slate-900">
                Answer / Content <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-500">
                {form.content.length}/{LIMITS.content}
              </span>
            </div>
            <textarea
              value={form.content}
              onChange={set("content")}
              maxLength={LIMITS.content}
              readOnly={readOnly}
              rows={6}
              placeholder="e.g. Delivery inside the city is Rs 40. Orders above Rs 500 ship free. Delivery takes 1-2 days."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-base text-slate-900">Category</label>
              <input
                value={form.category}
                onChange={set("category")}
                maxLength={LIMITS.category}
                readOnly={readOnly}
                list="kb-categories"
                placeholder="General"
                className={inputClass}
              />
              <datalist id="kb-categories">
                {CATEGORY_SUGGESTIONS.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-2 block text-base text-slate-900">
                Also known as (keywords)
              </label>
              <input
                value={form.keywords}
                onChange={set("keywords")}
                maxLength={LIMITS.keywords}
                readOnly={readOnly}
                placeholder="Shipping, courier, delivery fee"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
            <div>
              <p className="text-lg font-medium text-slate-900">Active</p>
              <p className="text-base text-slate-500">Inactive entries are never used by the AI</p>
            </div>
            <StatusToggle
              checked={form.isActive}
              disabled={readOnly}
              onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))}
              label="Entry active"
            />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-12 rounded-xl border border-slate-200 bg-white px-8 text-base font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving || readOnly}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-10 text-base font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <LoaderCircle size={16} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// TRY DEMO MODAL  (Try it + Tips)
// =====================================================
function DemoModal({ useKb, onClose }) {
  const [message, setMessage] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleTest = async () => {
    const text = message.trim();

    if (!text) return toast.error("Type a customer question to try");
    if (testing) return;

    setTesting(true);
    setResult(null);

    try {
      const data = await testAiSettings({ message: text });
      setResult({
        reply: data.reply,
        handoff: Boolean(data.handoff),
        matches: data.kbMatches || [],
      });
    } catch (error) {
      toast.error(errorMessage(error, "The test failed"));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-xl space-y-5 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
        >
          <X size={18} />
        </button>

        {/* TRY IT */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="pr-12 text-2xl font-bold text-slate-900">Try it</h2>
          <p className="mt-2 text-base text-slate-500">See how the AI answers a customer question</p>

          <label className="mt-6 block text-base text-slate-900" htmlFor="kb-demo-message">
            Sample customer message
          </label>
          <input
            id="kb-demo-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleTest();
            }}
            maxLength={500}
            placeholder="Hi, what are your working hours?"
            className={`${inputClass} mt-3`}
          />

          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="mx-auto mt-5 flex h-14 w-full max-w-sm items-center justify-center gap-3 rounded-xl bg-black px-6 text-base font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {testing ? <LoaderCircle size={20} className="animate-spin" /> : <Send size={20} />}
            Send test message
          </button>

          {result && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-lg text-slate-900">AI reply</p>
              <p className="mt-2 whitespace-pre-line break-words text-base text-slate-800">
                {result.reply}
              </p>

              {result.handoff && (
                <p className="mt-3 text-sm font-medium text-amber-700">
                  The AI would pass this chat to your team.
                </p>
              )}

              <p className="mt-3 text-xs text-slate-500">
                {result.matches.length > 0
                  ? `Entries used: ${result.matches.map((match) => match.title).join(", ")}`
                  : `No entries matched${useKb ? "" : " (knowledge base is off)"}.`}
              </p>
            </div>
          )}
        </section>

        {/* TIPS */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6">
          <h3 className="border-b border-slate-300 px-1 pb-4 text-sm font-semibold text-slate-900">
            Tips
          </h3>
          <ul className="mt-5 list-disc space-y-4 pl-8 pr-2 text-base text-slate-900">
            <li>One topic per entry works best (delivery, refunds, timings).</li>
            <li>Add keywords for other words customer use like &ldquo;shipping&rdquo; or &ldquo;courier&rdquo;.</li>
            <li>If nothing matches the AI hands the chat to your team instead of guessing.</li>
            <li>
              Switch the AI itself on or off in{" "}
              <Link
                to="/settings/ai-auto-reply"
                className="font-medium text-green-700 underline underline-offset-2 hover:text-green-800"
              >
                AI Auto-Reply
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}

// =====================================================
// PAGE
// =====================================================
export default function KnowledgeBase() {
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, limit: 300 });
  const [useKb, setUseKb] = useState(true);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [modal, setModal] = useState(null); // null | { entry: object|null, mode: "add"|"view"|"edit" }
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [switching, setSwitching] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteAllText, setDeleteAllText] = useState("");
  const [deletingAll, setDeletingAll] = useState(false);

  // Bump this to fetch the list again (after add / edit / delete)
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((key) => key + 1);

  // Load the list. `cancelled` drops the answer of an older request when the
  // admin types or clicks quickly, so a slow response can't overwrite a newer one.
  useEffect(() => {
    let cancelled = false;

    getKnowledgeBase({ search, status, page, limit: pageSize })
      .then((data) => {
        if (cancelled) return;

        setEntries(data.entries || []);
        setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
        setStats(data.stats || { total: 0, active: 0, inactive: 0, limit: 300 });
        setUseKb(data.useKnowledgeBase !== false);
        setLoadError("");
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(errorMessage(error, "Failed to load the knowledge base"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [search, status, page, pageSize, reloadKey]);

  // Search as the admin types (small delay so we don't call the server on every key)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ---------- master switch ----------
  const handleSwitch = async (next) => {
    setSwitching(true);
    setUseKb(next);

    try {
      await updateAiSettings({ useKnowledgeBase: next });
      toast.success(next ? "AI will use your knowledge base" : "AI will ignore the knowledge base");
    } catch (error) {
      setUseKb(!next);
      toast.error(errorMessage(error, "Failed to update the setting"));
    } finally {
      setSwitching(false);
    }
  };

  // ---------- add / edit ----------
  const handleSave = async (payload) => {
    setSaving(true);

    try {
      if (modal?.entry) {
        await updateKnowledgeEntry(modal.entry.id, payload);
        toast.success("Entry updated");
      } else {
        await createKnowledgeEntry(payload);
        toast.success("Entry added");
      }

      setModal(null);
      reload();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to save the entry"));
    } finally {
      setSaving(false);
    }
  };

  // ---------- active on/off ----------
  const handleToggleEntry = async (entry) => {
    const next = !entry.isActive;

    // flip it on screen right away, put it back if the server says no
    setEntries((prev) => prev.map((row) => (row.id === entry.id ? { ...row, isActive: next } : row)));

    try {
      await updateKnowledgeEntry(entry.id, { isActive: next });
      reload();
    } catch (error) {
      setEntries((prev) =>
        prev.map((row) => (row.id === entry.id ? { ...row, isActive: entry.isActive } : row))
      );
      toast.error(errorMessage(error, "Failed to update the entry"));
    }
  };

  // ---------- delete ----------
  const handleDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);

    if (!target) return;

    try {
      await deleteKnowledgeEntry(target.id);
      toast.success("Entry deleted");

      // Deleted the last row of a page -> go back one page
      if (entries.length === 1 && page > 1) setPage(page - 1);
      else reload();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete the entry"));
    }
  };

  // ---------- delete everything (typed confirmation) ----------
  const handleDeleteAll = async () => {
    setDeletingAll(true);

    try {
      const data = await deleteAllKnowledge();
      toast.success(data.message || "All entries deleted");
      setShowDeleteAll(false);
      setDeleteAllText("");
      setPage(1);
      reload();
    } catch (error) {
      toast.error(errorMessage(error, "Failed to delete the entries"));
    } finally {
      setDeletingAll(false);
    }
  };

  // 3-dot menu for one row
  const rowMenuItems = (entry) => [
    { key: "view", label: "View", icon: Eye, onClick: () => setModal({ entry, mode: "view" }) },
    { key: "edit", label: "Edit", icon: Pencil, onClick: () => setModal({ entry, mode: "edit" }) },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      danger: true,
      onClick: () => setDeleteTarget(entry),
    },
  ];

  // ---------- render ----------
  if (loading) {
    return (
      <div className="crm-page">
        <div className="mb-8 h-12 w-72 animate-pulse rounded-xl bg-slate-200" />
        <div className="space-y-4">
          <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (loadError && entries.length === 0 && stats.total === 0) {
    return (
      <div className="crm-page">
        <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          <CircleAlert size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                reload();
              }}
              className="mt-2 text-sm font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filtering = Boolean(search) || status !== "all";

  return (
    <div className="crm-page">
      {/* ================= TOP ROW: master switch (left) + Import / Try Demo (right) ================= */}
      {/* Heading removed - the "Knowledge base" tab above already names this page */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
          <div>
            <p className="text-sm font-medium text-slate-900">Use in AI replies</p>
            <p className="text-xs text-slate-500">{useKb ? "On" : "Off"}</p>
          </div>
          <StatusToggle
            checked={useKb}
            onChange={handleSwitch}
            disabled={switching}
            label="Use the knowledge base in AI replies"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-green-500 bg-white px-6 text-sm font-semibold text-green-600 transition hover:bg-green-50"
          >
            <Upload size={16} />
            Import
          </button>

          <button
            type="button"
            onClick={() => setShowDemo(true)}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-green-500 px-7 text-sm font-semibold text-white transition hover:bg-green-600"
          >
            Try Demo
          </button>
        </div>
      </div>

      {/* usage badge (1/300) - own row, right side */}
      <div className="mb-6 flex justify-end">
        <UsageBadge used={stats.total} limit={stats.limit} />
      </div>

      {!useKb && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <p>The knowledge base is switched off, so the AI is not using these entries.</p>
        </div>
      )}

      {/* ================= SEARCH + FILTER + ADD ================= */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search entries..."
            aria-label="Search entries"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="Clear search"
              title="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative sm:w-52">
          <Filter
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
        </div>

        <button
          type="button"
          onClick={() => setModal({ entry: null, mode: "add" })}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-6 text-sm font-semibold text-white transition hover:bg-green-600"
        >
          <Plus size={16} />
          Add Entry
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-green-100">
              <tr>
                <th className={thClass}>Title</th>
                <th className={`${thClass} text-center`}>Description</th>
                <th className={`${thClass} text-center`}>Category</th>
                <th className={`${thClass} text-center uppercase`}>Status</th>
                <th className={`${thClass} text-center uppercase`}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <Library size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-700">
                      {filtering ? "No entries match your search" : "Your knowledge base is empty"}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                      {filtering
                        ? "Try a different word or clear the filter."
                        : "Add your prices, policies, timings and common answers. The AI will use them when customers ask."}
                    </p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-t border-slate-200 transition hover:bg-slate-50"
                  >
                    <td className={`${tdClass} max-w-[260px]`}>
                      <button
                        type="button"
                        onClick={() => setModal({ entry, mode: "view" })}
                        className="line-clamp-2 break-words text-left font-semibold text-slate-900 transition hover:text-green-600 hover:underline"
                      >
                        {entry.title}
                      </button>
                    </td>

                    <td className={`${tdClass} max-w-[320px] text-center`}>
                      <p className="line-clamp-2 whitespace-pre-line break-words">{entry.content}</p>
                    </td>

                    <td className={`${tdClass} text-center`}>{entry.category}</td>

                    <td className={tdClass}>
                      <div className="flex justify-center">
                        <StatusToggle
                          checked={entry.isActive}
                          onChange={() => handleToggleEntry(entry)}
                          label={`Entry "${entry.title}" active`}
                        />
                      </div>
                    </td>

                    <td className={tdClass}>
                      <div className="flex justify-center">
                        <RowActionsMenu
                          ariaLabel={`Actions for ${entry.title}`}
                          items={rowMenuItems(entry)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PAGINATION ================= */}
      {entries.length > 0 && (
        <CustomerPagination
          currentPage={pagination.page || page}
          totalPages={pagination.totalPages || 1}
          pageSize={pageSize}
          onPageChange={(next) =>
            setPage(Math.min(Math.max(1, next), pagination.totalPages || 1))
          }
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      {stats.total > 0 && (
        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={() => {
              setDeleteAllText("");
              setShowDeleteAll(true);
            }}
            className="text-xs font-medium text-slate-400 transition hover:text-red-600"
          >
            Delete all entries...
          </button>
        </div>
      )}

      {/* ================= MODALS ================= */}
      {modal && (
        <EntryModal
          key={modal.entry?.id ?? "new"}
          entry={modal.entry}
          mode={modal.mode}
          saving={saving}
          onSave={handleSave}
          onClose={() => setModal(null)}
          onEdit={() => setModal((prev) => (prev ? { ...prev, mode: "edit" } : prev))}
        />
      )}

      {showDemo && <DemoModal useKb={useKb} onClose={() => setShowDemo(false)} />}

      {showImport && (
        <KnowledgeImportModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setPage(1);
            reload();
          }}
        />
      )}

      {showDeleteAll && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <h2 className="text-xl font-bold text-slate-900">Delete all entries?</h2>
            <p className="mt-2 text-sm text-slate-600">
              This removes all {stats.total} entries of your knowledge base. The AI will stop using
              them. This cannot be undone.
            </p>
            <p className="mt-4 text-sm text-slate-700">
              Type <b>DELETE ALL</b> to confirm:
            </p>
            <input
              value={deleteAllText}
              onChange={(event) => setDeleteAllText(event.target.value)}
              className={`${inputClass} mt-2`}
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteAll(false)}
                disabled={deletingAll}
                className="h-12 rounded-xl border border-slate-200 bg-white px-6 text-sm font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={deleteAllText !== "DELETE ALL" || deletingAll}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deletingAll && <LoaderCircle size={16} className="animate-spin" />}
                Delete everything
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete this entry?"
        message={`"${deleteTarget?.title || ""}" will be removed and the AI will stop using it.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}