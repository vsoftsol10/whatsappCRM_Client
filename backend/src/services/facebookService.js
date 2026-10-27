
// // ============================================================
// // FACEBOOK / MESSENGER SERVICE
// // Thin wrapper around the Meta Graph API for Facebook Pages.
// // Nothing here touches the database - it only talks to Meta.
// // ============================================================
// const axios = require("axios");

// const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION || "v23.0";
// const GRAPH = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// const REQUEST_TIMEOUT_MS = 15000;

// // Meta has to download the file before it answers, so attachments get longer.
// const ATTACHMENT_TIMEOUT_MS = 45000;

// // Page webhook fields every connected Page is subscribed to.
// //   messages        -> people messaging the Page
// //   message_echoes  -> messages sent from the Page itself
// //                      (Meta Business Suite / Page inbox)
// const PAGE_SUBSCRIBED_FIELDS = "messages,message_echoes";

// // Messenger text limit is 2000 characters per message.
// const MESSENGER_TEXT_LIMIT = 2000;

// // Instagram text limit is 1000 bytes (UTF-8) per message.
// const INSTAGRAM_TEXT_LIMIT_BYTES = 1000;

// const extractError = (err) => {
//   const e = err?.response?.data?.error;
//   return {
//     message: e?.message || err?.message || "Unknown Facebook error",
//     code: e?.code ?? null,
//     subcode: e?.error_subcode ?? null,
//     type: e?.type ?? null,
//   };
// };

// // Error 190 = the access token is invalid / expired / revoked.
// const isTokenError = (error) => !!error && error.code === 190;

// // Error 10 + these subcodes = outside the 24 hour messaging window
// // (2018278 = Messenger, 2534022 = Instagram).
// const OUTSIDE_WINDOW_SUBCODES = [2018278, 2534022];
// const isOutsideWindowError = (error) =>
//   !!error && error.code === 10 && OUTSIDE_WINDOW_SUBCODES.includes(error.subcode);

// // ---------------------------------------------------------------
// // OAUTH
// // ---------------------------------------------------------------

// // Exchange the `code` returned by FB.login() for a user access token.
// //
// // A code from the JavaScript SDK popup can be tied to a redirect_uri that we
// // do not know. Meta then answers with error 100 / subcode 36008 ("redirect_uri
// // is identical to the one you used in the OAuth dialog request"). When that
// // happens we retry with the values that are known to match: an empty
// // redirect_uri first, then the CRM's own address.
// const exchangeCodeForToken = async (code) => {
//   const base = {
//     client_id: process.env.META_APP_ID,
//     client_secret: process.env.META_APP_SECRET,
//     code,
//   };

//   // FRONTEND_URL can hold several comma-separated addresses (see server.js)
//   const origins = (process.env.FRONTEND_URL || "")
//     .split(",")
//     .map((o) => o.trim().replace(/\/+$/, ""))
//     .filter(Boolean);
//   const candidates = ["", ...origins.flatMap((o) => [o, `${o}/`])];

//   let lastError;
//   for (const redirectUri of candidates) {
//     try {
//       const res = await axios.get(`${GRAPH}/oauth/access_token`, {
//         params: { ...base, redirect_uri: redirectUri },
//         timeout: REQUEST_TIMEOUT_MS,
//       });
//       console.log(
//         "Facebook code exchange succeeded (redirect_uri:",
//         JSON.stringify(redirectUri),
//         ")"
//       );
//       return res.data.access_token;
//     } catch (err) {
//       lastError = err;
//       const detail = extractError(err);
//       const isRedirectMismatch = detail.code === 100 && detail.subcode === 36008;
//       if (!isRedirectMismatch) throw err; // a different problem - stop here
//     }
//   }
//   throw lastError;
// };

// // Turn a user token into a long-lived one (~60 days). Page tokens obtained
// // from a long-lived user token do not expire. Falls back to the original
// // token if Meta refuses (a code-flow token is often already long-lived).
// const extendUserToken = async (userToken) => {
//   try {
//     const res = await axios.get(`${GRAPH}/oauth/access_token`, {
//       params: {
//         grant_type: "fb_exchange_token",
//         client_id: process.env.META_APP_ID,
//         client_secret: process.env.META_APP_SECRET,
//         fb_exchange_token: userToken,
//       },
//       timeout: REQUEST_TIMEOUT_MS,
//     });
//     return res.data.access_token || userToken;
//   } catch (err) {
//     console.warn(
//       "Facebook long-lived token exchange skipped:",
//       extractError(err).message
//     );
//     return userToken;
//   }
// };

