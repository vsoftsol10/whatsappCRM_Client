
// // ============================================
// // SAAS WHATSAPP WEBHOOK (multi-tenant)
// // ============================================
// // This is the ONLY webhook URL that should be registered in the
// // Meta App Dashboard for this app: /api/saas/webhook. It looks up
// // the WhatsApp account per-request by phone_number_id, which the
// // legacy single-tenant routes/webhook.js (env-var based) cannot do.
// // ============================================

// const express = require("express");
// const router = express.Router();
// const prisma = require("../config/prisma");
// const { findAccountByDisplayPhone } = require("../utils/whatsappAccountMatcher");

// const {
//   getOrCreateSaaSConversation,
// } = require("../helpers/saasConversationHelper");

// const {
//   saveIncomingMessage,
// } = require("../helpers/messageHelper");

// const {
//   resolveMessageContent,
// } = require("../helpers/whatsappMediaHelper");

// const { sendTextMessage } = require("../services/whatsappService");
// const { getAutoReply } = require("../services/aiService");
// const { canCompanySendMessages } = require("../utils/companyAccess");
// const { emitToCompany } = require("../socket");

// // ============================================
// // AI AUTO-REPLY (multi-tenant)
// // ============================================
// // Ported from the legacy routes/webhook.js so customers' bots work on
// // the active /api/saas/webhook URL. The AI settings (provider, key,
// // on/off) are read PER COMPANY inside getAutoReply, and the reply is
// // sent from the same WhatsApp number the customer wrote to.
// //
// // Runs AFTER this webhook has answered Meta (fire-and-forget), so a
// // slow or failed AI call never delays message delivery.
// //
// // Safeguards:
// //  - the company's subscription must be active (not expired/inactive)
// //  - the WhatsApp number must still be CONNECTED
// //  - one reply pipeline per conversation at a time
// //  - if the customer writes again while the AI is thinking, the stale
// //    reply is dropped and regenerated with the full context
// //  - the bot switch is re-checked right before sending, so an agent
// //    who takes over mid-generation is never talked over
// //  - the BOT message stores Meta's message id so delivery status
// //    updates work and the Coexistence echo handler does not mistake
// //    it for a manual agent message (which would switch the bot off)
// const activeReplies = new Set();
// const MAX_REGENERATIONS = 3;

// const attemptAutoReply = async (conversationId) => {
//   const conversation = await prisma.conversation.findUnique({
//     where: { id: conversationId },
//     include: { customer: true, whatsappAccount: true },
//   });

//   if (!conversation || !conversation.botEnabled) return "done";

//   // Expired / inactive companies cannot send messages — this includes
//   // AI auto-replies. Incoming messages are still saved (view-only).
//   if (!(await canCompanySendMessages(conversation.companyId))) {
//     console.log(
//       "AI auto-reply skipped: company subscription is inactive or expired. companyId:",
//       conversation.companyId
//     );
//     return "done";
//   }

//   const recipientPhone = conversation.phone || conversation.customer?.phone;
//   if (!recipientPhone) {
//     console.error("Cannot send AI auto-reply: conversation has no phone number");
//     return "done";
//   }

//   // Reply from the number this chat belongs to; fall back to the
//   // company's connected number if the chat was never linked to one.
//   let whatsappAccount = conversation.whatsappAccount;
//   if (!whatsappAccount) {
//     whatsappAccount = await prisma.whatsAppAccount.findFirst({
//       where: { companyId: conversation.companyId, status: "CONNECTED" },
//     });
//   }

//   if (!whatsappAccount || whatsappAccount.status !== "CONNECTED") {
//     console.log("AI auto-reply skipped: no connected WhatsApp account for this chat");
//     return "done";
//   }

//   // Latest customer message at the moment we start generating
//   const latestCustomerMessage = await prisma.message.findFirst({
//     where: { conversationId, sender: "CUSTOMER" },
//     orderBy: { createdAt: "desc" },
//   });

//   if (!latestCustomerMessage) return "done";

//   const result = await getAutoReply(conversationId);

//   if (!result.success) {
//     console.error("AI did not return a reply:", result.error);
//     return "done";
//   }

//   // Customer wrote again while the AI was thinking -> throw this reply
//   // away and answer the whole burst of messages in one go.
//   const newerCustomerMessages = await prisma.message.count({
//     where: {
//       conversationId,
//       sender: "CUSTOMER",
//       createdAt: { gt: latestCustomerMessage.createdAt },
//     },
//   });

//   if (newerCustomerMessages > 0) return "stale";

//   // Re-check: an agent may have taken over (bot switched off), or the
//   // number may have been disconnected while we were waiting.
//   const fresh = await prisma.conversation.findUnique({
//     where: { id: conversationId },
//     select: { botEnabled: true },
//   });

//   if (!fresh || !fresh.botEnabled) return "done";

//   const freshAccount = await prisma.whatsAppAccount.findUnique({
//     where: { id: whatsappAccount.id },
//     select: { status: true },
//   });

//   if (!freshAccount || freshAccount.status !== "CONNECTED") return "done";

//   const sendResult = await sendTextMessage(
//     recipientPhone,
//     result.reply,
//     whatsappAccount
//   );

//   if (!sendResult.success) {
//     console.error("Failed to send AI auto-reply on WhatsApp:", sendResult.error);
//     return "done";
//   }

//   const metaMessageId = sendResult.data?.messages?.[0]?.id || undefined;

//   const botMessage = await prisma.message.create({
//     data: {
//       conversationId,
//       content: result.reply,
//       sender: "BOT",
//       messageType: "TEXT",
//       status: "SENT",
//       metaMessageId,
//     },
//   });

//   await prisma.conversation.update({
//     where: { id: conversationId },
//     data: { lastMessage: result.reply },
//   });

//   emitToCompany(conversation.companyId, "message:new", {
//     conversationId,
//     message: botMessage,
//   });

//   console.log("SaaS auto-reply sent:", botMessage.id);
//   return "done";
// };

// const triggerAutoReply = async (conversationId) => {
//   if (activeReplies.has(conversationId)) {
//     // A pipeline is already running for this chat. It will notice the
//     // newer customer message and regenerate, so nothing to do here.
//     return;
//   }

