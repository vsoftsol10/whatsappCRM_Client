
// // Sidebar page "Proposals": list + send on WhatsApp + download + delete.
// import { useCallback, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   CheckCircle2,
//   ChevronDown,
//   Download,
//   Eye,
//   FileSignature,
//   FileText,
//   Filter,
//   Pencil,
//   Plus,
//   Search,
//   Send,
//   Trash2,
//   Wallet,
//   X,
// } from "lucide-react";
// import toast from "react-hot-toast";

// import ConfirmModal from "../components/common/ConfirmModal";
// import RowActionsMenu from "../components/common/RowActionsMenu";
// import CustomerPagination from "../components/customers/CustomerPagination";
// import ProposalPreview, {
//   formatMoney,
// } from "../components/proposals/ProposalPreview";
// import {
//   deleteProposal,
//   downloadProposalPdf,
//   getProposalById,
//   getProposals,
//   sendProposalOnWhatsApp,
// } from "../api/proposalApi";
// import { getCompanySettings } from "../api/companyApi";

// const STATUS_STYLES = {
//   DRAFT: "bg-amber-100 text-amber-700",
//   SENT: "bg-green-100 text-green-700",
// };

// // Older proposals only have the linked customer, so fall back to it
// const clientNameOf = (p) => p.clientName || p.customer?.name || "-";
// const clientPhoneOf = (p) => p.clientPhone || p.customer?.phone || "";

// const formatDate = (d) =>
//   d
//     ? new Date(d).toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       })
//     : "-";

// // =====================================================
// // SEND ON WHATSAPP MODAL
// // =====================================================
// function SendModal({ proposal, onClose, onSent }) {
//   const [message, setMessage] = useState(
//     `Hi ${clientNameOf(proposal)}, please find our proposal "${
//       proposal.title
//     }" attached.`
//   );
//   const [sending, setSending] = useState(false);

//   const handleSend = async () => {
//     if (sending) return;

//     try {
//       setSending(true);
//       const res = await sendProposalOnWhatsApp(proposal.id, message.trim());
//       toast.success("Proposal sent on WhatsApp");
//       onSent(res.proposal);
//       onClose();
//     } catch (error) {
//       console.error("Send proposal error:", error);
//       toast.error(
//         error?.response?.data?.message || "Failed to send the proposal"
//       );
//     } finally {
//       setSending(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4">
//       <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
//         {/* HEADER */}
//         <div className="flex items-start justify-between gap-4">
//           <div className="min-w-0 flex-1">
//             <h2 className="text-2xl font-bold text-slate-900">
//               Send on WhatsApp
//             </h2>
//             <p className="mt-1 truncate border-b border-slate-300 pb-3 text-base text-slate-700">
//               {proposal.proposalNumber} to {clientNameOf(proposal)}
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={onClose}
//             disabled={sending}
//             aria-label="Close"
//             className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
//           >
//             <X size={18} />
//           </button>
//         </div>

//         {/* BODY */}
//         <div className="mt-7">
//           <label className="block">
//             <span className="mb-3 block text-base text-slate-900">
//               Message (sent before the PDF)
//             </span>
//             <textarea
//               rows={4}
//               value={message}
//               maxLength={1000}
//               placeholder="Write a short message to send with the proposal"
//               onChange={(e) => setMessage(e.target.value)}
//               className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
//             />
//           </label>

//           {clientPhoneOf(proposal) ? (
//             <p className="mt-4 text-sm text-slate-600">
//               The proposal PDF ({proposal.proposalNumber}.pdf) is sent to{" "}
//               {clientPhoneOf(proposal)}. WhatsApp only allows this within 24
//               hours of the customer&apos;s last message.
//             </p>
//           ) : (
//             <p className="mt-4 text-sm font-medium text-red-600">
//               This proposal has no phone number. Edit the proposal and add the
//               client&apos;s phone number first.
//             </p>
//           )}
//         </div>

