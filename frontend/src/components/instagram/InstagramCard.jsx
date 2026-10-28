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

  return (
    <div
      data-tour="instagram-card"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* Header: icon + text on the left, action on the right */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-50">
            <FaInstagram size={26} className="text-[#DD2A7B]" />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900">Instagram</h2>

            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
              {isAdmin
                ? "Connect your Instagram Business or Creator account to receive and reply to Instagram DMs. No Facebook account is needed."
                : "Instagram accounts connected to this CRM. Only an admin can connect or change them."}
            </p>

            <div
              className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                loadingAccounts
                  ? "bg-slate-100 text-slate-600"
                  : needsReconnect
                  ? "bg-amber-50 text-amber-700"
                  : hasAccounts
                  ? "bg-pink-50 text-pink-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  loadingAccounts
                    ? "bg-slate-300"
                    : needsReconnect
                    ? "bg-amber-400"
                    : hasAccounts
                    ? "bg-[#DD2A7B]"
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

            {!isAdmin && !loadingAccounts && !hasAccounts && (
              <p className="mt-3 text-sm text-slate-500">
                No Instagram account is connected yet. Please ask your admin to
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
              onClick={handleConnectInstagram}
              disabled={connectingInstagram}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaInstagram size={16} />
              {connectingInstagram
                ? "Opening Instagram..."
                : needsReconnect
                ? "Reconnect Instagram"
                : hasAccounts
                ? "Add / Reconnect Instagram"
                : "Connect Instagram"}
            </button>

            <p className="text-center text-xs text-slate-400">
              Needs a Business or Creator Instagram account.
            </p>
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

      {/* Connected Instagram accounts */}
      {hasAccounts && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Connected accounts
          </p>

          <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
            {accounts.map((account) => {
              const needsReconnectRow = account.status === "RECONNECT_NEEDED";

              return (
                <div
                  key={account.id}
                  className="flex flex-col gap-3 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pink-50">
                      <FaInstagram size={18} className="text-[#DD2A7B]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-800">
                          {account.instagramUsername
                            ? `@${account.instagramUsername}`
                            : account.pageName || "Instagram account"}
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

                      <p className="mt-1 text-xs text-slate-500">
                        Connected directly with Instagram (no Facebook)
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                      {needsReconnectRow && (
                        <button
                          type="button"
                          onClick={handleConnectInstagram}
                          disabled={connectingInstagram}
                          className="h-9 rounded-xl bg-[#DD2A7B] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                        >
                          Reconnect
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setAccountToDisconnect(account)}
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
    </div>
  );
}

export default InstagramCard;