//   activeReplies.add(conversationId);

//   try {
//     for (let i = 0; i < MAX_REGENERATIONS; i++) {
//       const outcome = await attemptAutoReply(conversationId);
//       if (outcome !== "stale") break;
//     }
//   } finally {
//     activeReplies.delete(conversationId);
//   }
// };

// // ============================================
// // TEST ROUTE
// // ============================================
// router.get("/test", (req, res) => {
//   res.status(200).send("SAAS WEBHOOK ROUTE IS WORKING");
// });

// // ============================================
// // META WEBHOOK VERIFICATION
// // ============================================
// router.get("/", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (
//     mode === "subscribe" &&
//     token === process.env.VERIFY_TOKEN
//   ) {
//     console.log("SaaS Webhook Verified");

//     return res.status(200).send(challenge);
//   }

//   console.log("SaaS Webhook Verification Failed");

//   return res.sendStatus(403);
// });

// // ============================================
// // RECEIVE WEBHOOK EVENTS
// // ============================================
// // ============================================
// // RETRY OR DROP?
// //
// // If we answer 500, Meta re-sends the webhook (for up to 7 days). That is
// // what we WANT for temporary problems (database down / timed out): the
// // message is not lost, and the duplicate check keeps it from being saved
// // twice. For a payload that can never succeed (bad data, unknown account)
// // retrying would loop forever and Meta may disable the webhook, so those
// // are logged and answered with 200.
// // ============================================
// const TRANSIENT_PRISMA_CODES = new Set([
//   "P1001", // cannot reach database server
//   "P1002", // database server timed out
//   "P1008", // operations timed out
//   "P1017", // server closed the connection
//   "P2024", // timed out getting a connection from the pool
//   "P2028", // transaction API error
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

// // ============================================
// // PROCESS ONE "change" OF A WEBHOOK
// // (the body of the old POST handler, unchanged except where marked NEW)
// // ============================================
// const processWebhookChange = async (field, value) => {
//   try {

//     // ============================================
//     // TEMPLATE STATUS UPDATE (Approved / Rejected / Paused / Disabled)
//     // ============================================
//     // Must be checked BEFORE the phone_number_id lookup below,
//     // since template status events don't include a phone_number_id.

//     if (field === "message_template_status_update") {
//       const metaTemplateId = value.message_template_id?.toString();
//       const newStatus = value.event; // "APPROVED" | "REJECTED" | "PAUSED" | "DISABLED"
//       const reason = value.reason || null;

//       console.log("Template status update:", {
//         metaTemplateId,
//         newStatus,
//         reason,
//       });

//       if (metaTemplateId) {
//         try {
//           await prisma.template.updateMany({
//             where: { metaTemplateId },
//             data: {
//               status: newStatus,
//               rejectionReason: newStatus === "REJECTED" ? reason : null,
//             },
//           });
//         } catch (error) {
//           console.error(
//             "Failed to update template status from webhook:",
//             error
//           );
//         }
//       }

//       return;
//     }

//     // ============================================
//     // ACCOUNT UPDATE (COEXISTENCE) — disconnect / offboard / reconnect
//     // ============================================
//     // Must ALSO be checked BEFORE the phone_number_id lookup below —
//     // this event carries a top-level "phone_number" string, not a
//     // "metadata.phone_number_id" object like message-related fields do.
//     // Fires when the business disconnects the Cloud API link from
//     // their phone (Settings > Account > Business Platform > Disconnect),
//     // or when Meta offboards/reconnects the WABA.

//     if (field === "account_update") {
//       const event = value.event; // PARTNER_REMOVED | ACCOUNT_OFFBOARDED | ACCOUNT_RECONNECTED
//       const displayPhoneNumber = value.phone_number;

//       console.log("SaaS account_update event:", event, displayPhoneNumber);

//       if (!displayPhoneNumber) {
//         return;
//       }

//       // Digit-based match, so "919876543210" finds "+91 98765 43210".
//       const account = await findAccountByDisplayPhone(displayPhoneNumber);

//       if (!account) {
//         console.log(
//           "No WhatsApp account found for account_update phone_number:",
//           displayPhoneNumber,
//           "Payload:",
//           JSON.stringify(value)
//         );
//         return;
//       }

//       try {
//         if (event === "PARTNER_REMOVED") {
//           const reason = value.disconnection_info?.reason || null;
//           console.log(
//             "WhatsApp account disconnected by business. Reason:",
//             reason
//           );

//           await prisma.whatsAppAccount.update({
//             where: { id: account.id },
//             data: { status: "DISCONNECTED", disconnectedAt: new Date() },
//           });
//         }

//         if (event === "ACCOUNT_OFFBOARDED") {
//           await prisma.whatsAppAccount.update({
//             where: { id: account.id },
//             data: { status: "DISCONNECTED", disconnectedAt: new Date() },
//           });
//         }

//         if (event === "ACCOUNT_RECONNECTED") {
//           // A disconnect from the CRM deletes the stored token, so without
//           // a token we must NOT show "Connected" — the admin has to reconnect.
//           if (!account.whatsappAccessToken) {
//             console.log(
//               "ACCOUNT_RECONNECTED ignored — no stored access token for account",
//               account.id
//             );
//           } else {
//             await prisma.whatsAppAccount.update({
//               where: { id: account.id },
//               data: { status: "CONNECTED", disconnectedAt: null },
//             });
//           }
//         }
//       } catch (error) {
//         console.error("Failed to process account_update webhook:", error);
//       }

//       return;
//     }

//     // ============================================
//     // GET META PHONE NUMBER ID
//     // ============================================

//     const phoneNumberId =
//       value.metadata?.phone_number_id;

//     console.log(
//       "Meta Phone Number ID:",
//       phoneNumberId
//     );

//     if (!phoneNumberId) {
//       console.log(
//         "No phone_number_id found in webhook"
//       );

//       return;
//     }

//     // ============================================
//     // FIND CONNECTED WHATSAPP ACCOUNT
//     // ============================================

//     const whatsappAccount =
//       await prisma.whatsAppAccount.findFirst({
//         where: {
//           phoneNumberId,
//           status: "CONNECTED",
//         },
//       });