//         {/* ACTIONS */}
//         <div className="mt-7 flex justify-end gap-3">
//           <button
//             type="button"
//             onClick={onClose}
//             disabled={sending}
//             className="h-12 rounded-xl border border-slate-200 bg-white px-7 text-base font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
//           >
//             Cancel
//           </button>
//           <button
//             type="button"
//             onClick={handleSend}
//             disabled={sending || !clientPhoneOf(proposal)}
//             className="h-12 rounded-xl bg-green-500 px-9 text-base font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
//           >
//             {sending ? "Sending..." : "Send"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // =====================================================
// // PREVIEW MODAL (saved proposal)
// // =====================================================
// function PreviewModal({ proposalId, onClose, onEdit }) {
//   const [proposal, setProposal] = useState(null);
//   const [company, setCompany] = useState(null);

//   useEffect(() => {
//     let cancelled = false;

//     getProposalById(proposalId)
//       .then((res) => {
//         if (cancelled) return;
//         const p = res.proposal;
//         setProposal({
//           ...p,
//           clientName: p.clientName || p.customer?.name || "",
//           clientPhone: p.clientPhone || p.customer?.phone || "",
//           clientEmail: p.clientEmail || p.customer?.email || "",
//           clientCompany: p.clientCompany || p.customer?.companyName || "",
//           issueDate: p.issueDate || p.createdAt,
//         });
//       })
//       .catch(() => {
//         toast.error("Failed to load the preview");
//         onClose();
//       });

//     getCompanySettings()
//       .then((res) => !cancelled && setCompany(res.company || null))
//       .catch(() => {});

//     return () => {
//       cancelled = true;
//     };
//   }, [proposalId, onClose]);

//   return (
//     <div
//       className="fixed inset-0 z-[10000] flex bg-slate-900/50 p-3 sm:p-6"
//       onClick={onClose}
//     >
//       <div
//         className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-gray-100 shadow-2xl"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
//           <div>
//             <h2 className="text-lg font-bold text-slate-900">
//               Proposal preview
//             </h2>
//             <p className="text-xs text-slate-500">
//               {proposal?.proposalNumber || "Loading..."}
//             </p>
//           </div>
//           <div className="flex items-center gap-2">
//             <button
//               type="button"
//               onClick={onEdit}
//               className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
//             >
//               <Pencil size={14} /> Edit
//             </button>
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
//               aria-label="Close preview"
//             >
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-4 sm:p-8">
//           {proposal ? (
//             <ProposalPreview proposal={proposal} company={company} />
//           ) : (
//             <p className="py-20 text-center text-sm text-slate-500">
//               Loading...
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // =====================================================
// // STAT CARD
// // =====================================================
// function StatCard({ icon: Icon, label, value }) {
//   return (
//     <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
//       <div className="min-w-0">
//         <p className="text-xs text-slate-500">{label}</p>
//         <p className="mt-2 truncate text-3xl font-bold text-slate-900">
//           {value}
//         </p>
//       </div>

//       <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
//         <Icon size={22} />
//       </span>
//     </div>
//   );
// }

// // =====================================================
// // PAGE
// // =====================================================
// function Proposals() {
//   const navigate = useNavigate();

//   const [proposals, setProposals] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [status, setStatus] = useState("");

//   // the list is paged here in the browser
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(5);

//   const [previewId, setPreviewId] = useState(null);
//   const [sendTarget, setSendTarget] = useState(null);
//   const [deleteTarget, setDeleteTarget] = useState(null);
//   const [deleting, setDeleting] = useState(false);
//   const [downloadingId, setDownloadingId] = useState(null);

//   const load = useCallback(async () => {
//     try {
//       const res = await getProposals({ search: search.trim(), status });
//       setProposals(res.proposals || []);
//     } catch (error) {
//       console.error("Load proposals error:", error);
//       toast.error(
//         error?.response?.data?.message || "Failed to load proposals"
//       );
//     } finally {
//       setLoading(false);
//     }
//   }, [search, status]);

//   // small delay while typing in the search box
//   useEffect(() => {
//     const timer = setTimeout(load, 300);
//     return () => clearTimeout(timer);
//   }, [load]);

//   // changing a filter always goes back to the first page
//   const changeSearch = (value) => {
//     setSearch(value);
//     setCurrentPage(1);
//   };

//   const changeStatus = (value) => {
//     setStatus(value);
//     setCurrentPage(1);
//   };

//   // true when the search box or the status dropdown has a value
//   const hasFilters = search.trim() !== "" || status !== "";

