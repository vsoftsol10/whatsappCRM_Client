// import { useEffect, useMemo, useState } from "react";
// import toast from "react-hot-toast";
// import { Sparkles } from "lucide-react";

// import useCampaignStore from "../store/campaignStore";

// import CampaignStats from "../components/campaigns/CampaignStats";
// import CampaignFilters from "../components/campaigns/CampaignFilters";
// import CampaignCard from "../components/campaigns/CampaignCard";
// import CreateCampaignModal from "../components/campaigns/CreateCampaignModal";
// import EditCampaignModal from "../components/campaigns/EditCampaignModal";
// import AICampaignModal from "../components/campaigns/AICampaignModal";
// import ViewCampaignModal from "../components/campaigns/ViewCampaignModal";
// import SendCampaignModal from "../components/campaigns/SendCampaignModal";
// import Pagination from "../components/common/Pagination";
// import ConfirmModal from "../components/common/ConfirmModal";

// export default function Campaigns() {
//   const {
//     campaigns,
//     fetchCampaigns,
//     removeCampaign,
//     editCampaign,
//     isLoading,
//   } = useCampaignStore();

//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("ALL");

//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showAIModal, setShowAIModal] = useState(false);

//   // NEW
//   const [showViewModal, setShowViewModal] = useState(false);
//   const [showSendModal, setShowSendModal] = useState(false);

//   const [selectedCampaign, setSelectedCampaign] = useState(null);

//   const [aiCampaign, setAiCampaign] = useState(null);
//   const [deleteTargetId, setDeleteTargetId] = useState(null);

//   const [currentPage, setCurrentPage] = useState(1);

//   const itemsPerPage = 10;

//   useEffect(() => {
//     fetchCampaigns();
//   }, []);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [search, statusFilter]);

//   const filteredCampaigns = useMemo(() => {
//     return campaigns.filter((campaign) => {
//       const matchesSearch = campaign.name
//         ?.toLowerCase()
//         .includes(search.toLowerCase());

//       const matchesStatus =
//         statusFilter === "ALL"
//           ? true
//           : campaign.status === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [campaigns, search, statusFilter]);

//   // =========================
//   // PAGINATION
//   // =========================

//   const totalPages = Math.ceil(
//     filteredCampaigns.length / itemsPerPage
//   );

//   const startIndex =
//     (currentPage - 1) * itemsPerPage;

//   const paginatedCampaigns =
//     filteredCampaigns.slice(
//       startIndex,
//       startIndex + itemsPerPage
//     );

//   // ===============================
//   // VIEW
//   // ===============================

//   const handleView = (campaign) => {
//     setSelectedCampaign(campaign);
//     setShowViewModal(true);
//   };

//   // ===============================
//   // SEND
//   // ===============================

//   const handleSend = (campaign) => {
//     setSelectedCampaign(campaign);
//     setShowSendModal(true);
//   };

//   // ===============================
//   // EDIT
//   // ===============================

//   const handleEdit = (campaign) => {
//     setSelectedCampaign(campaign);
//     setShowEditModal(true);
//   };

//   // ===============================
//   // DELETE
//   // ===============================

//   const handleDelete = (id) => {
//     setDeleteTargetId(id);
//   };

//   const confirmDelete = async () => {
//     const id = deleteTargetId;
//     setDeleteTargetId(null);

//     try {
//       await removeCampaign(id);

//       toast.success("Campaign deleted successfully");
//     } catch (error) {
//       toast.error("Delete failed");
//     }
//   };

//   // ===============================
//   // STATUS
//   // ===============================

//   const handleStatusChange = async (id, status) => {
//     try {
//       await editCampaign(id, {
//         status,
//       });

//       toast.success("Campaign status updated");
//     } catch (error) {
//       toast.error("Unable to update campaign");
//     }
//   };

//   // ===============================
//   // AI → CREATE
//   // ===============================

//   const handleUseCampaign = (campaign) => {
//     setAiCampaign(campaign);

//     setShowAIModal(false);

//     setShowCreateModal(true);
//   };

//   return (
//     <div className="p-6">

//       {/* Header */}

//       <div className="flex justify-between items-center mb-6">

//         <div>

//           <h1 className="text-3xl font-bold">
//             Campaigns
//           </h1>

//           <p className="text-gray-500">
//             Manage your marketing campaigns
//           </p>

//         </div>

//         <div className="flex gap-3">

//           <button
//             onClick={() => setShowAIModal(true)}
//             className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-5 py-3 rounded-xl hover:opacity-90"
//           >
//             <Sparkles size={18} />

