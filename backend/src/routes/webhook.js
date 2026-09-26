// // const express = require("express");
// // const router = express.Router();
// // const prisma = require("../config/prisma");

// // const {
// //   getOrCreateConversation,
// // } = require("../helpers/conversationHelper");

// // const {
// //   saveIncomingMessage,
// // } = require("../helpers/messageHelper");

// // router.get("/", (req, res) => {
// //   const mode = req.query["hub.mode"];
// //   const token = req.query["hub.verify_token"];
// //   const challenge = req.query["hub.challenge"];

// //   if (
// //     mode === "subscribe" &&
// //     token === process.env.VERIFY_TOKEN
// //   ) {
// //     console.log("Webhook Verified");
// //     return res.status(200).send(challenge);
// //   }

// //   return res.sendStatus(403);
// // });

// // router.post("/", async (req, res) => {
// //   try {
// //     const value = req.body.entry?.[0]?.changes?.[0]?.value;
// //     const message = value?.messages?.[0];
// //     const statuses = value?.statuses;

// //     if (message) {
// //       const phone = message.from;

// //       // Fall back for non-text messages (image/sticker/voice/location/
// //       // button or interactive replies) so the incoming message still
// //       // gets saved instead of throwing on a required "content" field.
// //       const text =
// //         message.text?.body ||
// //         message.button?.text ||
// //         message.interactive?.button_reply?.title ||
// //         message.interactive?.list_reply?.title ||
// //         `[${message.type || "unsupported"} message]`;

// //       console.log("Phone :", phone);
// //       console.log("Message :", text);

// //       const conversation = await getOrCreateConversation(phone);

// //       console.log("Conversation ID :",conversation.id);
// //       if (conversation.customer) {
// //         console.log("Customer :", conversation.customer.name);
// //         } else {
// //         console.log("Customer : Not linked yet");
// //         }
    
// //       await saveIncomingMessage(conversation.id, text);
// //         console.log("Message saved successfully");
// //     }

// //     // Delivery status updates (sent/delivered/read/failed) for messages
// //     // we sent out. Matched back to our Message row via metaMessageId so
// //     // failures are visible instead of silently disappearing.
// //     if (statuses && statuses.length > 0) {
// //       for (const statusEvent of statuses) {
// //         const metaMessageId = statusEvent.id;
// //         const newStatus = statusEvent.status; // sent | delivered | read | failed
// //         const failureReason =
// //           statusEvent.errors?.[0]?.title ||
// //           statusEvent.errors?.[0]?.message ||
// //           null;

// //         console.log("Status update:", metaMessageId, newStatus, failureReason || "");

// //         if (!metaMessageId) continue;

// //         try {
// //           await prisma.message.updateMany({
// //             where: { metaMessageId },
// //             data: {
// //               status: newStatus ? newStatus.toUpperCase() : undefined,
// //               failureReason,
// //             },
// //           });
// //         } catch (err) {
// //           console.error("Failed to update message status:", err);
// //         }
// //       }
// //     }

// //     return res.sendStatus(200);
// //   } catch (error) {
// //     console.error(error);
// //     return res.sendStatus(500);
// //   }
// // });



// // module.exports = router;

// const express = require("express");
// const router = express.Router();
// const prisma = require("../config/prisma");

// const {
//   getOrCreateConversation,
// } = require("../helpers/conversationHelper");

// const {
//   saveIncomingMessage,
// } = require("../helpers/messageHelper");

// const { sendTextMessage } = require("../services/whatsappService");
// const { getAutoReply } = require("../services/grokService");

// // Fetches Grok's reply, sends it to the customer on WhatsApp, and
// // saves it as a BOT message. Runs after the webhook has already
// // responded 200 to Meta, so a slow/failed Grok call never delays or
// // breaks message delivery for the customer's inbound message.
// const triggerAutoReply = async (conversationId) => {
//   const conversation = await prisma.conversation.findUnique({
//     where: { id: conversationId },
//     include: { customer: true, whatsappAccount: true }, // 👈 NEW: was missing
//   });

