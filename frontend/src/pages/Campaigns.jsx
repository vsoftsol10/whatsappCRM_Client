import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import useCampaignStore from "../store/campaignStore";
import { getCampaigns } from "../api/campaignApi"; // silent auto-refresh while sending

import CampaignStats from "../components/campaigns/CampaignStats";
import CampaignFilters from "../components/campaigns/CampaignFilters";
import CampaignCard from "../components/campaigns/CampaignCard";
import CampaignTable from "../components/campaigns/CampaignTable";
import CampaignPagination from "../components/campaigns/CampaignPagination";
import CreateCampaignModal from "../components/campaigns/CreateCampaignModal";
import EditCampaignModal from "../components/campaigns/EditCampaignModal";
import ViewCampaignModal from "../components/campaigns/ViewCampaignModal";
import SendCampaignModal from "../components/campaigns/SendCampaignModal";
import ConfirmModal from "../components/common/ConfirmModal";

const PAGE_SIZES = {
  card: [6, 9, 12, 24],
  table: [5, 10, 20, 50],
};

const DEFAULT_PAGE_SIZE = { card: 6, table: 5 };

const VIEW_STORAGE_KEY = "campaigns:view";

const readSavedView = () => {
  try {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    return saved === "card" ? "card" : "table";
  } catch {
    return "table";
  }
};

export default function Campaigns() {
  const {
    campaigns,
    fetchCampaigns,
    removeCampaign,
    editCampaign,
    isLoading,
  } = useCampaignStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [view, setView] = useState(readSavedView);
  const [pageSizes, setPageSizes] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const itemsPerPage = pageSizes[view];

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While any campaign is SENDING, refresh the list every 4 seconds
  // (silently - no loading spinner) so sent / failed counts move live.
  const hasSendingCampaign = campaigns.some(
    (campaign) => campaign.status === "SENDING"
  );

  useEffect(() => {
    if (!hasSendingCampaign) return undefined;

    const timer = setInterval(async () => {
      try {
        const response = await getCampaigns();

        useCampaignStore.setState({ campaigns: response.data || [] });
      } catch {
        // ignore - the next tick will try again
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [hasSendingCampaign]);

  // ==================================================
  // FILTER + PAGINATE
  // ==================================================

  const filteredCampaigns = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return campaigns.filter((campaign) => {
      const matchesSearch = campaign.name?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "ALL" ? true : campaign.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCampaigns.length / itemsPerPage)
  );

  // Never sit on a page that no longer exists (e.g. after deleting
  // the last campaign on the last page)
  const page = Math.min(currentPage, totalPages);

  const paginatedCampaigns = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredCampaigns.slice(start, start + itemsPerPage);
  }, [filteredCampaigns, page, itemsPerPage]);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleViewChange = (nextView) => {
    setView(nextView);
    setCurrentPage(1);

    try {
      localStorage.setItem(VIEW_STORAGE_KEY, nextView);
    } catch {
      // storage can be blocked - the choice just won't be remembered
    }
  };

  const handlePageSizeChange = (size) => {
    setPageSizes((prev) => ({ ...prev, [view]: size }));
    setCurrentPage(1);
  };

  // ==================================================
  // ACTIONS
  // ==================================================

  const handleView = (campaign) => {
    setSelectedCampaign(campaign);
    setShowViewModal(true);
  };

  const handleSend = (campaign) => {
    setSelectedCampaign(campaign);
    setShowSendModal(true);
  };

  const handleEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setShowEditModal(true);
  };

  // "Edit" button inside the View drawer: swap View for Edit
  const handleEditFromView = (campaign) => {
    setShowViewModal(false);
    setSelectedCampaign(campaign);
    setShowEditModal(true);
  };

  const handleDelete = (id) => setDeleteTargetId(id);

  const confirmDelete = async () => {
    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      await removeCampaign(id);

      toast.success("Campaign deleted successfully");
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await editCampaign(id, { status });

      toast.success("Campaign status updated");
    } catch {
      toast.error("Unable to update campaign");
    }
  };

  const closeView = useCallback(() => {
    setShowViewModal(false);
    setSelectedCampaign(null);
  }, []);

  const rowActions = {
    onView: handleView,
    onSend: handleSend,
    onEdit: handleEdit,
    onDelete: handleDelete,
  };

  // Only show the loader on the very first load, so the list doesn't
  // blink away every time the store is busy (sending, saving...).
  const showLoader = isLoading && campaigns.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] p-4 sm:p-6">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your marketing campaigns
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
        >
          + Create Campaigns
        </button>
      </div>

      {/* STATS */}
      <CampaignStats campaigns={campaigns} />

      {/* SEARCH / FILTER / VIEW TOGGLE */}
      <CampaignFilters
        search={search}
        setSearch={handleSearch}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusFilter}
        view={view}
        setView={handleViewChange}
      />

      {/* LOADING */}
      {showLoader && (
        <div className="mt-10 text-center text-sm text-slate-500">
          Loading campaigns...
        </div>
      )}

      {/* EMPTY */}
      {!showLoader && filteredCampaigns.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <h3 className="text-base font-semibold text-slate-900">
            {campaigns.length === 0
              ? "No campaigns yet"
              : "No campaigns match your search"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {campaigns.length === 0
              ? "Create your first campaign."
              : "Try a different name or status."}
          </p>
        </div>
      )}

      {/* CARD VIEW */}
      {!showLoader && filteredCampaigns.length > 0 && view === "card" && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {paginatedCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onStatusChange={handleStatusChange}
              {...rowActions}
            />
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {!showLoader && filteredCampaigns.length > 0 && view === "table" && (
        <CampaignTable campaigns={paginatedCampaigns} {...rowActions} />
      )}

      {/* PAGINATION */}
      {!showLoader && filteredCampaigns.length > 0 && (
        <CampaignPagination
          currentPage={page}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          pageSizeOptions={PAGE_SIZES[view]}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(campaign) => {
          // Straight after creation, open the Send Campaign drawer
          setSelectedCampaign(campaign);
          setShowSendModal(true);
        }}
      />

      <ViewCampaignModal
        isOpen={showViewModal}
        campaign={selectedCampaign}
        onClose={closeView}
        onRequestEdit={handleEditFromView}
      />

      <SendCampaignModal
        isOpen={showSendModal}
        campaign={selectedCampaign}
        onClose={() => {
          setShowSendModal(false);
          setSelectedCampaign(null);
        }}
      />

      <EditCampaignModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCampaign(null);
        }}
        campaign={selectedCampaign}
      />

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Campaign"
        message="Are you sure you want to delete this campaign? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
}