//             AI Generate
//           </button>

//           <button
//             onClick={() => setShowCreateModal(true)}
//             className="bg-[#25D366] text-black px-5 py-3 rounded-xl hover:bg-[#128C7E]"
//           >
//             Create Campaign
//           </button>

//         </div>

//       </div>

//       {/* Stats */}

//       <CampaignStats campaigns={campaigns} />

//       {/* Filters */}

//       <CampaignFilters
//         search={search}
//         setSearch={setSearch}
//         statusFilter={statusFilter}
//         setStatusFilter={setStatusFilter}
//       />

//       {/* Loading */}

//       {isLoading && (
//         <div className="text-center mt-10">
//           Loading campaigns...
//         </div>
//       )}

//       {/* Empty */}

//       {!isLoading &&
//         filteredCampaigns.length === 0 && (
//           <div className="bg-white rounded-xl p-10 text-center mt-6 shadow">

//             <h2 className="font-semibold text-lg">
//               No Campaigns Found
//             </h2>

//             <p className="text-gray-500 mt-2">
//               Create your first campaign.
//             </p>

//           </div>
//         )}

//       {/* Campaign Grid */}

//       {!isLoading &&
//         filteredCampaigns.length > 0 && (

//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">

//             {paginatedCampaigns.map((campaign) => (

//               <CampaignCard
//                 key={campaign.id}
//                 campaign={campaign}

//                 onView={handleView}

//                 onSend={handleSend}

//                 onEdit={handleEdit}

//                 onDelete={handleDelete}

//                 onStatusChange={handleStatusChange}
//               />

//             ))}

//           </div>

//         )}

//         {!isLoading && filteredCampaigns.length > 0 && (
//           <Pagination
//             currentPage={currentPage}
//             totalPages={totalPages}
//             totalItems={filteredCampaigns.length}
//             itemsPerPage={itemsPerPage}
//             onPageChange={setCurrentPage}
//           />
//         )}

//       {/* ========================= */}

//       {/* AI */}

//       {/* ========================= */}

//       <AICampaignModal
//         isOpen={showAIModal}
//         onClose={() => setShowAIModal(false)}
//         onUseCampaign={handleUseCampaign}
//       />

//       {/* ========================= */}

//       {/* CREATE */}

//       {/* ========================= */}

//       <CreateCampaignModal
//         isOpen={showCreateModal}
//         onClose={() => {
//           setShowCreateModal(false);

//           setAiCampaign(null);
//         }}
//         aiCampaign={aiCampaign}
//       />

//       {/* ========================= */}

//       {/* VIEW */}

//       {/* ========================= */}

//       <ViewCampaignModal
//         isOpen={showViewModal}
//         campaign={selectedCampaign}
//         onClose={() => {
//           setShowViewModal(false);

//           setSelectedCampaign(null);
//         }}
//       />

//       {/* ========================= */}

//       {/* SEND */}

//       {/* ========================= */}

//       <SendCampaignModal
//         isOpen={showSendModal}
//         campaign={selectedCampaign}
//         onClose={() => {
//           setShowSendModal(false);

//           setSelectedCampaign(null);
//         }}
//       />

//       {/* ========================= */}

//       {/* EDIT */}

//       {/* ========================= */}

//       <EditCampaignModal
//         isOpen={showEditModal}
//         onClose={() => {
//           setShowEditModal(false);

//           setSelectedCampaign(null);
//         }}
//         campaign={selectedCampaign}
//       />

//       <ConfirmModal
//         isOpen={!!deleteTargetId}
//         title="Delete Campaign"
//         message="Are you sure you want to delete this campaign? This cannot be undone."
//         confirmText="Delete"
//         cancelText="Cancel"
//         variant="danger"
//         onConfirm={confirmDelete}
//         onCancel={() => setDeleteTargetId(null)}
//       />

//     </div>
//   );
// }

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";

import useCampaignStore from "../store/campaignStore";

