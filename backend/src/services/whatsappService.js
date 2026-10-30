
// const axios = require("axios");

// const GRAPH_API_VERSION = "v23.0";

// // ============================================
// // SEND TEXT MESSAGE
// // ============================================
// const sendTextMessage = async (to, message, whatsappAccount) => {
//   console.log("Sending to:", to);
//   console.log("sendTextMessage called with:", {
//     to,
//     message,
//     whatsappAccountId: whatsappAccount?.id,
//   });

//   if (!to || typeof to !== "string" || !to.trim()) {
//     console.error("WhatsApp recipient number is missing");

//     return {
//       success: false,
//       error: {
//         message: "Recipient phone number is required",
//       },
//     };
//   }

//   if (!whatsappAccount) {
//     return {
//       success: false,
//       error: {
//         message: "WhatsApp account is not connected",
//       },
//     };
//   }

//   if (!whatsappAccount.phoneNumberId) {
//     return {
//       success: false,
//       error: {
//         message: "WhatsApp Phone Number ID is missing",
//       },
//     };
//   }

//   // 👈 CHANGED: no longer checks whatsappAccount.whatsappAccessToken —
//   // the token is shared across every company now, not stored per-account.
//   if (!process.env.META_SYSTEM_USER_TOKEN) {
//     return {
//       success: false,
//       error: {
//         message: "META_SYSTEM_USER_TOKEN is not configured on the server",
//       },
//     };
//   }

//   try {
//     const response = await axios.post(
//       `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/messages`,
//       {
//         messaging_product: "whatsapp",
//         recipient_type: "individual",
//         to: to.trim(),
//         type: "text",
//         text: {
//           preview_url: false,
//           body: message,
//         },
//       },
//       {
//         headers: {
//           // 👈 CHANGED
//           Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log(
//       "WhatsApp API Response:",
//       JSON.stringify(response.data, null, 2)
//     );

//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error("WhatsApp Send Error:");

//     if (error.response) {
//       console.error(error.response.data);
//     } else {
//       console.error(error.message);
//     }

//     return {
//       success: false,
//       error: error.response?.data || error.message,
//     };
//   }
// };

// // ============================================
// // SEND IMAGE MESSAGE
// // ============================================
// // 👈 CHANGED: now takes whatsappAccount instead of relying on
// // process.env.WHATSAPP_PHONE_NUMBER_ID — that env var pointed to ONE
// // hardcoded number for every company, which is wrong for multi-tenant.
// const sendImageMessage = async (to, imageUrl, caption = "", whatsappAccount) => {
//   console.log("Sending Image to:", to);

//   if (!whatsappAccount?.phoneNumberId) {
//     return {
//       success: false,
//       error: { message: "WhatsApp account or Phone Number ID is missing" },
//     };
//   }

//   try {
//     const response = await axios.post(
//       `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/messages`,
//       {
//         messaging_product: "whatsapp",
//         recipient_type: "individual",
//         to: to.trim(),
//         type: "image",
//         image: {
//           link: imageUrl,
//           caption,
//         },
//       },
//       {
//         headers: {
//           // 👈 CHANGED
//           Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return {
//       success: true,
//       data: response.data,
//     };
//   } catch (error) {
//     console.error("WhatsApp Image Error:");

//     if (error.response) {
//       console.error(error.response.data);
//     } else {
//       console.error(error.message);
//     }

//     return {
//       success: false,
//       error: error.response?.data || error.message,
//     };
//   }
// };

// // Meta rejects template body parameters that contain newlines/tabs
// // or 4+ consecutive spaces (error 132018). Clean the text before sending.
// const sanitizeTemplateParam = (text) =>
//   String(text ?? "")
//     .replace(/[\n\r\t]+/g, " ") // newlines/tabs -> single space
//     .replace(/ {2,}/g, " ")     // collapse repeated spaces
//     .trim();

// // ============================================
// // SEND TEMPLATE MESSAGE
// // ============================================
// // 👈 CHANGED: now takes whatsappAccount instead of process.env.WHATSAPP_PHONE_NUMBER_ID
// // FIX: added optional `languageCode` as the LAST argument (default "en_US") so existing
// // callers keep working. Before this, every non-image campaign was sent as en_US,
// // so Tamil (ta) / Hindi (hi) templates failed with "template does not exist".
// const sendTemplateMessage = async (
//   to,
//   templateName,
//   params = [],
//   whatsappAccount,
//   languageCode = "en_US",
//   buttonComponents = [] // 👈 NEW (optional): extra button parameters
// ) => {

//   if (!to || typeof to !== "string" || !to.trim()) {
//     return {
//       success: false,
//       error: {
//         message: "Recipient phone number is required",
//       },
//     };
//   }

//   if (!whatsappAccount?.phoneNumberId) {
//     return {
//       success: false,
//       error: { message: "WhatsApp account or Phone Number ID is missing" },
//     };
//   }

//   try {
//     const response = await axios.post(
//       `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/messages`,
//       {
//         messaging_product: "whatsapp",
//         to : to.trim(),
//         type: "template",
//         template: {
//           name: templateName,
//           language: { code: languageCode || "en_US" },
//           components: [
//             ...(params.length > 0 ? [
//               {
//                 type: "body",
//                 parameters: params.map(p => ({ type: "text", text: sanitizeTemplateParam(p) }))
//               }
//             ] : []),
//             // 👈 NEW: only filled for templates with a copy-code button
//             ...buttonComponents,
//           ]
//         },
//       },
//       {
//         headers: {
//           // 👈 CHANGED
//           Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     return { success: true, data: response.data };
//   } catch (error) {
//     console.error("WhatsApp Template Send Error:", error.response?.data || error.message);
//     return { success: false, error: error.response?.data || error.message };
//   }
// };

// // ============================================
// // SEND CAMPAIGN IMAGE TEMPLATE
// // ============================================
// // 👈 CHANGED: now takes whatsappAccount instead of process.env.WHATSAPP_PHONE_NUMBER_ID
// const sendCampaignImageTemplate = async (to, templateName, imageUrl, params = [], languageCode = "en_US", whatsappAccount, buttonComponents = []) => {

//   if (!to || typeof to !== "string" || !to.trim()) {
//     return {
//       success: false,
//       error: {
//         message: "Recipient phone number is required",
//       },
//     };
//   }

//   if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
//     return {
//       success: false,
//       error: {
//         message: "Image URL is required",
//       },
//     };
//   }

//   if (!whatsappAccount?.phoneNumberId) {
//     return {
//       success: false,
//       error: { message: "WhatsApp account or Phone Number ID is missing" },
//     };
//   }

//   try {
//     const response = await axios.post(
//       `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/messages`,
//       {
//         messaging_product: "whatsapp",
//         to: to.trim(),
//         type: "template",
//         template: {
//           name: templateName,
//           language: { code: languageCode },
//           components: [
//             {
//               type: "header",
//               parameters: [
//                 {
//                   type: "image",
//                   image: { link: imageUrl },
//                 },
//               ],
//             },
//             {
//               type: "body",
//               parameters: params.map((p) => ({
//                 type: "text",
//                 text: sanitizeTemplateParam(p),
//               })),
//             },
//             // 👈 NEW: only filled for templates with a copy-code button
//             ...buttonComponents,
//           ],
//         },
//       },
//       {
//         headers: {
//           // 👈 CHANGED
//           Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return { success: true, data: response.data };
//   } catch (error) {
//     console.error("WhatsApp Image Template Error:", error.response?.data || error.message);
//     return { success: false, error: error.response?.data || error.message };
//   }
// };

// // ============================================
// // UPLOAD MEDIA TO META  (returns a WhatsApp media id)
// // ============================================
// // Used for files an agent attaches in the chat (image / audio / video /
// // document). Uploading the bytes to Meta and sending by media id is more
// // reliable than sending a public link, because Meta does not have to
// // fetch the file from our storage or guess its content type.
// const uploadMediaToMeta = async (buffer, mimeType, fileName, whatsappAccount) => {
//   if (!whatsappAccount?.phoneNumberId) {
//     return {
//       success: false,
//       error: { message: "WhatsApp account or Phone Number ID is missing" },
//     };
//   }

//   if (!process.env.META_SYSTEM_USER_TOKEN) {
//     return {
//       success: false,
//       error: {
//         message: "META_SYSTEM_USER_TOKEN is not configured on the server",
//       },
//     };
//   }

//   try {
//     const form = new FormData();
//     form.append("messaging_product", "whatsapp");
//     form.append("type", mimeType);
//     form.append(
//       "file",
//       new Blob([buffer], { type: mimeType }),
//       fileName || "file"
//     );

//     const response = await axios.post(
//       `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/media`,
//       form,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
//         },
//         maxBodyLength: Infinity,
//         maxContentLength: Infinity,
//       }
//     );

//     if (!response.data?.id) {
//       return {
//         success: false,
//         error: { message: "Meta did not return a media id" },
//       };
//     }

//     return { success: true, mediaId: response.data.id };
//   } catch (error) {
//     console.error("WhatsApp Media Upload Error:");

//     if (error.response) {
//       console.error(error.response.data);
//     } else {
//       console.error(error.message);
//     }

//     return {
//       success: false,
//       error: error.response?.data || error.message,
//     };
//   }
// };

// // ============================================
// // SEND MEDIA MESSAGE (image | audio | video | document)
// // ============================================
// // mediaId comes from uploadMediaToMeta(). Caption is ignored for audio
// // (WhatsApp does not support captions on audio). fileName is only used
// // for documents.
// const sendMediaMessage = async (
//   to,
//   { type, mediaId, caption = "", fileName = "" } = {},
//   whatsappAccount
// ) => {
//   if (!to || typeof to !== "string" || !to.trim()) {
//     return {
//       success: false,
//       error: { message: "Recipient phone number is required" },
//     };
//   }

//   if (!["image", "audio", "video", "document"].includes(type)) {
//     return {
//       success: false,
//       error: { message: `Unsupported media type: ${type}` },
//     };
//   }

//   if (!mediaId) {
//     return { success: false, error: { message: "Media id is required" } };
//   }

//   if (!whatsappAccount?.phoneNumberId) {
//     return {
//       success: false,
//       error: { message: "WhatsApp account or Phone Number ID is missing" },
//     };
//   }

//   if (!process.env.META_SYSTEM_USER_TOKEN) {
//     return {
//       success: false,
//       error: {
//         message: "META_SYSTEM_USER_TOKEN is not configured on the server",
//       },
//     };
//   }

//   const mediaObject = { id: mediaId };

//   if (caption && type !== "audio") {
//     mediaObject.caption = caption;
//   }

//   if (type === "document" && fileName) {
//     mediaObject.filename = fileName;
//   }

//   try {
//     const response = await axios.post(
//       `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/messages`,
//       {
//         messaging_product: "whatsapp",
//         recipient_type: "individual",
//         to: to.trim(),
//         type,
//         [type]: mediaObject,
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     return { success: true, data: response.data };
//   } catch (error) {
//     console.error(`WhatsApp ${type} Send Error:`);

//     if (error.response) {
//       console.error(error.response.data);
//     } else {
//       console.error(error.message);
//     }

//     return {
//       success: false,
//       error: error.response?.data || error.message,
//     };
//   }
// };


// module.exports = {
//   sendTextMessage,
//   sendImageMessage,
//   sendTemplateMessage,
//   sendCampaignImageTemplate,
//   uploadMediaToMeta,
//   sendMediaMessage,
// };



const axios = require("axios");
const https = require("https"); // NEW

const GRAPH_API_VERSION = "v23.0";

// NEW: reuse the connection to Meta between campaign messages
// (faster than opening a new connection for every message).
const metaHttpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

// NEW: stop waiting for Meta after 30 seconds (axios has no limit by default,
// so one stuck request could block a whole campaign batch).
const META_CAMPAIGN_TIMEOUT_MS = 30000;

// ============================================
// SEND TEXT MESSAGE
// ============================================
const sendTextMessage = async (to, message, whatsappAccount) => {
  console.log("Sending to:", to);
  console.log("sendTextMessage called with:", {
    to,
    message,
    whatsappAccountId: whatsappAccount?.id,
  });

  if (!to || typeof to !== "string" || !to.trim()) {
    console.error("WhatsApp recipient number is missing");

    return {
      success: false,
      error: {
        message: "Recipient phone number is required",
      },
    };
  }

  if (!whatsappAccount) {
    return {
      success: false,
      error: {
        message: "WhatsApp account is not connected",
      },
    };
  }

  if (!whatsappAccount.phoneNumberId) {
    return {
      success: false,
      error: {
        message: "WhatsApp Phone Number ID is missing",
      },
    };
  }

  // 👈 CHANGED: no longer checks whatsappAccount.whatsappAccessToken —
  // the token is shared across every company now, not stored per-account.
  if (!process.env.META_SYSTEM_USER_TOKEN) {
    return {
      success: false,
      error: {
        message: "META_SYSTEM_USER_TOKEN is not configured on the server",
      },
    };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.trim(),
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      },
      {
        headers: {
          // 👈 CHANGED
          Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "WhatsApp API Response:",
      JSON.stringify(response.data, null, 2)
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("WhatsApp Send Error:");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

// ============================================
// SEND IMAGE MESSAGE
// ============================================
// 👈 CHANGED: now takes whatsappAccount instead of relying on
// process.env.WHATSAPP_PHONE_NUMBER_ID — that env var pointed to ONE
// hardcoded number for every company, which is wrong for multi-tenant.
const sendImageMessage = async (to, imageUrl, caption = "", whatsappAccount) => {
  console.log("Sending Image to:", to);

  if (!whatsappAccount?.phoneNumberId) {
    return {
      success: false,
      error: { message: "WhatsApp account or Phone Number ID is missing" },
    };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.trim(),
        type: "image",
        image: {
          link: imageUrl,
          caption,
        },
      },
      {
        headers: {
          // 👈 CHANGED
          Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("WhatsApp Image Error:");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

// Meta rejects template body parameters that contain newlines/tabs
// or 4+ consecutive spaces (error 132018). Clean the text before sending.
const sanitizeTemplateParam = (text) =>
  String(text ?? "")
    .replace(/[\n\r\t]+/g, " ") // newlines/tabs -> single space
    .replace(/ {2,}/g, " ")     // collapse repeated spaces
    .trim();

// ============================================
// SEND TEMPLATE MESSAGE
// ============================================
// 👈 CHANGED: now takes whatsappAccount instead of process.env.WHATSAPP_PHONE_NUMBER_ID
// FIX: added optional `languageCode` as the LAST argument (default "en_US") so existing
// callers keep working. Before this, every non-image campaign was sent as en_US,
// so Tamil (ta) / Hindi (hi) templates failed with "template does not exist".
const sendTemplateMessage = async (
  to,
  templateName,
  params = [],
  whatsappAccount,
  languageCode = "en_US",
  buttonComponents = [] // 👈 NEW (optional): extra button parameters
) => {

  if (!to || typeof to !== "string" || !to.trim()) {
    return {
      success: false,
      error: {
        message: "Recipient phone number is required",
      },
    };
  }

  if (!whatsappAccount?.phoneNumberId) {
    return {
      success: false,
      error: { message: "WhatsApp account or Phone Number ID is missing" },
    };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to : to.trim(),
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode || "en_US" },
          components: [
            ...(params.length > 0 ? [
              {
                type: "body",
                parameters: params.map(p => ({ type: "text", text: sanitizeTemplateParam(p) }))
              }
            ] : []),
            // 👈 NEW: only filled for templates with a copy-code button
            ...buttonComponents,
          ]
        },
      },
      {
        timeout: META_CAMPAIGN_TIMEOUT_MS, // NEW
        httpsAgent: metaHttpsAgent, // NEW
        headers: {
          // 👈 CHANGED
          Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error("WhatsApp Template Send Error:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// ============================================
// SEND CAMPAIGN IMAGE TEMPLATE
// ============================================
// 👈 CHANGED: now takes whatsappAccount instead of process.env.WHATSAPP_PHONE_NUMBER_ID
const sendCampaignImageTemplate = async (to, templateName, imageUrl, params = [], languageCode = "en_US", whatsappAccount, buttonComponents = []) => {

  if (!to || typeof to !== "string" || !to.trim()) {
    return {
      success: false,
      error: {
        message: "Recipient phone number is required",
      },
    };
  }

  if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
    return {
      success: false,
      error: {
        message: "Image URL is required",
      },
    };
  }

  if (!whatsappAccount?.phoneNumberId) {
    return {
      success: false,
      error: { message: "WhatsApp account or Phone Number ID is missing" },
    };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: to.trim(),
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "image",
                  image: { link: imageUrl },
                },
              ],
            },
            {
              type: "body",
              parameters: params.map((p) => ({
                type: "text",
                text: sanitizeTemplateParam(p),
              })),
            },
            // 👈 NEW: only filled for templates with a copy-code button
            ...buttonComponents,
          ],
        },
      },
      {
        timeout: META_CAMPAIGN_TIMEOUT_MS, // NEW
        httpsAgent: metaHttpsAgent, // NEW
        headers: {
          // 👈 CHANGED
          Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error("WhatsApp Image Template Error:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};

// ============================================
// UPLOAD MEDIA TO META  (returns a WhatsApp media id)
// ============================================
// Used for files an agent attaches in the chat (image / audio / video /
// document). Uploading the bytes to Meta and sending by media id is more
// reliable than sending a public link, because Meta does not have to
// fetch the file from our storage or guess its content type.
const uploadMediaToMeta = async (buffer, mimeType, fileName, whatsappAccount) => {
  if (!whatsappAccount?.phoneNumberId) {
    return {
      success: false,
      error: { message: "WhatsApp account or Phone Number ID is missing" },
    };
  }

  if (!process.env.META_SYSTEM_USER_TOKEN) {
    return {
      success: false,
      error: {
        message: "META_SYSTEM_USER_TOKEN is not configured on the server",
      },
    };
  }

  try {
    const form = new FormData();
    form.append("messaging_product", "whatsapp");
    form.append("type", mimeType);
    form.append(
      "file",
      new Blob([buffer], { type: mimeType }),
      fileName || "file"
    );

    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/media`,
      form,
      {
        headers: {
          Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    if (!response.data?.id) {
      return {
        success: false,
        error: { message: "Meta did not return a media id" },
      };
    }

    return { success: true, mediaId: response.data.id };
  } catch (error) {
    console.error("WhatsApp Media Upload Error:");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

// ============================================
// SEND MEDIA MESSAGE (image | audio | video | document)
// ============================================
// mediaId comes from uploadMediaToMeta(). Caption is ignored for audio
// (WhatsApp does not support captions on audio). fileName is only used
// for documents.
const sendMediaMessage = async (
  to,
  { type, mediaId, caption = "", fileName = "" } = {},
  whatsappAccount
) => {
  if (!to || typeof to !== "string" || !to.trim()) {
    return {
      success: false,
      error: { message: "Recipient phone number is required" },
    };
  }

  if (!["image", "audio", "video", "document"].includes(type)) {
    return {
      success: false,
      error: { message: `Unsupported media type: ${type}` },
    };
  }

  if (!mediaId) {
    return { success: false, error: { message: "Media id is required" } };
  }

  if (!whatsappAccount?.phoneNumberId) {
    return {
      success: false,
      error: { message: "WhatsApp account or Phone Number ID is missing" },
    };
  }

  if (!process.env.META_SYSTEM_USER_TOKEN) {
    return {
      success: false,
      error: {
        message: "META_SYSTEM_USER_TOKEN is not configured on the server",
      },
    };
  }

  const mediaObject = { id: mediaId };

  if (caption && type !== "audio") {
    mediaObject.caption = caption;
  }

  if (type === "document" && fileName) {
    mediaObject.filename = fileName;
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${whatsappAccount.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.trim(),
        type,
        [type]: mediaObject,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error(`WhatsApp ${type} Send Error:`);

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};


module.exports = {
  sendTextMessage,
  sendImageMessage,
  sendTemplateMessage,
  sendCampaignImageTemplate,
  uploadMediaToMeta,
  sendMediaMessage,
};