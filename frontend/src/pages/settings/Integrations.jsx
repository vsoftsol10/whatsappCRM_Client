// import React, { useEffect, useState } from "react";
// import { Plus, Plug, Loader2, RefreshCw } from "lucide-react";
// import toast from "react-hot-toast";

// import {
//   getIntegrations,
//   getIntegrationById,
//   createIntegration,
//   updateIntegrationStatus,
//   deleteIntegration,
//   getIntegrationEvents,
// } from "../../api/integrationApi";

// import IntegrationCard from "../../components/integrations/IntegrationCard";
// import AddIntegrationModal from "../../components/integrations/AddIntegrationModal";
// import IntegrationDetailsModal from "../../components/integrations/IntegrationDetailsModal";

// const initialForm = {
//   name: "",
//   provider: "",
//   type: "BILLING",
// };

// const Integrations = () => {
//   // =========================================================
//   // STATE
//   // =========================================================

//   const [integrations, setIntegrations] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const [showAddModal, setShowAddModal] = useState(false);

//   const [selectedIntegration, setSelectedIntegration] =
//     useState(null);

//   const [events, setEvents] = useState([]);
//   const [eventsLoading, setEventsLoading] = useState(false);

//   const [showSecret, setShowSecret] = useState(false);

//   const [form, setForm] = useState(initialForm);
//   const [submitting, setSubmitting] = useState(false);

//   const [copiedField, setCopiedField] = useState(null);

//   // =========================================================
//   // LOAD INTEGRATIONS
//   // =========================================================

//   const loadIntegrations = async () => {
//     try {
//       setLoading(true);

//       const response = await getIntegrations();

//       if (response?.success) {
//         setIntegrations(response.integrations || []);
//       } else {
//         setIntegrations([]);
//       }
//     } catch (error) {
//       console.error("Fetch integrations error:", error);

//       toast.error(
//         error.response?.data?.message ||
//           "Failed to load integrations"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadIntegrations();
//   }, []);

//   // =========================================================
//   // OPEN ADD MODAL
//   // =========================================================

//   const handleOpenAddModal = () => {
//     setForm(initialForm);
//     setShowAddModal(true);
//   };

//   // =========================================================
//   // CLOSE ADD MODAL
//   // =========================================================

//   const handleCloseAddModal = () => {
//     if (submitting) return;

//     setShowAddModal(false);
//     setForm(initialForm);
//   };

//   // =========================================================
//   // CREATE INTEGRATION
//   // =========================================================

//   const handleCreate = async (e) => {
//     e.preventDefault();

//     if (!form.name.trim()) {
//       toast.error("Please enter integration name");
//       return;
//     }

//     if (!form.type) {
//       toast.error("Please select integration type");
//       return;
//     }

//     try {
//       setSubmitting(true);

//       const response = await createIntegration({
//         name: form.name.trim(),
//         provider: form.provider.trim() || null,
//         type: form.type,
//       });

//       if (!response?.success) {
//         throw new Error(
//           response?.message || "Failed to create integration"
//         );
//       }

//       toast.success("Integration created successfully");

//       setShowAddModal(false);
//       setForm(initialForm);

//       await loadIntegrations();

//       // Open newly created integration
//       if (response.integration?.id) {
//         await handleOpenIntegration(response.integration.id);
//       }
//     } catch (error) {
//       console.error("Create integration error:", error);

//       toast.error(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to create integration"
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // =========================================================
//   // OPEN INTEGRATION DETAILS
//   // =========================================================

//   const handleOpenIntegration = async (integrationId) => {
//     try {
//       setSelectedIntegration(null);
//       setEvents([]);
//       setShowSecret(false);
//       setEventsLoading(true);

//       /*
//        * IMPORTANT:
//        *
//        * getIntegrations() intentionally does not return
//        * webhookSecret.
//        *
//        * Therefore we fetch:
//        *
//        * 1. Full integration details
//        * 2. Integration events
//        *
//        * at the same time.
//        */

