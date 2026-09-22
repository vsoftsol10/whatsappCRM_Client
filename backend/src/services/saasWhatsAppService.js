// const axios = require("axios");
// const prisma = require("../config/prisma");

// const GRAPH_API_VERSION = "v23.0";

// // ============================================
// // GET CONNECTED WHATSAPP ACCOUNT
// // ============================================
// const getWhatsAppAccount = async (companyId) => {
//   const account = await prisma.whatsAppAccount.findFirst({
//     where: {
//       companyId,
//       status: "CONNECTED",
//     },
//   });

//   if (!account) {
//     throw new Error(
//       "No connected WhatsApp account found for this company"
//     );
//   }

//   return account;
// };

// // ============================================
// // SEND TEXT MESSAGE
// // ============================================
// const sendTextMessage = async (
//   companyId,
//   to,
//   message
// ) => {
//   try {
//     const account = await getWhatsAppAccount(companyId);

//     if (!to || !to.trim()) {
//       return {
//         success: false,
//         error: {
//           message: "Recipient phone number is required",
//         },
//       };
//     }

//     const response = await axios.post(
//       `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.phoneNumberId}/messages`,
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
//           // 👈 CHANGED: shared tech-provider token, not per-company DB token
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
//     console.error(
//       "SAAS WHATSAPP SEND ERROR:",
//       error.response?.data || error.message
//     );

//     return {
//       success: false,
//       error:
//         error.response?.data || error.message,
//     };
//   }
// };

// // ============================================
// // CREATE / SUBMIT A MESSAGE TEMPLATE TO META (per company)
// // ============================================
// // Meta only accepts 3 categories — anything else in your local
// // enum (e.g. SUPPORT, SALES) gets mapped to UTILITY before sending.
// const mapToMetaCategory = (category) => {
//   const allowed = ["MARKETING", "UTILITY", "AUTHENTICATION"];
//   return allowed.includes(category) ? category : "UTILITY";
// };

// const createMetaTemplate = async (
//   companyId,
//   {
//     name,
//     category,
//     language,
//     headerType,
//     headerContent,
//     bodyText,
//     bodyExamples,
//     footerContent,
//   }
// ) => {
//   try {
//     const account = await getWhatsAppAccount(companyId);

//     if (!account.wabaId) {
//       return {
//         success: false,
//         error: {
//           message:
//             "No WhatsApp Business Account ID (wabaId) found for this company",
//         },
//       };
//     }

//     const components = [];

//     if (headerType && headerType !== "NONE") {
//       if (headerType === "TEXT") {
//         components.push({
//           type: "HEADER",
//           format: "TEXT",
//           text: headerContent,
//         });
//       } else {
//         components.push({
//           type: "HEADER",
//           format: headerType,
//         });
//       }
//     }

//     const bodyComponent = {
//       type: "BODY",
//       text: bodyText,
//     };

//     if (Array.isArray(bodyExamples) && bodyExamples.length > 0) {
//       bodyComponent.example = {
//         body_text: [bodyExamples],
//       };
//     }

//     components.push(bodyComponent);

//     if (footerContent && footerContent.trim()) {
//       components.push({
//         type: "FOOTER",
//         text: footerContent.trim(),
//       });
//     }

//     const response = await axios.post(
//       `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.wabaId}/message_templates`,
//       {
//         name,
//         category: mapToMetaCategory(category),
//         language,
//         components,
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
//     console.error(
//       "SAAS WHATSAPP TEMPLATE CREATE ERROR:",
//       error.response?.data || error.message
//     );

//     return {
//       success: false,
//       error:
//         error.response?.data?.error?.error_user_msg ||
//         error.response?.data?.error?.message ||
//         error.message,
//     };
//   }
// };

// // ============================================
// // SEND AN APPROVED TEMPLATE MESSAGE (per company)
// // ============================================
// const sendTemplateMessage = async (
//   companyId,
//   to,
//   metaTemplateName,
//   language = "en_US",
//   params = []
// ) => {
//   try {
//     const account = await getWhatsAppAccount(companyId);

//     if (!to || !to.trim()) {
//       return {
//         success: false,
//         error: { message: "Recipient phone number is required" },
//       };
//     }

