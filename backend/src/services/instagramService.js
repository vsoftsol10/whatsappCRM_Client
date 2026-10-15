// ============================================================
// INSTAGRAM LOGIN SERVICE  (customers who do NOT use Facebook)
//
// "Instagram API with Instagram Login" - the customer signs in with
// their Instagram professional (Business / Creator) account directly.
// No Facebook account or Facebook Page is needed.
//
// Differences from the Facebook-Login flow:
//   - host:   graph.instagram.com   (not graph.facebook.com)
//   - app:    uses the INSTAGRAM App ID / Secret (Meta App Dashboard ->
//             Instagram -> API setup with Instagram login)
//   - token:  60-day Instagram user token, must be refreshed
//   - send:   POST /me/messages
// ============================================================
const axios = require("axios");
const jwt = require("jsonwebtoken");

const IG_GRAPH_VERSION =
  process.env.INSTAGRAM_GRAPH_VERSION || process.env.META_GRAPH_VERSION || "v23.0";
const IG_GRAPH = `https://graph.instagram.com/${IG_GRAPH_VERSION}`;
const IG_GRAPH_ROOT = "https://graph.instagram.com";

const REQUEST_TIMEOUT_MS = 15000;

// Same limit as the Facebook-Login Instagram flow
const INSTAGRAM_TEXT_LIMIT_BYTES = 1000;

// Permissions we ask the customer for
const INSTAGRAM_LOGIN_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
];

// Webhook fields we subscribe the account to
const IG_SUBSCRIBED_FIELDS = "messages";

const STATE_TTL = "10m";

// ------------------------------------------------------------
// Config helpers
// ------------------------------------------------------------
const getConfig = () => ({
  appId: process.env.INSTAGRAM_APP_ID,
  appSecret: process.env.INSTAGRAM_APP_SECRET,
  redirectUri: process.env.INSTAGRAM_REDIRECT_URI,
});

const isConfigured = () => {
  const { appId, appSecret, redirectUri } = getConfig();
  return !!(appId && appSecret && redirectUri);
};

// Same shape as facebookService.extractError so callers can share code.
const extractError = (err) => {
  const data = err?.response?.data;
  const e = data?.error || data;
  return {
    message:
      e?.message ||
      e?.error_message ||
      err?.message ||
      "Unknown Instagram error",
    code: e?.code ?? null,
    subcode: e?.error_subcode ?? null,
    type: e?.type ?? e?.error_type ?? null,
    fbtrace: e?.fbtrace_id ?? null,
  };
};

// OAuthException 190 = token expired / revoked / password changed
const isTokenError = (error) => !!error && error.code === 190;

// ------------------------------------------------------------
// State (CSRF protection + remembers WHICH company/admin started it)
// The Instagram redirect comes back in the browser with no login
// header, so the signed state is how we know who is connecting.
// ------------------------------------------------------------
const createState = ({ companyId, userId }) =>
  jwt.sign({ purpose: "ig_connect", companyId, userId }, process.env.JWT_SECRET, {
    expiresIn: STATE_TTL,
  });

const verifyState = (state) => {
  const decoded = jwt.verify(String(state || ""), process.env.JWT_SECRET);
  if (decoded?.purpose !== "ig_connect" || !decoded.companyId) {
    throw new Error("Invalid state");
  }
  return decoded;
};

// ------------------------------------------------------------
// Step 1: URL we send the customer to
// ------------------------------------------------------------
const buildAuthUrl = (state) => {
  const { appId, redirectUri } = getConfig();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: INSTAGRAM_LOGIN_SCOPES.join(","),
    state,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
};

// ------------------------------------------------------------
// Step 2: code -> short-lived token (valid ~1 hour)
// ------------------------------------------------------------
const exchangeCodeForToken = async (code) => {
  const { appId, appSecret, redirectUri } = getConfig();

  const body = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    // Instagram sometimes appends "#_" to the code - never part of it
    code: String(code).replace(/#_$/, ""),
  });

  const res = await axios.post(
    "https://api.instagram.com/oauth/access_token",
    body.toString(),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: REQUEST_TIMEOUT_MS,
    }
  );

  // Response is either { access_token, user_id } or { data: [ {...} ] }
  const d = Array.isArray(res.data?.data) ? res.data.data[0] : res.data;
  if (!d?.access_token) throw new Error("Instagram did not return a token");

  return {
    accessToken: d.access_token,
    userId: d.user_id ? String(d.user_id) : null,
  };
};

