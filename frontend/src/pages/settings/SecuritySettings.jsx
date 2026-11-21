// import { useEffect, useState } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
// import { Lock, MessageCircle } from "lucide-react";

// import ConnectWhatsApp from "../../components/whatsapp/ConnectWhatsApp";
// import FacebookMessengerCard from "../../components/facebook/FacebookMessengerCard";
// import InstagramCard from "../../components/instagram/InstagramCard";
// import { useAuthStore } from "../../store/authStore";
// import usePlanFeatures from "../../hooks/usePlanFeatures";
// import ChangePasswordModal from "../../components/common/ChangePasswordModal";
// import ConfirmModal from "../../components/common/ConfirmModal";

// // Text under the page title. Change it here if you want different wording.
// const PAGE_SUBTITLE =
//   "Connect your CRM with billing, e-commerce, POS, ERP and other systems.";

// function SecuritySettings() {
//   const { user } = useAuthStore();
//   const { can } = usePlanFeatures();
//   const isAdmin = user?.role === "ADMIN";

//   const [showChangePassword, setShowChangePassword] = useState(false);
//   const [loadingStatus, setLoadingStatus] = useState(true);
//   const [connectedAccount, setConnectedAccount] = useState(null);
//   const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
//   const [disconnecting, setDisconnecting] = useState(false);

//   const fetchWhatsAppStatus = async () => {
//     try {
//       setLoadingStatus(true);
//       const token = localStorage.getItem("token");

//       const response = await axios.get(
//         `${import.meta.env.VITE_API_URL}/api/whatsapp/accounts`,
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       const accounts = response.data?.accounts || [];
//       const connected = accounts.find((acc) => acc.status === "CONNECTED");

//       setConnectedAccount(connected || null);
//     } catch (error) {
//       console.error("Failed to fetch WhatsApp account status:", error);
//       setConnectedAccount(null);
//     } finally {
//       setLoadingStatus(false);
//     }
//   };

//   useEffect(() => {
//     fetchWhatsAppStatus();
//   }, []);

//   const isConnected = !!connectedAccount;

//   const handleDisconnect = async () => {
//     if (!connectedAccount?.id) return;

//     try {
//       setDisconnecting(true);
//       const token = localStorage.getItem("token");

//       await axios.put(
//         `${import.meta.env.VITE_API_URL}/api/whatsapp/accounts/${connectedAccount.id}/disconnect`,
//         {},
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       setShowDisconnectConfirm(false);
//       await fetchWhatsAppStatus();
//     } catch (error) {
//       console.error(
//         "Failed to disconnect WhatsApp:",
//         error.response?.data || error.message
//       );
//       toast.error(
//         error.response?.data?.message ||
//           "Failed to disconnect WhatsApp. Please try again."
//       );
//     } finally {
//       setDisconnecting(false);
//     }
//   };

//   return (
//     <div className="space-y-8">
//       {/* PAGE HEADER */}
//       <div>
//         <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
//           Security
//         </h1>
//         <p className="mt-1 text-sm text-slate-500">{PAGE_SUBTITLE}</p>
//       </div>

//       {/* PASSWORD */}
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div className="flex items-center gap-4">
//           <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-100">
//             <Lock size={24} className="text-green-600" />
//           </div>

//           <div>
//             <h2 className="font-semibold text-slate-900">Password</h2>
//             <p className="mt-0.5 text-sm text-slate-500">
//               Update it regularly to keep your account secure.
//             </p>
//           </div>
//         </div>

//         <button
//           type="button"
//           onClick={() => setShowChangePassword(true)}
//           className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-green-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 sm:w-auto"
//         >
//           Change password
//         </button>
//       </div>

//       {/* CONNECTED CHANNELS */}
//       <div>
//         <h2 className="text-xl font-bold text-slate-900">Connected channels</h2>
//         <p className="mt-1 text-sm text-slate-500">
//           Messages from these channels arrive in Conversations.
//         </p>
//       </div>

//       {/* The three channel cards sit side by side. Facebook / Instagram also
//           add their "Connected pages / accounts" rows as full-width items that
//           are ordered underneath the cards. */}
//       <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
//         {/* WhatsApp Business */}
//         <div
//           data-tour="whatsapp-card"
//           className="order-1 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
//         >
//           <div className="flex items-start gap-3">
//             <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#DCF8C6]">
//               <MessageCircle size={22} className="text-[#25D366]" />
//             </div>

//             <div className="min-w-0">
//               <h2 className="font-semibold text-slate-900">WhatsApp Business</h2>