//   // reset both filters; the existing useEffect reloads the list by itself
//   const clearFilters = () => {
//     setSearch("");
//     setStatus("");
//     setCurrentPage(1);
//   };

//   const handleDownload = async (proposal) => {
//     if (downloadingId) return;

//     try {
//       setDownloadingId(proposal.id);
//       const blob = await downloadProposalPdf(proposal.id);

//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = `${proposal.proposalNumber}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Download proposal error:", error);
//       toast.error("Failed to download the PDF");
//     } finally {
//       setDownloadingId(null);
//     }
//   };

//   const handleDelete = async () => {
//     if (!deleteTarget || deleting) return;

//     try {
//       setDeleting(true);
//       await deleteProposal(deleteTarget.id);
//       toast.success("Proposal deleted");
//       setProposals((prev) => prev.filter((p) => p.id !== deleteTarget.id));
//       setDeleteTarget(null);
//     } catch (error) {
//       console.error("Delete proposal error:", error);
//       toast.error(
//         error?.response?.data?.message || "Failed to delete the proposal"
//       );
//     } finally {
//       setDeleting(false);
//     }
//   };

//   const handleSent = (updated) =>
//     setProposals((prev) =>
//       prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
//     );

//   // ---------- stats ----------
//   const sentCount = proposals.filter((p) => p.status === "SENT").length;
//   const draftCount = proposals.length - sentCount;
//   const mainCurrency = proposals[0]?.currency || "INR";
//   const totalValue = proposals
//     .filter((p) => (p.currency || "INR") === mainCurrency)
//     .reduce((sum, p) => sum + (Number(p.total) || 0), 0);

//   // ---------- paging ----------
//   const totalPages = Math.max(1, Math.ceil(proposals.length / pageSize));
//   const safePage = Math.min(currentPage, totalPages);
//   const pageRows = proposals.slice(
//     (safePage - 1) * pageSize,
//     safePage * pageSize
//   );

//   const closePreview = useCallback(() => setPreviewId(null), []);

//   // 3-dot menu for one row
//   const rowMenuItems = (p) => [
//     {
//       key: "preview",
//       label: "Preview",
//       icon: Eye,
//       onClick: () => setPreviewId(p.id),
//     },
//     {
//       key: "send",
//       label: p.status === "SENT" ? "Resend on WhatsApp" : "Send on WhatsApp",
//       icon: Send,
//       onClick: () => setSendTarget(p),
//     },
//     {
//       key: "download",
//       label: downloadingId === p.id ? "Downloading..." : "Download PDF",
//       icon: Download,
//       onClick: () => handleDownload(p),
//     },
//     {
//       key: "edit",
//       label: "Edit",
//       icon: Pencil,
//       onClick: () => navigate(`/proposals/${p.id}/edit`),
//     },
//     {
//       key: "delete",
//       label: "Delete",
//       icon: Trash2,
//       danger: true,
//       onClick: () => setDeleteTarget(p),
//     },
//   ];

//   const thClass =
//     "whitespace-nowrap px-5 py-4 text-left text-xs font-semibold text-green-900";
//   const tdClass = "px-5 py-4 text-sm text-slate-700";

//   return (
//     <div className="crm-page">
//       {/* HEADER */}
//       <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div className="min-w-0">
//           <h1 className="crm-title">Proposals</h1>
//           <p className="crm-subtitle">
//             Create proposals and send them to customers on WhatsApp
//           </p>
//         </div>

//         <button
//           type="button"
//           onClick={() => navigate("/proposals/new")}
//           className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-500 px-6 text-sm font-semibold text-white transition hover:bg-green-600 sm:w-auto"
//         >
//           <Plus size={16} /> New Proposal
//         </button>
//       </div>

//       {/* STATS */}
//       <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
//         <StatCard
//           icon={FileText}
//           label="Total proposals"
//           value={proposals.length}
//         />
//         <StatCard icon={CheckCircle2} label="Sent" value={sentCount} />
//         <StatCard icon={Pencil} label="Drafts" value={draftCount} />
//         <StatCard
//           icon={Wallet}
//           label="Total value"
//           value={formatMoney(totalValue, mainCurrency)}
//         />
//       </div>

