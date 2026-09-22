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

const createMetaTemplate = async (
  companyId,
  {
    name,
    category,
    language,
    headerType,
    headerContent,
    headerHandle, // 👈 NEW: media handle from Meta's Resumable Upload API,
    // required for IMAGE / VIDEO / DOCUMENT headers (see
    // metaMediaUploadService.js). Without this, Meta rejects the
    // submission with "component of type HEADER is missing expected
    // field(s) (example)".
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
        // 👈 CHANGED: IMAGE / VIDEO / DOCUMENT headers must include a
        // sample media handle or Meta rejects the submission outright.
        if (!headerHandle) {
          return {
            success: false,
            error: {
              message:
                "A sample media handle is required for IMAGE, VIDEO, or DOCUMENT headers. Upload a header sample before submitting.",
            },
          };
        }

        components.push({
          type: "HEADER",
          format: headerType,
          example: {
            header_handle: [headerHandle],
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