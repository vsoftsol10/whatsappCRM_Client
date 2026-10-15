// // ============================================================
// // FACEBOOK PAGE WEBHOOK  (Messenger)
// //
// // Mounted in server.js as:
// //   app.use("/api/facebook/webhook", verifyMetaWebhookSignature, facebookWebhookRoutes);
// //
// // Meta callback URL:  https://<your-backend-domain>/api/facebook/webhook
// //
// // Same Meta app as WhatsApp, so the same META_APP_SECRET is used to
// // verify the X-Hub-Signature-256 header (done by verifyMetaWebhookSignature).
// // ============================================================
// const express = require("express");
// const router = express.Router();

// const prisma = require("../config/prisma");
// const { saveIncomingMessage } = require("../helpers/messageHelper");
// const {
//   getOrCreateMessengerConversation,
//   resolveMessengerContent,
// } = require("../helpers/messengerHelper");
// const { emitToCompany } = require("../socket");

// // Same transient-error list the WhatsApp webhook uses: for these we answer
// // 500 so Meta re-sends the event instead of losing the message.
// const TRANSIENT_PRISMA_CODES = new Set([
//   "P1001",
//   "P1002",
//   "P1008",
//   "P1017",
//   "P2024",
//   "P2028",
// ]);

// const isTransientError = (error) => {
//   if (!error) return false;
//   if (TRANSIENT_PRISMA_CODES.has(error.code)) return true;
//   if (error.name === "PrismaClientInitializationError") return true;
//   if (error.name === "PrismaClientRustPanicError") return true;
//   return ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN"].includes(
//     error.code
//   );
// };

// // ------------------------------------------------------------
// // GET  -> Meta's one-time webhook verification handshake
// // ------------------------------------------------------------
// router.get("/", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   const expected = process.env.FB_VERIFY_TOKEN || process.env.VERIFY_TOKEN;

//   if (mode === "subscribe" && expected && token === expected) {
//     console.log("Facebook Page webhook verified");
//     return res.status(200).send(challenge);
//   }

//   console.log("Facebook Page webhook verification failed");
//   return res.sendStatus(403);
// });

// // ------------------------------------------------------------
// // One Messenger event (a person messaged the Page, or the Page sent one)
// // ------------------------------------------------------------
// const processMessagingEvent = async (page, event) => {
//   const message = event?.message;

//   // delivery / read / postback events are ignored for now
//   if (!message || !message.mid) return;

//   const isEcho = !!message.is_echo;

//   // Echo of a message WE sent from the CRM: it is already saved by the
//   // send API, so skip it. Echoes from the Page inbox / Business Suite
//   // (a different app_id or none) are mirrored into the CRM below.
//   if (isEcho && String(message.app_id) === String(process.env.META_APP_ID)) {
//     return;
//   }

//   // For a normal message the person is the sender; for an echo the person
//   // is the recipient (the Page is the sender).
//   const psid = isEcho ? event.recipient?.id : event.sender?.id;
//   if (!psid) return;

//   // Meta re-delivers events - skip anything we already stored.
//   const alreadySaved = await prisma.message.findUnique({
//     where: { metaMessageId: message.mid },
//     select: { id: true },
//   });
//   if (alreadySaved) {
//     console.log("Duplicate Messenger message skipped:", message.mid);
//     return;
//   }

//   const conversation = await getOrCreateMessengerConversation(
//     page,
//     String(psid)
//   );

//   const { content, messageType, imageUrl } = await resolveMessengerContent(
//     message
//   );

//   // ---------- Page owner replied from Meta Business Suite / Page inbox ----------
//   if (isEcho) {
//     try {
//       const echoMessage = await prisma.message.create({
//         data: {
//           conversationId: conversation.id,
//           content,
//           sender: "AGENT",
//           messageType,
//           imageUrl,
//           status: "SENT",
//           metaMessageId: message.mid,
//         },
//       });

//       await prisma.conversation.update({
//         where: { id: conversation.id },
//         data: { lastMessage: content, botEnabled: false },
//       });

//       emitToCompany(page.companyId, "message:new", {
//         conversationId: conversation.id,
//         message: echoMessage,
//       });
//     } catch (error) {
//       if (error?.code === "P2002") return; // saved by a parallel request
//       throw error;
//     }
//     return;
//   }

