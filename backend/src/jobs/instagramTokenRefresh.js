// ============================================================
// INSTAGRAM TOKEN REFRESH JOB
// Instagram Login tokens last 60 days. We refresh any token that
// expires within 15 days, once a day, so customers never get
// disconnected. A token that Meta rejects (password changed, access
// revoked, already expired) flags the account as RECONNECT_NEEDED,
// which shows the "Reconnect" button in Settings.
// ============================================================
const prisma = require("../config/prisma");
const { encryptSecret, decryptSecret } = require("../utils/secretCrypto");
const ig = require("../services/instagramService");

const RUN_EVERY_MS = 24 * 60 * 60 * 1000; // daily
const REFRESH_WINDOW_MS = 15 * 24 * 60 * 60 * 1000; // refresh when <15 days left
const MIN_TOKEN_AGE_MS = 24 * 60 * 60 * 1000; // Meta: token must be >24h old

let running = false;

const refreshOne = async (row) => {
  const token = decryptSecret(row.pageAccessToken);

  if (!token) {
    await prisma.facebookPage.update({
      where: { id: row.id },
      data: { status: "RECONNECT_NEEDED" },
    });
    return "flagged";
  }

  // Connected less than 24h ago -> Meta refuses; the next daily run handles it.
  if (Date.now() - new Date(row.connectedAt).getTime() < MIN_TOKEN_AGE_MS) {
    return "too-new";
  }

  try {
    const fresh = await ig.refreshLongLivedToken(token);
    await prisma.facebookPage.update({
      where: { id: row.id },
      data: {
        pageAccessToken: encryptSecret(fresh.accessToken),
        tokenExpiresAt: fresh.expiresAt,
        status: "CONNECTED",
      },
    });
    return "refreshed";
  } catch (err) {
    const detail = ig.extractError(err);
    console.error(
      "Instagram token refresh failed:",
      row.instagramUsername || row.id,
      detail.code,
      detail.message
    );

    // Any 4xx from Meta means this token will never work again
    const status = err?.response?.status;
    if (ig.isTokenError(detail) || (status >= 400 && status < 500)) {
      await prisma.facebookPage.update({
        where: { id: row.id },
        data: { status: "RECONNECT_NEEDED" },
      });
      return "flagged";
    }
    return "retry-later"; // network / Meta outage - try again tomorrow
  }
};

const runInstagramTokenRefresh = async () => {
  if (running) return;
  running = true;

  try {
    const rows = await prisma.facebookPage.findMany({
      where: {
        connectionType: "INSTAGRAM_LOGIN",
        status: { in: ["CONNECTED", "RECONNECT_NEEDED"] },
        pageAccessToken: { not: null },
        tokenExpiresAt: { lt: new Date(Date.now() + REFRESH_WINDOW_MS) },
      },
    });

    if (!rows.length) return;

    const summary = {};
    for (const row of rows) {
      // An already-expired token cannot be refreshed - customer must reconnect
      if (row.tokenExpiresAt && row.tokenExpiresAt.getTime() < Date.now()) {
        await prisma.facebookPage.update({
          where: { id: row.id },
          data: { status: "RECONNECT_NEEDED" },
        });
        summary.expired = (summary.expired || 0) + 1;
        continue;
      }
      const result = await refreshOne(row);
      summary[result] = (summary[result] || 0) + 1;
    }
    console.log("Instagram token refresh:", JSON.stringify(summary));
  } catch (err) {
    console.error("Instagram token refresh job error:", err);
  } finally {
    running = false;
  }
};

const startInstagramTokenRefreshJob = () => {
  // first check shortly after boot, then daily
  setTimeout(runInstagramTokenRefresh, 60 * 1000).unref?.();
  setInterval(runInstagramTokenRefresh, RUN_EVERY_MS).unref?.();
  console.log("Instagram token refresh job scheduled (daily)");
};

module.exports = { startInstagramTokenRefreshJob, runInstagramTokenRefresh };