//     if (!whatsappAccount) {
//       console.error(
//         "No connected WhatsApp account found for phoneNumberId:",
//         phoneNumberId
//       );

//       return;
//     }

//     const companyId =
//       whatsappAccount.companyId;

//     const whatsappAccountId =
//       whatsappAccount.id;

//     console.log("WhatsApp Account:", {
//       id: whatsappAccountId,
//       companyId,
//       phoneNumberId,
//       businessName:
//         whatsappAccount.whatsappBusinessName,
//     });

//     // ============================================
//     // INCOMING MESSAGE
//     // ============================================

//     // NEW: Meta can put several messages in one webhook, so loop over ALL of
//     // them (before, only messages[0] was handled and the rest were lost).
//     const incomingMessages = Array.isArray(value.messages)
//       ? value.messages
//       : [];

//     let transientFailure = null;

//     for (const message of incomingMessages) {
//       try {
//         const customerPhone = message.from;

//         if (!customerPhone) {
//           continue;
//         }

//         // NEW: duplicate check. Meta re-sends a webhook when we answer slowly
//         // or with an error. The message id is unique, so skip if we have it.
//         if (message.id) {
//           const alreadySaved = await prisma.message.findUnique({
//             where: { metaMessageId: message.id },
//             select: { id: true },
//           });

//           if (alreadySaved) {
//             console.log("Duplicate webhook message skipped:", message.id);
//             continue;
//           }
//         }

//         // NEW: images, audio, video, documents and stickers are downloaded
//         // and stored (same helper already used for echoes and history sync).
//         // Before, they were saved as the text "[image message]".
//         // Text / button / list replies behave exactly as before.
//         const { content: text, messageType, imageUrl } =
//           await resolveMessageContent(
//             message,
//             whatsappAccount.whatsappAccessToken ||
//               process.env.META_SYSTEM_USER_TOKEN
//           );

//         console.log(
//           "Customer Phone:",
//           customerPhone
//         );

//         console.log(
//           "Message:",
//           text
//         );

//         // ============================================
//         // GET / CREATE CONVERSATION
//         // ============================================

//         const conversation =
//           await getOrCreateSaaSConversation(
//             companyId,
//             whatsappAccountId,
//             customerPhone
//           );

//         console.log(
//           "Conversation ID:",
//           conversation.id
//         );

//         if (conversation.customer) {
//           console.log(
//             "Customer:",
//             conversation.customer.name
//           );
//         } else {
//           console.log(
//             "Customer: Not linked yet"
//           );
//         }

//         // ============================================
//         // SAVE MESSAGE (with Meta's id, for duplicate protection)
//         // ============================================

//         const savedMessage = await saveIncomingMessage(
//           conversation.id,
//           text,
//           {
//             metaMessageId: message.id,
//             messageType,
//             imageUrl,
//           }
//         );

//         // null = a parallel delivery already saved it
//         if (!savedMessage) {
//           continue;
//         }

//         console.log(
//           "SaaS incoming message saved successfully"
//         );

//         emitToCompany(companyId, "message:new", {
//           conversationId: conversation.id,
//           message: savedMessage,
//         });

//         // Only fires when this specific chat has the bot ON. The company's
//         // AI settings (enabled / provider / key) are checked inside
//         // getAutoReply. Not awaited, so Meta gets its 200 right away.
//         if (conversation.botEnabled) {
//           triggerAutoReply(conversation.id).catch((err) => {
//             console.error("SaaS auto-reply pipeline failed:", err);
//           });
//         }
//       } catch (error) {
//         // One bad message must not stop the rest of the batch.
//         console.error(
//           "Failed to process incoming message:",
//           message?.id,
//           error
//         );

//         if (isTransientError(error)) {
//           transientFailure = error;
//         }
//       }
//     }

//     // Temporary failure (e.g. database down): let Meta retry the whole
//     // webhook. Messages already saved are skipped by the duplicate check.
//     if (transientFailure) {
//       throw transientFailure;
//     }

//     // ============================================
//     // MESSAGE STATUS EVENTS
//     // ============================================

//     const statuses = value.statuses;

//     if (statuses && statuses.length > 0) {
//       for (const statusEvent of statuses) {
//         const metaMessageId =
//           statusEvent.id;

//         const newStatus =
//           statusEvent.status;

//         const failureReason =
//           statusEvent.errors?.[0]?.title ||
//           statusEvent.errors?.[0]?.message ||
//           null;

//         console.log(
//           "SaaS Status Update:",
//           metaMessageId,
//           newStatus,
//           failureReason || ""
//         );

//         if (!metaMessageId) {
//           continue;
//         }

//         try {
//           await prisma.message.updateMany({
//             where: {
//               metaMessageId,
//             },
//             data: {
//               status: newStatus
//                 ? newStatus.toUpperCase()
//                 : undefined,
//               failureReason,
//             },
//           });

//           emitToCompany(companyId, "message:status", {
//             metaMessageId,
//             status: newStatus ? newStatus.toUpperCase() : undefined,
//             failureReason,
//           });
//         } catch (error) {
//           console.error(
//             "Failed to update SaaS message status:",
//             error
//           );
//         }
//       }
//     }

//     // ============================================
//     // COEXISTENCE: WHATSAPP BUSINESS APP MESSAGE ECHOES
//     // ============================================
//     // A message the business sent from their PHONE (WhatsApp Business
//     // app or a linked companion device) after being onboarded onto
//     // Coexistence. Mirror it into the CRM inbox as if an agent sent it.

//     const messageEchoes = value.message_echoes;

//     if (messageEchoes && messageEchoes.length > 0) {
//       for (const echo of messageEchoes) {
//         const customerPhone = echo.to;
//         if (!customerPhone) continue;

//         console.log("SaaS message echo — from phone to:", customerPhone);

//         try {
//           // Avoid saving the same echo twice if Meta redelivers the webhook
//           if (echo.id) {
//             const alreadySaved = await prisma.message.findUnique({
//               where: { metaMessageId: echo.id },
//             });
//             if (alreadySaved) continue;
//           }