//       {/* SEARCH + FILTER */}
//       <div className="mb-6 flex flex-col gap-3 sm:flex-row">
//         <div className="relative min-w-0 flex-1">
//           <input
//             value={search}
//             onChange={(e) => changeSearch(e.target.value)}
//             placeholder="Search Proposals..."
//             aria-label="Search proposals"
//             className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
//           />

//           <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
//             {/* clear just the search text */}
//             {search && (
//               <button
//                 type="button"
//                 onClick={() => changeSearch("")}
//                 aria-label="Clear search"
//                 title="Clear search"
//                 className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
//               >
//                 <X size={14} />
//               </button>
//             )}
//             <Search size={16} className="text-slate-400" />
//           </div>
//         </div>

//         <div className="relative sm:w-52">
//           <Filter
//             size={18}
//             className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
//           />

//           <select
//             aria-label="Filter by status"
//             value={status}
//             onChange={(e) => changeStatus(e.target.value)}
//             className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
//           >
//             <option value="">All Status</option>
//             <option value="DRAFT">Draft</option>
//             <option value="SENT">Sent</option>
//           </select>

//           <ChevronDown
//             size={18}
//             className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
//           />
//         </div>

//         {/* clear everything (shown only when a filter is active) */}
//         {hasFilters && (
//           <button
//             type="button"
//             onClick={clearFilters}
//             className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
//           >
//             <X size={14} />
//             Clear filters
//           </button>
//         )}
//       </div>

//       {/* TABLE */}
//       <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
//         <div className="overflow-x-auto">
//           <table className="w-full min-w-[980px] text-left">
//             <thead className="bg-green-100">
//               <tr>
//                 <th className={thClass}>Proposal ID</th>
//                 <th className={thClass}>Proposal</th>
//                 <th className={thClass}>Customer</th>
//                 <th className={thClass}>Phone number</th>
//                 <th className={thClass}>Total</th>
//                 <th className={thClass}>Status</th>
//                 <th className={thClass}>Created</th>
//                 <th className={`${thClass} text-center`}>Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td
//                     colSpan={8}
//                     className="px-5 py-12 text-center text-sm text-slate-500"
//                   >
//                     Loading...
//                   </td>
//                 </tr>
//               ) : proposals.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} className="px-5 py-14 text-center">
//                     <FileSignature
//                       size={36}
//                       className="mx-auto mb-2 text-slate-300"
//                     />
//                     <p className="font-medium text-slate-700">
//                       No proposals yet
//                     </p>
//                     <p className="text-sm text-slate-500">
//                       Click &quot;New Proposal&quot; to create your first one.
//                     </p>
//                   </td>
//                 </tr>
//               ) : (
//                 pageRows.map((p) => (
//                   <tr
//                     key={p.id}
//                     className="border-t border-slate-200 transition hover:bg-slate-50"
//                   >
//                     <td className={`${tdClass} whitespace-nowrap`}>
//                       {p.proposalNumber}
//                     </td>

//                     <td className={tdClass}>
//                       <button
//                         type="button"
//                         onClick={() => setPreviewId(p.id)}
//                         className="text-left text-slate-800 transition hover:text-green-600 hover:underline"
//                       >
//                         {p.title}
//                       </button>
//                     </td>

//                     <td className={tdClass}>{clientNameOf(p)}</td>

//                     <td className={`${tdClass} whitespace-nowrap`}>
//                       {clientPhoneOf(p) || "-"}
//                     </td>

//                     <td className={`${tdClass} whitespace-nowrap`}>
//                       {formatMoney(p.total, p.currency)}
//                     </td>

//                     <td className={tdClass}>
//                       <span
//                         className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
//                           STATUS_STYLES[p.status] || STATUS_STYLES.DRAFT
//                         }`}
//                       >
//                         {p.status === "SENT" ? "Sent" : "Draft"}
//                       </span>
//                       {p.sentAt && (
//                         <p className="mt-1 text-[11px] text-slate-500">
//                           {formatDate(p.sentAt)}
//                         </p>
//                       )}
//                     </td>

//                     <td className={`${tdClass} whitespace-nowrap`}>
//                       {formatDate(p.createdAt)}
//                     </td>

//                     <td className={tdClass}>
//                       <div className="flex justify-center">
//                         <RowActionsMenu
//                           ariaLabel={`Actions for ${p.proposalNumber}`}
//                           items={rowMenuItems(p)}
//                           width={224}
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