//   // ---------- Person messaged the Page ----------
//   const savedMessage = await saveIncomingMessage(conversation.id, content, {
//     metaMessageId: message.mid,
//     messageType,
//     imageUrl,
//   });

//   // null = duplicate
//   if (!savedMessage) return;

//   emitToCompany(page.companyId, "message:new", {
//     conversationId: conversation.id,
//     message: savedMessage,
//   });

//   // FUTURE: AI auto-reply for Messenger plugs in here
//   // (same idea as triggerAutoReply() in saasWebhook.js).
// };

// // ------------------------------------------------------------
// // POST -> events
// // ------------------------------------------------------------
// router.post("/", async (req, res) => {
//   const body = req.body;

//   // Only Page events belong on this URL.
//   if (body?.object !== "page") {
//     return res.sendStatus(404);
//   }

//   const entries = Array.isArray(body.entry) ? body.entry : [];
//   let retryNeeded = false;

//   for (const entry of entries) {
//     const events = Array.isArray(entry?.messaging) ? entry.messaging : [];
//     if (!events.length) continue;

//     try {
//       // entry.id is the Facebook Page ID -> tells us which company it is
//       const page = await prisma.facebookPage.findUnique({
//         where: { pageId: String(entry.id) },
//       });

//       if (!page || page.status === "DISCONNECTED") {
//         console.log(
//           "Facebook webhook: no active connected Page for",
//           entry.id
//         );
//         continue;
//       }

//       for (const event of events) {
//         try {
//           await processMessagingEvent(page, event);
//         } catch (error) {
//           console.error(
//             "Failed to process Messenger event:",
//             event?.message?.mid,
//             error
//           );
//           if (isTransientError(error)) retryNeeded = true;
//         }
//       }
//     } catch (error) {
//       console.error("Facebook webhook entry failed:", entry?.id, error);
//       if (isTransientError(error)) retryNeeded = true;
//     }
//   }

//   return res.sendStatus(retryNeeded ? 500 : 200);
// });

// module.exports = router;


// ============================================================
// FACEBOOK PAGE + INSTAGRAM WEBHOOK  (Messenger and Instagram DMs)
//
// Mounted in server.js as:
//   app.use("/api/facebook/webhook", verifyMetaWebhookSignature, facebookWebhookRoutes);
//
// Meta callback URL:  https://<your-backend-domain>/api/facebook/webhook
// Use the same URL for the "Page" webhook AND the "Instagram" webhook.
//
// Same Meta app as WhatsApp, so the same META_APP_SECRET is used to
// verify the X-Hub-Signature-256 header (done by verifyMetaWebhookSignature).
// ============================================================
const express = require("express");
const router = express.Router();

const prisma = require("../config/prisma");
const { saveIncomingMessage } = require("../helpers/messageHelper");
const {
  getOrCreateMessengerConversation,
  resolveMessengerContent,
} = require("../helpers/messengerHelper");
const { INSTAGRAM_CHANNEL } = require("../helpers/instagramHelper");
const { emitToCompany } = require("../socket");

// Same transient-error list the WhatsApp webhook uses: for these we answer
// 500 so Meta re-sends the event instead of losing the message.
const TRANSIENT_PRISMA_CODES = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
  "P2028",
]);

const isTransientError = (error) => {
  if (!error) return false;
  if (TRANSIENT_PRISMA_CODES.has(error.code)) return true;
  if (error.name === "PrismaClientInitializationError") return true;
  if (error.name === "PrismaClientRustPanicError") return true;
  return ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "EAI_AGAIN"].includes(
    error.code
  );
};

// ------------------------------------------------------------
// GET  -> Meta's one-time webhook verification handshake
// ------------------------------------------------------------
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const expected = process.env.FB_VERIFY_TOKEN || process.env.VERIFY_TOKEN;

  if (mode === "subscribe" && expected && token === expected) {
    console.log("Facebook Page webhook verified");
    return res.status(200).send(challenge);
  }

  console.log("Facebook Page webhook verification failed");
  return res.sendStatus(403);
});