//   if (!conversation || !conversation.botEnabled) return;

//   const recipientPhone = conversation.phone || conversation.customer?.phone;
//   if (!recipientPhone) return;

//   if (!conversation.whatsappAccount) { // 👈 NEW guard
//     console.error("Cannot send Grok auto-reply: no WhatsApp account on this conversation");
//     return;
//   }

//   const result = await getAutoReply(conversationId);

//   if (!result.success) {
//     console.error("Grok did not return a reply:", result.error);
//     return;
//   }

//   const sendResult = await sendTextMessage(
//     recipientPhone,
//     result.reply,
//     conversation.whatsappAccount // 👈 NEW: was missing, causing every auto-reply to fail
//   );

//   if (!sendResult.success) {
//     console.error("Failed to send Grok auto-reply on WhatsApp:", sendResult.error);
//     return;
//   }

//   const botMessage = await prisma.message.create({
//     data: {
//       conversationId,
//       content: result.reply,
//       sender: "BOT",
//       messageType: "TEXT",
//       status: "SENT",
//     },
//   });

//   await prisma.conversation.update({
//     where: { id: conversationId },
//     data: { lastMessage: result.reply },
//   });

//   console.log("Auto-reply sent:", botMessage.id);
// };

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

//       // AI AUTO-REPLY (Grok)
//       // Only fires when this specific conversation has the bot toggle
//       // ON (conversation.botEnabled). If an agent already sent a manual
//       // reply, botEnabled would have been flipped off elsewhere.
//       if (conversation.botEnabled) {
//         triggerAutoReply(conversation.id).catch((err) => {
//           console.error("Auto-reply pipeline failed:", err);
//         });
//       }
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

// ============================================
// AI AUTO-REPLY (GROK) — unchanged
// ============================================
// Fetches Grok's reply, sends it to the customer on WhatsApp, and
// saves it as a BOT message. Runs after the webhook has already
// responded 200 to Meta, so a slow/failed Grok call never delays or
// breaks message delivery for the customer's inbound message.
const triggerAutoReply = async (conversationId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { customer: true, whatsappAccount: true },
  });

  if (!conversation || !conversation.botEnabled) return;

  const recipientPhone = conversation.phone || conversation.customer?.phone;
  if (!recipientPhone) return;

  if (!conversation.whatsappAccount) {
    console.error("Cannot send Grok auto-reply: no WhatsApp account on this conversation");
    return;
  }

  const result = await getAutoReply(conversationId);

  if (!result.success) {
    console.error("Grok did not return a reply:", result.error);
    return;
  }

  const sendResult = await sendTextMessage(
    recipientPhone,
    result.reply,
    conversation.whatsappAccount
  );

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

// ============================================
// FIND THE WHATSAPP ACCOUNT A WEBHOOK BELONGS TO
// ============================================
// Every webhook "value" object carries metadata.phone_number_id.
// We use it to resolve which company/account this event is for, so
// conversations and messages get linked correctly — this matters for
// EVERY number, not just Coexistence ones.
const findAccountByPhoneNumberId = async (phoneNumberId) => {
  if (!phoneNumberId) return null;
  return prisma.whatsAppAccount.findUnique({ where: { phoneNumberId } });
};

const accountContextFor = (account) =>
  account
    ? { companyId: account.companyId, whatsappAccountId: account.id }
    : null;

// ============================================
// HANDLE: "messages" field
// ============================================
// Normal inbound customer messages + outbound delivery statuses.
// Same logic whether the number is Coexistence or API-only.
const handleMessagesField = async (value) => {
  const phoneNumberId = value?.metadata?.phone_number_id;
  const account = await findAccountByPhoneNumberId(phoneNumberId);

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

    const conversation = await getOrCreateConversation(phone, accountContextFor(account));

    console.log("Conversation ID :", conversation.id);
    if (conversation.customer) {
      console.log("Customer :", conversation.customer.name);
    } else {
      console.log("Customer : Not linked yet");
    }

    await saveIncomingMessage(conversation.id, text);
    console.log("Message saved successfully");

    // Only fires when this specific conversation has the bot toggle
    // ON. If an agent already sent a manual reply, botEnabled would
    // have been flipped off elsewhere.
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
};

