// import React from "react";
// import {
//   X,
//   Copy,
//   Check,
//   Eye,
//   EyeOff,
//   Loader2,
//   Webhook,
//   ShieldCheck,
//   Clock,
//   CheckCircle2,
//   XCircle,
//   AlertCircle,
// } from "lucide-react";

// const formatDate = (date) => {
//   if (!date) return "Never";

//   try {
//     return new Date(date).toLocaleString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   } catch {
//     return "Never";
//   }
// };

// const getEventStatus = (status) => {
//   switch (status) {
//     case "PROCESSED":
//       return {
//         label: "Processed",
//         className: "bg-green-100 text-green-700",
//         icon: CheckCircle2,
//       };

//     case "FAILED":
//       return {
//         label: "Failed",
//         className: "bg-red-100 text-red-700",
//         icon: XCircle,
//       };

//     case "DUPLICATE":
//       return {
//         label: "Duplicate",
//         className: "bg-yellow-100 text-yellow-700",
//         icon: AlertCircle,
//       };

//     default:
//       return {
//         label: status || "Received",
//         className: "bg-gray-100 text-gray-700",
//         icon: Clock,
//       };
//   }
// };

// const IntegrationDetailsModal = ({
//   integration,
//   events,
//   eventsLoading,
//   showSecret,
//   setShowSecret,
//   webhookUrl,
//   copiedField,
//   onCopy,
//   onClose,
// }) => {
//   if (!integration) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       {/* Overlay */}
//       <div
//         className="absolute inset-0 bg-black/50"
//         onClick={onClose}
//       />

//       {/* Modal */}
//       <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
//           <div>
//             <h2 className="text-lg font-semibold text-gray-900">
//               {integration.name}
//             </h2>

//             <p className="text-sm text-gray-500 mt-1">
//               {integration.provider || integration.type}
//             </p>
//           </div>

//           <button
//             type="button"
//             onClick={onClose}
//             className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="overflow-y-auto px-6 py-6">
//           {/* Webhook Configuration */}
//           <div>
//             <div className="flex items-center gap-2 mb-4">
//               <Webhook className="w-5 h-5 text-green-600" />

//               <h3 className="text-base font-semibold text-gray-900">
//                 Webhook Configuration
//               </h3>
//             </div>

//             <div className="space-y-4">
//               {/* Webhook URL */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Webhook URL
//                 </label>

//                 <div className="flex gap-2">
//                   <input
//                     type="text"
//                     readOnly
//                     value={webhookUrl}
//                     className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
//                   />

//                   <button
//                     type="button"
//                     onClick={() =>
//                       onCopy(webhookUrl, "webhookUrl")
//                     }
//                     className="inline-flex items-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
//                   >
//                     {copiedField === "webhookUrl" ? (
//                       <>
//                         <Check className="w-4 h-4 text-green-600" />
//                         Copied
//                       </>
//                     ) : (
//                       <>
//                         <Copy className="w-4 h-4" />
//                         Copy
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* Webhook Secret */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Webhook Secret
//                 </label>

//                 <div className="flex gap-2">
//                   <div className="relative flex-1 min-w-0">
//                     <input
//                       type={showSecret ? "text" : "password"}
//                       readOnly
//                       value={integration.webhookSecret || ""}
//                       className="w-full px-3 py-2.5 pr-11 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 font-mono"
//                     />

//                     <button
//                       type="button"
//                       onClick={() =>
//                         setShowSecret((current) => !current)
//                       }
//                       className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
//                     >
//                       {showSecret ? (
//                         <EyeOff className="w-4 h-4" />
//                       ) : (
//                         <Eye className="w-4 h-4" />
//                       )}
//                     </button>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={() =>
//                       onCopy(
//                         integration.webhookSecret || "",
//                         "webhookSecret"
//                       )
//                     }
//                     className="inline-flex items-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
//                   >
//                     {copiedField === "webhookSecret" ? (
//                       <>
//                         <Check className="w-4 h-4 text-green-600" />
//                         Copied
//                       </>
//                     ) : (
//                       <>
//                         <Copy className="w-4 h-4" />
//                         Copy
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>

//             {/* Security note */}
//             <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
//               <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

//               <p className="text-sm text-blue-800">
//                 Keep your webhook secret secure. Your external
//                 system should send it using the{" "}
//                 <code className="font-mono text-xs">
//                   x-webhook-secret
//                 </code>{" "}
//                 header when sending events to this URL.
//               </p>
//             </div>
//           </div>

//           {/* Events */}
//           <div className="mt-8">
//             <div className="flex items-center justify-between mb-4">
//               <div>
//                 <h3 className="text-base font-semibold text-gray-900">
//                   Webhook Events
//                 </h3>

//                 <p className="text-sm text-gray-500 mt-1">
//                   Events received from this integration
//                 </p>
//               </div>

//               <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
//                 {events.length} events
//               </span>
//             </div>

//             {eventsLoading ? (
//               <div className="flex items-center justify-center py-12">
//                 <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
//               </div>
//             ) : events.length === 0 ? (
//               <div className="border border-dashed border-gray-300 rounded-xl py-12 text-center">
//                 <Webhook className="w-8 h-8 text-gray-300 mx-auto mb-3" />

//                 <p className="text-sm font-medium text-gray-700">
//                   No webhook events yet
//                 </p>

//                 <p className="text-xs text-gray-500 mt-1">
//                   Events received from your external system will
//                   appear here.
//                 </p>
//               </div>
//             ) : (
//               <div className="border border-gray-200 rounded-xl overflow-hidden">
//                 <div className="overflow-x-auto">
//                   <table className="w-full min-w-[700px]">
//                     <thead className="bg-gray-50 border-b border-gray-200">
//                       <tr>
//                         <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                           Event ID
//                         </th>

//                         <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                           Event Type
//                         </th>

//                         <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                           Status
//                         </th>

//                         <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
//                           Received
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody className="divide-y divide-gray-100">
//                       {events.map((event) => {
//                         const status = getEventStatus(
//                           event.status
//                         );

//                         const StatusIcon = status.icon;

//                         return (
//                           <tr
//                             key={event.id}
//                             className="hover:bg-gray-50"
//                           >
//                             <td className="px-4 py-3">
//                               <span className="font-mono text-xs text-gray-700">
//                                 {event.eventId}
//                               </span>
//                             </td>

//                             <td className="px-4 py-3">
//                               <span className="text-sm text-gray-700">
//                                 {event.eventType}
//                               </span>
//                             </td>

//                             <td className="px-4 py-3">
//                               <span
//                                 className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
//                               >
//                                 <StatusIcon className="w-3.5 h-3.5" />
//                                 {status.label}
//                               </span>
//                             </td>

//                             <td className="px-4 py-3">
//                               <span className="text-sm text-gray-500">
//                                 {formatDate(event.createdAt)}
//                               </span>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Integration details */}
//           <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="bg-gray-50 rounded-lg p-4">
//               <p className="text-xs text-gray-500">
//                 Integration Type
//               </p>

//               <p className="mt-1 text-sm font-semibold text-gray-900">
//                 {integration.type}
//               </p>
//             </div>

//             <div className="bg-gray-50 rounded-lg p-4">
//               <p className="text-xs text-gray-500">
//                 Last Event
//               </p>

//               <p className="mt-1 text-sm font-semibold text-gray-900">
//                 {formatDate(integration.lastEventAt)}
//               </p>
//             </div>

//             <div className="bg-gray-50 rounded-lg p-4">
//               <p className="text-xs text-gray-500">
//                 Created
//               </p>

//               <p className="mt-1 text-sm font-semibold text-gray-900">
//                 {formatDate(integration.createdAt)}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 flex-shrink-0">
//           <button
//             type="button"
//             onClick={onClose}
//             className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default IntegrationDetailsModal;



import React, { useEffect, useState } from "react";
import {
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Webhook,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  SkipForward,
  UserPlus,
  ReceiptText,
  Settings2,
  Save,
} from "lucide-react";

const formatDate = (date) => {
  if (!date) return "Never";

  try {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Never";
  }
};

const getEventStatus = (status) => {
  switch (status) {
    case "PROCESSED":
      return {
        label: "Processed",
        className: "bg-green-100 text-green-700",
        icon: CheckCircle2,
      };

    case "FAILED":
      return {
        label: "Failed",
        className: "bg-red-100 text-red-700",
        icon: XCircle,
      };

    case "DUPLICATE":
      return {
        label: "Duplicate",
        className: "bg-yellow-100 text-yellow-700",
        icon: AlertCircle,
      };

    case "SKIPPED":
      return {
        label: "Skipped",
        className: "bg-gray-200 text-gray-700",
        icon: SkipForward,
      };

    default:
      return {
        label: status || "Received",
        className: "bg-gray-100 text-gray-700",
        icon: Clock,
      };
  }
};