import CampaignStats from "../components/campaigns/CampaignStats";
import CampaignFilters from "../components/campaigns/CampaignFilters";
import CampaignCard from "../components/campaigns/CampaignCard";
import CreateCampaignModal from "../components/campaigns/CreateCampaignModal";
import EditCampaignModal from "../components/campaigns/EditCampaignModal";
import AICampaignModal from "../components/campaigns/AICampaignModal";
import ViewCampaignModal from "../components/campaigns/ViewCampaignModal";
import SendCampaignModal from "../components/campaigns/SendCampaignModal";
import Pagination from "../components/common/Pagination";
import ConfirmModal from "../components/common/ConfirmModal";

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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // NEW
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [aiCampaign, setAiCampaign] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch = campaign.name
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL"
          ? true
          : campaign.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, search, statusFilter]);

  // =========================
  // PAGINATION
  // =========================

  const totalPages = Math.ceil(
    filteredCampaigns.length / itemsPerPage
  );

  const startIndex =
    (currentPage - 1) * itemsPerPage;

  const paginatedCampaigns =
    filteredCampaigns.slice(
      startIndex,
      startIndex + itemsPerPage
    );

  // ===============================
  // VIEW
  // ===============================

  const handleView = (campaign) => {
    setSelectedCampaign(campaign);
    setShowViewModal(true);
  };

  // ===============================
  // SEND
  // ===============================

  const handleSend = (campaign) => {
    setSelectedCampaign(campaign);
    setShowSendModal(true);
  };

  // ===============================
  // EDIT
  // ===============================

  const handleEdit = (campaign) => {
    setSelectedCampaign(campaign);
    setShowEditModal(true);
  };

  // ===============================
  // DELETE
  // ===============================

  const handleDelete = (id) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    const id = deleteTargetId;
    setDeleteTargetId(null);

    try {
      await removeCampaign(id);

      toast.success("Campaign deleted successfully");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  // ===============================
  // STATUS
  // ===============================

  const handleStatusChange = async (id, status) => {
    try {
      await editCampaign(id, {
        status,
      });

      toast.success("Campaign status updated");
    } catch (error) {
      toast.error("Unable to update campaign");
    }
  };

  // ===============================
  // AI → CREATE
  // ===============================

  const handleUseCampaign = (campaign) => {
    setAiCampaign(campaign);

    setShowAIModal(false);

    setShowCreateModal(true);
  };

  return (
    <div className="p-6">

      {/* Header */}

      <div className="flex justify-between items-center mb-6">

        <div>

          <h1 className="text-3xl font-bold">
            Campaigns
          </h1>

          <p className="text-gray-500">
            Manage your marketing campaigns
          </p>

        </div>

        <div className="flex gap-3">

          <button
            onClick={() => setShowAIModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-5 py-3 rounded-xl hover:opacity-90"
          >
            <Sparkles size={18} />

            AI Generate
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#25D366] text-black px-5 py-3 rounded-xl hover:bg-[#128C7E]"
          >
            Create Campaign
          </button>

        </div>

      </div>

      {/* Stats */}

      <CampaignStats campaigns={campaigns} />

      {/* Filters */}

      <CampaignFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Loading */}

      {isLoading && (
        <div className="text-center mt-10">
          Loading campaigns...
        </div>
      )}

      {/* Empty */}

      {!isLoading &&
        filteredCampaigns.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center mt-6 shadow">

            <h2 className="font-semibold text-lg">
              No Campaigns Found
            </h2>

            <p className="text-gray-500 mt-2">
              Create your first campaign.
            </p>

          </div>
        )}

      {/* Campaign Grid */}

      {!isLoading &&
        filteredCampaigns.length > 0 && (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">

            {paginatedCampaigns.map((campaign) => (

              <CampaignCard
                key={campaign.id}
                campaign={campaign}

                onView={handleView}

                onSend={handleSend}

                onEdit={handleEdit}

                onDelete={handleDelete}

                onStatusChange={handleStatusChange}
              />

            ))}

          </div>

        )}

        {!isLoading && filteredCampaigns.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCampaigns.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}

      {/* ========================= */}

      {/* AI */}

      {/* ========================= */}

      <AICampaignModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onUseCampaign={handleUseCampaign}
      />

      {/* ========================= */}

      {/* CREATE */}

      {/* ========================= */}

      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);

          setAiCampaign(null);
        }}
        aiCampaign={aiCampaign}
      />

      {/* ========================= */}

      {/* VIEW */}

      {/* ========================= */}

      <ViewCampaignModal
        isOpen={showViewModal}
        campaign={selectedCampaign}
        onClose={() => {
          setShowViewModal(false);

          setSelectedCampaign(null);
        }}
      />

      {/* ========================= */}

      {/* SEND */}

      {/* ========================= */}

      <SendCampaignModal
        isOpen={showSendModal}
        campaign={selectedCampaign}
        onClose={() => {
          setShowSendModal(false);

          setSelectedCampaign(null);
        }}
      />

      {/* ========================= */}

      {/* EDIT */}

      {/* ========================= */}

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