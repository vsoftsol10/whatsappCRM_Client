// Instagram card (Instagram ONLY).
//
// Connects an Instagram Business / Creator account directly with Instagram
// Login - no Facebook needed. Facebook Pages are connected in their own card
// (components/facebook/FacebookMessengerCard.jsx).
//
// After Instagram login, the backend redirects the admin back to
//   /settings/security?instagram=connected|error|info
// and this card shows the result.

import { useEffect, useState, useCallback } from "react";
import { FaInstagram } from "react-icons/fa";

import {
  getFacebookPages,
  getInstagramAuthUrl,
  disconnectFacebookPage,
} from "../../api/facebookApi";
import ConfirmModal from "../common/ConfirmModal";

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

function InstagramCard({ isAdmin = false }) {
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [notice, setNotice] = useState(null); // { type: "success" | "error" | "info", text }
  const [connectingInstagram, setConnectingInstagram] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoadingAccounts(true);
      // Instagram accounts connected directly (Instagram Login) only
      const data = await getFacebookPages("instagram");
      setAccounts(data?.pages || []);
    } catch (error) {
      console.error("Failed to fetch Instagram accounts:", error);
      setAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Instagram sends the admin back here: /settings/security?instagram=connected|error|info
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("instagram");
    if (!result) return;

    if (result === "connected") {
      const username = params.get("username");
      setNotice({
        type: "success",
        text: username
          ? `Instagram @${username} connected successfully`
          : "Instagram connected successfully",
      });
      fetchAccounts();
    } else {
      setNotice({
        type: result === "info" ? "info" : "error",
        text:
          params.get("message") ||
          "Could not connect Instagram. Please try again.",
      });
    }

    // clean the address bar so a refresh does not repeat the message
    window.history.replaceState({}, "", window.location.pathname);
  }, [fetchAccounts]);

  const hasAccounts = accounts.length > 0;
  const needsReconnect = accounts.some((a) => a.status === "RECONNECT_NEEDED");

  // Instagram login WITHOUT Facebook: full-page redirect to Instagram, which
  // sends the admin back to this page when done.
  const handleConnectInstagram = async () => {
    setNotice(null);

    try {
      setConnectingInstagram(true);
      const data = await getInstagramAuthUrl();
      if (!data?.url) throw new Error("No Instagram login URL returned");
      window.location.href = data.url;
    } catch (error) {
      setConnectingInstagram(false);
      setNotice({
        type: "error",
        text: getErrorMessage(
          error,
          "Could not start Instagram login. Please try again."
        ),
      });
    }
  };

  const handleDisconnect = async () => {
    if (!accountToDisconnect?.id) return;

    try {
      setDisconnecting(true);
      await disconnectFacebookPage(accountToDisconnect.id);
      setAccountToDisconnect(null);
      setNotice({
        type: "success",
        text: "Instagram account disconnected.",
      });
      await fetchAccounts();
    } catch (error) {
      setAccountToDisconnect(null);
      setNotice({
        type: "error",
        text: getErrorMessage(
          error,
          "Failed to disconnect the Instagram account. Please try again."
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
  //   2. notices + connected accounts (full-width row under the cards, via `order-2`)
  return (
    <>
      <div
        data-tour="instagram-card"
        className="order-1 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-50">
            <FaInstagram size={22} className="text-[#DD2A7B]" />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900">Instagram</h2>

            <div
              className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                loadingAccounts
                  ? "bg-slate-100 text-slate-600"
                  : needsReconnect
                  ? "bg-amber-100 text-amber-700"
                  : hasAccounts
                  ? "bg-pink-100 text-pink-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  loadingAccounts
                    ? "bg-slate-300"
                    : needsReconnect
                    ? "bg-amber-400"
                    : hasAccounts
                    ? "bg-green-500"
                    : "bg-slate-400"
                }`}
              />
              {loadingAccounts
                ? "Checking..."
                : needsReconnect
                ? "Reconnect needed"
                : hasAccounts
                ? `Connected (${accounts.length} account${
                    accounts.length > 1 ? "s" : ""
                  })`
                : "Not Connected"}
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-500">
          {isAdmin
            ? "Connect your Instagram Business or Creator account to receive and reply to Instagram DMs. No Facebook account is needed."
            : "Instagram accounts connected to this CRM. Only an admin can connect or change them."}
        </p>

        {!isAdmin && !loadingAccounts && !hasAccounts && (
          <p className="mt-3 text-sm text-slate-500">
            No Instagram account is connected yet. Please ask your admin to
            connect one.
          </p>
        )}

        {/* Connect button: ADMIN only */}
        {isAdmin && (
          <div className="mt-auto pt-5">
            <button
              type="button"
              onClick={handleConnectInstagram}
              disabled={connectingInstagram}
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                hasAccounts && !needsReconnect
                  ? "border border-slate-900 bg-white text-slate-900 hover:bg-slate-50"
                  : "bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white shadow-sm hover:opacity-90"
              }`}
            >
              {!(hasAccounts && !needsReconnect) && <FaInstagram size={16} />}
              {connectingInstagram
                ? "Opening Instagram..."
                : needsReconnect
                ? "Reconnect Instagram"
                : hasAccounts
                ? "Add / update account"
                : "Connect Instagram"}
            </button>

            {!hasAccounts && (
              <p className="mt-2 text-center text-xs text-slate-400">
                Needs a Business or Creator Instagram account.
              </p>
            )}
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

      {/* Connected Instagram accounts */}
      {hasAccounts && (
        <div className="order-2 col-span-full rounded-2xl border border-slate-200 bg-slate-50/70 px-6 py-5 shadow-sm">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
            Connected accounts
          </p>

          <div className="divide-y divide-slate-200">
            {accounts.map((account) => {
              const needsReconnectRow = account.status === "RECONNECT_NEEDED";

              return (
                <div
                  key={account.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-50">
                        <FaInstagram size={16} className="text-[#DD2A7B]" />
                      </div>

                      <p className="truncate font-medium text-slate-800">
                        {account.instagramUsername
                          ? `@${account.instagramUsername}`
                          : account.pageName || "Instagram account"}
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

                    <p className="mt-1 text-xs text-slate-500 sm:pl-11">
                      Connected directly with Instagram (no Facebook)
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                      {needsReconnectRow && (
                        <button
                          type="button"
                          onClick={handleConnectInstagram}
                          disabled={connectingInstagram}
                          className="h-9 rounded-lg bg-[#DD2A7B] px-4 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          Reconnect
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setAccountToDisconnect(account)}
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
        isOpen={!!accountToDisconnect}
        title="Disconnect Instagram account?"
        message={`You won't receive or send Instagram messages for "${
          accountToDisconnect?.pageName || "this account"
        }" in the CRM until you reconnect. Existing chats are kept.`}
        confirmText={disconnecting ? "Disconnecting..." : "Disconnect"}
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDisconnect}
        onCancel={() => setAccountToDisconnect(null)}
      />
    </>
  );
}


export default InstagramCard;