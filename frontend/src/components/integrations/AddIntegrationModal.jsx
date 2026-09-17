import React from "react";
import { X, Loader2, Plug } from "lucide-react";

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

const AddIntegrationModal = ({
  show,
  form,
  setForm,
  submitting,
  onClose,
  onSubmit,
}) => {
  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
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
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Plug className="w-5 h-5 text-green-600" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Add Integration
              </h2>

              <p className="text-sm text-gray-500">
                Connect an external system to your CRM
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit}>
          <div className="px-6 py-6 space-y-5">
            {/* Integration Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Integration Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. My Billing System"
                disabled={submitting}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              />
            </div>

            {/* Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider
                <span className="text-gray-400 font-normal">
                  {" "}
                  (Optional)
                </span>
              </label>

              <input
                type="text"
                name="provider"
                value={form.provider}
                onChange={handleChange}
                placeholder="e.g. Zoho, Shopify, Razorpay"
                disabled={submitting}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              />
            </div>

            {/* Integration Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Integration Type
              </label>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                disabled={submitting}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              >
                {integrationTypes.map((type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Info */}
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <p className="text-sm text-green-800">
                After creating the integration, you'll receive a
                unique webhook URL and secret. Your billing,
                e-commerce, POS, or other system can use these to
                send customer and purchase events to your CRM.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
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