//       const [integrationResponse, eventsResponse] =
//         await Promise.all([
//           getIntegrationById(integrationId),
//           getIntegrationEvents(integrationId),
//         ]);

//       if (!integrationResponse?.success) {
//         throw new Error(
//           integrationResponse?.message ||
//             "Failed to load integration"
//         );
//       }

//       if (!eventsResponse?.success) {
//         throw new Error(
//           eventsResponse?.message ||
//             "Failed to load integration events"
//         );
//       }

//       setSelectedIntegration(
//         integrationResponse.integration ||
//           integrationResponse
//       );

//       setEvents(eventsResponse.events || []);
//     } catch (error) {
//       console.error(
//         "Failed to fetch integration details:",
//         error
//       );

//       toast.error(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to load integration details"
//       );

//       setSelectedIntegration(null);
//       setEvents([]);
//     } finally {
//       setEventsLoading(false);
//     }
//   };

//   // =========================================================
//   // CLOSE DETAILS MODAL
//   // =========================================================

//   const handleCloseDetails = () => {
//     setSelectedIntegration(null);
//     setEvents([]);
//     setShowSecret(false);
//     setCopiedField(null);
//   };

//   // =========================================================
//   // TOGGLE INTEGRATION STATUS
//   // =========================================================

//   const handleToggleStatus = async (integration) => {
//     const newStatus =
//       integration.status === "ACTIVE"
//         ? "INACTIVE"
//         : "ACTIVE";

//     try {
//       const response = await updateIntegrationStatus(
//         integration.id,
//         newStatus
//       );

//       if (!response?.success) {
//         throw new Error(
//           response?.message ||
//             "Failed to update integration status"
//         );
//       }

//       toast.success(
//         newStatus === "ACTIVE"
//           ? "Integration activated"
//           : "Integration deactivated"
//       );

//       await loadIntegrations();

//       /*
//        * If the details modal is currently open for this
//        * integration, refresh its details too.
//        */
//       if (
//         selectedIntegration?.id === integration.id
//       ) {
//         await handleOpenIntegration(integration.id);
//       }
//     } catch (error) {
//       console.error(
//         "Update integration status error:",
//         error
//       );

//       toast.error(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to update integration status"
//       );
//     }
//   };

//   // =========================================================
//   // DELETE INTEGRATION
//   // =========================================================

//   const handleDelete = async (integration) => {
//     const confirmed = window.confirm(
//       `Are you sure you want to delete "${integration.name}"?\n\nThis will also remove the webhook event records associated with this integration.`
//     );

//     if (!confirmed) return;

//     try {
//       const response = await deleteIntegration(
//         integration.id
//       );

//       if (!response?.success) {
//         throw new Error(
//           response?.message ||
//             "Failed to delete integration"
//         );
//       }

//       toast.success("Integration deleted successfully");

//       if (
//         selectedIntegration?.id === integration.id
//       ) {
//         handleCloseDetails();
//       }

//       await loadIntegrations();
//     } catch (error) {
//       console.error("Delete integration error:", error);

//       toast.error(
//         error.response?.data?.message ||
//           error.message ||
//           "Failed to delete integration"
//       );
//     }
//   };

//   // =========================================================
//   // COPY TO CLIPBOARD
//   // =========================================================

//   const handleCopy = async (value, field) => {
//     if (!value) {
//       toast.error("Nothing to copy");
//       return;
//     }

//     try {
//       await navigator.clipboard.writeText(value);

//       setCopiedField(field);

//       toast.success("Copied to clipboard");

//       setTimeout(() => {
//         setCopiedField(null);
//       }, 2000);
//     } catch (error) {
//       console.error("Copy error:", error);
//       toast.error("Failed to copy");
//     }
//   };

//   // =========================================================
//   // WEBHOOK URL
//   // =========================================================

// const webhookUrl = selectedIntegration?.webhookKey
//   ? `${import.meta.env.VITE_API_URL}/integrations/webhook/${selectedIntegration.webhookKey}`
//   : "";

