
import { useEffect, useState } from "react";

import TicketHeader from "../components/tickets/TicketHeader";
import TicketSearch from "../components/tickets/TicketSearch";
import TicketFilters from "../components/tickets/TicketFilters";
import TicketTable from "../components/tickets/TicketTable";
import AddEditTicketModal from "../components/tickets/AddEditTicketModal";
import ViewTicketModal from "../components/tickets/ViewTicketModal";
import TicketStats from "../components/tickets/TicketStats";

import useTicketStore from "../store/ticketStore";
import toast from "react-hot-toast";
import Pagination from "../components/common/Pagination";
import ConfirmModal from "../components/common/ConfirmModal";

function TicketsPage() {
  // ===========================
  // ZUSTAND STORE
  // ===========================

  const {
    tickets,
    customers,
    employees,

    fetchTickets,
    fetchCustomers,
    fetchEmployees,

    addTicket,
    editTicket,
    removeTicket,
    changeTicketStatus,
  } = useTicketStore();

  // ===========================
  // LOCAL STATES
  // ===========================

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [openMenu, setOpenMenu] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState({
    id: null,
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "OPEN",
    customerId: "",
    assignedToId: "",
  });

  // ===========================
  // LOAD DATA
  // ===========================

  useEffect(() => {
    fetchTickets();
    fetchCustomers();
    fetchEmployees();
  }, []);

  // ===========================
  // CREATE TICKET
  // ===========================

  const handleCreateTicket = async (e) => {
    e.preventDefault();

    if (!form.title || !form.description || !form.customerId) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        customerId: form.customerId,
        assignedToId: form.assignedToId || null,
      };

      await addTicket(payload);

      toast.success("Ticket Created Successfully");

      setForm({
        id: null,
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "OPEN",
        customerId: "",
        assignedToId: "",
      });

      setShowForm(false);
    } catch (error) {
      console.error(error);

      // 403 toast is already handled by apiClient
      if (error?.response?.status !== 403) {
        toast.error(
          error?.response?.data?.message ||
          "Failed to create ticket"
        );
      }
    } finally {
      setLoading(false);
      onClose();
    }
  };

  // ===========================
  // OPEN EDIT MODAL
  // ===========================

  const handleEditTicket = (ticket) => {
    setOpenMenu(null);

    setForm({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      customerId: ticket.customer?.id || "",
      assignedToId: ticket.assignedToId || "",
    });

    setIsEditing(true);
    setShowForm(true);
  };

  // ===========================
  // OPEN VIEW MODAL
  // ===========================

  const handleViewTicket = (ticket) => {
    setOpenMenu(null);
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };

  // ===========================
  // UPDATE TICKET
  // ===========================

  const handleUpdateTicket = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await editTicket(form.id, {
        title: form.title,
        description: form.description,
        priority: form.priority,
        status: form.status,
        customerId: form.customerId,
        assignedToId: form.assignedToId || null,
      });

      toast.success("Ticket Updated Successfully");

      setShowForm(false);
      setIsEditing(false);
    } catch (error) {
      console.error(error);

      // 403 toast is already handled by apiClient
      if (error?.response?.status !== 403) {
        toast.error(
          error?.response?.data?.message ||
          "Failed to update ticket"
        );
      }
    } finally {
      setLoading(false);
      onClose();
    }
  };

  // ===========================
  // DELETE TICKET
  // ===========================

  const handleDeleteTicket = (id) => {
    setDeleteTargetId(id);
  };

  const confirmDeleteTicket = async () => {
    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      await removeTicket(id);

      setOpenMenu(null);

      toast.success("Ticket Deleted Successfully");
    } catch (error) {
      console.error(error);

      // 403 toast is already handled by apiClient
      if (error?.response?.status !== 403) {
        toast.error(
          error?.response?.data?.message ||
          "Failed to delete ticket"
        );
      }
    }
  };

const handleStatusChange = async (id, status) => {
  try {
    await changeTicketStatus(id, status);

    toast.success("Ticket status updated");
  } catch (error) {
    console.error(error);

    // 403 toast is already handled by apiClient
    if (error?.response?.status !== 403) {
      toast.error(
        error?.response?.data?.message ||
          "Failed to update ticket status"
      );
    }
  }
};

  // ===========================
  // FILTER TICKETS
  // ===========================

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      ticket.customer?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(
    filteredTickets.length / itemsPerPage
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const paginatedTickets =
    filteredTickets.slice(
      startIndex,
      startIndex + itemsPerPage
    );

  // ===========================
  // COUNTS
  // ===========================

  const ticketCounts = {
    total: tickets.length,

    open: tickets.filter(
      (t) => t.status === "OPEN"
    ).length,

    inProgress: tickets.filter(
      (t) => t.status === "IN_PROGRESS"
    ).length,

    resolved: tickets.filter(
      (t) => t.status === "RESOLVED"
    ).length,

    closed: tickets.filter(
      (t) => t.status === "CLOSED"
    ).length,
  };

  // ===========================
  // RETURN
  // ===========================

  return (
    <div className="crm-page bg-slate-100">
      <TicketHeader
        setShowForm={setShowForm}
        setIsEditing={setIsEditing}
        setForm={setForm}
      />

      <TicketStats ticketCounts={ticketCounts} />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="w-full lg:max-w-md">
          <TicketSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </div>

        <TicketFilters
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>

      <TicketTable
        tickets={paginatedTickets}
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        handleView={handleViewTicket}
        handleEdit={handleEditTicket}
        handleDelete={handleDeleteTicket}
        onStatusChange={handleStatusChange}
      />

      {filteredTickets.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTickets.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      )}

      {showForm && (
        <AddEditTicketModal
          form={form}
          setForm={setForm}
          customers={customers}
          employees={employees}
          loading={loading}
          isEditing={isEditing}
          setShowForm={setShowForm}
          handleSubmit={
            isEditing
              ? handleUpdateTicket
              : handleCreateTicket
          }
        />
      )}

      <ViewTicketModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
      />

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