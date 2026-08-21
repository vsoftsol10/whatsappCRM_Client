
import { useEffect, useState } from "react";
import {
    Ticket,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

import RaiseSupportTicketModal from "./RaiseSupportTicketModal";

import {
    getMySupportTickets,
} from "../../api/supportTicketApi";

export default function SaasSupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);

    // =====================================================
    // LOAD SUPPORT TICKETS
    // =====================================================

    const loadTickets = async () => {
        try {
            setLoading(true);

            const response = await getMySupportTickets();

            console.log("Support tickets response:", response);

            setTickets(response.tickets || []);

        } catch (error) {
            console.error("Failed to load support tickets:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to load support tickets."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // LOAD ON PAGE OPEN
    // =====================================================

    useEffect(() => {
        loadTickets();
    }, []);

    // =====================================================
    // AFTER NEW TICKET
    // =====================================================

    const handleTicketCreated = (ticket) => {
        if (ticket) {
            setTickets((prev) => [ticket, ...prev]);
        } else {
            loadTickets();
        }
    };

    // =====================================================
    // STATUS STYLE
    // =====================================================

    const getStatusStyle = (status) => {
        switch (status) {
            case "OPEN":
                return "bg-blue-100 text-blue-700";

            case "IN_PROGRESS":
                return "bg-yellow-100 text-yellow-700";

            case "RESOLVED":
                return "bg-green-100 text-green-700";

            case "CLOSED":
                return "bg-slate-200 text-slate-700";

            default:
                return "bg-slate-100 text-slate-600";
        }
    };

    // =====================================================
    // PRIORITY STYLE
    // =====================================================

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case "URGENT":
                return "bg-red-100 text-red-700";

            case "HIGH":
                return "bg-orange-100 text-orange-700";

            case "MEDIUM":
                return "bg-yellow-100 text-yellow-700";

            case "LOW":
                return "bg-green-100 text-green-700";

            default:
                return "bg-slate-100 text-slate-600";
        }
    };

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <div className="space-y-6">

            {/* =================================================
          HEADER
      ================================================= */}

            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    SaaS Support
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Get help from our support team and track your
                    support requests.
                </p>
            </div>


            {/* =================================================
          RAISE TICKET CARD
      ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-start gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
                            <Ticket size={24} />
                        </div>

                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Need help?
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Raise a support ticket and our team will get
                                back to you.
                            </p>
                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={() => setOpenModal(true)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1ebe5d]"
                    >
                        <Plus size={18} />
                        Raise Support Ticket
                    </button>

                </div>

            </div>


            {/* =================================================
          TICKET HISTORY
      ================================================= */}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-200 px-6 py-5">

                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                My Support Tickets
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                View your previous support requests.
                            </p>
                        </div>

                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {tickets.length} Ticket
                            {tickets.length !== 1 ? "s" : ""}
                        </div>

                    </div>

                </div>


                <div className="p-6">

                    {/* LOADING */}

                    {loading ? (

                        <div className="py-10 text-center">

                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-green-500" />

                            <p className="mt-3 text-sm text-slate-500">
                                Loading tickets...
                            </p>

                        </div>

                    ) : tickets.length === 0 ? (

                        /* EMPTY */

                        <div className="py-12 text-center">

                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <Ticket size={26} />
                            </div>

                            <h3 className="mt-4 text-sm font-semibold text-slate-700">
                                No support tickets yet
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                If you have an issue, raise a support ticket.
                            </p>

                            <button
                                type="button"
                                onClick={() => setOpenModal(true)}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe5d]"
                            >
                                <Plus size={16} />
                                Raise Ticket
                            </button>

                        </div>

                    ) : (

                        /* TICKETS */

                        <div className="space-y-4">

                            {tickets.map((ticket) => (

                                <div
                                    key={ticket.id}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:shadow-sm"
                                >

                                    {/* TOP */}

                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                                        <div className="min-w-0">

                                            <div className="flex flex-wrap items-center gap-2">

                                                <span className="text-xs font-semibold text-slate-400">
                                                    #{ticket.id}
                                                </span>

                                                <h3 className="text-base font-semibold text-slate-900">
                                                    {ticket.title}
                                                </h3>

                                            </div>

                                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                                {ticket.description}
                                            </p>

                                        </div>


                                        {/* STATUS */}

                                        <span
                                            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                                ticket.status
                                            )}`}
                                        >
                                            {ticket.status?.replace("_", " ")}
                                        </span>

                                    </div>


                                    {/* DETAILS */}

                                    <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4">

                                        {/* PRIORITY */}

                                        <div className="flex items-center gap-2">

                                            <AlertCircle
                                                size={16}
                                                className="text-slate-400"
                                            />

                                            <span className="text-xs text-slate-500">
                                                Priority
                                            </span>

                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityStyle(
                                                    ticket.priority
                                                )}`}
                                            >
                                                {ticket.priority}
                                            </span>

                                        </div>


                                        {/* DATE */}

                                        <div className="flex items-center gap-2">

                                            <Clock
                                                size={16}
                                                className="text-slate-400"
                                            />

                                            <span className="text-xs text-slate-500">
                                                Created
                                            </span>

                                            <span className="text-xs font-medium text-slate-700">
                                                {formatDate(ticket.createdAt)}
                                            </span>

                                        </div>


                                        {/* RESOLVED */}

                                        {ticket.status === "RESOLVED" && (

                                            <div className="flex items-center gap-2 text-green-600">

                                                <CheckCircle size={16} />

                                                <span className="text-xs font-semibold">
                                                    Resolved
                                                </span>

                                            </div>

                                        )}

                                    </div>

                                </div>

                            ))}

                        </div>

                    )}

                </div>

            </div>


            {/* =================================================
          RAISE TICKET MODAL
      ================================================= */}

            <RaiseSupportTicketModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSuccess={handleTicketCreated}
            />

        </div>
    );
}

