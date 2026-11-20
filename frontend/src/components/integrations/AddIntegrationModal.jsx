import { useEffect, useState } from "react";
import {
  X,
  Loader2,
  Plug,
  Globe,
  ShoppingBag,
  ShoppingCart,
  CreditCard,
  Webhook,
  Check,
  Info,
  ChevronDown,
} from "lucide-react";
import { getSupportedProviders } from "../../api/integrationApi";

// Fallback list shown if the /providers call fails (e.g. while
// offline) - kept in sync manually with
// backend/src/integrations/adapters/index.js as a safety net.
// The live list from the API always wins when it loads.
const FALLBACK_PROVIDERS = [
  "WEBSITE",
  "SHOPIFY",
  "WOOCOMMERCE",
  "STRIPE",
  "RAZORPAY",
  "SQUARE",
  "GENERIC",
];

// ------------------------------------------------------
// What each provider looks like in the picker, which
// "Integration Type" it normally uses, and what the person
// has to do after creating it.
// Any provider the backend adds later that is NOT listed
// here still shows up (as a plain card), so nothing breaks.
// ------------------------------------------------------
const PROVIDER_META = {
  WEBSITE: {
    label: "Website",
    tagline: "Get leads from your website's contact forms",
    icon: Globe,
    type: "CUSTOM",
    namePlaceholder: "e.g. Company website",
    steps: [
      "After creating, you get one line of code.",
      "Paste it on your website, just before the closing </body> tag.",
      "Every contact form on your site then sends its leads to this CRM.",
    ],
  },
  SHOPIFY: {
    label: "Shopify",
    tagline: "Record paid orders from your Shopify store",
    icon: ShoppingBag,
    type: "ECOMMERCE",
    namePlaceholder: "e.g. Shopify store",
    steps: [
      "After creating, copy the webhook URL into Shopify: Settings, Notifications, Webhooks (event: Order payment).",
      "Shopify then shows a signing secret. Save that secret in this integration, replacing the generated one.",
    ],
  },
  WOOCOMMERCE: {
    label: "WooCommerce",
    tagline: "Record paid orders from your WordPress store",
    icon: ShoppingCart,
    type: "ECOMMERCE",
    namePlaceholder: "e.g. WordPress store",
    steps: [
      "After creating, copy the webhook URL into WooCommerce: Settings, Advanced, Webhooks.",
      "Copy the secret shown in this integration into WooCommerce's Secret field.",
    ],
  },
  STRIPE: {
    label: "Stripe",
    tagline: "Record successful Stripe payments",
    icon: CreditCard,
    type: "PAYMENT",
    namePlaceholder: "e.g. Stripe payments",
    steps: [
      "After creating, copy the webhook URL into your Stripe dashboard's webhook settings.",
      "Stripe shows a signing secret. Save it in this integration, replacing the generated one, or its calls will be rejected.",
    ],
  },
  RAZORPAY: {
    label: "Razorpay",
    tagline: "Record successful Razorpay payments",
    icon: CreditCard,
    type: "PAYMENT",
    namePlaceholder: "e.g. Razorpay payments",
    steps: [
      "After creating, copy the webhook URL into your Razorpay dashboard's webhook settings.",
      "Use the webhook secret you set there as this integration's secret, replacing the generated one, or its calls will be rejected.",
    ],
  },
  SQUARE: {
    label: "Square",
    tagline: "Record Square payments",
    icon: CreditCard,
    type: "PAYMENT",
    namePlaceholder: "e.g. Square payments",
    steps: [
      "After creating, copy the webhook URL into your Square developer dashboard's webhook subscription.",
      "Save Square's signature key in this integration, replacing the generated secret, or its calls will be rejected.",
    ],
  },
  GENERIC: {
    label: "Custom",
    tagline: "Send events from your own system",
    icon: Webhook,
    type: "CUSTOM",
    namePlaceholder: "e.g. My billing system",
    steps: [
      "After creating, you get a webhook URL and a secret.",
      "Your system sends events to that URL in your CRM's format, signed with the secret.",
    ],
  },
};

// Order in the picker. Unknown providers go after these.
const PROVIDER_ORDER = [
  "WEBSITE",
  "SHOPIFY",
  "WOOCOMMERCE",
  "STRIPE",
  "RAZORPAY",
  "SQUARE",
  "GENERIC",
];

const integrationTypes = [
  {
    value: "BILLING",
    label: "Billing",
    description: "Connect your billing software",
  },
  {
    value: "ECOMMERCE",
    label: "E-commerce",
    description: "Connect your online store",
  },
  {
    value: "POS",
    label: "POS",
    description: "Connect your point-of-sale system",
  },
  {
    value: "ERP",
    label: "ERP",
    description: "Connect your ERP software",
  },
  {
    value: "PAYMENT",
    label: "Payment",
    description: "Connect your payment system",
  },
  {
    value: "CUSTOM",
    label: "Custom",
    description: "Connect another system",
  },
];