// // All Pages the person granted access to, each with its own Page token.
// const getManagedPages = async (userToken) => {
//   const pages = [];
//   let url = `${GRAPH}/me/accounts`;
//   let params = {
//     fields: "id,name,access_token,tasks",
//     limit: 100,
//     access_token: userToken,
//   };

//   // Follow pagination (max 10 result pages as a safety stop).
//   for (let i = 0; i < 10 && url; i++) {
//     const res = await axios.get(url, { params, timeout: REQUEST_TIMEOUT_MS });
//     for (const p of res.data?.data || []) {
//       if (p?.id && p?.access_token) pages.push(p);
//     }
//     url = res.data?.paging?.next || null;
//     params = undefined; // `next` already contains every query param
//   }

//   return pages;
// };

// // ---------------------------------------------------------------
// // PAGE SUBSCRIPTION
// // ---------------------------------------------------------------

// const subscribePageToApp = async (pageId, pageToken) => {
//   const res = await axios.post(`${GRAPH}/${pageId}/subscribed_apps`, null, {
//     params: {
//       subscribed_fields: PAGE_SUBSCRIBED_FIELDS,
//       access_token: pageToken,
//     },
//     timeout: REQUEST_TIMEOUT_MS,
//   });
//   return res.data;
// };

// const unsubscribePageFromApp = async (pageId, pageToken) => {
//   const res = await axios.delete(`${GRAPH}/${pageId}/subscribed_apps`, {
//     params: { access_token: pageToken },
//     timeout: REQUEST_TIMEOUT_MS,
//   });
//   return res.data;
// };

// // ---------------------------------------------------------------
// // MESSENGER SEND API
// // ---------------------------------------------------------------

// // Returns { success: true, data } or { success: false, error: {...} }
// const sendMessengerText = async (pageToken, psid, text) => {
//   if (!text || !String(text).trim()) {
//     return { success: false, error: { message: "Message is empty" } };
//   }
//   if (String(text).length > MESSENGER_TEXT_LIMIT) {
//     return {
//       success: false,
//       error: {
//         message: `Messenger messages can be at most ${MESSENGER_TEXT_LIMIT} characters`,
//       },
//     };
//   }

//   try {
//     const res = await axios.post(
//       `${GRAPH}/me/messages`,
//       {
//         recipient: { id: psid },
//         messaging_type: "RESPONSE",
//         message: { text: String(text) },
//       },
//       {
//         params: { access_token: pageToken },
//         timeout: REQUEST_TIMEOUT_MS,
//       }
//     );
//     return { success: true, data: res.data }; // { recipient_id, message_id }
//   } catch (err) {
//     return { success: false, error: extractError(err) };
//   }
// };

// // ---------------------------------------------------------------
// // USER PROFILE (best effort)
// // Name / picture only come back when the app has "Business Asset User
// // Profile Access". If it is not available we simply return null.
// // ---------------------------------------------------------------
// const getUserProfile = async (pageToken, psid) => {
//   try {
//     const res = await axios.get(`${GRAPH}/${psid}`, {
//       params: {
//         fields: "name,first_name,last_name,profile_pic",
//         access_token: pageToken,
//       },
//       timeout: 4000,
//     });
//     const d = res.data || {};
//     const name =
//       d.name || [d.first_name, d.last_name].filter(Boolean).join(" ") || null;
//     return { name, profilePic: d.profile_pic || null };
//   } catch (err) {
//     return null;
//   }
// };

// // ---------------------------------------------------------------
// // INSTAGRAM (professional account linked to a Facebook Page)
// // ---------------------------------------------------------------

// // Which Instagram professional account (if any) is linked to this Page.
// // Returns { account: { id, username } | null, error: {...} | null }
// const getLinkedInstagramAccount = async (pageId, pageToken) => {
//   try {
//     const res = await axios.get(`${GRAPH}/${pageId}`, {
//       params: {
//         fields: "instagram_business_account{id,username}",
//         access_token: pageToken,
//       },
//       timeout: REQUEST_TIMEOUT_MS,
//     });

//     const ig = res.data?.instagram_business_account;
//     if (!ig?.id) return { account: null, error: null };

//     return {
//       account: { id: String(ig.id), username: ig.username || null },
//       error: null,
//     };
//   } catch (err) {
//     return { account: null, error: extractError(err) };
//   }
// };

// // Instagram DM through the linked Page:  POST /{page-id}/messages
// // Returns { success: true, data } or { success: false, error: {...} }
// const sendInstagramText = async (pageToken, pageId, igsid, text) => {
//   if (!text || !String(text).trim()) {
//     return { success: false, error: { message: "Message is empty" } };
//   }
//   if (Buffer.byteLength(String(text), "utf8") > INSTAGRAM_TEXT_LIMIT_BYTES) {
//     return {
//       success: false,
//       error: {
//         message:
//           "Instagram messages can be at most 1000 bytes (about 1000 English characters, fewer in other languages)",
//       },
//     };
//   }

//   try {
//     const res = await axios.post(
//       `${GRAPH}/${pageId}/messages`,
//       {
//         recipient: { id: igsid },
//         message: { text: String(text) },
//       },
//       {
//         params: { access_token: pageToken },
//         timeout: REQUEST_TIMEOUT_MS,
//       }
//     );
//     return { success: true, data: res.data }; // { recipient_id, message_id }
//   } catch (err) {
//     return { success: false, error: extractError(err) };
//   }
// };

// // ---------------------------------------------------------------
// // ATTACHMENTS (image / video / audio / file)
// // Meta downloads the file from a PUBLIC https url, so the caller must pass
// // a stored url (we use the Cloudinary link). Captions cannot ride along with
// // an attachment on Messenger / Instagram - send them as a separate text.
// // Returns { success: true, data } or { success: false, error: {...} }
// // ---------------------------------------------------------------
// const ATTACHMENT_TYPES = ["image", "video", "audio", "file"];

// const buildAttachmentMessage = (type, url) => ({
//   attachment: { type, payload: { url, is_reusable: false } },
// });

// const sendMessengerAttachment = async (pageToken, psid, type, url) => {
//   if (!ATTACHMENT_TYPES.includes(type) || !url) {
//     return { success: false, error: { message: "Invalid attachment" } };
//   }

//   try {
//     const res = await axios.post(
//       `${GRAPH}/me/messages`,
//       {
//         recipient: { id: psid },
//         messaging_type: "RESPONSE",
//         message: buildAttachmentMessage(type, url),
//       },
//       {
//         params: { access_token: pageToken },
//         timeout: ATTACHMENT_TIMEOUT_MS,
//       }
//     );
//     return { success: true, data: res.data }; // { recipient_id, message_id }
//   } catch (err) {
//     return { success: false, error: extractError(err) };
//   }
// };

// // Instagram through the linked Page:  POST /{page-id}/messages
// const sendInstagramAttachment = async (pageToken, pageId, igsid, type, url) => {
//   if (!ATTACHMENT_TYPES.includes(type) || !url) {
//     return { success: false, error: { message: "Invalid attachment" } };
//   }

//   try {
//     const res = await axios.post(
//       `${GRAPH}/${pageId}/messages`,
//       {
//         recipient: { id: igsid },
//         message: buildAttachmentMessage(type, url),
//       },
//       {
//         params: { access_token: pageToken },
//         timeout: ATTACHMENT_TIMEOUT_MS,
//       }
//     );
//     return { success: true, data: res.data };
//   } catch (err) {
//     return { success: false, error: extractError(err) };
//   }
// };

// // Name / username of the person on Instagram (best effort).
// const getInstagramUserProfile = async (pageToken, igsid) => {
//   try {
//     const res = await axios.get(`${GRAPH}/${igsid}`, {
//       params: {
//         fields: "name,username,profile_pic",
//         access_token: pageToken,
//       },
//       timeout: 4000,
//     });
//     const d = res.data || {};
//     const name = d.name || (d.username ? `@${d.username}` : null);
//     return { name, profilePic: d.profile_pic || null };
//   } catch (err) {
//     return null;
//   }
// };

// module.exports = {
//   INSTAGRAM_TEXT_LIMIT_BYTES,
//   getLinkedInstagramAccount,
//   sendInstagramText,
//   getInstagramUserProfile,
//   GRAPH_API_VERSION,
//   PAGE_SUBSCRIBED_FIELDS,
//   MESSENGER_TEXT_LIMIT,
//   extractError,
//   isTokenError,
//   isOutsideWindowError,
//   exchangeCodeForToken,
//   extendUserToken,
//   getManagedPages,
//   subscribePageToApp,
//   unsubscribePageFromApp,
//   sendMessengerText,
//   sendMessengerAttachment,
//   sendInstagramAttachment,
//   getUserProfile,
// };
 


