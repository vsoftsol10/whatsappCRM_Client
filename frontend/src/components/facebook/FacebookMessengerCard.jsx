// Facebook Messenger card (Facebook ONLY).
//
// Instagram is connected separately in its own card (see
// components/instagram/InstagramCard.jsx). Connecting a Facebook Page here no
// longer links or subscribes any Instagram account.

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
  const [pageToDisconnect, setPageToDisconnect] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchPages = useCallback(async () => {
    try {
      setLoadingPages(true);
      // Facebook Pages only (Instagram accounts are listed in the Instagram card)
      const data = await getFacebookPages("facebook");
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
      setNotice({
        type: "success",
        text: "Facebook Page disconnected.",
      });
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

  // This component returns TWO things for the 3-column grid in SecuritySettings:
  //   1. the channel card (one grid cell)
  //   2. notices + connected Pages (full-width row under the cards, via `order-2`)
  return (
    <>
      <div
        data-tour="facebook-instagram-card"
        className="order-1 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E7F0FF]">
            <FaFacebookMessenger size={22} className="text-[#1877F2]" />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900">Facebook Messenger</h2>

            <div
              className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                loadingPages
                  ? "bg-slate-100 text-slate-600"
                  : needsReconnect
                  ? "bg-amber-100 text-amber-700"
                  : hasPages
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  loadingPages
                    ? "bg-slate-300"
                    : needsReconnect
                    ? "bg-amber-400"
                    : hasPages
                    ? "bg-[#1877F2]"
                    : "bg-slate-400"
                }`}
              />
              {loadingPages
                ? "Checking..."
                : needsReconnect
                ? "Reconnect needed"
                : hasPages
                ? `Connected (${pages.length} Page${pages.length > 1 ? "s" : ""})`
                : "Not Connected"}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          {isAdmin
            ? "Connect your Facebook Page to receive and reply to Messenger messages. Instagram is connected separately in the Instagram section below."
            : "Facebook Pages connected to this CRM. Only an admin can connect or change them."}
        </p>

        {!isAdmin && !loadingPages && !hasPages && (
          <p className="mt-3 text-sm text-slate-500">
            No Facebook Page is connected yet. Please ask your admin to
            connect one.
          </p>
        )}

        {/* Connect button: ADMIN only */}
        {isAdmin && (
          <div className="mt-auto pt-5">
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting || !sdkReady}
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                hasPages && !needsReconnect
                  ? "border border-slate-900 bg-white text-slate-900 hover:bg-slate-50"
                  : "bg-[#1877F2] text-white shadow-sm hover:bg-[#145DBF]"
              }`}
            >
              {!(hasPages && !needsReconnect) && <FaFacebookMessenger size={16} />}
              {connecting
                ? "Connecting..."
                : needsReconnect
                ? "Reconnect Facebook"
                : hasPages
                ? "Add / update page"
                : "Connect Facebook"}
            </button>
          </div>
        )}
      </div>

      {/* Result message */}
      {notice && (
        <div
          className={`order-2 col-span-full rounded-xl border px-4 py-3 text-sm ${
            noticeStyles[notice.type] || noticeStyles.info
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Pages that could not be connected */}
      {skippedPages.length > 0 && (
        <div className="order-2 col-span-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
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

      {/* Connected Pages */}
      {hasPages && (
        <div className="order-2 col-span-full rounded-2xl border border-slate-200 bg-slate-50/70 px-6 py-5 shadow-sm">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
            Connected Pages
          </p>

          <div className="divide-y divide-slate-200">
            {pages.map((page) => {
              const needsReconnectRow = page.status === "RECONNECT_NEEDED";

              return (
                <div
                  key={page.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F0FF]">
                        <FaFacebookMessenger
                          size={16}
                          className="text-[#1877F2]"
                        />
                      </div>

                      <p className="truncate font-medium text-slate-800">
                        {page.pageName || `Page ${page.pageId}`}
                      </p>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                          needsReconnectRow
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            needsReconnectRow ? "bg-amber-400" : "bg-green-500"
                          }`}
                        />
                        {needsReconnectRow
                          ? "Reconnect needed — access was removed or expired"
                          : "Connected"}
                      </span>
                    </div>

                    {/* Older connections only: an Instagram account was linked
                        through this Page before the two were separated. */}
                    {page.hasInstagram && (
                      <p className="mt-1 max-w-xl text-xs leading-relaxed text-amber-700">
                        An older Instagram link
                        {page.instagramUsername
                          ? ` (@${page.instagramUsername})`
                          : ""}{" "}
                        is still attached to this Page. Click “Add / update
                        page” to remove it, then connect Instagram in the
                        Instagram section.
                      </p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setPageToDisconnect(page)}
                        className="h-9 rounded-lg border border-red-200 bg-white px-4 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
    </>
  );
}


export default FacebookMessengerCard;