//       {/* PAGINATION */}
//       {!loading && proposals.length > 0 && (
//         <CustomerPagination
//           currentPage={safePage}
//           totalPages={totalPages}
//           pageSize={pageSize}
//           onPageChange={(page) =>
//             setCurrentPage(Math.min(Math.max(1, page), totalPages))
//           }
//           onPageSizeChange={(size) => {
//             setPageSize(size);
//             setCurrentPage(1);
//           }}
//         />
//       )}

//       {previewId && (
//         <PreviewModal
//           proposalId={previewId}
//           onClose={closePreview}
//           onEdit={() => navigate(`/proposals/${previewId}/edit`)}
//         />
//       )}

//       {sendTarget && (
//         <SendModal
//           proposal={sendTarget}
//           onClose={() => setSendTarget(null)}
//           onSent={handleSent}
//         />
//       )}

//       <ConfirmModal
//         isOpen={Boolean(deleteTarget)}
//         title="Delete proposal?"
//         message={`"${deleteTarget?.title || ""}" will be deleted permanently.`}
//         confirmText={deleting ? "Deleting..." : "Delete"}
//         onConfirm={handleDelete}
//         onCancel={() => !deleting && setDeleteTarget(null)}
//       />
//     </div>
//   );
// }

// export default Proposals;





// Sidebar page "Proposals": list + send on WhatsApp + download + delete.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileSignature,
  FileText,
  Filter,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import ConfirmModal from "../components/common/ConfirmModal";
import RowActionsMenu from "../components/common/RowActionsMenu";
import CustomerPagination from "../components/customers/CustomerPagination";
import ProposalPreview, {
  formatMoney,
} from "../components/proposals/ProposalPreview";
import {
  deleteProposal,
  downloadProposalPdf,
  getProposalById,
  getProposals,
  sendProposalOnWhatsApp,
} from "../api/proposalApi";
import { getCompanySettings } from "../api/companyApi";

const STATUS_STYLES = {
  DRAFT: "bg-amber-100 text-amber-700",
  SENT: "bg-green-100 text-green-700",
};

// Older proposals only have the linked customer, so fall back to it
const clientNameOf = (p) => p.clientName || p.customer?.name || "-";
const clientPhoneOf = (p) => p.clientPhone || p.customer?.phone || "";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// =====================================================
// SEND ON WHATSAPP MODAL
// =====================================================
function SendModal({ proposal, onClose, onSent }) {
  const [message, setMessage] = useState(
    `Hi ${clientNameOf(proposal)}, please find our proposal "${
      proposal.title
    }" attached.`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (sending) return;

    try {
      setSending(true);
      const res = await sendProposalOnWhatsApp(proposal.id, message.trim());
      toast.success("Proposal sent on WhatsApp");
      onSent(res.proposal);
      onClose();
    } catch (error) {
      console.error("Send proposal error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to send the proposal"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-slate-900">
              Send on WhatsApp
            </h2>
            <p className="mt-1 truncate border-b border-slate-300 pb-3 text-base text-slate-700">
              {proposal.proposalNumber} to {clientNameOf(proposal)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            aria-label="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="mt-7">
          <label className="block">
            <span className="mb-3 block text-base text-slate-900">
              Message (sent before the PDF)
            </span>
            <textarea
              rows={4}
              value={message}
              maxLength={1000}
              placeholder="Write a short message to send with the proposal"
              onChange={(e) => setMessage(e.target.value)}
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />
          </label>

          {clientPhoneOf(proposal) ? (
            <p className="mt-4 text-sm text-slate-600">
              The proposal PDF ({proposal.proposalNumber}.pdf) is sent to{" "}
              {clientPhoneOf(proposal)}. WhatsApp only allows this within 24
              hours of the customer&apos;s last message.
            </p>
          ) : (
            <p className="mt-4 text-sm font-medium text-red-600">
              This proposal has no phone number. Edit the proposal and add the
              client&apos;s phone number first.
            </p>
          )}
        </div>

        {/* ACTIONS */}
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="h-12 rounded-xl border border-slate-200 bg-white px-7 text-base font-medium text-slate-900 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !clientPhoneOf(proposal)}
            className="h-12 rounded-xl bg-green-500 px-9 text-base font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PREVIEW MODAL (saved proposal)
// =====================================================
function PreviewModal({ proposalId, onClose, onEdit }) {
  const [proposal, setProposal] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getProposalById(proposalId)
      .then((res) => {
        if (cancelled) return;
        const p = res.proposal;
        setProposal({
          ...p,
          clientName: p.clientName || p.customer?.name || "",
          clientPhone: p.clientPhone || p.customer?.phone || "",
          clientEmail: p.clientEmail || p.customer?.email || "",
          clientCompany: p.clientCompany || p.customer?.companyName || "",
          issueDate: p.issueDate || p.createdAt,
        });
      })
      .catch(() => {
        toast.error("Failed to load the preview");
        onClose();
      });

    getCompanySettings()
      .then((res) => !cancelled && setCompany(res.company || null))
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [proposalId, onClose]);

  return (
    <div
      className="fixed inset-0 z-[10000] flex bg-slate-900/50 p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-gray-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Proposal preview
            </h2>
            <p className="text-xs text-slate-500">
              {proposal?.proposalNumber || "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {proposal ? (
            <ProposalPreview proposal={proposal} company={company} />
          ) : (
            <p className="py-20 text-center text-sm text-slate-500">
              Loading...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-2 truncate text-3xl font-bold text-slate-900">
          {value}
        </p>
      </div>

      <span className="flex h-11 w-11 shrink-0 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
        <Icon size={22} />
      </span>
    </div>
  );
}

// =====================================================
// PAGE
// =====================================================
function Proposals() {
  const navigate = useNavigate();

  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // the list is paged here in the browser
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [previewId, setPreviewId] = useState(null);
  const [sendTarget, setSendTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getProposals({ search: search.trim(), status });
      setProposals(res.proposals || []);
    } catch (error) {
      console.error("Load proposals error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load proposals"
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  // small delay while typing in the search box
  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  // changing a filter always goes back to the first page
  const changeSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const changeStatus = (value) => {
    setStatus(value);
    setCurrentPage(1);
  };

  // true when the search box or the status dropdown has a value
  const hasFilters = search.trim() !== "" || status !== "";

  // reset both filters; the existing useEffect reloads the list by itself
  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setCurrentPage(1);
  };

  const handleDownload = async (proposal) => {
    if (downloadingId) return;

    try {
      setDownloadingId(proposal.id);
      const blob = await downloadProposalPdf(proposal.id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${proposal.proposalNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download proposal error:", error);
      toast.error("Failed to download the PDF");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;

    try {
      setDeleting(true);
      await deleteProposal(deleteTarget.id);
      toast.success("Proposal deleted");
      setProposals((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete proposal error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete the proposal"
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSent = (updated) =>
    setProposals((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    );

  // ---------- stats ----------
  const sentCount = proposals.filter((p) => p.status === "SENT").length;
  const draftCount = proposals.length - sentCount;
  const mainCurrency = proposals[0]?.currency || "INR";
  const totalValue = proposals
    .filter((p) => (p.currency || "INR") === mainCurrency)
    .reduce((sum, p) => sum + (Number(p.total) || 0), 0);

  // ---------- paging ----------
  const totalPages = Math.max(1, Math.ceil(proposals.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageRows = proposals.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const closePreview = useCallback(() => setPreviewId(null), []);

  // 3-dot menu for one row
  const rowMenuItems = (p) => [
    {
      key: "preview",
      label: "Preview",
      icon: Eye,
      onClick: () => setPreviewId(p.id),
    },
    {
      key: "send",
      label: p.status === "SENT" ? "Resend on WhatsApp" : "Send on WhatsApp",
      icon: Send,
      onClick: () => setSendTarget(p),
    },
    {
      key: "download",
      label: downloadingId === p.id ? "Downloading..." : "Download PDF",
      icon: Download,
      onClick: () => handleDownload(p),
    },
    {
      key: "edit",
      label: "Edit",
      icon: Pencil,
      onClick: () => navigate(`/proposals/${p.id}/edit`),
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      danger: true,
      onClick: () => setDeleteTarget(p),
    },
  ];

  const thClass =
    "whitespace-nowrap px-5 py-4 text-left text-xs font-semibold text-green-900";
  const tdClass = "px-5 py-4 text-sm text-slate-700";

  return (
    <div className="crm-page">
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="crm-title">Proposals</h1>
          <p className="crm-subtitle">
            Create proposals and send them to customers on WhatsApp
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/proposals/new")}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-green-500 px-6 text-sm font-semibold text-white transition hover:bg-green-600"
        >
          <Plus size={16} /> New Proposal
        </button>
      </div>

      {/* STATS */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 xl:gap-5">
        <StatCard
          icon={FileText}
          label="Total proposals"
          value={proposals.length}
        />
        <StatCard icon={CheckCircle2} label="Sent" value={sentCount} />
        <StatCard icon={Pencil} label="Drafts" value={draftCount} />
        <StatCard
          icon={Wallet}
          label="Total value"
          value={formatMoney(totalValue, mainCurrency)}
        />
      </div>

      {/* SEARCH + FILTER */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <input
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search Proposals..."
            aria-label="Search proposals"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-4 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />

          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {/* clear just the search text */}
            {search && (
              <button
                type="button"
                onClick={() => changeSearch("")}
                aria-label="Clear search"
                title="Clear search"
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
            <Search size={16} className="text-slate-400" />
          </div>
        </div>

        <div className="relative sm:w-52">
          <Filter
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm text-slate-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
          </select>

          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
        </div>

        {/* clear everything (shown only when a filter is active) */}
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-12 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <X size={14} />
            Clear filters
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-green-100">
              <tr>
                <th className={thClass}>Proposal ID</th>
                <th className={thClass}>Proposal</th>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Phone number</th>
                <th className={thClass}>Total</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Created</th>
                <th className={`${thClass} text-center`}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : proposals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <FileSignature
                      size={36}
                      className="mx-auto mb-2 text-slate-300"
                    />
                    <p className="font-medium text-slate-700">
                      No proposals yet
                    </p>
                    <p className="text-sm text-slate-500">
                      Click &quot;New Proposal&quot; to create your first one.
                    </p>
                  </td>
                </tr>
              ) : (
                pageRows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-slate-200 transition hover:bg-slate-50"
                  >
                    <td className={`${tdClass} whitespace-nowrap`}>
                      {p.proposalNumber}
                    </td>

                    <td className={tdClass}>
                      <button
                        type="button"
                        onClick={() => setPreviewId(p.id)}
                        className="text-left text-slate-800 transition hover:text-green-600 hover:underline"
                      >
                        {p.title}
                      </button>
                    </td>

                    <td className={tdClass}>{clientNameOf(p)}</td>

                    <td className={`${tdClass} whitespace-nowrap`}>
                      {clientPhoneOf(p) || "-"}
                    </td>

                    <td className={`${tdClass} whitespace-nowrap`}>
                      {formatMoney(p.total, p.currency)}
                    </td>

                    <td className={tdClass}>
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                          STATUS_STYLES[p.status] || STATUS_STYLES.DRAFT
                        }`}
                      >
                        {p.status === "SENT" ? "Sent" : "Draft"}
                      </span>
                      {p.sentAt && (
                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatDate(p.sentAt)}
                        </p>
                      )}
                    </td>

                    <td className={`${tdClass} whitespace-nowrap`}>
                      {formatDate(p.createdAt)}
                    </td>

                    <td className={tdClass}>
                      <div className="flex justify-center">
                        <RowActionsMenu
                          ariaLabel={`Actions for ${p.proposalNumber}`}
                          items={rowMenuItems(p)}
                          width={224}
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

      {/* PAGINATION */}
      {!loading && proposals.length > 0 && (
        <CustomerPagination
          currentPage={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={(page) =>
            setCurrentPage(Math.min(Math.max(1, page), totalPages))
          }
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {previewId && (
        <PreviewModal
          proposalId={previewId}
          onClose={closePreview}
          onEdit={() => navigate(`/proposals/${previewId}/edit`)}
        />
      )}

      {sendTarget && (
        <SendModal
          proposal={sendTarget}
          onClose={() => setSendTarget(null)}
          onSent={handleSent}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete proposal?"
        message={`"${deleteTarget?.title || ""}" will be deleted permanently.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  );
}

export default Proposals;