//           // Resolves text as-is, or downloads image/video/audio/document
//           // media via the Graph API and re-hosts it on Cloudinary so it
//           // has a stable URL the CRM can actually render.
//           const { content, messageType, imageUrl } = await resolveMessageContent(
//             echo,
//             whatsappAccount.whatsappAccessToken
//           );

//           const conversation = await getOrCreateSaaSConversation(
//             companyId,
//             whatsappAccountId,
//             customerPhone
//           );

//           const echoMessage = await prisma.message.create({
//             data: {
//               conversationId: conversation.id,
//               content,
//               sender: "AGENT",
//               messageType,
//               imageUrl,
//               status: "SENT",
//               metaMessageId: echo.id || undefined,
//             },
//           });

//           emitToCompany(companyId, "message:new", {
//             conversationId: conversation.id,
//             message: echoMessage,
//           });

//           await prisma.conversation.update({
//             where: { id: conversation.id },
//             data: {
//               lastMessage: content,
//               // The business itself just replied from their phone, so
//               // the bot shouldn't jump in on this thread.
//               botEnabled: false,
//             },
//           });

//           console.log("Mirrored WhatsApp Business App message into CRM:", echo.id);
//         } catch (error) {
//           console.error("Failed to save SaaS message echo:", error);
//         }
//       }
//     }

//     // ============================================
//     // COEXISTENCE: CONTACTS SYNC (smb_app_state_sync)
//     // ============================================
//     // Contacts from the business's phone address book — synced once
//     // right after onboarding, then again on add/edit/remove. Only
//     // enriches EXISTING customers (in this company) by phone number;
//     // never auto-creates new CRM customers from this webhook.

//     const stateSync = value.state_sync;

//     if (stateSync && stateSync.length > 0) {
//       if (whatsappAccount.contactsSyncStatus === "REQUESTED") {
//         await prisma.whatsAppAccount
//           .update({
//             where: { id: whatsappAccountId },
//             data: { contactsSyncStatus: "IN_PROGRESS" },
//           })
//           .catch(() => {});
//       }

//       for (const item of stateSync) {
//         if (item.type !== "contact") continue;

//         const contactPhone = item.contact?.phone_number;
//         if (!contactPhone) continue;

//         if (item.action === "remove") {
//           console.log("SaaS contact removed from WhatsApp Business App:", contactPhone);
//           continue;
//         }

//         const fullName = item.contact?.full_name;
//         if (!fullName) continue;

//         try {
//           // Only fill in a name for customers who don't already have
//           // one — never overwrite data the agent already entered.
//           // (Customer.name is a required field, so "no name" means "".
//           // Filtering `name: null` is not allowed by Prisma and made every
//           // call fail.)
//           await prisma.customer.updateMany({
//             where: {
//               companyId,
//               phone: contactPhone,
//               name: "",
//             },
//             data: { name: fullName },
//           });
//         } catch (error) {
//           console.error("Failed to sync SaaS contact name:", error);
//         }
//       }
//     }

//     // ============================================
//     // COEXISTENCE: CHAT HISTORY SYNC (history)
//     // ============================================
//     // Up to 180 days of 1:1 chat history, delivered in phases/chunks.
//     // A chunk with "errors" means the business declined to share their
//     // chat history (error code 2593109) or another sync error occurred.
//     // Media message bodies arrive in a separate follow-up webhook, so
//     // media_placeholder rows are skipped here.

//     const historyChunks = value.history;

//     if (historyChunks && historyChunks.length > 0) {
//       for (const chunk of historyChunks) {
//         if (chunk.errors?.length) {
//           console.log(
//             "SaaS history sync declined or failed:",
//             chunk.errors[0]?.title
//           );

//           await prisma.whatsAppAccount
//             .update({
//               where: { id: whatsappAccountId },
//               data: { historySyncStatus: "DECLINED" },
//             })
//             .catch(() => {});

//           continue;
//         }

//         const { phase, progress } = chunk.metadata || {};

//         for (const thread of chunk.threads || []) {
//           const customerPhone = thread.id;
//           if (!customerPhone) continue;

//           let conversation;
//           try {
//             conversation = await getOrCreateSaaSConversation(
//               companyId,
//               whatsappAccountId,
//               customerPhone
//             );
//           } catch (error) {
//             console.error("Failed to get/create conversation for history thread:", error);
//             continue;
//           }

//           for (const historyMessage of thread.messages || []) {
//             if (historyMessage.id) {
//               const alreadySaved = await prisma.message.findUnique({
//                 where: { metaMessageId: historyMessage.id },
//               });
//               if (alreadySaved) continue;
//             }

//             // Media contents arrive in a separate follow-up webhook, keyed
//             // by the same message id — skip the placeholder row itself,
//             // nothing to show yet, and let the real one create the row.
//             if (historyMessage.type === "media_placeholder") continue;

//             const isFromBusiness =
//               historyMessage.from === whatsappAccount.displayPhoneNumber;

//             // Resolves text as-is, or downloads image/video/audio/document
//             // media via the Graph API and re-hosts it on Cloudinary so it
//             // has a stable URL the CRM can actually render.
//             const { content, messageType, imageUrl } = await resolveMessageContent(
//               historyMessage,
//               whatsappAccount.whatsappAccessToken
//             );

//             try {
//               await prisma.message.create({
//                 data: {
//                   conversationId: conversation.id,
//                   content,
//                   sender: isFromBusiness ? "AGENT" : "CUSTOMER",
//                   messageType,
//                   imageUrl,
//                   status: historyMessage.history_context?.status || "DELIVERED",
//                   metaMessageId: historyMessage.id || undefined,
//                   createdAt: historyMessage.timestamp
//                     ? new Date(Number(historyMessage.timestamp) * 1000)
//                     : undefined,
//                 },
//               });
//             } catch (error) {
//               // Safe to ignore duplicate metaMessageId races from redelivery
//               console.error("Failed to save SaaS history message:", error.message);
//             }
//           }
//         }

//         console.log(`SaaS history sync progress: phase ${phase}, ${progress}%`);

//         if (progress === 100) {
//           await prisma.whatsAppAccount
//             .update({
//               where: { id: whatsappAccountId },
//               data: { historySyncStatus: "COMPLETED" },
//             })
//             .catch(() => {});
//         }
//       }
//     }

