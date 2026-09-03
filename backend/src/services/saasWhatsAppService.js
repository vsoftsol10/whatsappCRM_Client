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
          Authorization: `Bearer ${account.whatsappAccessToken}`,
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

module.exports = {
  getWhatsAppAccount,
  sendTextMessage,
};