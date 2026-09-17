import React from "react";
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

    default:
      return {
        label: status || "Received",
        className: "bg-gray-100 text-gray-700",
        icon: Clock,
      };
  }
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
}) => {
  if (!integration) return null;

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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook Secret
                </label>

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
              </div>
            </div>

            {/* Security note */}
            <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

              <p className="text-sm text-blue-800">
                Keep your webhook secret secure. Your external
                system should send it using the{" "}
                <code className="font-mono text-xs">
                  x-webhook-secret
                </code>{" "}
                header when sending events to this URL.
              </p>
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