//               <div
//                 className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
//                   !loadingStatus && isConnected
//                     ? "bg-green-100 text-green-700"
//                     : "bg-slate-100 text-slate-600"
//                 }`}
//               >
//                 <span
//                   className={`h-1.5 w-1.5 rounded-full ${
//                     loadingStatus
//                       ? "bg-slate-300"
//                       : isConnected
//                       ? "bg-[#25D366]"
//                       : "bg-slate-400"
//                   }`}
//                 />
//                 {loadingStatus
//                   ? "Checking..."
//                   : isConnected
//                   ? `Connected${
//                       connectedAccount?.displayPhoneNumber
//                         ? ` (${connectedAccount.displayPhoneNumber})`
//                         : ""
//                     }`
//                   : "Not Connected"}
//               </div>
//             </div>
//           </div>

//           <p className="mt-4 text-sm leading-relaxed text-slate-500">
//             {isAdmin
//               ? "Connect your WhatsApp Business Account to send and receive WhatsApp messages through the CRM."
//               : "The WhatsApp Business Account connected to this CRM. Only an admin can connect or change it."}
//           </p>

//           {/* Employee view-only extras */}
//           {!isAdmin &&
//             !loadingStatus &&
//             isConnected &&
//             connectedAccount?.whatsappBusinessName && (
//               <p className="mt-3 text-sm text-slate-500">
//                 Business name:{" "}
//                 <span className="font-medium text-slate-700">
//                   {connectedAccount.whatsappBusinessName}
//                 </span>
//               </p>
//             )}

//           {!isAdmin && !loadingStatus && !isConnected && (
//             <p className="mt-3 text-sm text-slate-500">
//               No WhatsApp account is connected yet. Please ask your admin to
//               connect one.
//             </p>
//           )}

//           {/* Connect / disconnect buttons are visible to ADMIN only */}
//           {isAdmin && (
//             <div className="mt-auto flex flex-col gap-3 pt-5 [&_button]:inline-flex [&_button]:min-h-11 [&_button]:w-full [&_button]:justify-center [&_button]:px-4 [&_button]:py-2.5 [&_button]:text-center [&_button]:text-sm [&_div]:flex-col!">
//               <ConnectWhatsApp
//                 onConnected={fetchWhatsAppStatus}
//                 hideButtons={isConnected}
//               />

//               {isConnected && (
//                 <button
//                   type="button"
//                   onClick={() => setShowDisconnectConfirm(true)}
//                   disabled={disconnecting}
//                   className="items-center rounded-xl border border-red-500 bg-white font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   {disconnecting ? "Disconnecting..." : "Disconnect WhatsApp"}
//                 </button>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Facebook Messenger (card + connected Pages) */}
//         <FacebookMessengerCard isAdmin={isAdmin} />

//         {/* Instagram (card + connected accounts) - connected separately from Facebook.
//             Hidden when Instagram is switched off in the company's plan (Super Admin) */}
//         {can("instagram") && <InstagramCard isAdmin={isAdmin} />}
//       </div>

//       <ChangePasswordModal
//         isOpen={showChangePassword}
//         onClose={() => setShowChangePassword(false)}
//       />

//       <ConfirmModal
//         isOpen={showDisconnectConfirm}
//         title="Disconnect WhatsApp?"
//         message={
//           connectedAccount?.isCoexistence
//             ? "You won't be able to send or receive WhatsApp messages in the CRM until you reconnect. Existing chats are kept. Note: for a WhatsApp Business App (Coexistence) number, chat history may not sync again after reconnecting."
//             : "You won't be able to send or receive WhatsApp messages in the CRM until you reconnect. Existing chats are kept."
//         }
//         confirmText={disconnecting ? "Disconnecting..." : "Disconnect"}
//         cancelText="Cancel"
//         variant="danger"
//         onConfirm={handleDisconnect}
//         onCancel={() => setShowDisconnectConfirm(false)}
//       />
//     </div>
//   );
// }

// export default SecuritySettings;



import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Lock, MessageCircle } from "lucide-react";

import ConnectWhatsApp from "../../components/whatsapp/ConnectWhatsApp";
import FacebookMessengerCard from "../../components/facebook/FacebookMessengerCard";
import InstagramCard from "../../components/instagram/InstagramCard";
import { useAuthStore } from "../../store/authStore";
import usePlanFeatures from "../../hooks/usePlanFeatures";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import ConfirmModal from "../../components/common/ConfirmModal";

