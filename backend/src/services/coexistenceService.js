const axios = require("axios");
const prisma = require("../config/prisma");

const GRAPH_API_VERSION = "v23.0";

// ============================================
// SUBSCRIBE APP TO A WABA
// ============================================
// Required so Meta sends webhooks (messages, history,
// smb_app_state_sync, smb_message_echoes, account_update) for this
// business's WABA to our app's callback URL.
const subscribeAppToWaba = async (wabaId, accessToken) => {
  await axios.post(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`,
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
};

// ============================================
// LIST PHONE NUMBERS UNDER A WABA
// ============================================
// Coexistence's FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING session
// event only returns a waba_id — NOT a phone_number_id — so we have
// to look the number up ourselves right after the flow completes.
const getPhoneNumbersForWaba = async (wabaId, accessToken) => {
  const response = await axios.get(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/phone_numbers`,
    {
      params: {
        fields:
          "id,display_phone_number,verified_name,is_on_biz_app,platform_type",
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return response.data?.data || [];
};

// ============================================
// GET SINGLE PHONE NUMBER DETAILS / STATUS
// ============================================
// Used for the standard (non-Coexistence) path where we already
// have a phoneNumberId from the FINISH event, and for polling
// is_on_biz_app / platform_type later.
const getPhoneNumberStatus = async (phoneNumberId, accessToken) => {
  const response = await axios.get(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}`,
    {
      params: {
        fields:
          "display_phone_number,verified_name,is_on_biz_app,platform_type",
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return response.data;
};

// ============================================
// INITIATE CONTACTS SYNC (smb_app_state_sync)
// ============================================
// One-shot call — Meta replies with a request_id, then streams
// smb_app_state_sync webhooks containing the actual contacts.
// Can only be called once per onboarding; if you need it again the
// customer must offboard and redo Embedded Signup.
const initiateContactsSync = async (phoneNumberId, accessToken) => {
  const response = await axios.post(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/smb_app_data`,
    {
      messaging_product: "whatsapp",
      sync_type: "smb_app_state_sync",
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return response.data?.request_id || null;
};

// ============================================
// INITIATE CHAT HISTORY SYNC (history)
// ============================================
// One-shot call — Meta replies with a request_id, then streams
// "history" webhooks (up to 180 days of 1:1 chats), or a single
// history webhook with error code 2593109 if the business declined
// to share their chat history.
const initiateHistorySync = async (phoneNumberId, accessToken) => {
  const response = await axios.post(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/smb_app_data`,
    {
      messaging_product: "whatsapp",
      sync_type: "history",
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return response.data?.request_id || null;
};

// ============================================
// RUN BOTH SYNCS AFTER COEXISTENCE ONBOARDING
// ============================================
// Fire-and-forget from the controller — Meta says this can take
// "several minutes" depending on chat history size, so it must never
// block the HTTP response back to the frontend. Updates the
// WhatsAppAccount row with request IDs / statuses so the frontend can
// poll GET /api/whatsapp/accounts/:id/coexistence-status if it wants to.
const runPostOnboardingSync = async (accountId, phoneNumberId, accessToken) => {
  try {
    const contactsRequestId = await initiateContactsSync(phoneNumberId, accessToken);

    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: {
        contactsSyncStatus: "REQUESTED",
        contactsSyncRequestId: contactsRequestId,
      },
    });
  } catch (error) {
    console.error(
      "COEXISTENCE CONTACTS SYNC ERROR:",
      error.response?.data || error.message
    );

    await prisma.whatsAppAccount
      .update({
        where: { id: accountId },
        data: { contactsSyncStatus: "FAILED" },
      })
      .catch(() => {});
  }

  try {
    const historyRequestId = await initiateHistorySync(phoneNumberId, accessToken);

    await prisma.whatsAppAccount.update({
      where: { id: accountId },
      data: {
        historySyncStatus: "REQUESTED",
        historySyncRequestId: historyRequestId,
      },
    });
  } catch (error) {
    console.error(
      "COEXISTENCE HISTORY SYNC ERROR:",
      error.response?.data || error.message
    );

    await prisma.whatsAppAccount
      .update({
        where: { id: accountId },
        data: { historySyncStatus: "FAILED" },
      })
      .catch(() => {});
  }
};

module.exports = {
  subscribeAppToWaba,
  getPhoneNumbersForWaba,
  getPhoneNumberStatus,
  initiateContactsSync,
  initiateHistorySync,
  runPostOnboardingSync,
};