// ============================================================
// FACEBOOK / MESSENGER SERVICE
// Thin wrapper around the Meta Graph API for Facebook Pages.
// Nothing here touches the database - it only talks to Meta.
//
// DIAGNOSTIC VERSION: all original logic is unchanged. Only logging was
// added (search for "DIAGNOSTIC") to find out why the Instagram account is
// not returned when connecting through the Facebook button.
// ============================================================
const axios = require("axios");

const GRAPH_API_VERSION = process.env.META_GRAPH_VERSION || "v23.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

const REQUEST_TIMEOUT_MS = 15000;

// Meta has to download the file before it answers, so attachments get longer.
const ATTACHMENT_TIMEOUT_MS = 45000;

// Page webhook fields every connected Page is subscribed to.
//   messages        -> people messaging the Page
//   message_echoes  -> messages sent from the Page itself
//                      (Meta Business Suite / Page inbox)
const PAGE_SUBSCRIBED_FIELDS = "messages,message_echoes";

// Messenger text limit is 2000 characters per message.
const MESSENGER_TEXT_LIMIT = 2000;

// Instagram text limit is 1000 bytes (UTF-8) per message.
const INSTAGRAM_TEXT_LIMIT_BYTES = 1000;

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

// Error 10 + these subcodes = outside the 24 hour messaging window
// (2018278 = Messenger, 2534022 = Instagram).
const OUTSIDE_WINDOW_SUBCODES = [2018278, 2534022];
const isOutsideWindowError = (error) =>
  !!error && error.code === 10 && OUTSIDE_WINDOW_SUBCODES.includes(error.subcode);

// ---------------------------------------------------------------
// OAUTH
// ---------------------------------------------------------------

