// import { useEffect, useState, useCallback } from "react";
// import { FaFacebookMessenger } from "react-icons/fa";

// import { loadFacebookSDK } from "../../utils/facebookSdk";
// import {
//   getFacebookPages,
//   connectFacebookPages,
//   disconnectFacebookPage,
// } from "../../api/facebookApi";
// import ConfirmModal from "../common/ConfirmModal";

// // Configuration ID of the "Facebook Pages" login configuration
// // (Meta Dashboard -> Facebook Login for Business -> Configurations).
// const FACEBOOK_CONFIG_ID = import.meta.env.VITE_META_FACEBOOK_CONFIG_ID;

// const getErrorMessage = (error, fallback) =>
//   error?.response?.data?.message || error?.message || fallback;

// function FacebookMessengerCard({ isAdmin = false }) {
//   const [pages, setPages] = useState([]);
//   const [loadingPages, setLoadingPages] = useState(true);
//   const [sdkReady, setSdkReady] = useState(false);
//   const [connecting, setConnecting] = useState(false);
//   const [notice, setNotice] = useState(null); // { type: "success" | "error" | "info", text }
//   const [skippedPages, setSkippedPages] = useState([]);
//   const [pageToDisconnect, setPageToDisconnect] = useState(null);
//   const [disconnecting, setDisconnecting] = useState(false);

//   const fetchPages = useCallback(async () => {
//     try {
//       setLoadingPages(true);
//       const data = await getFacebookPages();
//       setPages(data?.pages || []);
//     } catch (error) {
//       console.error("Failed to fetch Facebook pages:", error);
//       setPages([]);
//     } finally {
//       setLoadingPages(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchPages();

//     loadFacebookSDK()
//       .then(() => setSdkReady(true))
//       .catch((error) => console.error("Facebook SDK error:", error));
//   }, [fetchPages]);

//   const hasPages = pages.length > 0;
//   const needsReconnect = pages.some((p) => p.status === "RECONNECT_NEEDED");

//   // Send the Facebook login result (access token, or code) to our backend
//   const finishConnect = async ({ accessToken, code }) => {
//     try {
//       const data = await connectFacebookPages({ accessToken, code });

//       setNotice({
//         type: "success",
//         text: data?.message || "Facebook connected successfully",
//       });
//       setSkippedPages(data?.skipped || []);

//       await fetchPages();
//     } catch (error) {
//       console.error(
//         "Facebook connect failed:",
//         error?.response?.data || error?.message
//       );
//       setNotice({
//         type: "error",
//         text: getErrorMessage(
//           error,
//           "Failed to connect Facebook. Please try again."
//         ),
//       });
//       setSkippedPages(error?.response?.data?.skipped || []);
//     } finally {
//       setConnecting(false);
//     }
//   };

//   const handleConnect = () => {
//     setNotice(null);
//     setSkippedPages([]);

//     if (!FACEBOOK_CONFIG_ID) {
//       console.error("Missing VITE_META_FACEBOOK_CONFIG_ID");
//       setNotice({
//         type: "error",
//         text: "Facebook is not configured yet. Please contact support.",
//       });
//       return;
//     }

//     if (!window.FB) {
//       setNotice({
//         type: "error",
//         text: "Facebook is still loading. Please try again in a moment.",
//       });
//       return;
//     }

//     setConnecting(true);

//     // NOTE: FB.login needs a normal (non-async) callback.
//     window.FB.login(
//       (response) => {
//         // A "User access token" configuration returns an access token
//         // directly, so there is no code to exchange on the server.
//         const accessToken = response?.authResponse?.accessToken;
//         const code = response?.authResponse?.code;

//         if (!accessToken && !code) {
//           setConnecting(false);
//           setNotice({
//             type: "info",
//             text: "Facebook login was cancelled. No changes were made.",
//           });
//           return;
//         }

//         finishConnect({ accessToken, code });
//       },
//       {
//         config_id: FACEBOOK_CONFIG_ID,
//       }
//     );
//   };

//   const handleDisconnect = async () => {
//     if (!pageToDisconnect?.id) return;

//     try {
//       setDisconnecting(true);
//       await disconnectFacebookPage(pageToDisconnect.id);
//       setPageToDisconnect(null);
//       setNotice({ type: "success", text: "Facebook Page disconnected." });
//       await fetchPages();
//     } catch (error) {
//       setPageToDisconnect(null);
//       setNotice({
//         type: "error",
//         text: getErrorMessage(
//           error,
//           "Failed to disconnect the Page. Please try again."
//         ),
//       });
//     } finally {
//       setDisconnecting(false);
//     }
//   };

//   const noticeStyles = {
//     success: "border-green-200 bg-green-50 text-green-700",
//     error: "border-red-200 bg-red-50 text-red-700",
//     info: "border-slate-200 bg-slate-50 text-slate-600",
//   };

//   return (
//     <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
//       <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//         <div className="flex items-start gap-4">
//           <div className="rounded-2xl bg-[#E7F0FF] p-4">
//             <FaFacebookMessenger size={28} className="text-[#1877F2]" />
//           </div>

//           <div>
//             <h2 className="text-xl font-bold text-slate-900">
//               Facebook Messenger
//             </h2>

//             <p className="mt-2 text-sm text-slate-500">
//               {isAdmin
//                 ? "Connect your Facebook Page to receive and reply to Messenger messages inside the CRM."
//                 : "Facebook Pages connected to this CRM. Only an admin can connect or change them."}
//             </p>

//             <div className="mt-3 flex items-center gap-2">
//               <span
//                 className={`h-2.5 w-2.5 rounded-full ${
//                   loadingPages
//                     ? "bg-slate-300"
//                     : needsReconnect
//                     ? "bg-amber-400"
//                     : hasPages
//                     ? "bg-[#1877F2]"
//                     : "bg-slate-400"
//                 }`}
//               />

//               <span className="text-sm font-medium text-slate-500">
//                 {loadingPages
//                   ? "Checking..."
//                   : needsReconnect
//                   ? "Reconnect needed"
//                   : hasPages
//                   ? `Connected (${pages.length} Page${pages.length > 1 ? "s" : ""})`
//                   : "Not Connected"}
//               </span>
//             </div>

//             {!isAdmin && !loadingPages && !hasPages && (
//               <p className="mt-2 text-sm text-slate-500">
//                 No Facebook Page is connected yet. Please ask your admin to
//                 connect one.
//               </p>
//             )}
//           </div>
//         </div>

//         {/* Connect button: ADMIN only */}
//         {isAdmin && (
//           <div className="flex flex-col gap-3">
//             <button
//               type="button"
//               onClick={handleConnect}
//               disabled={connecting || !sdkReady}
//               className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-6 py-3 font-semibold text-white transition hover:bg-[#145DBF] disabled:cursor-not-allowed disabled:opacity-60"
//             >
//               <FaFacebookMessenger size={18} />
//               {connecting
//                 ? "Connecting..."
//                 : needsReconnect
//                 ? "Reconnect Facebook"
//                 : hasPages
//                 ? "Add / Update Pages"
//                 : "Connect Facebook"}
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Result message */}
//       {notice && (
//         <div
//           className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
//             noticeStyles[notice.type] || noticeStyles.info
//           }`}
//         >
//           {notice.text}
//         </div>
//       )}

//       {/* Pages that could not be connected */}
//       {skippedPages.length > 0 && (
//         <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
//           <p className="font-semibold">Some Pages could not be connected:</p>
//           <ul className="mt-1 list-disc pl-5">
//             {skippedPages.map((p) => (
//               <li key={p.pageId}>
//                 {p.pageName || p.pageId}: {p.reason}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {/* Connected Pages */}
//       {hasPages && (
//         <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
//           {pages.map((page) => (
//             <div
//               key={page.id}
//               className="flex items-center justify-between gap-4 px-4 py-3"
//             >
//               <div className="min-w-0">
//                 <p className="truncate font-semibold text-slate-800">
//                   {page.pageName || `Page ${page.pageId}`}
//                 </p>
//                 <p
//                   className={`text-xs font-medium ${
//                     page.status === "RECONNECT_NEEDED"
//                       ? "text-amber-600"
//                       : "text-slate-500"
//                   }`}
//                 >
//                   {page.status === "RECONNECT_NEEDED"
//                     ? "Reconnect needed — access was removed or expired"
//                     : "Connected"}
//                 </p>
//               </div>

