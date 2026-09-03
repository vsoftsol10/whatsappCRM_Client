

const axios = require("axios");

const GRAPH_API_VERSION = "v23.0";

const sendTextMessage = async (to, message) => {
  console.log("Sending to:", to);
  console.log("sendTextMessage called with:", { to, message });

  if (!to || typeof to !== "string" || !to.trim()) {
    console.error("WhatsApp recipient number is missing");

    return {
      success: false,
      error: {
        message: "Recipient phone number is required",
      },
    };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
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
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("WhatsApp API Response:", JSON.stringify(response.data, null, 2));
    
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

const sendImageMessage = async (to, imageUrl, caption = "") => {
  console.log("Sending Image to:", to);

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
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
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
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

const sendTemplateMessage = async (to, templateName, params = []) => {

  if (!to || typeof to !== "string" || !to.trim()) {
    return {
      success: false,
      error: {
        message: "Recipient phone number is required",
      },
    };
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to : to.trim(),
        type: "template",
        template: {
          name: templateName,
          language: { code: "en_US" },
          components: params.length > 0 ? [
            {
              type: "body",
              parameters: params.map(p => ({ type: "text", text: sanitizeTemplateParam(p) }))
            }
          ] : []
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
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

// Template message with an Image header + body text variables.
// Requires a Meta-approved template whose Header format is set to "Image"
// (e.g. "custom_campaign_image_message"). imageUrl must be a publicly
// accessible URL (your Cloudinary link works fine).
const sendCampaignImageTemplate = async (to, templateName, imageUrl, params = [], languageCode = "en_US") => {

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

  try {
    const response = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
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
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
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

module.exports = {
  sendTextMessage,
  sendImageMessage,
  sendTemplateMessage,
  sendCampaignImageTemplate,
};