// ============================================
// HANDLE: "smb_message_echoes" field  — COEXISTENCE
// ============================================
// A message the business sent from their phone (WhatsApp Business
// app, or a linked companion device) after being onboarded onto
// Coexistence. Mirror it into the CRM inbox as if an agent sent it.
const handleSmbMessageEchoesField = async (value) => {
  const phoneNumberId = value?.metadata?.phone_number_id;
  const account = await findAccountByPhoneNumberId(phoneNumberId);

  const echoes = value?.message_echoes || [];

  for (const echo of echoes) {
    const customerPhone = echo.to;
    if (!customerPhone) continue;

    const text =
      echo.text?.body ||
      echo.button?.text ||
      echo.interactive?.button_reply?.title ||
      `[${echo.type || "unsupported"} message from phone]`;

    const conversation = await getOrCreateConversation(customerPhone, accountContextFor(account));

    // Avoid saving the same echo twice if Meta redelivers the webhook
    if (echo.id) {
      const alreadySaved = await prisma.message.findUnique({
        where: { metaMessageId: echo.id },
      });
      if (alreadySaved) continue;
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: text,
        sender: "AGENT",
        messageType: "TEXT",
        status: "SENT",
        metaMessageId: echo.id || undefined,
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: text,
        // The business itself just replied from their phone, so the
        // bot shouldn't jump in on this thread.
        botEnabled: false,
      },
    });

    console.log("Mirrored WhatsApp Business App message into CRM:", echo.id);
  }
};

// ============================================
// HANDLE: "smb_app_state_sync" field  — COEXISTENCE
// ============================================
// Contacts from the business's phone address book — synced once
// right after onboarding, then again whenever the business adds,
// edits, or removes a contact. We only use this to enrich EXISTING
// customers by phone number; we never auto-create new CRM customers
// from this webhook.
const handleSmbAppStateSyncField = async (value) => {
  const phoneNumberId = value?.metadata?.phone_number_id;
  const account = await findAccountByPhoneNumberId(phoneNumberId);

  const syncItems = value?.state_sync || [];

  if (account && account.contactsSyncStatus === "REQUESTED") {
    await prisma.whatsAppAccount
      .update({
        where: { id: account.id },
        data: { contactsSyncStatus: "IN_PROGRESS" },
      })
      .catch(() => {});
  }

  for (const item of syncItems) {
    if (item.type !== "contact") continue;

    const phone = item.contact?.phone_number;
    if (!phone) continue;

    if (item.action === "remove") {
      console.log("Contact removed from WhatsApp Business App:", phone);
      continue;
    }

    const fullName = item.contact?.full_name;
    if (!fullName) continue;

    try {
      // Only fill in a name for customers who don't already have one —
      // never overwrite data the agent has already entered in the CRM.
      await prisma.customer.updateMany({
        where: { phone, OR: [{ name: null }, { name: "" }] },
        data: { name: fullName },
      });
    } catch (err) {
      console.error("Failed to sync contact name:", err);
    }
  }
};