//     const response = await axios.post(
//       `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.phoneNumberId}/messages`,
//       {
//         messaging_product: "whatsapp",
//         to: to.trim(),
//         type: "template",
//         template: {
//           name: metaTemplateName,
//           language: { code: language },
//           components:
//             params.length > 0
//               ? [
//                   {
//                     type: "body",
//                     parameters: params.map((p) => ({
//                       type: "text",
//                       text: p,
//                     })),
//                   },
//                 ]
//               : [],
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
//     console.error(
//       "SAAS WHATSAPP TEMPLATE SEND ERROR:",
//       error.response?.data || error.message
//     );

//     return {
//       success: false,
//       error: error.response?.data || error.message,
//     };
//   }
// };

// module.exports = {
//   getWhatsAppAccount,
//   sendTextMessage,
//   createMetaTemplate,
//   sendTemplateMessage,
// };

const axios = require("axios");
const prisma = require("../config/prisma");

const GRAPH_API_VERSION = "v23.0";

// ============================================
// GET CONNECTED WHATSAPP ACCOUNT
// ============================================
const getWhatsAppAccount = async (companyId) => {
  const account = await prisma.whatsAppAccount.findFirst({
    where: {
      companyId,
      status: "CONNECTED",
    },
  });

  if (!account) {
    throw new Error(
      "No connected WhatsApp account found for this company"
    );
  }

  return account;
};

// ============================================
// SEND TEXT MESSAGE
// ============================================
const sendTextMessage = async (
  companyId,
  to,
  message
) => {
  try {
    const account = await getWhatsAppAccount(companyId);

    if (!to || !to.trim()) {
      return {
        success: false,
        error: {
          message: "Recipient phone number is required",
        },
      };
    }

    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.phoneNumberId}/messages`,
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
          // 👈 CHANGED: shared tech-provider token, not per-company DB token
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
    console.error(
      "SAAS WHATSAPP SEND ERROR:",
      error.response?.data || error.message
    );

    return {
      success: false,
      error:
        error.response?.data || error.message,
    };
  }
};

// ============================================
// CREATE / SUBMIT A MESSAGE TEMPLATE TO META (per company)
// ============================================
// Meta only accepts 3 categories — anything else in your local
// enum (e.g. SUPPORT, SALES) gets mapped to UTILITY before sending.
const mapToMetaCategory = (category) => {
  const allowed = ["MARKETING", "UTILITY", "AUTHENTICATION"];
  return allowed.includes(category) ? category : "UTILITY";
};

// ============================================
// 👈 NEW: UPLOAD HEADER SAMPLE MEDIA TO META, GET A HANDLE BACK
// ============================================
// A Cloudinary URL is enough for Meta's Resumable Upload API to
// accept as the *source*, but Meta does not accept that URL itself
// as the template's header sample — it needs its own "handle",
// obtained by:
//   1. Starting an upload session on Meta's Graph API (needs the
//      file's byte length + mime type + your Meta App ID).
//   2. Uploading the actual file bytes to that session.
//   3. Reading back the "h" (handle) value from the response.
// That handle then goes into the HEADER component as
// example.header_handle when creating the template — this is what
// was missing, which is why Meta returned:
// "A sample media handle is required for IMAGE, VIDEO, or DOCUMENT
// headers."
const uploadHeaderMediaToMeta = async (mediaUrl) => {
  try {
    if (!process.env.META_APP_ID) {
      return {
        success: false,
        error:
          "META_APP_ID is not configured on the server. Contact support.",
      };
    }

    // Step 1: download the actual file bytes from Cloudinary so we
    // know their exact length/type and can forward them to Meta.
    const fileResponse = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
    });

    const fileBuffer = Buffer.from(fileResponse.data);
    const fileType =
      fileResponse.headers["content-type"] || "image/jpeg";

    // Step 2: start an upload session with Meta.
    const sessionResponse = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.META_APP_ID}/uploads`,
      null,
      {
        params: {
          file_length: fileBuffer.length,
          file_type: fileType,
          access_token: process.env.META_SYSTEM_USER_TOKEN,
        },
      }
    );

    const uploadSessionId = sessionResponse.data?.id;

    if (!uploadSessionId) {
      return {
        success: false,
        error: "Meta did not return an upload session ID.",
      };
    }

    // Step 3: upload the actual bytes to that session.
    // NOTE: this call uses "OAuth" in the Authorization header, not
    // "Bearer" — that's what Meta's Resumable Upload API expects,
    // unlike the rest of the Graph API calls in this file.
    const uploadResponse = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${uploadSessionId}`,
      fileBuffer,
      {
        headers: {
          Authorization: `OAuth ${process.env.META_SYSTEM_USER_TOKEN}`,
          "Content-Type": fileType,
          "file_offset": 0,
        },
      }
    );

    const handle = uploadResponse.data?.h;

    if (!handle) {
      return {
        success: false,
        error: "Meta did not return a media handle after upload.",
      };
    }

    return {
      success: true,
      handle,
    };
  } catch (error) {
    console.error(
      "META HEADER MEDIA UPLOAD ERROR:",
      error.response?.data || error.message
    );

    return {
      success: false,
      error:
        error.response?.data?.error?.error_user_msg ||
        error.response?.data?.error?.message ||
        error.message,
    };
  }
};

const createMetaTemplate = async (
  companyId,
  {
    name,
    category,
    language,
    headerType,
    headerContent,
    bodyText,
    bodyExamples,
    footerContent,
  }
) => {
  try {
    const account = await getWhatsAppAccount(companyId);

    if (!account.wabaId) {
      return {
        success: false,
        error: {
          message:
            "No WhatsApp Business Account ID (wabaId) found for this company",
        },
      };
    }

    const components = [];

    if (headerType && headerType !== "NONE") {
      if (headerType === "TEXT") {
        components.push({
          type: "HEADER",
          format: "TEXT",
          text: headerContent,
        });
      } else {
        // 👈 NEW: IMAGE / VIDEO / DOCUMENT headers require a Meta
        // media "handle" in example.header_handle — a Cloudinary
        // URL alone is not accepted here. headerContent is expected
        // to be that public URL; we upload its bytes to Meta first
        // to get the handle Meta actually wants.
        if (!headerContent || !headerContent.trim()) {
          return {
            success: false,
            error: `A sample ${headerType.toLowerCase()} URL is required before submitting.`,
          };
        }

        const mediaUploadResult = await uploadHeaderMediaToMeta(
          headerContent
        );

        if (!mediaUploadResult.success) {
          return {
            success: false,
            error: `Failed to prepare header media for Meta: ${mediaUploadResult.error}`,
          };
        }

        components.push({
          type: "HEADER",
          format: headerType,
          example: {
            header_handle: [mediaUploadResult.handle],
          },
        });
      }
    }

    const bodyComponent = {
      type: "BODY",
      text: bodyText,
    };

    if (Array.isArray(bodyExamples) && bodyExamples.length > 0) {
      bodyComponent.example = {
        body_text: [bodyExamples],
      };
    }

    components.push(bodyComponent);

    if (footerContent && footerContent.trim()) {
      components.push({
        type: "FOOTER",
        text: footerContent.trim(),
      });
    }

    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.wabaId}/message_templates`,
      {
        name,
        category: mapToMetaCategory(category),
        language,
        components,
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
    console.error(
      "SAAS WHATSAPP TEMPLATE CREATE ERROR:",
      error.response?.data || error.message
    );

    return {
      success: false,
      error:
        error.response?.data?.error?.error_user_msg ||
        error.response?.data?.error?.message ||
        error.message,
    };
  }
};

// ============================================
// SEND AN APPROVED TEMPLATE MESSAGE (per company)
// ============================================
const sendTemplateMessage = async (
  companyId,
  to,
  metaTemplateName,
  language = "en_US",
  params = []
) => {
  try {
    const account = await getWhatsAppAccount(companyId);

    if (!to || !to.trim()) {
      return {
        success: false,
        error: { message: "Recipient phone number is required" },
      };
    }

    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: to.trim(),
        type: "template",
        template: {
          name: metaTemplateName,
          language: { code: language },
          components:
            params.length > 0
              ? [
                  {
                    type: "body",
                    parameters: params.map((p) => ({
                      type: "text",
                      text: p,
                    })),
                  },
                ]
              : [],
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

    return { success: true, data: response.data };
  } catch (error) {
    console.error(
      "SAAS WHATSAPP TEMPLATE SEND ERROR:",
      error.response?.data || error.message
    );

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

module.exports = {
  getWhatsAppAccount,
  sendTextMessage,
  createMetaTemplate,
  sendTemplateMessage,
};