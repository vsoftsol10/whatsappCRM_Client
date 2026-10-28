
// import { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   Lock,
//   MessageCircle,
// } from "lucide-react";

// import ConnectWhatsApp from "../../components/whatsapp/ConnectWhatsApp";
// import FacebookMessengerCard from "../../components/facebook/FacebookMessengerCard";
// import { useAuthStore } from "../../store/authStore";
// import ChangePasswordModal from "../../components/common/ChangePasswordModal";
// import ConfirmModal from "../../components/common/ConfirmModal";

// function SecuritySettings() {
//   const { user } = useAuthStore();
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
//       alert(
//         error.response?.data?.message ||
//           "Failed to disconnect WhatsApp. Please try again."
//       );
//     } finally {
//       setDisconnecting(false);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Password Card */}
//       <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
//         <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//           <div className="flex items-center gap-4">
//             <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50">
//               <Lock size={26} className="text-green-600" />
//             </div>

//             <div>
//               <h2 className="text-lg font-bold text-slate-900">Password</h2>
//               <p className="mt-1 text-sm text-slate-500">
//                 Update it regularly to keep your account secure.
//               </p>
//             </div>
//           </div>

//           <button
//             type="button"
//             onClick={() => setShowChangePassword(true)}
//             className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 sm:w-auto sm:min-w-[180px]"
//           >
//             Change password
//           </button>
//         </div>
//       </div>

//       {/* Connected channels heading */}
//       <div className="pt-4">
//         <h2 className="text-xl font-bold text-slate-900">Connected channels</h2>
//         <p className="mt-1 text-sm text-slate-500">
//           Messages from these channels arrive in Conversations.
//         </p>
//       </div>

//       {/* WhatsApp Business Card */}
//       <div
//         data-tour="whatsapp-card"
//         className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
//       >
//         <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//           <div className="flex min-w-0 flex-1 items-start gap-4">
//             <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCF8C6]">
//               <MessageCircle size={26} className="text-[#25D366]" />
//             </div>

//             <div className="min-w-0">
//               <h2 className="text-lg font-bold text-slate-900">
//                 WhatsApp Business
//               </h2>

//               <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
//                 {isAdmin
//                   ? "Connect your WhatsApp Business Account to send and receive WhatsApp messages through the CRM."
//                   : "The WhatsApp Business Account connected to this CRM. Only an admin can connect or change it."}
//               </p>

//               <div
//                 className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
//                   loadingStatus
//                     ? "bg-slate-100 text-slate-600"
//                     : isConnected
//                     ? "bg-green-50 text-green-700"
//                     : "bg-slate-100 text-slate-600"
//                 }`}
//               >
//                 <span
//                   className={`h-2 w-2 rounded-full ${
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

//               {/* Employee view-only extras */}
//               {!isAdmin &&
//                 !loadingStatus &&
//                 isConnected &&
//                 connectedAccount?.whatsappBusinessName && (
//                   <p className="mt-3 text-sm text-slate-500">
//                     Business name:{" "}
//                     <span className="font-medium text-slate-700">
//                       {connectedAccount.whatsappBusinessName}
//                     </span>
//                   </p>
//                 )}

//               {!isAdmin && !loadingStatus && !isConnected && (
//                 <p className="mt-3 text-sm text-slate-500">
//                   No WhatsApp account is connected yet. Please ask your admin to
//                   connect one.
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Connect buttons are visible to ADMIN only */}
//           {isAdmin && (
//             <div className="flex w-full shrink-0 flex-col gap-3 lg:w-72 [&_button]:inline-flex [&_button]:h-11 [&_button]:w-full [&_button]:justify-center [&_button]:px-5 [&_button]:text-sm [&_div]:flex-col!">
//               <ConnectWhatsApp
//                 onConnected={fetchWhatsAppStatus}
//                 hideButtons={isConnected}
//               />

//               {isConnected && (
//                 <button
//                   type="button"
//                   onClick={() => setShowDisconnectConfirm(true)}
//                   disabled={disconnecting}
//                   className="items-center rounded-xl border border-red-300 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   {disconnecting ? "Disconnecting..." : "Disconnect WhatsApp"}
//                 </button>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Facebook Messenger Card */}
//       <FacebookMessengerCard isAdmin={isAdmin} />

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
import {
  Lock,
  MessageCircle,
} from "lucide-react";

import ConnectWhatsApp from "../../components/whatsapp/ConnectWhatsApp";
import FacebookMessengerCard from "../../components/facebook/FacebookMessengerCard";
import InstagramCard from "../../components/instagram/InstagramCard";
import { useAuthStore } from "../../store/authStore";
import ChangePasswordModal from "../../components/common/ChangePasswordModal";
import ConfirmModal from "../../components/common/ConfirmModal";

function SecuritySettings() {
  const { user } = useAuthStore();
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
      alert(
        error.response?.data?.message ||
          "Failed to disconnect WhatsApp. Please try again."
      );
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-50">
              <Lock size={26} className="text-green-600" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">Password</h2>
              <p className="mt-1 text-sm text-slate-500">
                Update it regularly to keep your account secure.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowChangePassword(true)}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 sm:w-auto sm:min-w-[180px]"
          >
            Change password
          </button>
        </div>
      </div>

      {/* Connected channels heading */}
      <div className="pt-4">
        <h2 className="text-xl font-bold text-slate-900">Connected channels</h2>
        <p className="mt-1 text-sm text-slate-500">
          Messages from these channels arrive in Conversations.
        </p>
      </div>

      {/* WhatsApp Business Card */}
      <div
        data-tour="whatsapp-card"
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCF8C6]">
              <MessageCircle size={26} className="text-[#25D366]" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">
                WhatsApp Business
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                {isAdmin
                  ? "Connect your WhatsApp Business Account to send and receive WhatsApp messages through the CRM."
                  : "The WhatsApp Business Account connected to this CRM. Only an admin can connect or change it."}
              </p>

              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                  loadingStatus
                    ? "bg-slate-100 text-slate-600"
                    : isConnected
                    ? "bg-green-50 text-green-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
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
            </div>
          </div>

          {/* Connect buttons are visible to ADMIN only */}
          {isAdmin && (
            <div className="flex w-full shrink-0 flex-col gap-3 lg:w-72 [&_button]:inline-flex [&_button]:h-11 [&_button]:w-full [&_button]:justify-center [&_button]:px-5 [&_button]:text-sm [&_div]:flex-col!">
              <ConnectWhatsApp
                onConnected={fetchWhatsAppStatus}
                hideButtons={isConnected}
              />

              {isConnected && (
                <button
                  type="button"
                  onClick={() => setShowDisconnectConfirm(true)}
                  disabled={disconnecting}
                  className="items-center rounded-xl border border-red-300 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {disconnecting ? "Disconnecting..." : "Disconnect WhatsApp"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Facebook Messenger Card */}
      <FacebookMessengerCard isAdmin={isAdmin} />

      {/* Instagram Card (connected separately from Facebook) */}
      <InstagramCard isAdmin={isAdmin} />

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
