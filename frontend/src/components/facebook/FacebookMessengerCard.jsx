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

  return (
    <div
      data-tour="facebook-instagram-card"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* Header: icon + text on the left, action on the right */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E7F0FF]">
            <FaFacebookMessenger size={26} className="text-[#1877F2]" />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">
              Facebook Messenger
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
              {isAdmin
                ? "Connect your Facebook Page to receive and reply to Messenger messages. Instagram is connected separately in the Instagram section below."
                : "Facebook Pages connected to this CRM. Only an admin can connect or change them."}
            </p>

            <div
              className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                loadingPages
                  ? "bg-slate-100 text-slate-600"
                  : needsReconnect
                  ? "bg-amber-50 text-amber-700"
                  : hasPages
                  ? "bg-blue-50 text-blue-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
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

            {!isAdmin && !loadingPages && !hasPages && (
              <p className="mt-3 text-sm text-slate-500">
                No Facebook Page is connected yet. Please ask your admin to
                connect one.
              </p>
            )}
          </div>
        </div>

        {/* Connect button: ADMIN only */}
        {isAdmin && (
          <div className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
            <button
              type="button"
              onClick={handleConnect}
              disabled={connecting || !sdkReady}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#145DBF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaFacebookMessenger size={16} />
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

      {/* Connected Pages */}
      {hasPages && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Connected Pages
          </p>

          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
            {pages.map((page) => {
              const needsReconnectRow = page.status === "RECONNECT_NEEDED";

              return (
                <div
                  key={page.id}
                  className="flex flex-col gap-3 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E7F0FF]">
                      <FaFacebookMessenger
                        size={18}
                        className="text-[#1877F2]"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-800">
                          {page.pageName || `Page ${page.pageId}`}
                        </p>

                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            needsReconnectRow
                              ? "bg-amber-50 text-amber-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
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
                          is still attached to this Page. Click “Add / Update
                          Pages” to remove it, then connect Instagram in the
                          Instagram section.
                        </p>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setPageToDisconnect(page)}
                        className="h-9 rounded-xl border border-red-300 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
    </div>
  );
}

export default FacebookMessengerCard;