//   } catch (error) {
//     console.error(
//       "SAAS WEBHOOK ERROR (field: " + field + "):",
//       error
//     );

//     throw error;
//   }
// };

// router.post("/", async (req, res) => {
//   console.log(
//     "========== SAAS WHATSAPP WEBHOOK =========="
//   );

//   // NEW: handle EVERY entry and EVERY change in the payload.
//   // Before, only entry[0].changes[0] was processed.
//   const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];

//   let retryNeeded = false;

//   for (const entry of entries) {
//     const changes = Array.isArray(entry?.changes) ? entry.changes : [];

//     for (const change of changes) {
//       if (!change?.value) {
//         continue;
//       }

//       try {
//         await processWebhookChange(change.field, change.value);
//       } catch (error) {
//         if (isTransientError(error)) {
//           // answer 500 below so Meta sends this webhook again
//           retryNeeded = true;
//         } else {
//           // Cannot succeed on retry. Keep the payload in the logs so it
//           // can be replayed by hand, and acknowledge it.
//           console.error(
//             "SAAS WEBHOOK: dropping change that cannot be processed. Payload:",
//             JSON.stringify(change)
//           );
//         }
//       }
//     }
//   }

//   return res.sendStatus(retryNeeded ? 500 : 200);
// });

// module.exports = router;


// ============================================
// SAAS WHATSAPP WEBHOOK (multi-tenant)
// ============================================
// This is the ONLY webhook URL that should be registered in the
// Meta App Dashboard for this app: /api/saas/webhook. It looks up
// the WhatsApp account per-request by phone_number_id, which the
// legacy single-tenant routes/webhook.js (env-var based) cannot do.
// ============================================

const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const { findAccountByDisplayPhone } = require("../utils/whatsappAccountMatcher");

const {
  getOrCreateSaaSConversation,
} = require("../helpers/saasConversationHelper");

const {
  saveIncomingMessage,
} = require("../helpers/messageHelper");

const {
  resolveMessageContent,
} = require("../helpers/whatsappMediaHelper");

const { sendTextMessage } = require("../services/whatsappService");
const { getAutoReply } = require("../services/aiService");
const { handleAiHandoff } = require("../services/ai/handoffService");
const { canCompanySendMessages } = require("../utils/companyAccess");
const { emitToCompany } = require("../socket");

// ============================================
// AI AUTO-REPLY (multi-tenant)
// ============================================
// Ported from the legacy routes/webhook.js so customers' bots work on
// the active /api/saas/webhook URL. The AI settings (provider, key,
// on/off) are read PER COMPANY inside getAutoReply, and the reply is
// sent from the same WhatsApp number the customer wrote to.
//
// Runs AFTER this webhook has answered Meta (fire-and-forget), so a
// slow or failed AI call never delays message delivery.
//
// Safeguards:
//  - the company's subscription must be active (not expired/inactive)
//  - the WhatsApp number must still be CONNECTED
//  - one reply pipeline per conversation at a time
//  - if the customer writes again while the AI is thinking, the stale
//    reply is dropped and regenerated with the full context
//  - the bot switch is re-checked right before sending, so an agent
//    who takes over mid-generation is never talked over
//  - the BOT message stores Meta's message id so delivery status
//    updates work and the Coexistence echo handler does not mistake
//    it for a manual agent message (which would switch the bot off)
const activeReplies = new Set();
const MAX_REGENERATIONS = 3;

const attemptAutoReply = async (conversationId) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { customer: true, whatsappAccount: true },
  });

  if (!conversation || !conversation.botEnabled) return "done";

  // Expired / inactive companies cannot send messages — this includes
  // AI auto-replies. Incoming messages are still saved (view-only).
  if (!(await canCompanySendMessages(conversation.companyId))) {
    console.log(
      "AI auto-reply skipped: company subscription is inactive or expired. companyId:",
      conversation.companyId
    );
    return "done";
  }

  const recipientPhone = conversation.phone || conversation.customer?.phone;
  if (!recipientPhone) {
    console.error("Cannot send AI auto-reply: conversation has no phone number");
    return "done";
  }

  // Reply from the number this chat belongs to; fall back to the
  // company's connected number if the chat was never linked to one.
  let whatsappAccount = conversation.whatsappAccount;
  if (!whatsappAccount) {
    whatsappAccount = await prisma.whatsAppAccount.findFirst({
      where: { companyId: conversation.companyId, status: "CONNECTED" },
    });
  }

  if (!whatsappAccount || whatsappAccount.status !== "CONNECTED") {
    console.log("AI auto-reply skipped: no connected WhatsApp account for this chat");
    return "done";
  }

  // Latest customer message at the moment we start generating
  const latestCustomerMessage = await prisma.message.findFirst({
    where: { conversationId, sender: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
  });

  if (!latestCustomerMessage) return "done";

  const result = await getAutoReply(conversationId);

  if (!result.success) {
    console.error("AI did not return a reply:", result.error);
    return "done";
  }

  // Customer wrote again while the AI was thinking -> throw this reply
  // away and answer the whole burst of messages in one go.
  const newerCustomerMessages = await prisma.message.count({
    where: {
      conversationId,
      sender: "CUSTOMER",
      createdAt: { gt: latestCustomerMessage.createdAt },
    },
  });

  if (newerCustomerMessages > 0) return "stale";

  // Re-check: an agent may have taken over (bot switched off), or the
  // number may have been disconnected while we were waiting.
  const fresh = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { botEnabled: true },
  });

  if (!fresh || !fresh.botEnabled) return "done";

  const freshAccount = await prisma.whatsAppAccount.findUnique({
    where: { id: whatsappAccount.id },
    select: { status: true },
  });

  if (!freshAccount || freshAccount.status !== "CONNECTED") return "done";

  const sendResult = await sendTextMessage(
    recipientPhone,
    result.reply,
    whatsappAccount
  );

  if (!sendResult.success) {
    console.error("Failed to send AI auto-reply on WhatsApp:", sendResult.error);
    return "done";
  }

  const metaMessageId = sendResult.data?.messages?.[0]?.id || undefined;

  const botMessage = await prisma.message.create({
    data: {
      conversationId,
      content: result.reply,
      sender: "BOT",
      messageType: "TEXT",
      status: "SENT",
      metaMessageId,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessage: result.reply },
  });

  emitToCompany(conversation.companyId, "message:new", {
    conversationId,
    message: botMessage,
  });

  // The AI asked for a human: switch the bot off and notify the team.
  if (result.handoff) {
    await handleAiHandoff(conversation);
  }

  console.log("SaaS auto-reply sent:", botMessage.id);
  return "done";
};

