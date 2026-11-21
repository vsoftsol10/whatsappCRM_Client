// import { useEffect, useMemo, useState } from "react";
// import toast from "react-hot-toast";

// import TicketHeader from "../components/tickets/TicketHeader";
// import TicketStats from "../components/tickets/TicketStats";
// import TicketSearch from "../components/tickets/TicketSearch";
// import TicketFilters from "../components/tickets/TicketFilters";
// import TicketTable from "../components/tickets/TicketTable";
// import AddEditTicketModal from "../components/tickets/AddEditTicketModal";
// import ViewTicketModal from "../components/tickets/ViewTicketModal";
// import CustomerPagination from "../components/customers/CustomerPagination";
// import ConfirmModal from "../components/common/ConfirmModal";
// import useTicketStore from "../store/ticketStore";
// import { useAuthStore } from "../store/authStore";

// function TicketsPage() {
//   const { user } = useAuthStore();
//   const isAdmin = user?.role === "ADMIN";

//   const tickets = useTicketStore((s) => s.tickets);
//   const customers = useTicketStore((s) => s.customers);
//   const employees = useTicketStore((s) => s.employees);
//   const addTicket = useTicketStore((s) => s.addTicket);
//   const editTicket = useTicketStore((s) => s.editTicket);
//   const removeTicket = useTicketStore((s) => s.removeTicket);
//   const changeTicketStatus = useTicketStore((s) => s.changeTicketStatus);

//   const [loaded, setLoaded] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("ALL");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(5);

//   // { mode: "add" } | { mode: "edit" | "view", ticketId }
//   const [modal, setModal] = useState(null);
//   const [deleteTargetId, setDeleteTargetId] = useState(null);

//   // Status changes shown straight away while they are being saved: { [ticketId]: status }
//   const [pendingStatus, setPendingStatus] = useState({});

//   // =========================
//   // LOAD DATA
//   // =========================

//   useEffect(() => {
//     const store = useTicketStore.getState();

//     store.fetchTickets().finally(() => setLoaded(true));
//   }, []);

//   // Only admins create tickets, so only they need the pick lists
//   useEffect(() => {
//     if (!isAdmin) return;

//     const store = useTicketStore.getState();

//     store.fetchCustomers();
//     store.fetchEmployees();
//   }, [isAdmin]);

//   // =========================
//   // FILTER + PAGINATION
//   // =========================

//   const filteredTickets = useMemo(() => {
//     const keyword = searchTerm.trim().toLowerCase();

//     return tickets.filter((ticket) => {
//       const matchesSearch =
//         !keyword ||
//         ticket.title?.toLowerCase().includes(keyword) ||
//         ticket.customer?.name?.toLowerCase().includes(keyword) ||
//         ticket.assignedTo?.name?.toLowerCase().includes(keyword) ||
//         ticket.assignedTo?.email?.toLowerCase().includes(keyword);

//       const matchesStatus =
//         statusFilter === "ALL" || ticket.status === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [tickets, searchTerm, statusFilter]);

//   // Page stays inside the valid range, e.g. after a delete
//   const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
//   const page = Math.min(currentPage, totalPages);

//   const pagedTickets = useMemo(
//     () => filteredTickets.slice((page - 1) * pageSize, page * pageSize),
//     [filteredTickets, page, pageSize]
//   );

//   const ticketCounts = useMemo(
//     () => ({
//       total: tickets.length,
//       open: tickets.filter((t) => t.status === "OPEN").length,
//       inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
//       resolved: tickets.filter((t) => t.status === "RESOLVED").length,
//       closed: tickets.filter((t) => t.status === "CLOSED").length,
//     }),
//     [tickets]
//   );

//   // =========================
//   // ACTIONS
//   // =========================

//   const handleStatusChange = async (id, status) => {
//     if (pendingStatus[id]) return;

//     setPendingStatus((prev) => ({ ...prev, [id]: status }));

//     try {
//       await changeTicketStatus(id, status);

//       toast.success("Ticket status updated");
//     } catch (error) {
//       console.error(error);

//       // 403 is already handled by the apiClient interceptor
//       if (error?.response?.status !== 403) {
//         toast.error(
//           error?.response?.data?.message || "Failed to update ticket status"
//         );
//       }
//     } finally {
//       setPendingStatus((prev) => {
//         const next = { ...prev };
//         delete next[id];
//         return next;
//       });
//     }
//   };

//   const confirmDeleteTicket = async () => {
//     const id = deleteTargetId;

//     setDeleteTargetId(null);

//     if (!id) return;

//     try {
//       await removeTicket(id);

//       toast.success("Ticket deleted successfully!");
//     } catch (error) {
//       console.error(error);