// Exchange the `code` returned by FB.login() for a user access token.
//
// A code from the JavaScript SDK popup can be tied to a redirect_uri that we
// do not know. Meta then answers with error 100 / subcode 36008 ("redirect_uri
// is identical to the one you used in the OAuth dialog request"). When that
// happens we retry with the values that are known to match: an empty
// redirect_uri first, then the CRM's own address.
const exchangeCodeForToken = async (code) => {
  const base = {
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    code,
  };

  // FRONTEND_URL can hold several comma-separated addresses (see server.js)
  const origins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  const candidates = ["", ...origins.flatMap((o) => [o, `${o}/`])];

  let lastError;
  for (const redirectUri of candidates) {
    try {
      const res = await axios.get(`${GRAPH}/oauth/access_token`, {
        params: { ...base, redirect_uri: redirectUri },
        timeout: REQUEST_TIMEOUT_MS,
      });
      console.log(
        "Facebook code exchange succeeded (redirect_uri:",
        JSON.stringify(redirectUri),
        ")"
      );
      return res.data.access_token;
    } catch (err) {
      lastError = err;
      const detail = extractError(err);
      const isRedirectMismatch = detail.code === 100 && detail.subcode === 36008;
      if (!isRedirectMismatch) throw err; // a different problem - stop here
    }
  }
  throw lastError;
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

// ---------------------------------------------------------------
// DIAGNOSTIC (log only - never changes behaviour, never throws)
// Prints which permissions the token really has, and for which assets
// (Pages / Instagram accounts) they were granted. This shows whether the
// Instagram account was shared in the Facebook login dialog.
// ---------------------------------------------------------------
const logTokenDiagnostics = async (userToken) => {
  try {
    // 1) Permissions granted / declined
    const permRes = await axios.get(`${GRAPH}/me/permissions`, {
      params: { access_token: userToken },
      timeout: REQUEST_TIMEOUT_MS,
    });
    const perms = permRes.data?.data || [];
    const granted = perms.filter((p) => p.status === "granted").map((p) => p.permission);
    const declined = perms.filter((p) => p.status !== "granted").map((p) => p.permission);
    console.log("[FB DIAG] granted permissions:", granted.join(", ") || "(none)");
    if (declined.length) {
      console.log("[FB DIAG] declined/expired permissions:", declined.join(", "));
    }

    const needed = [
      "pages_show_list",
      "pages_messaging",
      "pages_manage_metadata",
      "pages_read_engagement",
      "instagram_basic",
      "instagram_manage_messages",
    ];
    const missing = needed.filter((n) => !granted.includes(n));
    if (missing.length) {
      console.log(
        "[FB DIAG] MISSING permissions (add them to the Facebook Login for Business Configuration):",
        missing.join(", ")
      );
    }

    // 2) Which assets each permission was granted for (granular scopes)
    if (process.env.META_APP_ID && process.env.META_APP_SECRET) {
      const dbg = await axios.get(`${GRAPH}/debug_token`, {
        params: {
          input_token: userToken,
          access_token: `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`,
        },
        timeout: REQUEST_TIMEOUT_MS,
      });
      const granular = dbg.data?.data?.granular_scopes || [];
      for (const g of granular) {
        if (
          g.scope === "instagram_basic" ||
          g.scope === "instagram_manage_messages" ||
          g.scope === "pages_show_list"
        ) {
          console.log(
            `[FB DIAG] ${g.scope} granted for asset ids:`,
            (g.target_ids || []).join(", ") || "(all / none listed)"
          );
        }
      }
    }
  } catch (err) {
    console.log("[FB DIAG] could not read token diagnostics:", extractError(err).message);
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

  // DIAGNOSTIC: log only
  console.log(
    "[FB DIAG] pages returned by Meta:",
    pages.map((p) => `${p.name} (${p.id})`).join(" | ") || "(none)"
  );
  await logTokenDiagnostics(userToken);

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

  // ADDED (best effort, never throws, never changes the return value):
  // 1) log what Meta now shows for this Page
  // 2) also subscribe the linked Instagram account itself to the app's
  //    "messages" webhook. The "Connect Instagram" button does this for its
  //    own account; the Facebook route only subscribed the Page.
  await subscribeLinkedInstagramBestEffort(pageId, pageToken);

  return res.data;
};

const subscribeLinkedInstagramBestEffort = async (pageId, pageToken) => {
  // 1) DIAGNOSTIC: what is the Page subscribed to now?
  try {
    const check = await axios.get(`${GRAPH}/${pageId}/subscribed_apps`, {
      params: { access_token: pageToken },
      timeout: REQUEST_TIMEOUT_MS,
    });
    console.log("[FB DIAG] subscribed_apps for page", pageId, JSON.stringify(check.data));
  } catch (e) {
    console.log("[FB DIAG] subscribed_apps check failed:", extractError(e).message);
  }

  // 2) Subscribe the linked Instagram account (if there is one)
  try {
    const lookup = await axios.get(`${GRAPH}/${pageId}`, {
      params: {
        fields: "instagram_business_account{id,username}",
        access_token: pageToken,
      },
      timeout: REQUEST_TIMEOUT_MS,
    });
    const igId = lookup.data?.instagram_business_account?.id;
    if (!igId) {
      console.log("[IG subscribe] no linked Instagram account on page", pageId, "- skipped");
      return;
    }

    const sub = await axios.post(`${GRAPH}/${igId}/subscribed_apps`, null, {
      params: {
        subscribed_fields: "messages",
        access_token: pageToken,
      },
      timeout: REQUEST_TIMEOUT_MS,
    });
    console.log("[IG subscribe] subscribed Instagram", igId, "->", JSON.stringify(sub.data));

    try {
      const igCheck = await axios.get(`${GRAPH}/${igId}/subscribed_apps`, {
        params: { access_token: pageToken },
        timeout: REQUEST_TIMEOUT_MS,
      });
      console.log("[IG subscribe] subscribed_apps for Instagram", igId, JSON.stringify(igCheck.data));
    } catch (e) {
      console.log("[IG subscribe] read-back failed:", extractError(e).message);
    }
  } catch (e) {
    console.log("[IG subscribe] failed (Page subscription is unaffected):", JSON.stringify(extractError(e)));
  }
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

// ---------------------------------------------------------------
// INSTAGRAM (professional account linked to a Facebook Page)
// ---------------------------------------------------------------

// Which Instagram professional account (if any) is linked to this Page.
// Returns { account: { id, username } | null, error: {...} | null }
const getLinkedInstagramAccount = async (pageId, pageToken) => {
  try {
    const res = await axios.get(`${GRAPH}/${pageId}`, {
      params: {
        fields: "instagram_business_account{id,username}",
        access_token: pageToken,
      },
      timeout: REQUEST_TIMEOUT_MS,
    });

    // DIAGNOSTIC: log exactly what Meta returned for this Page
    console.log("[IG lookup]", pageId, JSON.stringify(res.data));

    const ig = res.data?.instagram_business_account;
    if (!ig?.id) {
      // DIAGNOSTIC: second look, log only (result is NOT used)
      try {
        const alt = await axios.get(`${GRAPH}/${pageId}`, {
          params: {
            fields: "connected_instagram_account{id,username}",
            access_token: pageToken,
          },
          timeout: REQUEST_TIMEOUT_MS,
        });
        console.log("[IG lookup][connected_instagram_account]", pageId, JSON.stringify(alt.data));
      } catch (altErr) {
        console.log(
          "[IG lookup][connected_instagram_account] failed:",
          extractError(altErr).message
        );
      }
      console.log(
        "[IG lookup] No instagram_business_account returned. Most likely: " +
          "(1) Instagram account was not selected in the Facebook login dialog, " +
          "(2) instagram_basic / instagram_manage_messages missing in the Configuration, " +
          "(3) Instagram is not Professional or not linked to this Page."
      );
      return { account: null, error: null };
    }

    return {
      account: { id: String(ig.id), username: ig.username || null },
      error: null,
    };
  } catch (err) {
    // DIAGNOSTIC: log only
    console.log("[IG lookup] ERROR for page", pageId, JSON.stringify(extractError(err)));
    return { account: null, error: extractError(err) };
  }
};

// Instagram DM through the linked Page:  POST /{page-id}/messages
// Returns { success: true, data } or { success: false, error: {...} }
const sendInstagramText = async (pageToken, pageId, igsid, text) => {
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
      `${GRAPH}/${pageId}/messages`,
      {
        recipient: { id: igsid },
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
// ATTACHMENTS (image / video / audio / file)
// Meta downloads the file from a PUBLIC https url, so the caller must pass
// a stored url (we use the Cloudinary link). Captions cannot ride along with
// an attachment on Messenger / Instagram - send them as a separate text.
// Returns { success: true, data } or { success: false, error: {...} }
// ---------------------------------------------------------------
const ATTACHMENT_TYPES = ["image", "video", "audio", "file"];

const buildAttachmentMessage = (type, url) => ({
  attachment: { type, payload: { url, is_reusable: false } },
});

const sendMessengerAttachment = async (pageToken, psid, type, url) => {
  if (!ATTACHMENT_TYPES.includes(type) || !url) {
    return { success: false, error: { message: "Invalid attachment" } };
  }

  try {
    const res = await axios.post(
      `${GRAPH}/me/messages`,
      {
        recipient: { id: psid },
        messaging_type: "RESPONSE",
        message: buildAttachmentMessage(type, url),
      },
      {
        params: { access_token: pageToken },
        timeout: ATTACHMENT_TIMEOUT_MS,
      }
    );
    return { success: true, data: res.data }; // { recipient_id, message_id }
  } catch (err) {
    return { success: false, error: extractError(err) };
  }
};

// Instagram through the linked Page:  POST /{page-id}/messages
const sendInstagramAttachment = async (pageToken, pageId, igsid, type, url) => {
  if (!ATTACHMENT_TYPES.includes(type) || !url) {
    return { success: false, error: { message: "Invalid attachment" } };
  }

  try {
    const res = await axios.post(
      `${GRAPH}/${pageId}/messages`,
      {
        recipient: { id: igsid },
        message: buildAttachmentMessage(type, url),
      },
      {
        params: { access_token: pageToken },
        timeout: ATTACHMENT_TIMEOUT_MS,
      }
    );
    return { success: true, data: res.data };
  } catch (err) {
    return { success: false, error: extractError(err) };
  }
};

// Name / username of the person on Instagram (best effort).
const getInstagramUserProfile = async (pageToken, igsid) => {
  try {
    const res = await axios.get(`${GRAPH}/${igsid}`, {
      params: {
        fields: "name,username,profile_pic",
        access_token: pageToken,
      },
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
  INSTAGRAM_TEXT_LIMIT_BYTES,
  getLinkedInstagramAccount,
  sendInstagramText,
  getInstagramUserProfile,
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
  sendMessengerAttachment,
  sendInstagramAttachment,
  getUserProfile,
};