const metaFor = (key) =>
  PROVIDER_META[key] || {
    label: key,
    tagline: "Connect this provider",
    icon: Plug,
    type: null,
    namePlaceholder: "e.g. My integration",
    steps: [
      "After creating, you get a webhook URL and a secret to use in that system.",
    ],
  };

const AddIntegrationModal = ({
  show,
  form,
  setForm,
  submitting,
  onClose,
  onSubmit,
}) => {
  const [providers, setProviders] = useState(FALLBACK_PROVIDERS);

  // Load the real list of supported providers from the backend
  // as soon as the modal is used, so this picker can never
  // drift out of sync with the adapters that actually exist.
  useEffect(() => {
    if (!show) return;

    let cancelled = false;

    getSupportedProviders()
      .then((res) => {
        if (!cancelled && res?.providers?.length) {
          setProviders(res.providers);
        }
      })
      .catch(() => {
        // Keep FALLBACK_PROVIDERS - no need to block the form.
      });

    return () => {
      cancelled = true;
    };
  }, [show]);

  if (!show) return null;

  const selectedProvider = form.provider || "GENERIC";
  const selectedMeta = metaFor(selectedProvider);

  // Known providers first (in our order), then any new ones.
  const orderedProviders = [
    ...PROVIDER_ORDER.filter((key) => providers.includes(key)),
    ...providers.filter((key) => !PROVIDER_ORDER.includes(key)),
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // Picking a provider also sets the matching Integration Type
  // (Shopify -> E-commerce, Stripe -> Payment ...). It can still
  // be changed in the Type dropdown afterwards.
  const handleSelectProvider = (providerKey) => {
    if (submitting) return;

    const suggestedType = metaFor(providerKey).type;

    setForm((current) => ({
      ...current,
      provider: providerKey,
      type: suggestedType || current.type,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-integration-title"
        className="relative flex max-h-[94vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="mx-6 flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 pb-4 pt-6 sm:mx-8">
          <div>
            <h2
              id="add-integration-title"
              className="text-xl font-bold text-slate-900"
            >
              Add Integration
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Connect a website, store or payment system to your CRM
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-8">
            {/* Provider picker */}
            <div>
              <p className="mb-4 text-lg text-slate-900">
                What do you want to connect ?
              </p>

              <div
                role="radiogroup"
                aria-label="Provider"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                {orderedProviders.map((providerKey) => {
                  const meta = metaFor(providerKey);
                  const Icon = meta.icon;
                  const isSelected = selectedProvider === providerKey;

                  return (
                    <button
                      key={providerKey}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={submitting}
                      onClick={() => handleSelectProvider(providerKey)}
                      className={`relative flex items-center gap-4 rounded-2xl border p-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#25D366] disabled:opacity-60 ${
                        isSelected
                          ? "border-[#22C55E] bg-[#E3FCEA]"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                          isSelected
                            ? "bg-[#22C55E] text-white"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 pr-6">
                        <p className="text-lg font-semibold leading-tight text-slate-900">
                          {meta.label}
                        </p>
                        <p className="mt-1 text-sm leading-snug text-slate-500">
                          {meta.tagline}
                        </p>
                      </div>

                      {isSelected && (
                        <span className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-[#22C55E] text-[#22C55E]">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name + type */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="integration-name"
                  className="mb-2 block text-base font-medium text-slate-900"
                >
                  Integration Name
                </label>

                <input
                  id="integration-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={selectedMeta.namePlaceholder}
                  disabled={submitting}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 disabled:bg-slate-100"
                />

                <p className="mt-2 text-sm text-slate-500">
                  A name only you see, to tell integrations apart.
                </p>
              </div>

              <div>
                <label
                  htmlFor="integration-type"
                  className="mb-2 block text-base font-medium text-slate-900"
                >
                  Integration Type
                </label>

                <div className="relative">
                  <select
                    id="integration-type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    disabled={submitting}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 disabled:bg-slate-100"
                  >
                    {integrationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-700" />
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Pick the kind of system you are connecting.
                </p>
              </div>
            </div>

            {/* What happens next */}
            <div className="rounded-2xl border border-[#22C55E] bg-[#EEFCF2] p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <Info className="h-5 w-5 text-green-700" />
                <p className="text-base font-semibold text-green-700">
                  What happens next ({selectedMeta.label})
                </p>
              </div>

              <ol className="list-decimal space-y-2 pl-6 text-sm text-slate-800 marker:text-slate-800">
                {selectedMeta.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-3 px-6 pb-6 pt-2 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-8 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#16a34a] disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Integration"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIntegrationModal;