//       if (error?.response?.status !== 403) {
//         toast.error(
//           error?.response?.data?.message || "Failed to delete ticket"
//         );
//       }
//     }
//   };

//   // The ticket a View / Edit modal is about (always the latest copy from the store)
//   const modalTicket =
//     modal?.ticketId ? tickets.find((t) => t.id === modal.ticketId) : null;

//   return (
//     <div className="crm-page">
//       <TicketHeader
//         canCreate={isAdmin}
//         onAdd={() => setModal({ mode: "add" })}
//       />

//       <TicketStats ticketCounts={ticketCounts} />

//       <div className="mb-6 flex flex-col gap-3 sm:flex-row">
//         <TicketSearch
//           searchTerm={searchTerm}
//           setSearchTerm={(value) => {
//             setSearchTerm(value);
//             setCurrentPage(1);
//           }}
//         />

//         <TicketFilters
//           statusFilter={statusFilter}
//           setStatusFilter={(value) => {
//             setStatusFilter(value);
//             setCurrentPage(1);
//           }}
//         />
//       </div>

//       <TicketTable
//         tickets={pagedTickets}
//         loading={!loaded}
//         isAdmin={isAdmin}
//         pendingStatus={pendingStatus}
//         onView={(ticket) => setModal({ mode: "view", ticketId: ticket.id })}
//         onEdit={(ticket) => setModal({ mode: "edit", ticketId: ticket.id })}
//         onDelete={setDeleteTargetId}
//         onStatusChange={handleStatusChange}
//       />

//       {loaded && filteredTickets.length > 0 && (
//         <CustomerPagination
//           currentPage={page}
//           totalPages={totalPages}
//           pageSize={pageSize}
//           onPageChange={setCurrentPage}
//           onPageSizeChange={(size) => {
//             setPageSize(size);
//             setCurrentPage(1);
//           }}
//         />
//       )}

//       {/* ================= MODALS ================= */}

//       {modal?.mode === "add" && (
//         <AddEditTicketModal
//           key="add"
//           mode="add"
//           customers={customers}
//           employees={employees}
//           onClose={() => setModal(null)}
//           onSubmit={addTicket}
//         />
//       )}

//       {modal?.mode === "edit" && modalTicket && (
//         <AddEditTicketModal
//           key={`edit-${modalTicket.id}`}
//           mode="edit"
//           ticket={modalTicket}
//           customers={customers}
//           employees={employees}
//           onClose={() => setModal(null)}
//           onSubmit={(payload) => editTicket(modalTicket.id, payload)}
//         />
//       )}

//       {modal?.mode === "view" && modalTicket && (
//         <ViewTicketModal
//           key={`view-${modalTicket.id}`}
//           ticket={modalTicket}
//           onClose={() => setModal(null)}
//           onEdit={
//             isAdmin
//               ? () => setModal({ mode: "edit", ticketId: modalTicket.id })
//               : undefined
//           }
//         />
//       )}

//       <ConfirmModal
//         isOpen={!!deleteTargetId}
//         title="Delete Ticket"
//         message="Are you sure you want to delete this ticket? This cannot be undone."
//         confirmText="Delete"
//         cancelText="Cancel"
//         variant="danger"
//         onConfirm={confirmDeleteTicket}
//         onCancel={() => setDeleteTargetId(null)}
//       />
//     </div>
//   );
// }

// export default TicketsPage;


import { useEffect, useMemo, useState } from "react";
import useGuideAutoOpen from "../components/guide/useGuideAutoOpen";
import toast from "react-hot-toast";

import TicketHeader from "../components/tickets/TicketHeader";
import TicketStats from "../components/tickets/TicketStats";
import TicketSearch from "../components/tickets/TicketSearch";
import TicketFilters from "../components/tickets/TicketFilters";
import TicketTable from "../components/tickets/TicketTable";
import AddEditTicketModal from "../components/tickets/AddEditTicketModal";
import ViewTicketModal from "../components/tickets/ViewTicketModal";
import CustomerPagination from "../components/customers/CustomerPagination";
import ConfirmModal from "../components/common/ConfirmModal";
import useTicketStore from "../store/ticketStore";
import { useAuthStore } from "../store/authStore";

function TicketsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const tickets = useTicketStore((s) => s.tickets);
  const customers = useTicketStore((s) => s.customers);
  const employees = useTicketStore((s) => s.employees);
  const addTicket = useTicketStore((s) => s.addTicket);
  const editTicket = useTicketStore((s) => s.editTicket);
  const removeTicket = useTicketStore((s) => s.removeTicket);
  const changeTicketStatus = useTicketStore((s) => s.changeTicketStatus);

  const [loaded, setLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // { mode: "add" } | { mode: "edit" | "view", ticketId }
  const [modal, setModal] = useState(null);

  // Opens the add form when coming from the first-visit guide
  useGuideAutoOpen("tickets", () => {
    if (isAdmin) setModal({ mode: "add" });
  });
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Status changes shown straight away while they are being saved: { [ticketId]: status }
  const [pendingStatus, setPendingStatus] = useState({});

  // =========================
  // LOAD DATA
  // =========================

  useEffect(() => {
    const store = useTicketStore.getState();

    store.fetchTickets().finally(() => setLoaded(true));
  }, []);

  // Only admins create tickets, so only they need the pick lists
  useEffect(() => {
    if (!isAdmin) return;

    const store = useTicketStore.getState();

    store.fetchCustomers();
    store.fetchEmployees();
  }, [isAdmin]);

  // =========================
  // FILTER + PAGINATION
  // =========================

  const filteredTickets = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesSearch =
        !keyword ||
        ticket.title?.toLowerCase().includes(keyword) ||
        ticket.customer?.name?.toLowerCase().includes(keyword) ||
        ticket.assignedTo?.name?.toLowerCase().includes(keyword) ||
        ticket.assignedTo?.email?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  // Page stays inside the valid range, e.g. after a delete
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const page = Math.min(currentPage, totalPages);

  const pagedTickets = useMemo(
    () => filteredTickets.slice((page - 1) * pageSize, page * pageSize),
    [filteredTickets, page, pageSize]
  );

  const ticketCounts = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN").length,
      inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
      closed: tickets.filter((t) => t.status === "CLOSED").length,
    }),
    [tickets]
  );

  // =========================
  // ACTIONS
  // =========================

  const handleStatusChange = async (id, status) => {
    if (pendingStatus[id]) return;

    setPendingStatus((prev) => ({ ...prev, [id]: status }));

    try {
      await changeTicketStatus(id, status);

      toast.success("Ticket status updated");
    } catch (error) {
      console.error(error);

      // 403 is already handled by the apiClient interceptor
      if (error?.response?.status !== 403) {
        toast.error(
          error?.response?.data?.message || "Failed to update ticket status"
        );
      }
    } finally {
      setPendingStatus((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const confirmDeleteTicket = async () => {
    const id = deleteTargetId;

    setDeleteTargetId(null);

    if (!id) return;

    try {
      await removeTicket(id);

      toast.success("Ticket deleted successfully!");
    } catch (error) {
      console.error(error);

      if (error?.response?.status !== 403) {
        toast.error(
          error?.response?.data?.message || "Failed to delete ticket"
        );
      }
    }
  };

  // The ticket a View / Edit modal is about (always the latest copy from the store)
  const modalTicket =
    modal?.ticketId ? tickets.find((t) => t.id === modal.ticketId) : null;

  return (
    <div className="crm-page">
      <TicketHeader
        canCreate={isAdmin}
        onAdd={() => setModal({ mode: "add" })}
      />

      <TicketStats ticketCounts={ticketCounts} />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <TicketSearch
          searchTerm={searchTerm}
          setSearchTerm={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
        />

        <TicketFilters
          statusFilter={statusFilter}
          setStatusFilter={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
        />
      </div>

      <TicketTable
        tickets={pagedTickets}
        loading={!loaded}
        isAdmin={isAdmin}
        pendingStatus={pendingStatus}
        onView={(ticket) => setModal({ mode: "view", ticketId: ticket.id })}
        onEdit={(ticket) => setModal({ mode: "edit", ticketId: ticket.id })}
        onDelete={setDeleteTargetId}
        onStatusChange={handleStatusChange}
      />

      {loaded && filteredTickets.length > 0 && (
        <CustomerPagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}

      {/* ================= MODALS ================= */}

      {modal?.mode === "add" && (
        <AddEditTicketModal
          key="add"
          mode="add"
          customers={customers}
          employees={employees}
          onClose={() => setModal(null)}
          onSubmit={addTicket}
        />
      )}

      {modal?.mode === "edit" && modalTicket && (
        <AddEditTicketModal
          key={`edit-${modalTicket.id}`}
          mode="edit"
          ticket={modalTicket}
          customers={customers}
          employees={employees}
          onClose={() => setModal(null)}
          onSubmit={(payload) => editTicket(modalTicket.id, payload)}
        />
      )}

      {modal?.mode === "view" && modalTicket && (
        <ViewTicketModal
          key={`view-${modalTicket.id}`}
          ticket={modalTicket}
          onClose={() => setModal(null)}
          onEdit={
            isAdmin
              ? () => setModal({ mode: "edit", ticketId: modalTicket.id })
              : undefined
          }
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Ticket"
        message="Are you sure you want to delete this ticket? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteTicket}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}

export default TicketsPage;