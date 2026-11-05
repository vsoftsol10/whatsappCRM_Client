// // frontend/src/pages/Proposals.jsx   (NEW FILE)
// // Sidebar page "Proposals": list + send on WhatsApp + download + delete.
// import { useCallback, useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Download, Pencil, Plus, Search, Send, Trash2, X } from "lucide-react";
// import toast from "react-hot-toast";

// import ConfirmModal from "../components/common/ConfirmModal";
// import { formatMoney } from "../components/proposals/ProposalPreview";
// import {
//   deleteProposal,
//   downloadProposalPdf,
//   getProposals,
//   sendProposalOnWhatsApp,
// } from "../api/proposalApi";

// const STATUS_STYLES = {
//   DRAFT: "bg-gray-100 text-gray-700",
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
//     <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
//       <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
//         <div className="flex items-center justify-between bg-[#25D366] px-5 py-4">
//           <div>
//             <h2 className="text-lg font-bold text-black">
//               Send on WhatsApp
//             </h2>
//             <p className="text-sm text-gray-800">
//               {proposal.proposalNumber} to {clientNameOf(proposal)}
//             </p>
//           </div>
//           <button
//             onClick={onClose}
//             disabled={sending}
//             className="rounded-full bg-white p-2 shadow hover:bg-gray-100 disabled:opacity-50"
//             aria-label="Close"
//           >
//             <X size={16} />
//           </button>
//         </div>

//         <div className="space-y-3 p-5">
//           <label className="block">
//             <span className="mb-1 block text-sm font-medium text-gray-700">
//               Message (sent before the PDF)
//             </span>
//             <textarea
//               rows={4}
//               value={message}
//               maxLength={1000}
//               onChange={(e) => setMessage(e.target.value)}
//               className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]"
//             />
//           </label>

//           {clientPhoneOf(proposal) ? (
//             <p className="text-xs text-gray-500">
//               The proposal PDF ({proposal.proposalNumber}.pdf) is sent to{" "}
//               {clientPhoneOf(proposal)}. WhatsApp only allows this within 24
//               hours of the customer's last message.
//             </p>
//           ) : (
//             <p className="text-xs font-medium text-red-600">
//               This proposal has no phone number. Edit the proposal and add the
//               client's phone number first.
//             </p>
//           )}

//           <div className="flex justify-end gap-2 pt-1">
//             <button
//               onClick={onClose}
//               disabled={sending}
//               className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSend}
//               disabled={sending || !clientPhoneOf(proposal)}
//               className="flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2 text-sm font-semibold text-black hover:bg-[#1ebe5a] disabled:opacity-60"
//             >
//               <Send size={14} />
//               {sending ? "Sending..." : "Send"}
//             </button>
//           </div>
//         </div>
//       </div>
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

//   return (
//     <div className="p-4 sm:p-6">
//       {/* HEADER */}
//       <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
//           <p className="text-sm text-gray-500">
//             Create proposals and send them to customers on WhatsApp
//           </p>
//         </div>

//         <button
//           onClick={() => navigate("/proposals/new")}
//           className="flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#1ebe5a]"
//         >
//           <Plus size={16} /> New Proposal
//         </button>
//       </div>

//       {/* FILTERS */}
//       <div className="mb-4 flex flex-wrap gap-3">
//         <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
//           <Search
//             size={16}
//             className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
//           />
//           <input
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             placeholder="Search by title, number or client"
//             className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]"
//           />
//         </div>

//         <select
//           value={status}
//           onChange={(e) => setStatus(e.target.value)}
//           className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
//         >
//           <option value="">All status</option>
//           <option value="DRAFT">Draft</option>
//           <option value="SENT">Sent</option>
//         </select>
//       </div>

