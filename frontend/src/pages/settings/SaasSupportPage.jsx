// import { useEffect, useState } from "react";
// import { Plus, Ticket } from "lucide-react";
// import { toast } from "react-hot-toast";

// import RaiseSupportTicketModal from "./RaiseSupportTicketModal";
// import { getMySupportTickets } from "../../api/supportTicketApi";

// const STATUS_STYLES = {
//   OPEN: "bg-green-100 text-green-700",
//   IN_PROGRESS: "bg-blue-100 text-blue-600",
//   RESOLVED: "bg-teal-100 text-teal-700",
//   CLOSED: "bg-slate-200 text-slate-600",
// };

// const PRIORITY_STYLES = {
//   URGENT: "bg-red-100 text-red-600",
//   HIGH: "bg-slate-100 text-slate-600",
//   MEDIUM: "bg-amber-100 text-amber-700",
//   LOW: "bg-green-100 text-green-700",
// };

// // "IN_PROGRESS" -> "In progress"
// const toSentenceCase = (value = "") => {
//   const text = value.replace(/_/g, " ").toLowerCase();
//   return text.charAt(0).toUpperCase() + text.slice(1);
// };

// const formatDate = (date) => {
//   if (!date) return "-";

//   return new Date(date).toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// export default function SaasSupportPage() {
//   const [tickets, setTickets] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [openModal, setOpenModal] = useState(false);

//   const loadTickets = async () => {
//     try {
//       setLoading(true);

//       const response = await getMySupportTickets();

//       setTickets(response.tickets || []);
//     } catch (error) {
//       console.error("Failed to load support tickets:", error);

//       toast.error(
//         error.response?.data?.message || "Failed to load support tickets."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadTickets();
//   }, []);

//   const handleTicketCreated = (ticket) => {
//     if (ticket) {
//       setTickets((prev) => [ticket, ...prev]);
//     } else {
//       loadTickets();
//     }
//   };

//   const raiseButton = (
//     <button
//       type="button"
//       onClick={() => setOpenModal(true)}
//       className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5d]"
//     >
//       <Plus size={16} />
//       Raise Support Ticket
//     </button>
//   );

//   return (
//     <div className="space-y-8">
//       {/* HEADER */}
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
//             Support
//           </h1>
//           <p className="mt-1 text-sm text-slate-500">
//             Raise a ticket and track its progress.
//           </p>
//         </div>

//         {raiseButton}
//       </div>

//       {/* MY TICKETS */}
//       <div>
//         <h2 className="text-xl font-bold text-slate-900">My Tickets</h2>
//         <p className="mt-1 text-sm text-slate-500">
//           {loading
//             ? "Loading tickets..."
//             : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} raised`}
//         </p>

//         <div className="mt-5">
//           {loading ? (
//             <div className="py-12 text-center">
//               <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-green-500" />
//               <p className="mt-3 text-sm text-slate-500">Loading tickets...</p>
//             </div>
//           ) : tickets.length === 0 ? (
//             <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
//               <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
//                 <Ticket size={26} />
//               </div>

//               <h3 className="mt-4 text-sm font-semibold text-slate-700">
//                 No support tickets yet
//               </h3>

//               <p className="mt-1 text-sm text-slate-500">
//                 If you have an issue, raise a support ticket.
//               </p>

//               <div className="mt-5 flex justify-center">{raiseButton}</div>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
//               {tickets.map((ticket) => (
//                 <div
//                   key={ticket.id}
//                   className={`flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${
//                     ticket.priority === "URGENT"
//                       ? "border-l-4 border-l-red-500"
//                       : ""
//                   }`}
//                 >
//                   <div className="flex items-start justify-between gap-3">
//                     <h3 className="min-w-0 break-words font-semibold text-slate-900">
//                       {ticket.title}
//                     </h3>

//                     <span
//                       className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
//                         STATUS_STYLES[ticket.status] ||
//                         "bg-slate-100 text-slate-600"
//                       }`}
//                     >
//                       {toSentenceCase(ticket.status)}
//                     </span>
//                   </div>

//                   <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
//                     {ticket.description}
//                   </p>

//                   <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
//                     <span
//                       className={`rounded-md px-2.5 py-1 text-xs font-medium ${
//                         PRIORITY_STYLES[ticket.priority] ||
//                         "bg-slate-100 text-slate-600"
//                       }`}
//                     >
//                       {toSentenceCase(ticket.priority)}
//                     </span>

//                     <span className="text-xs text-slate-500">
//                       Created {formatDate(ticket.createdAt)}
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* RAISE TICKET MODAL */}
//       <RaiseSupportTicketModal
//         open={openModal}
//         onClose={() => setOpenModal(false)}
//         onSuccess={handleTicketCreated}
//       />
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { Plus, Ticket } from "lucide-react";
import { toast } from "react-hot-toast";

import RaiseSupportTicketModal from "./RaiseSupportTicketModal";
import { getMySupportTickets } from "../../api/supportTicketApi";

const STATUS_STYLES = {
  OPEN: "bg-green-100 text-green-700",
  IN_PROGRESS: "bg-blue-100 text-blue-600",
  RESOLVED: "bg-teal-100 text-teal-700",
  CLOSED: "bg-slate-200 text-slate-600",
};

const PRIORITY_STYLES = {
  URGENT: "bg-red-100 text-red-600",
  HIGH: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-green-100 text-green-700",
};

// "IN_PROGRESS" -> "In progress"
const toSentenceCase = (value = "") => {
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function SaasSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  const loadTickets = async () => {
    try {
      setLoading(true);

      const response = await getMySupportTickets();

      setTickets(response.tickets || []);
    } catch (error) {
      console.error("Failed to load support tickets:", error);

      toast.error(
        error.response?.data?.message || "Failed to load support tickets."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleTicketCreated = (ticket) => {
    if (ticket) {
      setTickets((prev) => [ticket, ...prev]);
    } else {
      loadTickets();
    }
  };

  const raiseButton = (
    <button
      type="button"
      onClick={() => setOpenModal(true)}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5d]"
    >
      <Plus size={16} />
      Raise Support Ticket
    </button>
  );

  return (
    <div className="space-y-8">
      {/* HEADER */}
      {/* Heading removed - the "Support" tab above already names this page */}
      <div className="flex justify-end">{raiseButton}</div>

      {/* MY TICKETS */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">My Tickets</h2>
        <p className="mt-1 text-sm text-slate-500">
          {loading
            ? "Loading tickets..."
            : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} raised`}
        </p>

        <div className="mt-5">
          {loading ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-green-500" />
              <p className="mt-3 text-sm text-slate-500">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Ticket size={26} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-700">
                No support tickets yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                If you have an issue, raise a support ticket.
              </p>

              <div className="mt-5 flex justify-center">{raiseButton}</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${
                    ticket.priority === "URGENT"
                      ? "border-l-4 border-l-red-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="min-w-0 break-words font-semibold text-slate-900">
                      {ticket.title}
                    </h3>

                    <span
                      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                        STATUS_STYLES[ticket.status] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {toSentenceCase(ticket.status)}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-500">
                    {ticket.description}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        PRIORITY_STYLES[ticket.priority] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {toSentenceCase(ticket.priority)}
                    </span>

                    <span className="text-xs text-slate-500">
                      Created {formatDate(ticket.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RAISE TICKET MODAL */}
      <RaiseSupportTicketModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={handleTicketCreated}
      />
    </div>
  );
}