const triggerAutoReply = async (conversationId) => {
  if (activeReplies.has(conversationId)) {
    // A pipeline is already running for this chat. It will notice the
    // newer customer message and regenerate, so nothing to do here.
    return;
  }

  activeReplies.add(conversationId);

  try {
    for (let i = 0; i < MAX_REGENERATIONS; i++) {
      const outcome = await attemptAutoReply(conversationId);
      if (outcome !== "stale") break;
    }
  } finally {
    activeReplies.delete(conversationId);
  }
};

// ============================================
// TEST ROUTE
// ============================================
router.get("/test", (req, res) => {
  res.status(200).send("SAAS WEBHOOK ROUTE IS WORKING");
});

// ============================================
// META WEBHOOK VERIFICATION
// ============================================
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.VERIFY_TOKEN
  ) {
    console.log("SaaS Webhook Verified");

    return res.status(200).send(challenge);
  }

  console.log("SaaS Webhook Verification Failed");

  return res.sendStatus(403);
});

// ============================================
// RECEIVE WEBHOOK EVENTS
// ============================================
// ============================================
// RETRY OR DROP?
//
// If we answer 500, Meta re-sends the webhook (for up to 7 days). That is
// what we WANT for temporary problems (database down / timed out): the
// message is not lost, and the duplicate check keeps it from being saved
// twice. For a payload that can never succeed (bad data, unknown account)
// retrying would loop forever and Meta may disable the webhook, so those
// are logged and answered with 200.
// ============================================
const TRANSIENT_PRISMA_CODES = new Set([
  "P1001", // cannot reach database server
  "P1002", // database server timed out
  "P1008", // operations timed out
  "P1017", // server closed the connection
  "P2024", // timed out getting a connection from the pool
  "P2028", // transaction API error
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

// ============================================
// PROCESS ONE "change" OF A WEBHOOK
// (the body of the old POST handler, unchanged except where marked NEW)
// ============================================
const processWebhookChange = async (field, value) => {
  try {

    // ============================================
    // TEMPLATE STATUS UPDATE (Approved / Rejected / Paused / Disabled)
    // ============================================
    // Must be checked BEFORE the phone_number_id lookup below,
    // since template status events don't include a phone_number_id.

    if (field === "message_template_status_update") {
      const metaTemplateId = value.message_template_id?.toString();
      const newStatus = value.event; // "APPROVED" | "REJECTED" | "PAUSED" | "DISABLED"
      const reason = value.reason || null;

      console.log("Template status update:", {
        metaTemplateId,
        newStatus,
        reason,
      });

      if (metaTemplateId) {
        try {
          await prisma.template.updateMany({
            where: { metaTemplateId },
            data: {
              status: newStatus,
              rejectionReason: newStatus === "REJECTED" ? reason : null,
            },
          });
        } catch (error) {
          console.error(
            "Failed to update template status from webhook:",
            error
          );
        }
      }

      return;
    }

    // ============================================
    // ACCOUNT UPDATE (COEXISTENCE) — disconnect / offboard / reconnect
    // ============================================
    // Must ALSO be checked BEFORE the phone_number_id lookup below —
    // this event carries a top-level "phone_number" string, not a
    // "metadata.phone_number_id" object like message-related fields do.
    // Fires when the business disconnects the Cloud API link from
    // their phone (Settings > Account > Business Platform > Disconnect),
    // or when Meta offboards/reconnects the WABA.

    if (field === "account_update") {
      const event = value.event; // PARTNER_REMOVED | ACCOUNT_OFFBOARDED | ACCOUNT_RECONNECTED
      const displayPhoneNumber = value.phone_number;

      console.log("SaaS account_update event:", event, displayPhoneNumber);

      if (!displayPhoneNumber) {
        return;
      }

      // Digit-based match, so "919876543210" finds "+91 98765 43210".
      const account = await findAccountByDisplayPhone(displayPhoneNumber);

      if (!account) {
        console.log(
          "No WhatsApp account found for account_update phone_number:",
          displayPhoneNumber,
          "Payload:",
          JSON.stringify(value)
        );
        return;
      }

      try {
        if (event === "PARTNER_REMOVED") {
          const reason = value.disconnection_info?.reason || null;
          console.log(
            "WhatsApp account disconnected by business. Reason:",
            reason
          );

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
          // A disconnect from the CRM deletes the stored token, so without
          // a token we must NOT show "Connected" — the admin has to reconnect.
          if (!account.whatsappAccessToken) {
            console.log(
              "ACCOUNT_RECONNECTED ignored — no stored access token for account",
              account.id
            );
          } else {
            await prisma.whatsAppAccount.update({
              where: { id: account.id },
              data: { status: "CONNECTED", disconnectedAt: null },
            });
          }
        }
      } catch (error) {
        console.error("Failed to process account_update webhook:", error);
      }

      return;
    }

    // ============================================
    // GET META PHONE NUMBER ID
    // ============================================

    const phoneNumberId =
      value.metadata?.phone_number_id;

    console.log(
      "Meta Phone Number ID:",
      phoneNumberId
    );

    if (!phoneNumberId) {
      console.log(
        "No phone_number_id found in webhook"
      );

      return;
    }

    // ============================================
    // FIND CONNECTED WHATSAPP ACCOUNT
    // ============================================

    const whatsappAccount =
      await prisma.whatsAppAccount.findFirst({
        where: {
          phoneNumberId,
          status: "CONNECTED",
        },
      });

    if (!whatsappAccount) {
      console.error(
        "No connected WhatsApp account found for phoneNumberId:",
        phoneNumberId
      );

      return;
    }

    const companyId =
      whatsappAccount.companyId;

    const whatsappAccountId =
      whatsappAccount.id;

    console.log("WhatsApp Account:", {
      id: whatsappAccountId,
      companyId,
      phoneNumberId,
      businessName:
        whatsappAccount.whatsappBusinessName,
    });

    // ============================================
    // INCOMING MESSAGE
    // ============================================

    // NEW: Meta can put several messages in one webhook, so loop over ALL of
    // them (before, only messages[0] was handled and the rest were lost).
    const incomingMessages = Array.isArray(value.messages)
      ? value.messages
      : [];

    let transientFailure = null;

    for (const message of incomingMessages) {
      try {
        const customerPhone = message.from;

        if (!customerPhone) {
          continue;
        }

        // NEW: duplicate check. Meta re-sends a webhook when we answer slowly
        // or with an error. The message id is unique, so skip if we have it.
        if (message.id) {
          const alreadySaved = await prisma.message.findUnique({
            where: { metaMessageId: message.id },
            select: { id: true },
          });

          if (alreadySaved) {
            console.log("Duplicate webhook message skipped:", message.id);
            continue;
          }
        }

        // NEW: images, audio, video, documents and stickers are downloaded
        // and stored (same helper already used for echoes and history sync).
        // Before, they were saved as the text "[image message]".
        // Text / button / list replies behave exactly as before.
        const { content: text, messageType, imageUrl } =
          await resolveMessageContent(
            message,
            whatsappAccount.whatsappAccessToken ||
              process.env.META_SYSTEM_USER_TOKEN
          );

        console.log(
          "Customer Phone:",
          customerPhone
        );

        console.log(
          "Message:",
          text
        );

        // ============================================
        // GET / CREATE CONVERSATION
        // ============================================

        const conversation =
          await getOrCreateSaaSConversation(
            companyId,
            whatsappAccountId,
            customerPhone
          );

        console.log(
          "Conversation ID:",
          conversation.id
        );

        if (conversation.customer) {
          console.log(
            "Customer:",
            conversation.customer.name
          );
        } else {
          console.log(
            "Customer: Not linked yet"
          );
        }

        // ============================================
        // SAVE MESSAGE (with Meta's id, for duplicate protection)
        // ============================================

        const savedMessage = await saveIncomingMessage(
          conversation.id,
          text,
          {
            metaMessageId: message.id,
            messageType,
            imageUrl,
          }
        );

        // null = a parallel delivery already saved it
        if (!savedMessage) {
          continue;
        }

        console.log(
          "SaaS incoming message saved successfully"
        );

        emitToCompany(companyId, "message:new", {
          conversationId: conversation.id,
          message: savedMessage,
        });

        // Only fires when this specific chat has the bot ON. The company's
        // AI settings (enabled / provider / key) are checked inside
        // getAutoReply. Not awaited, so Meta gets its 200 right away.
        if (conversation.botEnabled) {
          triggerAutoReply(conversation.id).catch((err) => {
            console.error("SaaS auto-reply pipeline failed:", err);
          });
        }
      } catch (error) {
        // One bad message must not stop the rest of the batch.
        console.error(
          "Failed to process incoming message:",
          message?.id,
          error
        );

        if (isTransientError(error)) {
          transientFailure = error;
        }
      }
    }

    // Temporary failure (e.g. database down): let Meta retry the whole
    // webhook. Messages already saved are skipped by the duplicate check.
    if (transientFailure) {
      throw transientFailure;
    }

    // ============================================
    // MESSAGE STATUS EVENTS
    // ============================================

    const statuses = value.statuses;

    if (statuses && statuses.length > 0) {
      for (const statusEvent of statuses) {
        const metaMessageId =
          statusEvent.id;

        const newStatus =
          statusEvent.status;

        const failureReason =
          statusEvent.errors?.[0]?.title ||
          statusEvent.errors?.[0]?.message ||
          null;

        console.log(
          "SaaS Status Update:",
          metaMessageId,
          newStatus,
          failureReason || ""
        );

        if (!metaMessageId) {
          continue;
        }

        try {
          await prisma.message.updateMany({
            where: {
              metaMessageId,
            },
            data: {
              status: newStatus
                ? newStatus.toUpperCase()
                : undefined,
              failureReason,
            },
          });

          emitToCompany(companyId, "message:status", {
            metaMessageId,
            status: newStatus ? newStatus.toUpperCase() : undefined,
            failureReason,
          });
        } catch (error) {
          console.error(
            "Failed to update SaaS message status:",
            error
          );
        }
      }
    }

    // ============================================
    // COEXISTENCE: WHATSAPP BUSINESS APP MESSAGE ECHOES
    // ============================================
    // A message the business sent from their PHONE (WhatsApp Business
    // app or a linked companion device) after being onboarded onto
    // Coexistence. Mirror it into the CRM inbox as if an agent sent it.

    const messageEchoes = value.message_echoes;

    if (messageEchoes && messageEchoes.length > 0) {
      for (const echo of messageEchoes) {
        const customerPhone = echo.to;
        if (!customerPhone) continue;

        console.log("SaaS message echo — from phone to:", customerPhone);

        try {
          // Avoid saving the same echo twice if Meta redelivers the webhook
          if (echo.id) {
            const alreadySaved = await prisma.message.findUnique({
              where: { metaMessageId: echo.id },
            });
            if (alreadySaved) continue;
          }

          // Resolves text as-is, or downloads image/video/audio/document
          // media via the Graph API and re-hosts it on Cloudinary so it
          // has a stable URL the CRM can actually render.
          const { content, messageType, imageUrl } = await resolveMessageContent(
            echo,
            whatsappAccount.whatsappAccessToken
          );

          const conversation = await getOrCreateSaaSConversation(
            companyId,
            whatsappAccountId,
            customerPhone
          );

          const echoMessage = await prisma.message.create({
            data: {
              conversationId: conversation.id,
              content,
              sender: "AGENT",
              messageType,
              imageUrl,
              status: "SENT",
              metaMessageId: echo.id || undefined,
            },
          });

          emitToCompany(companyId, "message:new", {
            conversationId: conversation.id,
            message: echoMessage,
          });

          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              lastMessage: content,
              // The business itself just replied from their phone, so
              // the bot shouldn't jump in on this thread.
              botEnabled: false,
            },
          });

          console.log("Mirrored WhatsApp Business App message into CRM:", echo.id);
        } catch (error) {
          console.error("Failed to save SaaS message echo:", error);
        }
      }
    }

    // ============================================
    // COEXISTENCE: CONTACTS SYNC (smb_app_state_sync)
    // ============================================
    // Contacts from the business's phone address book — synced once
    // right after onboarding, then again on add/edit/remove. Only
    // enriches EXISTING customers (in this company) by phone number;
    // never auto-creates new CRM customers from this webhook.

    const stateSync = value.state_sync;

    if (stateSync && stateSync.length > 0) {
      if (whatsappAccount.contactsSyncStatus === "REQUESTED") {
        await prisma.whatsAppAccount
          .update({
            where: { id: whatsappAccountId },
            data: { contactsSyncStatus: "IN_PROGRESS" },
          })
          .catch(() => {});
      }

      for (const item of stateSync) {
        if (item.type !== "contact") continue;

        const contactPhone = item.contact?.phone_number;
        if (!contactPhone) continue;

        if (item.action === "remove") {
          console.log("SaaS contact removed from WhatsApp Business App:", contactPhone);
          continue;
        }

        const fullName = item.contact?.full_name;
        if (!fullName) continue;

        try {
          // Only fill in a name for customers who don't already have
          // one — never overwrite data the agent already entered.
          // (Customer.name is a required field, so "no name" means "".
          // Filtering `name: null` is not allowed by Prisma and made every
          // call fail.)
          await prisma.customer.updateMany({
            where: {
              companyId,
              phone: contactPhone,
              name: "",
            },
            data: { name: fullName },
          });
        } catch (error) {
          console.error("Failed to sync SaaS contact name:", error);
        }
      }
    }

    // ============================================
    // COEXISTENCE: CHAT HISTORY SYNC (history)
    // ============================================
    // Up to 180 days of 1:1 chat history, delivered in phases/chunks.
    // A chunk with "errors" means the business declined to share their
    // chat history (error code 2593109) or another sync error occurred.
    // Media message bodies arrive in a separate follow-up webhook, so
    // media_placeholder rows are skipped here.

    const historyChunks = value.history;

    if (historyChunks && historyChunks.length > 0) {
      for (const chunk of historyChunks) {
        if (chunk.errors?.length) {
          console.log(
            "SaaS history sync declined or failed:",
            chunk.errors[0]?.title
          );

          await prisma.whatsAppAccount
            .update({
              where: { id: whatsappAccountId },
              data: { historySyncStatus: "DECLINED" },
            })
            .catch(() => {});

          continue;
        }

        const { phase, progress } = chunk.metadata || {};

        for (const thread of chunk.threads || []) {
          const customerPhone = thread.id;
          if (!customerPhone) continue;

          let conversation;
          try {
            conversation = await getOrCreateSaaSConversation(
              companyId,
              whatsappAccountId,
              customerPhone
            );
          } catch (error) {
            console.error("Failed to get/create conversation for history thread:", error);
            continue;
          }

          for (const historyMessage of thread.messages || []) {
            if (historyMessage.id) {
              const alreadySaved = await prisma.message.findUnique({
                where: { metaMessageId: historyMessage.id },
              });
              if (alreadySaved) continue;
            }

            // Media contents arrive in a separate follow-up webhook, keyed
            // by the same message id — skip the placeholder row itself,
            // nothing to show yet, and let the real one create the row.
            if (historyMessage.type === "media_placeholder") continue;

            const isFromBusiness =
              historyMessage.from === whatsappAccount.displayPhoneNumber;

            // Resolves text as-is, or downloads image/video/audio/document
            // media via the Graph API and re-hosts it on Cloudinary so it
            // has a stable URL the CRM can actually render.
            const { content, messageType, imageUrl } = await resolveMessageContent(
              historyMessage,
              whatsappAccount.whatsappAccessToken
            );

            try {
              await prisma.message.create({
                data: {
                  conversationId: conversation.id,
                  content,
                  sender: isFromBusiness ? "AGENT" : "CUSTOMER",
                  messageType,
                  imageUrl,
                  status: historyMessage.history_context?.status || "DELIVERED",
                  metaMessageId: historyMessage.id || undefined,
                  createdAt: historyMessage.timestamp
                    ? new Date(Number(historyMessage.timestamp) * 1000)
                    : undefined,
                },
              });
            } catch (error) {
              // Safe to ignore duplicate metaMessageId races from redelivery
              console.error("Failed to save SaaS history message:", error.message);
            }
          }
        }

        console.log(`SaaS history sync progress: phase ${phase}, ${progress}%`);

        if (progress === 100) {
          await prisma.whatsAppAccount
            .update({
              where: { id: whatsappAccountId },
              data: { historySyncStatus: "COMPLETED" },
            })
            .catch(() => {});
        }
      }
    }

  } catch (error) {
    console.error(
      "SAAS WEBHOOK ERROR (field: " + field + "):",
      error
    );

    throw error;
  }
};

router.post("/", async (req, res) => {
  console.log(
    "========== SAAS WHATSAPP WEBHOOK =========="
  );

  // NEW: handle EVERY entry and EVERY change in the payload.
  // Before, only entry[0].changes[0] was processed.
  const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];

  let retryNeeded = false;

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];

    for (const change of changes) {
      if (!change?.value) {
        continue;
      }

      try {
        await processWebhookChange(change.field, change.value);
      } catch (error) {
        if (isTransientError(error)) {
          // answer 500 below so Meta sends this webhook again
          retryNeeded = true;
        } else {
          // Cannot succeed on retry. Keep the payload in the logs so it
          // can be replayed by hand, and acknowledge it.
          console.error(
            "SAAS WEBHOOK: dropping change that cannot be processed. Payload:",
            JSON.stringify(change)
          );
        }
      }
    }
  }

  return res.sendStatus(retryNeeded ? 500 : 200);
});

module.exports = router;