// ============================================
// HANDLE: "history" field  — COEXISTENCE
// ============================================
// Up to 180 days of 1:1 chat history, delivered in phases/chunks. A
// history webhook with error code 2593109 means the business declined
// to share their chat history. Media message bodies arrive in a
// separate follow-up webhook, so media_placeholder rows are skipped
// here (they carry no content yet).
const handleHistoryField = async (value) => {
  const phoneNumberId = value?.metadata?.phone_number_id;
  const account = await findAccountByPhoneNumberId(phoneNumberId);

  const historyChunks = value?.history || [];

  for (const chunk of historyChunks) {
    // Business declined to share their chat history (or another
    // history-sync error occurred).
    if (chunk.errors?.length) {
      console.log("History sync declined or failed:", chunk.errors[0]?.title);

      if (account) {
        await prisma.whatsAppAccount
          .update({
            where: { id: account.id },
            data: { historySyncStatus: "DECLINED" },
          })
          .catch(() => {});
      }
      continue;
    }

    const { phase, progress } = chunk.metadata || {};

    for (const thread of chunk.threads || []) {
      const customerPhone = thread.id;
      if (!customerPhone) continue;

      const conversation = await getOrCreateConversation(customerPhone, accountContextFor(account));

      for (const historyMessage of thread.messages || []) {
        if (historyMessage.id) {
          const alreadySaved = await prisma.message.findUnique({
            where: { metaMessageId: historyMessage.id },
          });
          if (alreadySaved) continue;
        }

        // Media contents arrive in a separate follow-up webhook —
        // skip the placeholder row itself; there's nothing to show yet.
        if (historyMessage.type === "media_placeholder") continue;

        const isFromBusiness =
          account && historyMessage.from === account.displayPhoneNumber;

        const text =
          historyMessage.text?.body ||
          `[${historyMessage.type || "unsupported"} message]`;

        try {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              content: text,
              sender: isFromBusiness ? "AGENT" : "CUSTOMER",
              messageType: "TEXT",
              status: historyMessage.history_context?.status || "DELIVERED",
              metaMessageId: historyMessage.id || undefined,
              createdAt: historyMessage.timestamp
                ? new Date(Number(historyMessage.timestamp) * 1000)
                : undefined,
            },
          });
        } catch (err) {
          // Safe to ignore duplicate metaMessageId races from redelivery
          console.error("Failed to save history message:", err.message);
        }
      }
    }

    console.log(`History sync progress: phase ${phase}, ${progress}%`);

    if (account && progress === 100) {
      await prisma.whatsAppAccount
        .update({
          where: { id: account.id },
          data: { historySyncStatus: "COMPLETED" },
        })
        .catch(() => {});
    }
  }
};

// ============================================
// HANDLE: "account_update" field
// ============================================
// Fired when the business disconnects the Cloud API link from their
// phone (Settings > Account > Business Platform > Disconnect), or
// when Meta offboards/reconnects the WABA. Applies to Coexistence
// numbers, but harmless to handle for every number.
const handleAccountUpdateField = async (value) => {
  const event = value?.event;
  const phone = value?.phone_number;

  console.log("Account update event:", event, phone);

  if (!phone) return;

  const account = await prisma.whatsAppAccount.findFirst({
    where: { displayPhoneNumber: phone },
  });

  if (!account) return;

  if (event === "PARTNER_REMOVED") {
    const reason = value?.disconnection_info?.reason;
    console.log("WhatsApp account disconnected by business. Reason:", reason);

    await prisma.whatsAppAccount.update({
      where: { id: account.id },
      data: { status: "DISCONNECTED", disconnectedAt: new Date() },
    });
  }

  if (event === "ACCOUNT_OFFBOARDED") {
    await prisma.whatsAppAccount.update({
      where: { id: account.id },
      data: { status: "DISCONNECTED", disconnectedAt: new Date() },
    });
  }

  if (event === "ACCOUNT_RECONNECTED") {
    await prisma.whatsAppAccount.update({
      where: { id: account.id },
      data: { status: "CONNECTED", disconnectedAt: null },
    });
  }
};

// ============================================
// WEBHOOK VERIFICATION (Meta calls this once when you save the
// callback URL + verify token in the App Dashboard)
// ============================================
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

// ============================================
// WEBHOOK EVENTS
// ============================================
router.post("/", async (req, res) => {
  try {
    const entries = req.body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const { field, value } = change;

        switch (field) {
          case "messages":
            await handleMessagesField(value);
            break;

          case "smb_message_echoes":
            await handleSmbMessageEchoesField(value);
            break;

          case "smb_app_state_sync":
            await handleSmbAppStateSyncField(value);
            break;

          case "history":
            await handleHistoryField(value);
            break;

          case "account_update":
            await handleAccountUpdateField(value);
            break;

          default:
            console.log("Unhandled webhook field:", field);
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