// ------------------------------------------------------------
// One event (a person messaged the Page / Instagram account, or the
// account itself sent a message)
// ------------------------------------------------------------
const processMessagingEvent = async (page, event, channel) => {
  const message = event?.message;

  // delivery / read / postback events are ignored for now
  if (!message || !message.mid) return;

  // Message the person unsent on Instagram - nothing to show
  if (message.is_deleted) return;

  const isEcho = !!message.is_echo;

  // Echo of a message WE sent from the CRM: it is already saved by the
  // send API, so skip it. Echoes from the Page inbox / Business Suite /
  // Instagram app (a different app_id or none) are mirrored below.
  if (isEcho && String(message.app_id) === String(process.env.META_APP_ID)) {
    return;
  }

  // For a normal message the person is the sender; for an echo the person
  // is the recipient (the Page / Instagram account is the sender).
  const personId = isEcho ? event.recipient?.id : event.sender?.id;
  if (!personId) return;

  // Meta re-delivers events - skip anything we already stored.
  const alreadySaved = await prisma.message.findUnique({
    where: { metaMessageId: message.mid },
    select: { id: true },
  });
  if (alreadySaved) {
    console.log("Duplicate message skipped:", message.mid);
    return;
  }

  const conversation = await getOrCreateMessengerConversation(
    page,
    String(personId),
    channel
  );

  const { content, messageType, imageUrl } = await resolveMessengerContent(
    message
  );

  // ---------- Account owner replied outside the CRM ----------
  if (isEcho) {
    try {
      const echoMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content,
          sender: "AGENT",
          messageType,
          imageUrl,
          status: "SENT",
          metaMessageId: message.mid,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessage: content, botEnabled: false },
      });

      emitToCompany(page.companyId, "message:new", {
        conversationId: conversation.id,
        message: echoMessage,
      });
    } catch (error) {
      if (error?.code === "P2002") return; // saved by a parallel request
      throw error;
    }
    return;
  }

  // ---------- Person messaged us ----------
  const savedMessage = await saveIncomingMessage(conversation.id, content, {
    metaMessageId: message.mid,
    messageType,
    imageUrl,
  });

  // null = duplicate
  if (!savedMessage) return;

  emitToCompany(page.companyId, "message:new", {
    conversationId: conversation.id,
    message: savedMessage,
  });

  // FUTURE: AI auto-reply for Messenger / Instagram plugs in here
  // (same idea as triggerAutoReply() in saasWebhook.js).
};

// ------------------------------------------------------------
// POST -> events
// ------------------------------------------------------------
router.post("/", async (req, res) => {
  const body = req.body;

  // Only Facebook Page and Instagram events belong on this URL.
  const objectType = body?.object;
  if (objectType !== "page" && objectType !== "instagram") {
    return res.sendStatus(404);
  }

  const isInstagram = objectType === "instagram";
  const channel = isInstagram ? INSTAGRAM_CHANNEL : "MESSENGER";

  const entries = Array.isArray(body.entry) ? body.entry : [];
  let retryNeeded = false;

  for (const entry of entries) {
    const events = Array.isArray(entry?.messaging) ? entry.messaging : [];
    if (!events.length) continue;

    try {
      // Facebook: entry.id is the Page ID.
      // Instagram: entry.id is the Instagram professional account ID.
      // Either one tells us which company it is.
      const page = isInstagram
        ? await prisma.facebookPage.findUnique({
            where: { instagramAccountId: String(entry.id) },
          })
        : await prisma.facebookPage.findUnique({
            where: { pageId: String(entry.id) },
          });

      if (!page || page.status === "DISCONNECTED") {
        console.log(
          `${isInstagram ? "Instagram" : "Facebook"} webhook: no active connected account for`,
          entry.id
        );
        continue;
      }

      for (const event of events) {
        try {
          await processMessagingEvent(page, event, channel);
        } catch (error) {
          console.error(
            "Failed to process message event:",
            event?.message?.mid,
            error
          );
          if (isTransientError(error)) retryNeeded = true;
        }
      }
    } catch (error) {
      console.error("Webhook entry failed:", entry?.id, error);
      if (isTransientError(error)) retryNeeded = true;
    }
  }

  return res.sendStatus(retryNeeded ? 500 : 200);
});

module.exports = router;
