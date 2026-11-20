import {
  Building2,
  Calendar,
  Clock,
  CreditCard,
  Diamond,
  Globe,
  Plug,
  ShoppingBag,
  ShoppingCart,
  Webhook,
} from "lucide-react";

import IntegrationActionsMenu from "./IntegrationActionsMenu";
import { TYPE_LABELS, formatDate } from "./integrationUtils";

const PROVIDER_ICONS = {
  WEBSITE: Building2,
  SHOPIFY: ShoppingBag,
  WOOCOMMERCE: ShoppingCart,
  STRIPE: CreditCard,
  RAZORPAY: CreditCard,
  SQUARE: CreditCard,
  GENERIC: Webhook,
};

const TYPE_ICONS = {
  BILLING: CreditCard,
  ECOMMERCE: ShoppingCart,
  POS: Globe,
  ERP: Building2,
  PAYMENT: CreditCard,
  CUSTOM: Plug,
};

export function StatusSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-[#25D366]" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="mt-1 h-4 w-4 shrink-0 text-blue-600" />

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-sm text-slate-800">{value}</p>
      </div>
    </div>
  );
}

const IntegrationCard = ({
  integration,
  onView,
  onToggleStatus,
  onDelete,
}) => {
  const isActive = integration.status === "ACTIVE";

  const Icon =
    PROVIDER_ICONS[integration.provider] ||
    TYPE_ICONS[integration.type] ||
    Plug;

  const typeLabel = TYPE_LABELS[integration.type] || integration.type;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onView(integration.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target === e.currentTarget) {
          onView(integration.id);
        }
      }}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#25D366]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900">
              {integration.name}
            </h3>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {integration.provider || typeLabel}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <StatusSwitch
            checked={isActive}
            onChange={() => onToggleStatus(integration)}
            label={isActive ? "Deactivate integration" : "Activate integration"}
          />

          <IntegrationActionsMenu
            integration={integration}
            onView={onView}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Details */}
      <div className="mx-4 divide-y divide-slate-200 border-t border-slate-200">
        <InfoRow icon={Diamond} label="Type" value={typeLabel} />

        <InfoRow
          icon={Calendar}
          label="Last event"
          value={
            integration.lastEventAt ? (
              formatDate(integration.lastEventAt)
            ) : (
              <span className="text-slate-500">No events yet</span>
            )
          }
        />

        <InfoRow
          icon={Clock}
          label="Created"
          value={formatDate(integration.createdAt)}
        />
      </div>

      <div className="h-2" />
    </div>
  );
};

export default IntegrationCard;
