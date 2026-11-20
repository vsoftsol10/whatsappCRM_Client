import { FaArrowLeft, FaPhoneAlt, FaEnvelope, FaTimes } from "react-icons/fa";
import SocialAvatar from "./SocialAvatar";
import {
  getContactName,
  getAccountLabel,
  getAccountColor,
} from "./socialTheme";

function SocialContactInfo({
  theme,
  conversation,
  showInfo,
  setShowInfo,
  accounts = [],
}) {
  const Icon = theme.Icon;

  // Nothing to show until a chat is selected and its profile is opened
  if (!conversation || !showInfo) return null;

  const accountLabel = getAccountLabel(conversation, theme.variant);
  const accountColor = getAccountColor(conversation.facebookPage?.id, accounts);

  const content = (
    <div className="flex flex-col items-center px-5 py-8">
      <SocialAvatar conversation={conversation} theme={theme} size={96} />

      <h2 className="mt-4 max-w-full break-words text-center text-xl font-semibold text-[#050505]">
        {getContactName(conversation)}
      </h2>

      <p className="mt-1 flex items-center gap-1.5 text-sm text-[#65676B]">
        <Icon className={theme.accentText} size={13} />
        {theme.label}
      </p>

      <div className="mt-6 w-full space-y-4 border-t border-gray-200 pt-5 text-sm">
        {accountLabel && (
          <div>
            <p className="text-[#65676B]">Received on</p>
            <p
              className={`mt-1 inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${accountColor.chip}`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${accountColor.dot}`} />
              <span className="truncate">{accountLabel}</span>
            </p>
          </div>
        )}

        <div>
          <p className="text-[#65676B]">Status</p>
          <p className="font-semibold text-[#050505]">
            {conversation.status === "CLOSED" ? "Closed" : "Open"}
          </p>
        </div>

        <div>
          <p className="text-[#65676B]">Chat started</p>
          <p className="font-medium text-[#050505]">
            {new Date(conversation.createdAt).toLocaleString()}
          </p>
        </div>

        {conversation.customer && (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            <p className="font-semibold text-[#050505]">Linked customer</p>

            {conversation.customer.phone && (
              <p className="flex items-center gap-2 text-[#050505]">
                <FaPhoneAlt className={theme.accentText} size={12} />
                {conversation.customer.phone}
              </p>
            )}
            {conversation.customer.email && (
              <p className="flex items-center gap-2 break-all text-[#050505]">
                <FaEnvelope className={theme.accentText} size={12} />
                {conversation.customer.email}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop panel: close with the X at the top right */}
      <div className="relative hidden h-full w-full overflow-y-auto bg-white xl:block">
        <button
          type="button"
          onClick={() => setShowInfo(false)}
          aria-label="Close profile information"
          title="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F2F5] text-[#65676B] transition hover:bg-[#E4E6EB]"
        >
          <FaTimes size={16} />
        </button>
        {content}
      </div>

      {showInfo && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white xl:hidden">
          <div className="flex h-14 items-center gap-4 border-b border-gray-200 px-4">
            <button
              onClick={() => setShowInfo(false)}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <FaArrowLeft size={18} />
            </button>
            <h2 className="text-lg font-semibold">Details</h2>
          </div>
          <div className="flex-1 overflow-y-auto">{content}</div>
        </div>
      )}
    </>
  );
}

export default SocialContactInfo;