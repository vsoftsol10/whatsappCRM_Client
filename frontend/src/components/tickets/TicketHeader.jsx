// Page title + "Add Ticket" (only admins can create tickets).
function TicketHeader({ canCreate, onAdd }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="crm-title">Tickets</h1>

        <p className="crm-subtitle">Manage customer support tickets</p>
      </div>

      {canCreate && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-green-500 px-6 text-sm font-semibold text-white transition hover:bg-green-600 sm:w-auto"
        >
          + Add Ticket
        </button>
      )}
    </div>
  );
}

export default TicketHeader;