//   // =========================================================
//   // LOADING STATE
//   // =========================================================

//   if (loading) {
//     return (
//       <div className="min-h-[60vh] flex items-center justify-center">
//         <div className="flex flex-col items-center gap-3">
//           <Loader2 className="w-7 h-7 text-green-600 animate-spin" />

//           <p className="text-sm text-gray-500">
//             Loading integrations...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // =========================================================
//   // MAIN UI
//   // =========================================================

//   return (
//     <div className="p-4 sm:p-6 lg:p-8">
//       {/* =====================================================
//           PAGE HEADER
//       ====================================================== */}

//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
//         <div>
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
//               <Plug className="w-5 h-5 text-green-600" />
//             </div>

//             <div>
//               <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
//                 Integrations
//               </h1>

//               <p className="text-sm text-gray-500 mt-1">
//                 Connect your CRM with billing, e-commerce,
//                 POS, ERP and other systems.
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           {/* Refresh */}
//           <button
//             type="button"
//             onClick={loadIntegrations}
//             disabled={loading}
//             title="Refresh integrations"
//             className="inline-flex items-center justify-center p-2.5 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
//           >
//             <RefreshCw
//               className={`w-4 h-4 ${
//                 loading ? "animate-spin" : ""
//               }`}
//             />
//           </button>

//           {/* Add Integration */}
//           <button
//             type="button"
//             onClick={handleOpenAddModal}
//             className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
//           >
//             <Plus className="w-4 h-4" />
//             Add Integration
//           </button>
//         </div>
//       </div>

//       {/* =====================================================
//           INFO BANNER
//       ====================================================== */}

//       <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4">
//         <div className="flex items-start gap-3">
//           <WebhookIcon />

//           <div>
//             <h3 className="text-sm font-semibold text-green-900">
//               Connect external systems to your CRM
//             </h3>

//             <p className="text-sm text-green-800 mt-1">
//               Your billing, e-commerce, POS or other system
//               can send webhook events to your CRM. The CRM
//               can automatically create or update customers
//               and record purchases.
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* =====================================================
//           EMPTY STATE
//       ====================================================== */}

//       {integrations.length === 0 ? (
//         <div className="bg-white border border-gray-200 rounded-xl">
//           <div className="py-16 px-6 text-center">
//             <div className="w-14 h-14 mx-auto rounded-full bg-green-50 flex items-center justify-center">
//               <Plug className="w-7 h-7 text-green-600" />
//             </div>

//             <h2 className="mt-4 text-lg font-semibold text-gray-900">
//               No integrations yet
//             </h2>

//             <p className="mt-2 max-w-md mx-auto text-sm text-gray-500">
//               Connect your billing software, e-commerce
//               store, POS, ERP or another external system
//               to automatically send customer and purchase
//               information to your CRM.
//             </p>

//             <button
//               type="button"
//               onClick={handleOpenAddModal}
//               className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
//             >
//               <Plus className="w-4 h-4" />
//               Add Your First Integration
//             </button>
//           </div>
//         </div>
//       ) : (
//         <>
//           {/* =================================================
//               INTEGRATION COUNT
//           ================================================== */}

//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h2 className="text-base font-semibold text-gray-900">
//                 Connected Systems
//               </h2>

//               <p className="text-sm text-gray-500 mt-1">
//                 {integrations.length} integration
//                 {integrations.length !== 1 ? "s" : ""}
//                 {" "}configured
//               </p>
//             </div>
//           </div>

//           {/* =================================================
//               INTEGRATION CARDS
//           ================================================== */}

//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
//             {integrations.map((integration) => (
//               <IntegrationCard
//                 key={integration.id}
//                 integration={integration}
//                 onView={handleOpenIntegration}
//                 onToggleStatus={handleToggleStatus}
//                 onDelete={handleDelete}
//               />
//             ))}
//           </div>
//         </>
//       )}