const DEFAULT_SETTINGS = {
  autoCreateCustomer: true,
  autoCreatePurchase: true,
  allowedEventTypes: [],
};

const IntegrationDetailsModal = ({
  integration,
  events,
  eventsLoading,
  showSecret,
  setShowSecret,
  webhookUrl,
  copiedField,
  onCopy,
  onClose,
  onSaveSettings,
  savingSettings,
  onSaveSecret,
  savingSecret,
}) => {
  const [localSettings, setLocalSettings] = useState(DEFAULT_SETTINGS);
  const [allowedEventTypesInput, setAllowedEventTypesInput] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [editingSecret, setEditingSecret] = useState(false);

  // Sync local editable state whenever a different (or freshly
  // reloaded) integration is opened.
  useEffect(() => {
    if (!integration) return;

    const settings = {
      ...DEFAULT_SETTINGS,
      ...(integration.settings || {}),
    };

    setLocalSettings(settings);
    setAllowedEventTypesInput(
      (settings.allowedEventTypes || []).join(", ")
    );
    setSecretInput(integration.webhookSecret || "");
    setEditingSecret(false);
  }, [integration]);

  if (!integration) return null;

  const handleToggleLocalSetting = (key) => {
    setLocalSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const parsedAllowedEventTypes = allowedEventTypesInput
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  const hasUnsavedChanges =
    localSettings.autoCreateCustomer !==
      (integration.settings?.autoCreateCustomer ?? true) ||
    localSettings.autoCreatePurchase !==
      (integration.settings?.autoCreatePurchase ?? true) ||
    JSON.stringify(parsedAllowedEventTypes) !==
      JSON.stringify(integration.settings?.allowedEventTypes || []);

  const handleSaveSettings = () => {
    if (!onSaveSettings) return;

    onSaveSettings(integration.id, {
      autoCreateCustomer: localSettings.autoCreateCustomer,
      autoCreatePurchase: localSettings.autoCreatePurchase,
      allowedEventTypes: parsedAllowedEventTypes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {integration.name}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {integration.provider || integration.type}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6">
          {/* Webhook Configuration */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Webhook className="w-5 h-5 text-green-600" />

              <h3 className="text-base font-semibold text-gray-900">
                Webhook Configuration
              </h3>
            </div>

            <div className="space-y-4">
              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 min-w-0 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      onCopy(webhookUrl, "webhookUrl")
                    }
                    className="inline-flex items-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    {copiedField === "webhookUrl" ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Webhook Secret */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Webhook Secret
                  </label>

                  {integration.provider &&
                    integration.provider !== "GENERIC" &&
                    !editingSecret && (
                      <button
                        type="button"
                        onClick={() => setEditingSecret(true)}
                        className="text-xs font-medium text-green-700 hover:text-green-800"
                      >
                        Paste {integration.provider} signing secret
                      </button>
                    )}
                </div>

                {editingSecret ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={secretInput}
                      onChange={(e) => setSecretInput(e.target.value)}
                      placeholder="Paste the signing secret from your provider's dashboard"
                      className="flex-1 min-w-0 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 font-mono"
                    />

                    <button
                      type="button"
                      disabled={savingSecret || !secretInput.trim()}
                      onClick={() =>
                        onSaveSecret &&
                        onSaveSecret(integration.id, secretInput.trim())
                      }
                      className="inline-flex items-center gap-2 px-3 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {savingSecret ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingSecret(false);
                        setSecretInput(integration.webhookSecret || "");
                      }}
                      className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <input
                        type={showSecret ? "text" : "password"}
                        readOnly
                        value={integration.webhookSecret || ""}
                        className="w-full px-3 py-2.5 pr-11 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 font-mono"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowSecret((current) => !current)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                      >
                        {showSecret ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onCopy(
                          integration.webhookSecret || "",
                          "webhookSecret"
                        )
                      }
                      className="inline-flex items-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      {copiedField === "webhookSecret" ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                )}

                {integration.provider &&
                  integration.provider !== "GENERIC" && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      For {integration.provider}, this must be the signing
                      secret from your {integration.provider} dashboard's
                      webhook settings - not the value shown above by
                      default, which only works for testing.
                    </p>
                  )}
              </div>
            </div>

            {/* Security note */}
            <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

              <p className="text-sm text-blue-800">
                Keep your webhook secret secure. For a Generic
                integration, sign requests with HMAC-SHA256 of
                the raw request body using this secret, and send
                the hex digest in the{" "}
                <code className="font-mono text-xs">
                  x-webhook-signature
                </code>{" "}
                header. Unsigned requests are still accepted for
                testing, but are logged as unverified. Stripe and
                Razorpay integrations sign requests automatically
                using their own headers - just paste their signing
                secret above.
              </p>
            </div>
          </div>

          {/* Automation Settings */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-green-600" />

              <h3 className="text-base font-semibold text-gray-900">
                Automation Settings
              </h3>
            </div>

            <div className="space-y-2">
              {/* Auto-create customer */}
              <button
                type="button"
                onClick={() =>
                  handleToggleLocalSetting("autoCreateCustomer")
                }
                className="w-full flex items-start justify-between gap-3 p-3.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <UserPlus className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Automatically create customer
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      When a payment/order event arrives for a phone
                      number that isn't already in your CRM, create a
                      new customer. Turn this off if you'd rather
                      review and add customers yourself.
                    </p>
                  </div>
                </div>

                <span
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                    localSettings.autoCreateCustomer
                      ? "bg-green-600"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      localSettings.autoCreateCustomer
                        ? "translate-x-[18px]"
                        : "translate-x-1"
                    }`}
                  />
                </span>
              </button>

              {/* Auto-create purchase */}
              <button
                type="button"
                onClick={() =>
                  handleToggleLocalSetting("autoCreatePurchase")
                }
                className="w-full flex items-start justify-between gap-3 p-3.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <ReceiptText className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Record purchase
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Log the order amount against the customer's
                      purchase history.
                    </p>
                  </div>
                </div>

                <span
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
                    localSettings.autoCreatePurchase
                      ? "bg-green-600"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      localSettings.autoCreatePurchase
                        ? "translate-x-[18px]"
                        : "translate-x-1"
                    }`}
                  />
                </span>
              </button>

              {/* Allowed event types */}
              <div className="p-3.5 border border-gray-200 rounded-lg">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Only process these event types
                  <span className="text-gray-400 font-normal">
                    {" "}
                    (optional)
                  </span>
                </label>

                <p className="text-xs text-gray-500 mb-2">
                  Comma-separated, e.g.{" "}
                  <code className="font-mono">
                    payment.success, order.completed
                  </code>
                  . Leave empty to process every event type this
                  integration sends.
                </p>

                <input
                  type="text"
                  value={allowedEventTypesInput}
                  onChange={(e) =>
                    setAllowedEventTypesInput(e.target.value)
                  }
                  placeholder="e.g. payment.success"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                This never sends a WhatsApp message automatically —
                it only controls whether a customer/purchase record
                is created.
              </p>

              <button
                type="button"
                disabled={!hasUnsavedChanges || savingSettings}
                onClick={handleSaveSettings}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex-shrink-0"
              >
                {savingSettings ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save settings
              </button>
            </div>
          </div>

          {/* Events */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Webhook Events
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Events received from this integration
                </p>
              </div>

              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                {events.length} events
              </span>
            </div>

            {eventsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-xl py-12 text-center">
                <Webhook className="w-8 h-8 text-gray-300 mx-auto mb-3" />

                <p className="text-sm font-medium text-gray-700">
                  No webhook events yet
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Events received from your external system will
                  appear here.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Event ID
                        </th>

                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Event Type
                        </th>

                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Status
                        </th>

                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Received
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {events.map((event) => {
                        const status = getEventStatus(
                          event.status
                        );

                        const StatusIcon = status.icon;

                        return (
                          <tr
                            key={event.id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-xs text-gray-700">
                                {event.eventId}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-700">
                                {event.eventType}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
                              >
                                <StatusIcon className="w-3.5 h-3.5" />
                                {status.label}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-sm text-gray-500">
                                {formatDate(event.createdAt)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Integration details */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">
                Integration Type
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {integration.type}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">
                Last Event
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatDate(integration.lastEventAt)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500">
                Created
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatDate(integration.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationDetailsModal;