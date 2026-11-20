
import { useEffect } from "react";
import { FaPhoneAlt, FaEnvelope, FaBuilding, FaTimes } from "react-icons/fa";
import {
  avatarColor,
  getConversationName,
  getInitial,
} from "../../utils/conversationDisplay";

const STATUS_STYLES = {
  ACTIVE: "text-[#16A34A]",
  INACTIVE: "text-gray-500",
};

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <Icon className="mt-1 shrink-0 text-[#0F766E]" aria-hidden="true" />

      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p
          className={`break-words font-medium ${
            value ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {value || "Not added"}
        </p>
      </div>
    </div>
  );
}

// The customer profile panel. Opens when you click the customer's name in
// the chat header. On wide screens it is a column on the right; on smaller
// screens it slides over the chat.
function CustomerDetails({ conversation, onClose }) {
  // Esc closes the panel
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!conversation) return null;

  const customer = conversation.customer;
  const name = getConversationName(conversation);
  const status = String(customer?.status || "ACTIVE").toUpperCase();

  return (
    <>
      {/* Dim background (only when the panel floats over the chat) */}
      <button
        type="button"
        aria-label="Close profile"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/30 2xl:hidden"
      />

      <aside
        aria-label="Customer profile"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[380px] flex-col overflow-y-auto bg-white shadow-2xl 2xl:static 2xl:z-auto 2xl:w-[340px] 2xl:max-w-none 2xl:shrink-0 2xl:border-l 2xl:border-gray-200 2xl:shadow-none"
      >
        {/* Close */}
        <div className="flex justify-end px-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center px-6 pb-6">
          <span
            className={`flex h-28 w-28 items-center justify-center rounded-full text-5xl font-bold text-white ${avatarColor(name)}`}
          >
            {getInitial(name)}
          </span>

          <h2 className="mt-4 max-w-full break-words text-center text-2xl font-semibold text-gray-900">
            {name}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {customer ? "Customer" : "Contact"}
          </p>
        </div>

        {/* Contact details */}
        <div className="mx-6 space-y-6 border-t border-gray-200 py-6">
          <InfoRow
            icon={FaPhoneAlt}
            label="Phone"
            value={customer?.phone || conversation.phone}
          />
          <InfoRow icon={FaEnvelope} label="Email" value={customer?.email} />
          <InfoRow icon={FaBuilding} label="Company" value={customer?.companyName} />
        </div>

        {/* Additional information (only for saved customers) */}
        {customer && (
          <div className="mx-6 border-t border-gray-200 py-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Additional Information
            </h3>

            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd
                  className={`font-semibold ${
                    STATUS_STYLES[status] || "text-gray-700"
                  }`}
                >
                  {status}
                </dd>
              </div>

              {customer.source && (
                <div>
                  <dt className="text-sm text-gray-500">Source</dt>
                  <dd className="font-medium text-gray-900">{customer.source}</dd>
                </div>
              )}

              {customer.requirements && (
                <div>
                  <dt className="text-sm text-gray-500">Requirements</dt>
                  <dd className="whitespace-pre-wrap break-words font-medium text-gray-900">
                    {customer.requirements}
                  </dd>
                </div>
              )}

              {customer.createdAt && (
                <div>
                  <dt className="text-sm text-gray-500">Customer since</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(customer.createdAt).toLocaleDateString([], {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </aside>
    </>
  );
}

export default CustomerDetails;