// Text under the page title. Change it here if you want different wording.
function SecuritySettings() {
  const { user } = useAuthStore();
  const { can } = usePlanFeatures();
  const isAdmin = user?.role === "ADMIN";

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchWhatsAppStatus = async () => {
    try {
      setLoadingStatus(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/whatsapp/accounts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const accounts = response.data?.accounts || [];
      const connected = accounts.find((acc) => acc.status === "CONNECTED");

      setConnectedAccount(connected || null);
    } catch (error) {
      console.error("Failed to fetch WhatsApp account status:", error);
      setConnectedAccount(null);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchWhatsAppStatus();
  }, []);

  const isConnected = !!connectedAccount;

  const handleDisconnect = async () => {
    if (!connectedAccount?.id) return;

    try {
      setDisconnecting(true);
      const token = localStorage.getItem("token");

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/whatsapp/accounts/${connectedAccount.id}/disconnect`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowDisconnectConfirm(false);
      await fetchWhatsAppStatus();
    } catch (error) {
      console.error(
        "Failed to disconnect WhatsApp:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message ||
          "Failed to disconnect WhatsApp. Please try again."
      );
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PASSWORD */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
            <Lock size={18} className="text-green-600" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">Password</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Update it regularly to keep your account secure.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowChangePassword(true)}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-green-700 px-5 text-[13px] font-semibold text-white transition hover:bg-green-800 sm:w-auto"
        >
          Change password
        </button>
      </div>

      {/* CONNECTED CHANNELS */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Connected channels</h2>
        <p className="mt-1 text-[13px] text-slate-500">
          Messages from these channels arrive in Conversations.
        </p>
      </div>

      {/* The three channel cards sit side by side. Facebook / Instagram also
          add their "Connected pages / accounts" rows as full-width items that
          are ordered underneath the cards. */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        {/* WhatsApp Business */}
        <div
          data-tour="whatsapp-card"
          className="order-1 flex flex-col rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#DCF8C6]">
              <MessageCircle size={20} className="text-[#25D366]" />
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">WhatsApp Business</h2>

              <div
                className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                  !loadingStatus && isConnected
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    loadingStatus
                      ? "bg-slate-300"
                      : isConnected
                      ? "bg-[#25D366]"
                      : "bg-slate-400"
                  }`}
                />
                {loadingStatus
                  ? "Checking..."
                  : isConnected
                  ? `Connected${
                      connectedAccount?.displayPhoneNumber
                        ? ` (${connectedAccount.displayPhoneNumber})`
                        : ""
                    }`
                  : "Not Connected"}
              </div>
            </div>
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-slate-500">
            {isAdmin
              ? "Connect your WhatsApp Business Account to send and receive WhatsApp messages through the CRM."
              : "The WhatsApp Business Account connected to this CRM. Only an admin can connect or change it."}
          </p>

          {/* Employee view-only extras */}
          {!isAdmin &&
            !loadingStatus &&
            isConnected &&
            connectedAccount?.whatsappBusinessName && (
              <p className="mt-3 text-sm text-slate-500">
                Business name:{" "}
                <span className="font-medium text-slate-700">
                  {connectedAccount.whatsappBusinessName}
                </span>
              </p>
            )}

          {!isAdmin && !loadingStatus && !isConnected && (
            <p className="mt-3 text-sm text-slate-500">
              No WhatsApp account is connected yet. Please ask your admin to
              connect one.
            </p>
          )}

          {/* Connect / disconnect buttons are visible to ADMIN only */}
          {isAdmin && (
            <div className="mt-auto flex flex-col gap-3 pt-5 [&_button]:inline-flex [&_button]:min-h-10 [&_button]:w-full [&_button]:justify-center [&_button]:px-4 [&_button]:py-2 [&_button]:text-center [&_button]:text-[13px] [&_div]:flex-col!">
              <ConnectWhatsApp
                onConnected={fetchWhatsAppStatus}
                hideButtons={isConnected}
              />

              {isConnected && (
                <button
                  type="button"
                  onClick={() => setShowDisconnectConfirm(true)}
                  disabled={disconnecting}
                  className="items-center rounded-lg border border-red-500 bg-white font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect WhatsApp"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Facebook Messenger (card + connected Pages) */}
        <FacebookMessengerCard isAdmin={isAdmin} />

        {/* Instagram (card + connected accounts) - connected separately from Facebook.
            Hidden when Instagram is switched off in the company's plan (Super Admin) */}
        {can("instagram") && <InstagramCard isAdmin={isAdmin} />}
      </div>

      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <ConfirmModal
        isOpen={showDisconnectConfirm}
        title="Disconnect WhatsApp?"
        message={
          connectedAccount?.isCoexistence
            ? "You won't be able to send or receive WhatsApp messages in the CRM until you reconnect. Existing chats are kept. Note: for a WhatsApp Business App (Coexistence) number, chat history may not sync again after reconnecting."
            : "You won't be able to send or receive WhatsApp messages in the CRM until you reconnect. Existing chats are kept."
        }
        confirmText={disconnecting ? "Disconnecting..." : "Disconnect"}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnectConfirm(false)}
      />
    </div>
  );
}

export default SecuritySettings;