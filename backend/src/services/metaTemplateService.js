const axios = require("axios");

const GRAPH_VERSION = "v21.0";

// Meta only accepts these 3 categories — map anything else to UTILITY
const mapToMetaCategory = (category) => {
  const allowed = ["MARKETING", "UTILITY", "AUTHENTICATION"];
  return allowed.includes(category) ? category : "UTILITY";
};

/**
 * Creates a template on Meta's WhatsApp Business Account.
 * Throws on failure — caller should catch and handle.
 */
const createMetaTemplate = async ({
  wabaId,
  accessToken,
  name,
  category,
  language,
  headerType,
  headerContent,
  bodyText,
  footerContent,
}) => {
  const components = [];

  // HEADER (optional)
  if (headerType && headerType !== "NONE") {
    if (headerType === "TEXT") {
      components.push({
        type: "HEADER",
        format: "TEXT",
        text: headerContent,
      });
    } else {
      // IMAGE / VIDEO / DOCUMENT headers require an uploaded media handle
      // via Meta's Resumable Upload API — not just a plain string.
      // For now, skip attaching media headers until that upload flow exists.
      components.push({
        type: "HEADER",
        format: headerType, // "IMAGE" | "VIDEO" | "DOCUMENT"
      });
    }
  }

  // BODY (required)
  components.push({
    type: "BODY",
    text: bodyText,
  });

  // FOOTER (optional)
  if (footerContent && footerContent.trim()) {
    components.push({
      type: "FOOTER",
      text: footerContent.trim(),
    });
  }

  const response = await axios.post(
    `https://graph.facebook.com/${GRAPH_VERSION}/${wabaId}/message_templates`,
    {
      name,
      category: mapToMetaCategory(category),
      language,
      components,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  // Meta responds with { id, status, category }
  return response.data;
};

module.exports = { createMetaTemplate };