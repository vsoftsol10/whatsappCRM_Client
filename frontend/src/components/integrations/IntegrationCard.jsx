import React from "react";
import {
  Eye,
  Trash2,
  Power,
  CreditCard,
  ShoppingCart,
  Store,
  Building2,
  Wallet,
  Plug,
  Clock,
} from "lucide-react";

const typeConfig = {
  BILLING: {
    label: "Billing",
    icon: CreditCard,
  },
  ECOMMERCE: {
    label: "E-commerce",
    icon: ShoppingCart,
  },
  POS: {
    label: "POS",
    icon: Store,
  },
  ERP: {
    label: "ERP",
    icon: Building2,
  },
  PAYMENT: {
    label: "Payment",
    icon: Wallet,
  },
  CUSTOM: {
    label: "Custom",
    icon: Plug,
  },
};

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

const IntegrationCard = ({
  integration,
  onView,
  onToggleStatus,
  onDelete,
}) => {
  const config =
    typeConfig[integration.type] || typeConfig.CUSTOM;

  const TypeIcon = config.icon;

  const isActive = integration.status === "ACTIVE";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
            <TypeIcon className="w-5 h-5 text-green-600" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {integration.name}
            </h3>

            <p className="text-sm text-gray-500">
              {integration.provider || config.label}
            </p>
          </div>
        </div>

        {/* Status */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
            isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isActive ? "bg-green-500" : "bg-gray-400"
            }`}
          />

          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Integration information */}
      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Type</span>

          <span className="font-medium text-gray-700">
            {config.label}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Last Event
          </span>

          <span className="font-medium text-gray-700">
            {formatDate(integration.lastEventAt)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onView(integration.id)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Details
        </button>

        <div className="flex items-center gap-2">
          {/* Toggle status */}
          <button
            type="button"
            onClick={() => onToggleStatus(integration)}
            title={isActive ? "Deactivate" : "Activate"}
            className={`p-2 rounded-lg transition-colors ${
              isActive
                ? "text-green-600 bg-green-50 hover:bg-green-100"
                : "text-gray-500 bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <Power className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(integration)}
            title="Delete integration"
            className="p-2 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationCard;