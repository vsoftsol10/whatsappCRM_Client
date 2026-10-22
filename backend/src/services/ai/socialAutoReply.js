// backend/src/services/ai/socialAutoReply.js   (NEW FILE)
//
// AI auto-reply for FACEBOOK MESSENGER and INSTAGRAM chats.
// It works exactly like the WhatsApp auto-reply in routes/saasWebhook.js:
//
//  - runs in the background AFTER the webhook has answered Meta
//  - the company's AI settings / on-off switch are read inside getAutoReply
//  - the chat's "Bot" switch (botEnabled) must be ON
//  - the company's subscription must be active
//  - the Page / Instagram account must still be CONNECTED
//  - Meta's 24-hour reply window must be open
//  - one reply pipeline per chat at a time
//  - if the customer writes again while the AI is thinking, the old reply
//    is thrown away and the whole burst is answered in one go
//  - the bot switch is re-checked right before sending, so an employee
//    who takes over mid-generation is never talked over
//  - when the AI asks for a human, the bot is switched OFF and ONE
//    employee is notified (handleAiHandoff)

const prisma = require("../../config/prisma");
const { getAutoReply } = require("../aiService");
const { handleAiHandoff } = require("./handoffService");
const { canCompanySendMessages } = require("../../utils/companyAccess");
const { emitToCompany } = require("../../socket");
const { decryptSecret } = require("../../utils/secretCrypto");
const {
  sendMessengerText,
  sendInstagramText,
  isTokenError,
  isOutsideWindowError,
  MESSENGER_TEXT_LIMIT,
  INSTAGRAM_TEXT_LIMIT_BYTES,
} = require("../facebookService");
const { sendInstagramLoginText } = require("../instagramService");
const {
  INSTAGRAM_CHANNEL,
  fromExternalId,
} = require("../../helpers/instagramHelper");

const WINDOW_MS = 24 * 60 * 60 * 1000; // Meta: free replies for 24 hours
const MAX_REGENERATIONS = 3;

const activeReplies = new Set();

// ------------------------------------------------------------
// Make the AI reply fit Meta's text limit
// (Instagram counts BYTES, Messenger counts characters)
// ------------------------------------------------------------
const fitsLimit = (text, isInstagram) =>
  isInstagram
    ? Buffer.byteLength(text, "utf8") <= INSTAGRAM_TEXT_LIMIT_BYTES
    : text.length <= MESSENGER_TEXT_LIMIT;

const fitReply = (rawText, isInstagram) => {
  const text = String(rawText || "").trim();

  if (!text || fitsLimit(text, isInstagram)) return text;

  // longest start of the text that still fits
  let low = 0;
  let high = text.length;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);

    if (fitsLimit(text.slice(0, mid), isInstagram)) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  let cut = text.slice(0, low);

  // do not leave half an emoji at the end
  const lastCode = cut.charCodeAt(cut.length - 1);
  if (lastCode >= 0xd800 && lastCode <= 0xdbff) cut = cut.slice(0, -1);

  // prefer to stop at the end of a sentence / line
  const boundary = Math.max(
    cut.lastIndexOf("\n"),
    cut.lastIndexOf(". "),
    cut.lastIndexOf("! "),
    cut.lastIndexOf("? ")
  );

  if (boundary > cut.length * 0.5) cut = cut.slice(0, boundary + 1);

  return cut.trim();
};

const markReconnectNeeded = (pageId) =>
  prisma.facebookPage
    .update({ where: { id: pageId }, data: { status: "RECONNECT_NEEDED" } })
    .catch((error) =>
      console.error("Could not flag Page for reconnect:", error.message)
    );

// ------------------------------------------------------------
// One attempt. Returns "done" or "stale" (customer wrote again).
// ------------------------------------------------------------
const attemptSocialReply = async (conversationId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { customer: true, facebookPage: true },
  });

  if (!conversation || !conversation.botEnabled) return "done";

  const isInstagram = conversation.channel === INSTAGRAM_CHANNEL;
  const isMessenger = conversation.channel === "MESSENGER";

  // WhatsApp chats are handled by saasWebhook.js, not here.
  if (!isInstagram && !isMessenger) return "done";

  const channelName = isInstagram ? "Instagram" : "Messenger";

  if (!(await canCompanySendMessages(conversation.companyId))) {
    console.log(
      `AI auto-reply skipped (${channelName}): company subscription is inactive or expired. companyId:`,
      conversation.companyId
    );
    return "done";
  }

  const page = conversation.facebookPage;

  if (
    !page ||
    page.companyId !== conversation.companyId ||
    page.status !== "CONNECTED" ||
    !page.pageAccessToken
  ) {
    console.log(`AI auto-reply skipped (${channelName}): account not connected`);
    return "done";
  }

  if (!conversation.externalUserId) {
    console.log(`AI auto-reply skipped (${channelName}): recipient not found`);
    return "done";
  }

  if (isInstagram && !page.instagramAccountId) {
    console.log("AI auto-reply skipped (Instagram): no Instagram account linked");
    return "done";
  }

  // Latest customer message at the moment we start generating
  const latestCustomerMessage = await prisma.message.findFirst({
    where: { conversationId, sender: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
  });

  if (!latestCustomerMessage) return "done";

  // Meta 24-hour rule
  if (Date.now() - latestCustomerMessage.createdAt.getTime() > WINDOW_MS) {
    console.log(`AI auto-reply skipped (${channelName}): 24-hour window closed`);
    return "done";
  }

  const result = await getAutoReply(conversationId, { channel: channelName });

  if (!result.success) {
    console.error(`AI did not return a ${channelName} reply:`, result.error);
    return "done";
  }

  // Customer wrote again while the AI was thinking -> drop this reply
  const newerCustomerMessages = await prisma.message.count({
    where: {
      conversationId,
      sender: "CUSTOMER",
      createdAt: { gt: latestCustomerMessage.createdAt },
    },
  });

  if (newerCustomerMessages > 0) return "stale";

  // Re-check: an employee may have taken over, or the account may have
  // been disconnected while we were waiting.
  const fresh = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { botEnabled: true },
  });

  if (!fresh || !fresh.botEnabled) return "done";

  const freshPage = await prisma.facebookPage.findUnique({
    where: { id: page.id },
    select: { status: true, pageAccessToken: true },
  });

  if (
    !freshPage ||
    freshPage.status !== "CONNECTED" ||
    !freshPage.pageAccessToken
  ) {
    return "done";
  }

  const token = decryptSecret(freshPage.pageAccessToken);

  if (!token) {
    await markReconnectNeeded(page.id);
    return "done";
  }

  const text = fitReply(result.reply, isInstagram);

  if (!text) return "done";

  const recipientId = fromExternalId(conversation.externalUserId);

  const sendResult = isInstagram
    ? page.connectionType === "INSTAGRAM_LOGIN"
      ? await sendInstagramLoginText(token, recipientId, text)
      : await sendInstagramText(token, page.pageId, recipientId, text)
    : await sendMessengerText(token, recipientId, text);

  if (!sendResult.success) {
    if (isTokenError(sendResult.error)) {
      await markReconnectNeeded(page.id);
    } else if (isOutsideWindowError(sendResult.error)) {
      console.log(`AI auto-reply skipped (${channelName}): outside reply window`);
    } else {
      console.error(
        `Failed to send AI auto-reply on ${channelName}:`,
        sendResult.error
      );
    }

    return "done";
  }

  const botMessage = await prisma.message.create({
    data: {
      conversationId,
      content: text,
      sender: "BOT",
      messageType: "TEXT",
      status: "SENT",
      metaMessageId: sendResult.data?.message_id || undefined,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessage: text },
  });

  emitToCompany(conversation.companyId, "message:new", {
    conversationId,
    message: botMessage,
  });

  // The AI asked for a human: switch the bot off and notify ONE employee.
  if (result.handoff) {
    await handleAiHandoff(conversation);
  }

  console.log(`${channelName} AI auto-reply sent:`, botMessage.id);
  return "done";
};

// ------------------------------------------------------------
// Called by facebookWebhook.js after a customer message is saved.
// Never throws.
// ------------------------------------------------------------
const triggerSocialAutoReply = async (conversationId) => {
  if (activeReplies.has(conversationId)) {
    // A pipeline is already running for this chat. It will notice the
    // newer customer message and regenerate, so nothing to do here.
    return;
  }

  activeReplies.add(conversationId);

  try {
    for (let i = 0; i < MAX_REGENERATIONS; i++) {
      const outcome = await attemptSocialReply(conversationId);
      if (outcome !== "stale") break;
    }
  } catch (error) {
    console.error("Social AI auto-reply failed:", error);
  } finally {
    activeReplies.delete(conversationId);
  }
};

module.exports = { triggerSocialAutoReply };