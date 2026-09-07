// const express = require("express");
// const router = express.Router();
// const prisma = require("../config/prisma");

// const {
//   getOrCreateConversation,
// } = require("../helpers/conversationHelper");

// const {
//   saveIncomingMessage,
// } = require("../helpers/messageHelper");

// router.get("/", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (
//     mode === "subscribe" &&
//     token === process.env.VERIFY_TOKEN
//   ) {
//     console.log("Webhook Verified");
//     return res.status(200).send(challenge);
//   }

//   return res.sendStatus(403);
// });

// router.post("/", async (req, res) => {
//   try {
//     const value = req.body.entry?.[0]?.changes?.[0]?.value;
//     const message = value?.messages?.[0];
//     const statuses = value?.statuses;

//     if (message) {
//       const phone = message.from;

//       // Fall back for non-text messages (image/sticker/voice/location/
//       // button or interactive replies) so the incoming message still
//       // gets saved instead of throwing on a required "content" field.
//       const text =
//         message.text?.body ||
//         message.button?.text ||
//         message.interactive?.button_reply?.title ||
//         message.interactive?.list_reply?.title ||
//         `[${message.type || "unsupported"} message]`;

//       console.log("Phone :", phone);
//       console.log("Message :", text);

//       const conversation = await getOrCreateConversation(phone);

//       console.log("Conversation ID :",conversation.id);
//       if (conversation.customer) {
//         console.log("Customer :", conversation.customer.name);
//         } else {
//         console.log("Customer : Not linked yet");
//         }
    
//       await saveIncomingMessage(conversation.id, text);
//         console.log("Message saved successfully");
//     }

//     // Delivery status updates (sent/delivered/read/failed) for messages
//     // we sent out. Matched back to our Message row via metaMessageId so
//     // failures are visible instead of silently disappearing.
//     if (statuses && statuses.length > 0) {
//       for (const statusEvent of statuses) {
//         const metaMessageId = statusEvent.id;
//         const newStatus = statusEvent.status; // sent | delivered | read | failed
//         const failureReason =
//           statusEvent.errors?.[0]?.title ||
//           statusEvent.errors?.[0]?.message ||
//           null;

//         console.log("Status update:", metaMessageId, newStatus, failureReason || "");

//         if (!metaMessageId) continue;

//         try {
//           await prisma.message.updateMany({
//             where: { metaMessageId },
//             data: {
//               status: newStatus ? newStatus.toUpperCase() : undefined,
//               failureReason,
//             },
//           });
//         } catch (err) {
//           console.error("Failed to update message status:", err);
//         }
//       }
//     }

//     return res.sendStatus(200);
//   } catch (error) {
//     console.error(error);
//     return res.sendStatus(500);
//   }
// });



// module.exports = router;

const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");

const {
  getOrCreateConversation,
} = require("../helpers/conversationHelper");

const {
  saveIncomingMessage,
} = require("../helpers/messageHelper");

const { sendTextMessage } = require("../services/whatsappService");
const { getAutoReply } = require("../services/grokService");

// Fetches Grok's reply, sends it to the customer on WhatsApp, and
// saves it as a BOT message. Runs after the webhook has already
// responded 200 to Meta, so a slow/failed Grok call never delays or
// breaks message delivery for the customer's inbound message.
const triggerAutoReply = async (conversationId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { customer: true },
  });

  if (!conversation || !conversation.botEnabled) return;

  const recipientPhone = conversation.phone || conversation.customer?.phone;
  if (!recipientPhone) return;

  const result = await getAutoReply(conversationId);

  if (!result.success) {
    console.error("Grok did not return a reply:", result.error);
    return;
  }

  const sendResult = await sendTextMessage(recipientPhone, result.reply);

  if (!sendResult.success) {
    console.error("Failed to send Grok auto-reply on WhatsApp:", sendResult.error);
    return;
  }

  const botMessage = await prisma.message.create({
    data: {
      conversationId,
      content: result.reply,
      sender: "BOT",
      messageType: "TEXT",
      status: "SENT",
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessage: result.reply },
  });

  console.log("Auto-reply sent:", botMessage.id);
};

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.VERIFY_TOKEN
  ) {
    console.log("Webhook Verified");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post("/", async (req, res) => {
  try {
    const value = req.body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    const statuses = value?.statuses;

    if (message) {
      const phone = message.from;

      // Fall back for non-text messages (image/sticker/voice/location/
      // button or interactive replies) so the incoming message still
      // gets saved instead of throwing on a required "content" field.
      const text =
        message.text?.body ||
        message.button?.text ||
        message.interactive?.button_reply?.title ||
        message.interactive?.list_reply?.title ||
        `[${message.type || "unsupported"} message]`;

      console.log("Phone :", phone);
      console.log("Message :", text);

      const conversation = await getOrCreateConversation(phone);

      console.log("Conversation ID :",conversation.id);
      if (conversation.customer) {
        console.log("Customer :", conversation.customer.name);
        } else {
        console.log("Customer : Not linked yet");
        }
    
      await saveIncomingMessage(conversation.id, text);
        console.log("Message saved successfully");

      // AI AUTO-REPLY (Grok)
      // Only fires when this specific conversation has the bot toggle
      // ON (conversation.botEnabled). If an agent already sent a manual
      // reply, botEnabled would have been flipped off elsewhere.
      if (conversation.botEnabled) {
        triggerAutoReply(conversation.id).catch((err) => {
          console.error("Auto-reply pipeline failed:", err);
        });
      }
    }

    // Delivery status updates (sent/delivered/read/failed) for messages
    // we sent out. Matched back to our Message row via metaMessageId so
    // failures are visible instead of silently disappearing.
    if (statuses && statuses.length > 0) {
      for (const statusEvent of statuses) {
        const metaMessageId = statusEvent.id;
        const newStatus = statusEvent.status; // sent | delivered | read | failed
        const failureReason =
          statusEvent.errors?.[0]?.title ||
          statusEvent.errors?.[0]?.message ||
          null;

        console.log("Status update:", metaMessageId, newStatus, failureReason || "");

        if (!metaMessageId) continue;

        try {
          await prisma.message.updateMany({
            where: { metaMessageId },
            data: {
              status: newStatus ? newStatus.toUpperCase() : undefined,
              failureReason,
            },
          });
        } catch (err) {
          console.error("Failed to update message status:", err);
        }
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});



module.exports = router;