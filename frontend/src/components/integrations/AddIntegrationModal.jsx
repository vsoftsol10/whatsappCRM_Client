// import React, { useEffect, useState } from "react";
// import { X, Loader2, Plug } from "lucide-react";
// import { getSupportedProviders } from "../../api/integrationApi";

// // Fallback list shown if the /providers call fails (e.g. while
// // offline) - kept in sync manually with
// // backend/src/integrations/adapters/index.js as a safety net.
// // The live list from the API always wins when it loads.
// const FALLBACK_PROVIDERS = ["GENERIC", "STRIPE", "RAZORPAY"];

// const PROVIDER_LABELS = {
//   GENERIC: "Generic / Custom (I'll send events in your CRM's format)",
//   STRIPE: "Stripe",
//   RAZORPAY: "Razorpay",
// };

// const integrationTypes = [
//   {
//     value: "BILLING",
//     label: "Billing",
//     description: "Connect your billing software",
//   },
//   {
//     value: "ECOMMERCE",
//     label: "E-commerce",
//     description: "Connect your online store",
//   },
//   {
//     value: "POS",
//     label: "POS",
//     description: "Connect your point-of-sale system",
//   },
//   {
//     value: "ERP",
//     label: "ERP",
//     description: "Connect your ERP software",
//   },
//   {
//     value: "PAYMENT",
//     label: "Payment",
//     description: "Connect your payment system",
//   },
//   {
//     value: "CUSTOM",
//     label: "Custom",
//     description: "Connect another system",
//   },
// ];

// const AddIntegrationModal = ({
//   show,
//   form,
//   setForm,
//   submitting,
//   onClose,
//   onSubmit,
// }) => {
//   const [providers, setProviders] = useState(FALLBACK_PROVIDERS);

//   // Load the real list of supported providers from the backend
//   // as soon as the modal is used, so this dropdown can never
//   // drift out of sync with the adapters that actually exist.
//   useEffect(() => {
//     if (!show) return;

//     let cancelled = false;

//     getSupportedProviders()
//       .then((res) => {
//         if (!cancelled && res?.providers?.length) {
//           setProviders(res.providers);
//         }
//       })
//       .catch(() => {
//         // Keep FALLBACK_PROVIDERS - no need to block the form.
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, [show]);

//   if (!show) return null;

//   const handleChange = (e) => {
//     const { name, value } = e.target;

//     setForm((current) => ({
//       ...current,
//       [name]: value,
//     }));
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       {/* Overlay */}
//       <div
//         className="absolute inset-0 bg-black/50"
//         onClick={onClose}
//       />

//       {/* Modal */}
//       <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
//               <Plug className="w-5 h-5 text-green-600" />
//             </div>

//             <div>
//               <h2 className="text-lg font-semibold text-gray-900">
//                 Add Integration
//               </h2>

//               <p className="text-sm text-gray-500">
//                 Connect an external system to your CRM
//               </p>
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={onClose}
//             className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         {/* Form */}
//         <form onSubmit={onSubmit}>
//           <div className="px-6 py-6 space-y-5">
//             {/* Integration Name */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Integration Name
//               </label>

//               <input
//                 type="text"
//                 name="name"
//                 value={form.name}
//                 onChange={handleChange}
//                 placeholder="e.g. My Billing System"
//                 disabled={submitting}
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
//               />
//             </div>

//             {/* Provider */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Provider
//               </label>

//               {/*
//                 CHANGED from a free-text input to a dropdown.
//                 The provider value picks which backend adapter
//                 handles this integration's webhooks (signature
//                 verification + payload normalization) - a typo
//                 or an unsupported name here used to silently
//                 fall back to the generic format and fail on the
//                 first real webhook. A dropdown makes that
//                 impossible.
//               */}
//               <select
//                 name="provider"
//                 value={form.provider || "GENERIC"}
//                 onChange={handleChange}
//                 disabled={submitting}
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
//               >
//                 {providers.map((providerKey) => (
//                   <option key={providerKey} value={providerKey}>
//                     {PROVIDER_LABELS[providerKey] || providerKey}
//                   </option>
//                 ))}
//               </select>

//               <p className="mt-1.5 text-xs text-gray-500">
//                 Don't see your billing system? Choose "Generic /
//                 Custom" and send events directly in your CRM's
//                 expected format, or ask your developer to add a
//                 dedicated adapter for it.
//               </p>
//             </div>

//             {/* Integration Type */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Integration Type
//               </label>

//               <select
//                 name="type"
//                 value={form.type}
//                 onChange={handleChange}
//                 disabled={submitting}
//                 className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
//               >
//                 {integrationTypes.map((type) => (
//                   <option
//                     key={type.value}
//                     value={type.value}
//                   >
//                     {type.label} - {type.description}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Info */}
//             <div className="bg-green-50 border border-green-100 rounded-lg p-4">
//               <p className="text-sm text-green-800">
//                 After creating the integration, you'll receive a
//                 unique webhook URL and secret. Your billing,
//                 e-commerce, POS, or other system can use these to
//                 send customer and purchase events to your CRM.
//               </p>

//               {form.provider &&
//                 form.provider !== "GENERIC" && (
//                   <p className="text-sm text-green-800 mt-2">
//                     For {PROVIDER_LABELS[form.provider] || form.provider},
//                     open that provider's dashboard after creating
//                     this integration and copy their real webhook
//                     signing secret over the generated one here -
//                     otherwise their webhook calls will be
//                     rejected as unverified.
//                   </p>
//                 )}
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
//             <button
//               type="button"
//               onClick={onClose}
//               disabled={submitting}
//               className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
//             >
//               Cancel
//             </button>

//             <button
//               type="submit"
//               disabled={submitting}
//               className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
//             >
//               {submitting ? (
//                 <>
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                   Creating...
//                 </>
//               ) : (
//                 <>
//                   <Plug className="w-4 h-4" />
//                   Create Integration
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AddIntegrationModal;



import React, { useEffect, useState } from "react";
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
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex w-full max-w-2xl max-h-[92vh] flex-col bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Plug className="w-5 h-5 text-green-600" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add Integration
              </h2>

              <p className="text-sm text-gray-500">
                Connect a website, store or payment system to your CRM
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Provider picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to connect?
              </label>

              <div
                role="radiogroup"
                aria-label="Provider"
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
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
                      className={`relative flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-60 ${
                        isSelected
                          ? "border-green-600 bg-green-50 ring-1 ring-green-600"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 pr-5">
                        <p className="text-sm font-semibold text-gray-900">
                          {meta.label}
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                          {meta.tagline}
                        </p>
                      </div>

                      {isSelected && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-green-600">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name + type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="integration-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  A name only you see, to tell integrations apart.
                </p>
              </div>

              <div>
                <label
                  htmlFor="integration-type"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Integration Type
                </label>

                <select
                  id="integration-type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                >
                  {integrationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500">
                  Filled in for you when you pick a provider.
                </p>
              </div>
            </div>

            {/* What happens next */}
            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-green-700" />
                <p className="text-sm font-semibold text-green-900">
                  What happens next ({selectedMeta.label})
                </p>
              </div>

              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-green-800">
                {selectedMeta.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-shrink-0 items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plug className="w-4 h-4" />
                  Create Integration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddIntegrationModal;
