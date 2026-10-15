// ============================================================
// INSTAGRAM LOGIN CONTROLLER
// For customers who do NOT use Facebook: the admin signs in with
// Instagram directly. The account is stored in the SAME table as
// Facebook Pages (FacebookPage) with connectionType = INSTAGRAM_LOGIN,
// so conversations, webhooks and the inbox work exactly as before.
//
//   GET /api/instagram/auth-url   (admin)   -> { url } to open
//   GET /api/instagram/callback   (public)  -> Instagram redirects here
// ============================================================
const prisma = require("../config/prisma");
const { encryptSecret } = require("../utils/secretCrypto");
const ig = require("../services/instagramService");
const { getFrontendUrl } = require("../utils/frontendUrl");

const CONNECTION_TYPE = "INSTAGRAM_LOGIN";

// FRONTEND_URL may hold several comma-separated addresses - use the first.
const frontendBase = () => getFrontendUrl().split(",")[0].trim().replace(/\/+$/, "");

const redirectToFrontend = (res, params) => {
  const qs = new URLSearchParams(params).toString();
  return res.redirect(`${frontendBase()}/settings/security?${qs}`);
};

// ------------------------------------------------------------
// GET /api/instagram/auth-url   (admin only)
// ------------------------------------------------------------
const getInstagramAuthUrl = (req, res) => {
  if (!ig.isConfigured()) {
    return res.status(503).json({
      success: false,
      message:
        "Instagram login is not configured yet. Please contact support.",
    });
  }

  const state = ig.createState({
    companyId: req.user.companyId,
    userId: req.user.userId || null,
  });

  return res.status(200).json({ success: true, url: ig.buildAuthUrl(state) });
};

// ------------------------------------------------------------
// GET /api/instagram/callback   (PUBLIC - Instagram sends the browser here)
// Security comes from the signed `state`, not from a login header.
// ------------------------------------------------------------
const instagramCallback = async (req, res) => {
  const { code, state, error, error_reason, error_description } = req.query;

  // Customer pressed "Cancel" / denied permission
  if (error) {
    console.log("Instagram login denied:", error_reason || error);
    return redirectToFrontend(res, {
      instagram: "error",
      message:
        error_description || "Instagram login was cancelled. No changes were made.",
    });
  }

  let who;
  try {
    who = ig.verifyState(state);
  } catch (e) {
    return redirectToFrontend(res, {
      instagram: "error",
      message: "This Instagram login link has expired. Please try again.",
    });
  }

  if (!code) {
    return redirectToFrontend(res, {
      instagram: "error",
      message: "Instagram did not return a login code. Please try again.",
    });
  }

  const companyId = who.companyId;

  try {
    // 1. code -> short token -> long-lived (60 day) token
    const short = await ig.exchangeCodeForToken(String(code));
    const long = await ig.getLongLivedToken(short.accessToken);

    // 2. Who logged in?
    const account = await ig.getMyAccount(long.accessToken);

    if (
      account.accountType &&
      !["BUSINESS", "MEDIA_CREATOR"].includes(account.accountType)
    ) {
      return redirectToFrontend(res, {
        instagram: "error",
        message:
          "This is a personal Instagram account. Switch it to a Professional (Business or Creator) account in the Instagram app: Settings -> Account type and tools -> Switch to professional account.",
      });
    }

    // 3. Is this Instagram account already used somewhere?
    const existing = await prisma.facebookPage.findUnique({
      where: { instagramAccountId: account.id },
    });

    if (existing && existing.companyId !== companyId) {
      return redirectToFrontend(res, {
        instagram: "error",
        message:
          "This Instagram account is already connected to another CRM account. Contact support if this is a mistake.",
      });
    }

    if (
      existing &&
      existing.connectionType !== CONNECTION_TYPE &&
      existing.status !== "DISCONNECTED"
    ) {
      return redirectToFrontend(res, {
        instagram: "info",
        message: `@${
          account.username || account.id
        } is already connected through your Facebook Page "${
          existing.pageName || existing.pageId
        }". Nothing more to do.`,
      });
    }

    // 4. Subscribe to webhooks so DMs reach us
    await ig.subscribeAccount(long.accessToken);

    // 5. Save (create or reconnect)
    const syntheticPageId = `ig_${account.id}`;
    const data = {
      companyId,
      connectionType: CONNECTION_TYPE,
      pageName: account.username ? `@${account.username}` : account.name,
      instagramAccountId: account.id,
      instagramUsername: account.username,
      pageAccessToken: encryptSecret(long.accessToken),
      tokenExpiresAt: long.expiresAt,
      status: "CONNECTED",
      connectedByUserId: who.userId ? String(who.userId) : null,
      connectedAt: new Date(),
      disconnectedAt: null,
    };

    const row = await prisma.facebookPage.findUnique({
      where: { pageId: syntheticPageId },
    });

    if (row) {
      await prisma.facebookPage.update({ where: { pageId: syntheticPageId }, data });
    } else if (existing) {
      // Old DISCONNECTED Facebook-Login row that still holds this IG id.
      // Turn it into the Instagram-Login row (keeps its old conversations).
      await prisma.facebookPage.update({
        where: { id: existing.id },
        data: { ...data, pageId: syntheticPageId },
      });
    } else {
      await prisma.facebookPage.create({
        data: { ...data, pageId: syntheticPageId },
      });
    }

    return redirectToFrontend(res, {
      instagram: "connected",
      username: account.username || "",
    });
  } catch (err) {
    const detail = ig.extractError(err);
    console.error("INSTAGRAM CONNECT ERROR:", detail);
    return redirectToFrontend(res, {
      instagram: "error",
      message: `Failed to connect Instagram: ${detail.message}`,
    });
  }
};

module.exports = {
  CONNECTION_TYPE,
  getInstagramAuthUrl,
  instagramCallback,
};
