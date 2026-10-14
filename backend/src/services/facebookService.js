// ============================================================
// FACEBOOK / MESSENGER SERVICE
// Thin wrapper around the Meta Graph API for Facebook Pages.
// Nothing here touches the database - it only talks to Meta.
// ============================================================
const axios = require("axios");

const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION || "v23.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const REQUEST_TIMEOUT_MS = 15000;

// Page webhook fields every connected Page is subscribed to.
//   messages        -> people messaging the Page
//   message_echoes  -> messages sent from the Page itself
//                      (Meta Business Suite / Page inbox)
const PAGE_SUBSCRIBED_FIELDS = "messages,message_echoes";

// Messenger text limit is 2000 characters per message.
const MESSENGER_TEXT_LIMIT = 2000;

const extractError = (err) => {
  const e = err?.response?.data?.error;
  return {
    message: e?.message || err?.message || "Unknown Facebook error",
    code: e?.code ?? null,
    subcode: e?.error_subcode ?? null,
    type: e?.type ?? null,
  };
};

// Error 190 = the access token is invalid / expired / revoked.
const isTokenError = (error) => !!error && error.code === 190;

// Error 10 + subcode 2018278 = outside the 24 hour messaging window.
const isOutsideWindowError = (error) =>
  !!error && error.code === 10 && error.subcode === 2018278;

// ---------------------------------------------------------------
// OAUTH
// ---------------------------------------------------------------

// Exchange the `code` returned by FB.login() for a user access token.
const exchangeCodeForToken = async (code) => {
  const res = await axios.get(`${GRAPH}/oauth/access_token`, {
    params: {
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      code,
    },
    timeout: REQUEST_TIMEOUT_MS,
  });
  return res.data.access_token;
};

// Turn a user token into a long-lived one (~60 days). Page tokens obtained
// from a long-lived user token do not expire. Falls back to the original
// token if Meta refuses (a code-flow token is often already long-lived).
const extendUserToken = async (userToken) => {
  try {
    const res = await axios.get(`${GRAPH}/oauth/access_token`, {
      params: {
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: userToken,
      },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return res.data.access_token || userToken;
  } catch (err) {
    console.warn(
      "Facebook long-lived token exchange skipped:",
      extractError(err).message
    );
    return userToken;
  }
};

// All Pages the person granted access to, each with its own Page token.
const getManagedPages = async (userToken) => {
  const pages = [];
  let url = `${GRAPH}/me/accounts`;
  let params = {
    fields: "id,name,access_token,tasks",
    limit: 100,
    access_token: userToken,
  };

  // Follow pagination (max 10 result pages as a safety stop).
  for (let i = 0; i < 10 && url; i++) {
    const res = await axios.get(url, { params, timeout: REQUEST_TIMEOUT_MS });
    for (const p of res.data?.data || []) {
      if (p?.id && p?.access_token) pages.push(p);
    }
    url = res.data?.paging?.next || null;
    params = undefined; // `next` already contains every query param
  }

  return pages;
};

// ---------------------------------------------------------------
// PAGE SUBSCRIPTION
// ---------------------------------------------------------------

const subscribePageToApp = async (pageId, pageToken) => {
  const res = await axios.post(`${GRAPH}/${pageId}/subscribed_apps`, null, {
    params: {
      subscribed_fields: PAGE_SUBSCRIBED_FIELDS,
      access_token: pageToken,
    },
    timeout: REQUEST_TIMEOUT_MS,
  });
  return res.data;
};

const unsubscribePageFromApp = async (pageId, pageToken) => {
  const res = await axios.delete(`${GRAPH}/${pageId}/subscribed_apps`, {
    params: { access_token: pageToken },
    timeout: REQUEST_TIMEOUT_MS,
  });
  return res.data;
};

// ---------------------------------------------------------------
// MESSENGER SEND API
// ---------------------------------------------------------------

// Returns { success: true, data } or { success: false, error: {...} }
const sendMessengerText = async (pageToken, psid, text) => {
  if (!text || !String(text).trim()) {
    return { success: false, error: { message: "Message is empty" } };
  }
  if (String(text).length > MESSENGER_TEXT_LIMIT) {
    return {
      success: false,
      error: {
        message: `Messenger messages can be at most ${MESSENGER_TEXT_LIMIT} characters`,
      },
    };
  }

  try {
    const res = await axios.post(
      `${GRAPH}/me/messages`,
      {
        recipient: { id: psid },
        messaging_type: "RESPONSE",
        message: { text: String(text) },
      },
      {
        params: { access_token: pageToken },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );
    return { success: true, data: res.data }; // { recipient_id, message_id }
  } catch (err) {
    return { success: false, error: extractError(err) };
  }
};

// ---------------------------------------------------------------
// USER PROFILE (best effort)
// Name / picture only come back when the app has "Business Asset User
// Profile Access". If it is not available we simply return null.
// ---------------------------------------------------------------
const getUserProfile = async (pageToken, psid) => {
  try {
    const res = await axios.get(`${GRAPH}/${psid}`, {
      params: {
        fields: "name,first_name,last_name,profile_pic",
        access_token: pageToken,
      },
      timeout: 4000,
    });
    const d = res.data || {};
    const name =
      d.name || [d.first_name, d.last_name].filter(Boolean).join(" ") || null;
    return { name, profilePic: d.profile_pic || null };
  } catch (err) {
    return null;
  }
};

module.exports = {
  GRAPH_API_VERSION,
  PAGE_SUBSCRIBED_FIELDS,
  MESSENGER_TEXT_LIMIT,
  extractError,
  isTokenError,
  isOutsideWindowError,
  exchangeCodeForToken,
  extendUserToken,
  getManagedPages,
  subscribePageToApp,
  unsubscribePageFromApp,
  sendMessengerText,
  getUserProfile,
};
