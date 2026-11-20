import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  Loader2,
  Plug,
  Plus,
  Table2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getIntegrations,
  getIntegrationById,
  createIntegration,
  updateIntegrationStatus,
  updateIntegrationSettings,
  updateIntegrationSecret,
  deleteIntegration,
  getIntegrationEvents,
} from "../../api/integrationApi";
import IntegrationCard from "../../components/integrations/IntegrationCard";
import AddIntegrationModal from "../../components/integrations/AddIntegrationModal";
import IntegrationDetailsModal from "../../components/integrations/IntegrationDetailsModal";
import IntegrationActionsMenu from "../../components/integrations/IntegrationActionsMenu";
import {
  TYPE_LABELS,
  formatDate,
} from "../../components/integrations/integrationUtils";
import { StatusSwitch } from "../../components/integrations/IntegrationCard";
import ConfirmModal from "../../components/common/ConfirmModal";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

const getPageNumbers = (current, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, "...", total];
  if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

const initialForm = {
  name: "",
  provider: "",
  type: "BILLING",
  settings: {
    autoCreateCustomer: true,
    autoCreatePurchase: true,
  },
};

const Integrations = () => {
  // =========================================================
  // STATE
  // =========================================================

  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedIntegration, setSelectedIntegration] =
    useState(null);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [showSecret, setShowSecret] = useState(false);

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const [copiedField, setCopiedField] = useState(null);

  // Integration waiting for delete confirmation (null = popup closed)
  const [integrationToDelete, setIntegrationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // View + filter + pagination (table view)
  const [view, setView] = useState("cards");
  const [filter, setFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // =========================================================
  // LOAD INTEGRATIONS
  // =========================================================

  const loadIntegrations = async () => {
    try {
      setLoading(true);

      const response = await getIntegrations();

      if (response?.success) {
        setIntegrations(response.integrations || []);
      } else {
        setIntegrations([]);
      }
    } catch (error) {
      console.error("Fetch integrations error:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to load integrations"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const handleOpenAddModal = () => {
    setForm(initialForm);
    setShowAddModal(true);
  };

  // =========================================================
  // CLOSE ADD MODAL
  // =========================================================

  const handleCloseAddModal = () => {
    if (submitting) return;

    setShowAddModal(false);
    setForm(initialForm);
  };

  // =========================================================
  // CREATE INTEGRATION
  // =========================================================

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter integration name");
      return;
    }

    if (!form.type) {
      toast.error("Please select integration type");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createIntegration({
        name: form.name.trim(),
        provider: form.provider.trim() || null,
        type: form.type,
        settings: form.settings,
      });

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to create integration"
        );
      }

      setShowAddModal(false);
      setForm(initialForm);

      // Success message (shown AFTER the popup is closed)
      toast.success("Integration created successfully");

      await loadIntegrations();

      // Open newly created integration
      if (response.integration?.id) {
        await handleOpenIntegration(response.integration.id);
      }
    } catch (error) {
      console.error("Create integration error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create integration"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =========================================================
  // OPEN INTEGRATION DETAILS
  // =========================================================

  const handleOpenIntegration = async (integrationId) => {
    try {
      setSelectedIntegration(null);
      setEvents([]);
      setShowSecret(false);
      setEventsLoading(true);

      /*
       * IMPORTANT:
       *
       * getIntegrations() intentionally does not return
       * webhookSecret.
       *
       * Therefore we fetch:
       *
       * 1. Full integration details
       * 2. Integration events
       *
       * at the same time.
       */

      const [integrationResponse, eventsResponse] =
        await Promise.all([
          getIntegrationById(integrationId),
          getIntegrationEvents(integrationId),
        ]);

      if (!integrationResponse?.success) {
        throw new Error(
          integrationResponse?.message ||
            "Failed to load integration"
        );
      }

      if (!eventsResponse?.success) {
        throw new Error(
          eventsResponse?.message ||
            "Failed to load integration events"
        );
      }

      setSelectedIntegration(
        integrationResponse.integration ||
          integrationResponse
      );

      setEvents(eventsResponse.events || []);
    } catch (error) {
      console.error(
        "Failed to fetch integration details:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load integration details"
      );

      setSelectedIntegration(null);
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  // =========================================================
  // CLOSE DETAILS MODAL
  // =========================================================

  const handleCloseDetails = () => {
    setSelectedIntegration(null);
    setEvents([]);
    setShowSecret(false);
    setCopiedField(null);
  };

  // =========================================================
  // TOGGLE INTEGRATION STATUS
  // =========================================================

  const handleToggleStatus = async (integration) => {
    const newStatus =
      integration.status === "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    try {
      const response = await updateIntegrationStatus(
        integration.id,
        newStatus
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update integration status"
        );
      }

      toast.success(
        newStatus === "ACTIVE"
          ? "Integration activated"
          : "Integration deactivated"
      );

      await loadIntegrations();

      /*
       * If the details modal is currently open for this
       * integration, refresh its details too.
       */
      if (
        selectedIntegration?.id === integration.id
      ) {
        await handleOpenIntegration(integration.id);
      }
    } catch (error) {
      console.error(
        "Update integration status error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update integration status"
      );
    }
  };

  // =========================================================
  // UPDATE INTEGRATION SETTINGS
  // =========================================================

  const [savingSettings, setSavingSettings] = useState(false);

  const handleUpdateSettings = async (integrationId, settings) => {
    try {
      setSavingSettings(true);

      const response = await updateIntegrationSettings(
        integrationId,
        settings
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update integration settings"
        );
      }

      toast.success("Automation settings saved");

      await loadIntegrations();

      if (selectedIntegration?.id === integrationId) {
        await handleOpenIntegration(integrationId);
      }
    } catch (error) {
      console.error("Update integration settings error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update integration settings"
      );
    } finally {
      setSavingSettings(false);
    }
  };

  // =========================================================
  // UPDATE WEBHOOK SECRET
  // =========================================================

  const [savingSecret, setSavingSecret] = useState(false);

  const handleUpdateSecret = async (integrationId, webhookSecret) => {
    try {
      setSavingSecret(true);

      const response = await updateIntegrationSecret(
        integrationId,
        webhookSecret
      );

      if (!response?.success) {
        throw new Error(
          response?.message || "Failed to update webhook secret"
        );
      }

      toast.success(
        "Webhook secret updated. Re-send a test event from your provider to confirm it verifies."
      );

      await loadIntegrations();

      if (selectedIntegration?.id === integrationId) {
        await handleOpenIntegration(integrationId);
      }
    } catch (error) {
      console.error("Update integration secret error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update webhook secret"
      );
    } finally {
      setSavingSecret(false);
    }
  };

  // =========================================================
  // DELETE INTEGRATION
  // =========================================================

  // Step 1: the card's Delete button only opens the confirm popup
  const handleDelete = (integration) => {
    setIntegrationToDelete(integration);
  };

  // Step 2: user pressed Delete inside the popup
  const confirmDelete = async () => {
    const integration = integrationToDelete;

    if (!integration) return;

    setDeleting(true);

    try {
      const response = await deleteIntegration(
        integration.id
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to delete integration"
        );
      }

      toast.success("Integration deleted successfully");

      if (
        selectedIntegration?.id === integration.id
      ) {
        handleCloseDetails();
      }

      await loadIntegrations();
    } catch (error) {
      console.error("Delete integration error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete integration"
      );
    } finally {
      setDeleting(false);
      setIntegrationToDelete(null);
    }
  };

  // =========================================================
  // COPY TO CLIPBOARD
  // =========================================================

  const handleCopy = async (value, field) => {
    if (!value) {
      toast.error("Nothing to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);

      setCopiedField(field);

      toast.success("Copied to clipboard");

      setTimeout(() => {
        setCopiedField(null);
      }, 2000);
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Failed to copy");
    }
  };

  // =========================================================
  // WEBHOOK URL
  // =========================================================

const webhookUrl = selectedIntegration?.webhookKey
  ? `${import.meta.env.VITE_API_URL}/api/integrations/webhook/${selectedIntegration.webhookKey}`
  : "";

  // =========================================================
  // LOADING STATE
  // =========================================================


  // ---------- filter + pagination ----------
  const filteredIntegrations = integrations.filter((integration) => {
    if (filter === "ALL") return true;

    const [kind, value] = filter.split(":");

    return kind === "status"
      ? integration.status === value
      : integration.type === value;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredIntegrations.length / limit)
  );
  const currentPage = Math.min(page, totalPages);

  const tableRows = filteredIntegrations.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const goToPage = (next) => {
    if (next < 1 || next > totalPages || next === currentPage) return;
    setPage(next);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-green-600" />
          <p className="text-sm text-slate-500">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ================= PAGE HEADER ================= */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Integrations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Connect your CRM with billing, e-commerce, POS, ERP and other
            systems.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5d]"
        >
          <Plus className="h-4 w-4" />
          Add Integration
        </button>
      </div>

      {integrations.length === 0 ? (
        /* ================= EMPTY STATE ================= */
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Plug className="h-7 w-7 text-green-600" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No integrations yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Connect your website, billing software, e-commerce store, POS or
              another external system to send customers, leads and purchases
              to your CRM automatically.
            </p>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1ebe5d]"
            >
              <Plus className="h-4 w-4" />
              Add Your First Integration
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ================= TITLE + CONTROLS ================= */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Connected Systems
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {integrations.length} integration
                {integrations.length !== 1 ? "s" : ""} configured
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="relative w-44">
                <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <select
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPage(1);
                  }}
                  aria-label="Filter integrations"
                  className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-11 pr-9 text-sm text-slate-800 shadow-sm outline-none transition focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20"
                >
                  <option value="ALL">Filter</option>

                  <optgroup label="Status">
                    <option value="status:ACTIVE">Active</option>
                    <option value="status:INACTIVE">Inactive</option>
                  </optgroup>

                  <optgroup label="Type">
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={`type:${value}`}>
                        {label}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
              </div>

              {/* View switch */}
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {[
                  { id: "cards", label: "Card view", Icon: LayoutGrid },
                  { id: "table", label: "Table view", Icon: Table2 },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-label={label}
                    title={label}
                    aria-pressed={view === id}
                    onClick={() => setView(id)}
                    className={`flex h-10 w-12 items-center justify-center rounded-lg transition ${
                      view === id
                        ? "bg-[#25D366] text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredIntegrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                No integrations match this filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilter("ALL");
                  setPage(1);
                }}
                className="mt-3 text-sm font-semibold text-green-700 hover:underline"
              >
                Clear filter
              </button>
            </div>
          ) : view === "cards" ? (
            /* ================= CARD VIEW ================= */
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onView={handleOpenIntegration}
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            /* ================= TABLE VIEW ================= */
            <>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="bg-[#DCFCE7]">
                      <tr className="text-xs font-semibold text-emerald-900">
                        <th className="px-6 py-4">Integration</th>
                        <th className="px-4 py-4">Sources</th>
                        <th className="px-4 py-4">Type</th>
                        <th className="px-4 py-4">Last Event</th>
                        <th className="px-4 py-4">Created</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {tableRows.map((integration) => {
                        const isActive = integration.status === "ACTIVE";

                        return (
                          <tr
                            key={integration.id}
                            onClick={() => handleOpenIntegration(integration.id)}
                            className="cursor-pointer transition hover:bg-slate-50"
                          >
                            <td className="px-6 py-4 font-medium text-slate-800">
                              {integration.name}
                            </td>

                            <td className="px-4 py-4 uppercase text-slate-800">
                              {integration.provider || "-"}
                            </td>

                            <td className="px-4 py-4 text-slate-800">
                              {TYPE_LABELS[integration.type] || integration.type}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-slate-800">
                              {formatDate(integration.lastEventAt, "No events yet")}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-slate-800">
                              {formatDate(integration.createdAt)}
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-block rounded-full px-3 py-1 text-xs font-medium uppercase ${
                                  isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </td>

                            <td
                              className="px-6 py-4"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-center gap-3">
                                <StatusSwitch
                                  checked={isActive}
                                  onChange={() => handleToggleStatus(integration)}
                                  label={
                                    isActive
                                      ? "Deactivate integration"
                                      : "Activate integration"
                                  }
                                />

                                <IntegrationActionsMenu
                                  integration={integration}
                                  onView={handleOpenIntegration}
                                  onToggleStatus={handleToggleStatus}
                                  onDelete={handleDelete}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ================= PAGINATION ================= */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    Page {currentPage} of {totalPages}
                  </span>

                  <div className="relative">
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      aria-label="Rows per page"
                      className="h-10 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-4 pr-9 text-sm font-medium text-slate-800 outline-none focus:border-[#25D366]"
                    >
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-700" />
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
                  <button
                    type="button"
                    aria-label="Previous page"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {pageNumbers.map((p, index) =>
                    p === "..." ? (
                      <span key={`gap-${index}`} className="px-1 text-slate-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => goToPage(p)}
                        aria-current={p === currentPage ? "page" : undefined}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition ${
                          p === currentPage
                            ? "border border-[#25D366] bg-green-50 font-semibold text-slate-900"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    aria-label="Next page"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ================= ADD INTEGRATION MODAL ================= */}
      <AddIntegrationModal
        show={showAddModal}
        form={form}
        setForm={setForm}
        submitting={submitting}
        onClose={handleCloseAddModal}
        onSubmit={handleCreate}
      />

      {/* ================= INTEGRATION DETAILS ================= */}
      <IntegrationDetailsModal
        integration={selectedIntegration}
        events={events}
        eventsLoading={eventsLoading}
        showSecret={showSecret}
        setShowSecret={setShowSecret}
        webhookUrl={webhookUrl}
        copiedField={copiedField}
        onCopy={handleCopy}
        onClose={handleCloseDetails}
        onSaveSettings={handleUpdateSettings}
        savingSettings={savingSettings}
        onSaveSecret={handleUpdateSecret}
        savingSecret={savingSecret}
      />

      <ConfirmModal
        isOpen={!!integrationToDelete}
        title="Delete integration?"
        message={`Are you sure you want to delete "${integrationToDelete?.name}"? This will also remove the webhook event records associated with this integration.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setIntegrationToDelete(null)}
      />
    </div>
  );
};

export default Integrations;