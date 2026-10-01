// backend/src/services/metaTemplateDelete.js
//
// Deletes a message template from Meta (WhatsApp Business Account).
// Uses the same account lookup + system-user token as createMetaTemplate.

const axios = require("axios");
const { getWhatsAppAccount } = require("./saasWhatsAppService");

const GRAPH_API_VERSION = "v23.0";

// Meta returns different wording when the template is already gone.
// If that happens we treat the delete as a success.
const looksLikeAlreadyDeleted = (message = "") =>
  /does not exist|doesn't exist|not found|no template|already.*deleted/i.test(
    message
  );

/**
 * @param {number} companyId
 * @param {{ name: string, metaTemplateId?: string|null }} template
 * @returns {Promise<{ success: boolean, alreadyDeleted?: boolean, error?: string }>}
 */
const deleteMetaTemplate = async (companyId, { name, metaTemplateId }) => {
  try {
    const account = await getWhatsAppAccount(companyId); // throws if not connected

    if (!account.wabaId) {
      return {
        success: false,
        error: "This company's WhatsApp account has no WABA ID.",
      };
    }

    if (!process.env.META_SYSTEM_USER_TOKEN) {
      return {
        success: false,
        error: "Server is not configured with a WhatsApp system token.",
      };
    }

    // name only      -> deletes this name in ALL languages
    // name + hsm_id  -> deletes only that one template/language
    const params = { name };
    if (metaTemplateId) params.hsm_id = metaTemplateId;

    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.wabaId}/message_templates`;

    console.log("deleteMetaTemplate() calling Meta:", { url, params });

    const response = await axios.delete(url, {
      params,
      headers: {
        Authorization: `Bearer ${process.env.META_SYSTEM_USER_TOKEN}`,
      },
      timeout: 15000,
    });

    console.log("deleteMetaTemplate() Meta response:", response.data);

    if (response.data?.success === false) {
      return { success: false, error: "Meta did not confirm the deletion." };
    }

    return { success: true };
  } catch (error) {
    const metaError = error.response?.data?.error;
    const message =
      metaError?.error_user_msg || metaError?.message || error.message;

    console.error("META TEMPLATE DELETE ERROR:", error.response?.data || message);

    // Template no longer exists on Meta -> nothing left to delete there
    if (error.response?.status === 404 || looksLikeAlreadyDeleted(message)) {
      return { success: true, alreadyDeleted: true };
    }

    return { success: false, error: message };
  }
};

module.exports = { deleteMetaTemplate };