//       {/* TABLE */}
//       <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
//         <table className="w-full min-w-[760px] text-left text-sm">
//           <thead className="bg-gray-50 text-xs uppercase text-gray-500">
//             <tr>
//               <th className="px-4 py-3">Proposal</th>
//               <th className="px-4 py-3">Customer</th>
//               <th className="px-4 py-3 text-right">Total</th>
//               <th className="px-4 py-3">Status</th>
//               <th className="px-4 py-3">Created</th>
//               <th className="px-4 py-3 text-right">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
//                   Loading...
//                 </td>
//               </tr>
//             ) : proposals.length === 0 ? (
//               <tr>
//                 <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
//                   No proposals yet. Click "New Proposal" to create one.
//                 </td>
//               </tr>
//             ) : (
//               proposals.map((p) => (
//                 <tr key={p.id} className="border-t border-gray-100">
//                   <td className="px-4 py-3">
//                     <p className="font-semibold text-gray-900">{p.title}</p>
//                     <p className="text-xs text-gray-500">{p.proposalNumber}</p>
//                   </td>
//                   <td className="px-4 py-3">
//                     <p>{clientNameOf(p)}</p>
//                     <p className="text-xs text-gray-500">
//                       {clientPhoneOf(p) || "No phone"}
//                     </p>
//                   </td>
//                   <td className="px-4 py-3 text-right font-medium">
//                     {formatMoney(p.total, p.currency)}
//                   </td>
//                   <td className="px-4 py-3">
//                     <span
//                       className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
//                         STATUS_STYLES[p.status] || STATUS_STYLES.DRAFT
//                       }`}
//                     >
//                       {p.status === "SENT" ? "Sent" : "Draft"}
//                     </span>
//                     {p.sentAt && (
//                       <p className="mt-1 text-[11px] text-gray-500">
//                         {formatDate(p.sentAt)}
//                       </p>
//                     )}
//                   </td>
//                   <td className="px-4 py-3 text-gray-600">
//                     {formatDate(p.createdAt)}
//                   </td>
//                   <td className="px-4 py-3">
//                     <div className="flex justify-end gap-1">
//                       <button
//                         onClick={() => setSendTarget(p)}
//                         title={
//                           p.status === "SENT"
//                             ? "Send again on WhatsApp"
//                             : "Send on WhatsApp"
//                         }
//                         className="rounded-lg p-2 text-green-600 hover:bg-green-50"
//                       >
//                         <Send size={16} />
//                       </button>
//                       <button
//                         onClick={() => handleDownload(p)}
//                         disabled={downloadingId === p.id}
//                         title="Download PDF"
//                         className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
//                       >
//                         <Download size={16} />
//                       </button>
//                       <button
//                         onClick={() => navigate(`/proposals/${p.id}/edit`)}
//                         title="Edit"
//                         className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
//                       >
//                         <Pencil size={16} />
//                       </button>
//                       <button
//                         onClick={() => setDeleteTarget(p)}
//                         title="Delete"
//                         className="rounded-lg p-2 text-red-500 hover:bg-red-50"
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

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
  Download,
  Eye,
  FileSignature,
  FileText,
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
  DRAFT: "bg-gray-100 text-gray-700",
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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-[#25D366] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-black">
              Send on WhatsApp
            </h2>
            <p className="text-sm text-gray-800">
              {proposal.proposalNumber} to {clientNameOf(proposal)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={sending}
            className="rounded-full bg-white p-2 shadow hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">
              Message (sent before the PDF)
            </span>
            <textarea
              rows={4}
              value={message}
              maxLength={1000}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#25D366] focus:ring-1 focus:ring-[#25D366]"
            />
          </label>

          {clientPhoneOf(proposal) ? (
            <p className="text-xs text-gray-500">
              The proposal PDF ({proposal.proposalNumber}.pdf) is sent to{" "}
              {clientPhoneOf(proposal)}. WhatsApp only allows this within 24
              hours of the customer's last message.
            </p>
          ) : (
            <p className="text-xs font-medium text-red-600">
              This proposal has no phone number. Edit the proposal and add the
              client's phone number first.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={sending}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !clientPhoneOf(proposal)}
              className="flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2 text-sm font-semibold text-black hover:bg-[#1ebe5a] disabled:opacity-60"
            >
              <Send size={14} />
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
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
      className="fixed inset-0 z-[10000] flex bg-black/60 p-3 sm:p-6"
      onClick={onClose}
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
              {proposal?.proposalNumber || "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100"
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
            <p className="py-20 text-center text-sm text-gray-500">
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
function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="truncate text-xl font-bold text-gray-900">{value}</p>
      </div>
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

  const sentCount = proposals.filter((p) => p.status === "SENT").length;
  const draftCount = proposals.length - sentCount;
  const mainCurrency = proposals[0]?.currency || "INR";
  const totalValue = proposals
    .filter((p) => (p.currency || "INR") === mainCurrency)
    .reduce((sum, p) => sum + (Number(p.total) || 0), 0);

  const closePreview = useCallback(() => setPreviewId(null), []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* HEADER */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C7E]">
            <FileSignature size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
            <p className="text-sm text-gray-500">
              Create proposals and send them to customers on WhatsApp
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/proposals/new")}
          className="flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-[#1ebe5a]"
        >
          <Plus size={16} /> New Proposal
        </button>
      </div>

      {/* STATS */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total proposals"
          value={proposals.length}
          tone="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Sent"
          value={sentCount}
          tone="bg-green-50 text-green-600"
        />
        <StatCard
          icon={Pencil}
          label="Drafts"
          value={draftCount}
          tone="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={Wallet}
          label="Total value"
          value={formatMoney(totalValue, mainCurrency)}
          tone="bg-purple-50 text-purple-600"
        />
      </div>

      {/* FILTERS */}
      <div className="mb-4 flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, number or client"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/25"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/25"
        >
          <option value="">All status</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Proposal</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : proposals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-14 text-center">
                  <FileSignature
                    size={36}
                    className="mx-auto mb-2 text-gray-300"
                  />
                  <p className="font-medium text-gray-700">No proposals yet</p>
                  <p className="text-sm text-gray-500">
                    Click "New Proposal" to create your first one.
                  </p>
                </td>
              </tr>
            ) : (
              proposals.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-gray-100 transition hover:bg-gray-50/70"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setPreviewId(p.id)}
                      className="text-left font-semibold text-gray-900 hover:text-[#128C7E] hover:underline"
                    >
                      {p.title}
                    </button>
                    <p className="text-xs text-gray-500">{p.proposalNumber}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{clientNameOf(p)}</p>
                    <p className="text-xs text-gray-500">
                      {clientPhoneOf(p) || "No phone"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatMoney(p.total, p.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        STATUS_STYLES[p.status] || STATUS_STYLES.DRAFT
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          p.status === "SENT" ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      {p.status === "SENT" ? "Sent" : "Draft"}
                    </span>
                    {p.sentAt && (
                      <p className="mt-1 text-[11px] text-gray-500">
                        {formatDate(p.sentAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setPreviewId(p.id)}
                        title="Preview"
                        className="rounded-lg p-2 text-purple-600 hover:bg-purple-50"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setSendTarget(p)}
                        title={
                          p.status === "SENT"
                            ? "Send again on WhatsApp"
                            : "Send on WhatsApp"
                        }
                        className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                      >
                        <Send size={16} />
                      </button>
                      <button
                        onClick={() => handleDownload(p)}
                        disabled={downloadingId === p.id}
                        title="Download PDF"
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/proposals/${p.id}/edit`)}
                        title="Edit"
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        title="Delete"
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