//               {isAdmin && (
//                 <button
//                   type="button"
//                   onClick={() => setPageToDisconnect(page)}
//                   className="shrink-0 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
//                 >
//                   Disconnect
//                 </button>
//               )}
//             </div>
//           ))}
//         </div>
//       )}

//       <ConfirmModal
//         isOpen={!!pageToDisconnect}
//         title="Disconnect Facebook Page?"
//         message={`You won't receive or send Messenger messages for "${
//           pageToDisconnect?.pageName || "this Page"
//         }" in the CRM until you reconnect. Existing chats are kept.`}
//         confirmText={disconnecting ? "Disconnecting..." : "Disconnect"}
//         cancelText="Cancel"
//         variant="danger"
//         onConfirm={handleDisconnect}
//         onCancel={() => setPageToDisconnect(null)}
//       />
//     </div>
//   );
// }

// export default FacebookMessengerCard;


import { useEffect, useState, useCallback } from "react";
import { FaFacebookMessenger } from "react-icons/fa";

import { loadFacebookSDK } from "../../utils/facebookSdk";
import {
  getFacebookPages,
  connectFacebookPages,
  disconnectFacebookPage,
} from "../../api/facebookApi";
import ConfirmModal from "../common/ConfirmModal";

// Configuration ID of the "Facebook Pages" login configuration
// (Meta Dashboard -> Facebook Login for Business -> Configurations).
const FACEBOOK_CONFIG_ID = import.meta.env.VITE_META_FACEBOOK_CONFIG_ID;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function FacebookMessengerCard({ isAdmin = false }) {
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [sdkReady, setSdkReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "success" | "error" | "info", text }
  const [skippedPages, setSkippedPages] = useState([]);
  const [instagramNotes, setInstagramNotes] = useState([]);
  const [pageToDisconnect, setPageToDisconnect] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchPages = useCallback(async () => {
    try {
      setLoadingPages(true);
      const data = await getFacebookPages();
      setPages(data?.pages || []);
    } catch (error) {
      console.error("Failed to fetch Facebook pages:", error);
      setPages([]);
    } finally {
      setLoadingPages(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();

    loadFacebookSDK()
      .then(() => setSdkReady(true))
      .catch((error) => console.error("Facebook SDK error:", error));
  }, [fetchPages]);

  const hasPages = pages.length > 0;
  const needsReconnect = pages.some((p) => p.status === "RECONNECT_NEEDED");

  // Send the Facebook login result (access token, or code) to our backend
  const finishConnect = async ({ accessToken, code }) => {
    try {
      const data = await connectFacebookPages({ accessToken, code });

      setNotice({
        type: "success",
        text: data?.message || "Facebook connected successfully",
      });
      setSkippedPages(data?.skipped || []);
      setInstagramNotes(
        (data?.pages || [])
          .filter((p) => p.instagramNote)
          .map((p) => `${p.pageName || p.pageId}: ${p.instagramNote}`)
      );

      await fetchPages();
    } catch (error) {
      console.error(
        "Facebook connect failed:",
        error?.response?.data || error?.message
      );
      setNotice({
        type: "error",
        text: getErrorMessage(
          error,
          "Failed to connect Facebook. Please try again."
        ),
      });
      setSkippedPages(error?.response?.data?.skipped || []);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnect = () => {
    setNotice(null);
    setSkippedPages([]);
    setInstagramNotes([]);

    if (!FACEBOOK_CONFIG_ID) {
      console.error("Missing VITE_META_FACEBOOK_CONFIG_ID");
      setNotice({
        type: "error",
        text: "Facebook is not configured yet. Please contact support.",
      });
      return;
    }

    if (!window.FB) {
      setNotice({
        type: "error",
        text: "Facebook is still loading. Please try again in a moment.",
      });
      return;
    }

    setConnecting(true);

    // NOTE: FB.login needs a normal (non-async) callback.
    window.FB.login(
      (response) => {
        // A "User access token" configuration returns an access token
        // directly, so there is no code to exchange on the server.
        const accessToken = response?.authResponse?.accessToken;
        const code = response?.authResponse?.code;

        if (!accessToken && !code) {
          setConnecting(false);
          setNotice({
            type: "info",
            text: "Facebook login was cancelled. No changes were made.",
          });
          return;
        }

        finishConnect({ accessToken, code });
      },
      {
        config_id: FACEBOOK_CONFIG_ID,
      }
    );
  };

  const handleDisconnect = async () => {
    if (!pageToDisconnect?.id) return;

    try {
      setDisconnecting(true);
      await disconnectFacebookPage(pageToDisconnect.id);
      setPageToDisconnect(null);
      setNotice({ type: "success", text: "Facebook Page disconnected." });
      await fetchPages();
    } catch (error) {
      setPageToDisconnect(null);
      setNotice({
        type: "error",
        text: getErrorMessage(
          error,
          "Failed to disconnect the Page. Please try again."
        ),
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const noticeStyles = {
    success: "border-green-200 bg-green-50 text-green-700",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[#E7F0FF] p-4">
            <FaFacebookMessenger size={28} className="text-[#1877F2]" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Facebook & Instagram
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {isAdmin
                ? "Connect your Facebook Page to receive and reply to Messenger messages, and Instagram DMs if your Instagram account is linked to the Page, inside the CRM."
                : "Facebook Pages connected to this CRM. Only an admin can connect or change them."}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  loadingPages
                    ? "bg-slate-300"
                    : needsReconnect
                    ? "bg-amber-400"
                    : hasPages
                    ? "bg-[#1877F2]"
                    : "bg-slate-400"
                }`}
              />

              <span className="text-sm font-medium text-slate-500">
                {loadingPages
                  ? "Checking..."
                  : needsReconnect
                  ? "Reconnect needed"
                  : hasPages
                  ? `Connected (${pages.length} Page${pages.length > 1 ? "s" : ""})`
                  : "Not Connected"}
              </span>
            </div>

            {!isAdmin && !loadingPages && !hasPages && (
              <p className="mt-2 text-sm text-slate-500">
                No Facebook Page is connected yet. Please ask your admin to
                connect one.
              </p>
            )}
          </div>
        </div>

        {/* Connect button: ADMIN only */}
        {isAdmin && (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting || !sdkReady}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-6 py-3 font-semibold text-white transition hover:bg-[#145DBF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaFacebookMessenger size={18} />
              {connecting
                ? "Connecting..."
                : needsReconnect
                ? "Reconnect Facebook"
                : hasPages
                ? "Add / Update Pages"
                : "Connect Facebook"}
            </button>
          </div>
        )}
      </div>

      {/* Result message */}
      {notice && (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
            noticeStyles[notice.type] || noticeStyles.info
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Pages that could not be connected */}
      {skippedPages.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Some Pages could not be connected:</p>
          <ul className="mt-1 list-disc pl-5">
            {skippedPages.map((p) => (
              <li key={p.pageId}>
                {p.pageName || p.pageId}: {p.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instagram notes (for example an Instagram account already used elsewhere) */}
      {instagramNotes.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">Instagram:</p>
          <ul className="mt-1 list-disc pl-5">
            {instagramNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Connected Pages */}
      {hasPages && (
        <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800">
                  {page.pageName || `Page ${page.pageId}`}
                </p>
                <p
                  className={`text-xs font-medium ${
                    page.status === "RECONNECT_NEEDED"
                      ? "text-amber-600"
                      : "text-slate-500"
                  }`}
                >
                  {page.status === "RECONNECT_NEEDED"
                    ? "Reconnect needed — access was removed or expired"
                    : "Connected"}
                </p>

                {page.hasInstagram ? (
                  <p className="text-xs font-medium text-pink-600">
                    Instagram:{" "}
                    {page.instagramUsername
                      ? `@${page.instagramUsername}`
                      : "linked"}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Instagram: not linked. To receive Instagram DMs, link a
                    professional Instagram account to this Page, then click
                    "Add / Update Pages".
                  </p>
                )}
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setPageToDisconnect(page)}
                  className="shrink-0 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Disconnect
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!pageToDisconnect}
        title="Disconnect Facebook Page?"
        message={`You won't receive or send Messenger messages for "${
          pageToDisconnect?.pageName || "this Page"
        }" in the CRM until you reconnect. Existing chats are kept.`}
        confirmText={disconnecting ? "Disconnecting..." : "Disconnect"}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDisconnect}
        onCancel={() => setPageToDisconnect(null)}
      />
    </div>
  );
}

export default FacebookMessengerCard;