//       {/* =====================================================
//           ADD INTEGRATION MODAL
//       ====================================================== */}

//       <AddIntegrationModal
//         show={showAddModal}
//         form={form}
//         setForm={setForm}
//         submitting={submitting}
//         onClose={handleCloseAddModal}
//         onSubmit={handleCreate}
//       />

//       {/* =====================================================
//           INTEGRATION DETAILS MODAL
//       ====================================================== */}

//       <IntegrationDetailsModal
//         integration={selectedIntegration}
//         events={events}
//         eventsLoading={eventsLoading}
//         showSecret={showSecret}
//         setShowSecret={setShowSecret}
//         webhookUrl={webhookUrl}
//         copiedField={copiedField}
//         onCopy={handleCopy}
//         onClose={handleCloseDetails}
//       />
//     </div>
//   );
// };

// // =========================================================
// // SMALL WEBHOOK ICON
// // =========================================================

// const WebhookIcon = () => {
//   return (
//     <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
//       <Plug className="w-4 h-4 text-green-600" />
//     </div>
//   );
// };

// export default Integrations;



import React, { useEffect, useState } from "react";
import { Plus, Plug, Loader2, RefreshCw } from "lucide-react";
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

      toast.success("Integration created successfully");

      setShowAddModal(false);
      setForm(initialForm);

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

  const handleDelete = async (integration) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${integration.name}"?\n\nThis will also remove the webhook event records associated with this integration.`
    );

    if (!confirmed) return;

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
  ? `${import.meta.env.VITE_API_URL}/integrations/webhook/${selectedIntegration.webhookKey}`
  : "";

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 text-green-600 animate-spin" />

          <p className="text-sm text-gray-500">
            Loading integrations...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Plug className="w-5 h-5 text-green-600" />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Integrations
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                Connect your CRM with billing, e-commerce,
                POS, ERP and other systems.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            type="button"
            onClick={loadIntegrations}
            disabled={loading}
            title="Refresh integrations"
            className="inline-flex items-center justify-center p-2.5 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
          </button>

          {/* Add Integration */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Integration
          </button>
        </div>
      </div>

      {/* =====================================================
          INFO BANNER
      ====================================================== */}

      <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <WebhookIcon />

          <div>
            <h3 className="text-sm font-semibold text-green-900">
              Connect external systems to your CRM
            </h3>

            <p className="text-sm text-green-800 mt-1">
              Your billing, e-commerce, POS or other system
              can send webhook events to your CRM. The CRM
              can automatically create or update customers
              and record purchases.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {integrations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="py-16 px-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-50 flex items-center justify-center">
              <Plug className="w-7 h-7 text-green-600" />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-gray-900">
              No integrations yet
            </h2>

            <p className="mt-2 max-w-md mx-auto text-sm text-gray-500">
              Connect your billing software, e-commerce
              store, POS, ERP or another external system
              to automatically send customer and purchase
              information to your CRM.
            </p>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Integration
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* =================================================
              INTEGRATION COUNT
          ================================================== */}

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Connected Systems
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {integrations.length} integration
                {integrations.length !== 1 ? "s" : ""}
                {" "}configured
              </p>
            </div>
          </div>

          {/* =================================================
              INTEGRATION CARDS
          ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {integrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onView={handleOpenIntegration}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {/* =====================================================
          ADD INTEGRATION MODAL
      ====================================================== */}

      <AddIntegrationModal
        show={showAddModal}
        form={form}
        setForm={setForm}
        submitting={submitting}
        onClose={handleCloseAddModal}
        onSubmit={handleCreate}
      />

      {/* =====================================================
          INTEGRATION DETAILS MODAL
      ====================================================== */}

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
    </div>
  );
};

// =========================================================
// SMALL WEBHOOK ICON
// =========================================================

const WebhookIcon = () => {
  return (
    <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
      <Plug className="w-4 h-4 text-green-600" />
    </div>
  );
};

export default Integrations;