// ------------------------------------------------------------
// Step 3: short-lived -> long-lived token (60 days)
// ------------------------------------------------------------
const getLongLivedToken = async (shortToken) => {
  const { appSecret } = getConfig();

  // Meta's docs say GET https://graph.instagram.com/access_token. Some apps get
  // "Unsupported request - method type: ..." for it, so we try every sensible
  // variant and record what each one returned (never the secret/token itself).
  const secrets = [["instagram-secret", appSecret]];
  if (process.env.META_APP_SECRET && process.env.META_APP_SECRET !== appSecret) {
    secrets.push(["meta-secret", process.env.META_APP_SECRET]);
  }

  const attempts = [];

  for (const [secretName, secret] of secrets) {
    const fields = {
      grant_type: "ig_exchange_token",
      client_secret: secret,
      access_token: shortToken,
    };

    for (const method of ["GET", "POST"]) {
      try {
        const res =
          method === "GET"
            ? await axios.get(`${IG_GRAPH_ROOT}/access_token`, {
                params: fields,
                timeout: REQUEST_TIMEOUT_MS,
              })
            : await axios.post(
                `${IG_GRAPH_ROOT}/access_token`,
                new URLSearchParams(fields).toString(),
                {
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  timeout: REQUEST_TIMEOUT_MS,
                }
              );

        if (res.data?.access_token) {
          const expiresInSec =
            Number(res.data?.expires_in) || 60 * 24 * 60 * 60;
          return {
            accessToken: res.data.access_token,
            expiresAt: new Date(Date.now() + expiresInSec * 1000),
          };
        }
        attempts.push({ method, secret: secretName, note: "no token in response" });
      } catch (err) {
        const d = extractError(err);
        attempts.push({
          method,
          secret: secretName,
          status: err?.response?.status ?? null,
          code: d.code,
          message: d.message,
          fbtrace: d.fbtrace,
        });
      }
    }
  }

  const first = attempts[0] || {};
  const error = new Error(
    `Instagram refused to issue a long-lived token (${first.message || "no response"})`
  );
  error.attempts = attempts;
  throw error;
};

// ------------------------------------------------------------
// Refresh a long-lived token (must be >24h old and not expired yet)
// ------------------------------------------------------------
const refreshLongLivedToken = async (token) => {
  const res = await axios.get(`${IG_GRAPH_ROOT}/refresh_access_token`, {
    params: { grant_type: "ig_refresh_token", access_token: token },
    timeout: REQUEST_TIMEOUT_MS,
  });

  const expiresInSec = Number(res.data?.expires_in) || 60 * 24 * 60 * 60;
  return {
    accessToken: res.data.access_token,
    expiresAt: new Date(Date.now() + expiresInSec * 1000),
  };
};

// ------------------------------------------------------------
// Who is this? `user_id` is the professional account ID - the same ID
// Meta sends as `entry.id` in webhooks.
// ------------------------------------------------------------
const getMyAccount = async (token) => {
  let res;
  try {
    res = await axios.get(`${IG_GRAPH}/me`, {
      params: {
        fields: "user_id,username,name,account_type",
        access_token: token,
      },
      timeout: REQUEST_TIMEOUT_MS,
    });
  } catch (firstErr) {
    // Retry without a version in the path and with only the basic fields
    res = await axios
      .get(`${IG_GRAPH_ROOT}/me`, {
        params: {
          fields: "user_id,username,account_type",
          access_token: token,
        },
        timeout: REQUEST_TIMEOUT_MS,
      })
      .catch(() => {
        throw firstErr;
      });
  }

  const d = res.data || {};
  return {
    id: String(d.user_id || d.id),
    username: d.username || null,
    name: d.name || null,
    accountType: d.account_type || null, // BUSINESS | MEDIA_CREATOR
  };
};

// ------------------------------------------------------------
// Webhooks: tell Meta to send this account's DMs to our callback URL
// ------------------------------------------------------------
const subscribeAccount = async (token) => {
  const res = await axios.post(`${IG_GRAPH}/me/subscribed_apps`, null, {
    params: { subscribed_fields: IG_SUBSCRIBED_FIELDS, access_token: token },
    timeout: REQUEST_TIMEOUT_MS,
  });
  return res.data;
};

const unsubscribeAccount = async (token) => {
  const res = await axios.delete(`${IG_GRAPH}/me/subscribed_apps`, {
    params: { access_token: token },
    timeout: REQUEST_TIMEOUT_MS,
  });
  return res.data;
};

// ------------------------------------------------------------
// Send a text DM  (recipient = IGSID)
// Returns { success, data } | { success: false, error } - never throws,
// same contract as facebookService.sendInstagramText.
// ------------------------------------------------------------
const sendInstagramLoginText = async (token, igsid, text) => {
  if (!text || !String(text).trim()) {
    return { success: false, error: { message: "Message is empty" } };
  }
  if (Buffer.byteLength(String(text), "utf8") > INSTAGRAM_TEXT_LIMIT_BYTES) {
    return {
      success: false,
      error: {
        message:
          "Instagram messages can be at most 1000 bytes (about 1000 English characters, fewer in other languages)",
      },
    };
  }

  try {
    const res = await axios.post(
      `${IG_GRAPH}/me/messages`,
      { recipient: { id: igsid }, message: { text: String(text) } },
      { params: { access_token: token }, timeout: REQUEST_TIMEOUT_MS }
    );
    return { success: true, data: res.data }; // { recipient_id, message_id }
  } catch (err) {
    return { success: false, error: extractError(err) };
  }
};

// Name + picture of the person who messaged us (best effort)
const getInstagramLoginUserProfile = async (token, igsid) => {
  try {
    const res = await axios.get(`${IG_GRAPH}/${igsid}`, {
      params: { fields: "name,username,profile_pic", access_token: token },
      timeout: 4000,
    });
    const d = res.data || {};
    const name = d.name || (d.username ? `@${d.username}` : null);
    return { name, profilePic: d.profile_pic || null };
  } catch (err) {
    return null;
  }
};

module.exports = {
  INSTAGRAM_LOGIN_SCOPES,
  INSTAGRAM_TEXT_LIMIT_BYTES,
  isConfigured,
  extractError,
  isTokenError,
  createState,
  verifyState,
  buildAuthUrl,
  exchangeCodeForToken,
  getLongLivedToken,
  refreshLongLivedToken,
  getMyAccount,
  subscribeAccount,
  unsubscribeAccount,
  sendInstagramLoginText,
  getInstagramLoginUserProfile,
};
