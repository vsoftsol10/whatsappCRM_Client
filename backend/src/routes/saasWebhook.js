// const express = require("express");
// const router = express.Router();
// const prisma = require("../config/prisma");

// const {
//   getOrCreateSaaSConversation,
// } = require("../helpers/saasConversationHelper");

// const {
//   saveIncomingMessage,
// } = require("../helpers/messageHelper");

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
// router.post("/", async (req, res) => {
//   try {
//     console.log(
//       "========== SAAS WHATSAPP WEBHOOK =========="
//     );

//     const entry = req.body.entry?.[0];
//     const change = entry?.changes?.[0];
//     const field = change?.field;
//     const value = change?.value;

//     if (!value) {
//       return res.sendStatus(200);
//     }

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

//       return res.sendStatus(200);
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

//       return res.sendStatus(200);
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

//       return res.sendStatus(200);
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

//     const message = value.messages?.[0];

//     if (message) {
//       const customerPhone = message.from;

//       const text =
//         message.text?.body ||
//         message.button?.text ||
//         message.interactive?.button_reply?.title ||
//         message.interactive?.list_reply?.title ||
//         `[${message.type || "unsupported"} message]`;

//       console.log(
//         "Customer Phone:",
//         customerPhone
//       );

//       console.log(
//         "Message:",
//         text
//       );

//       // ============================================
//       // GET / CREATE CONVERSATION
//       // ============================================

//       const conversation =
//         await getOrCreateSaaSConversation(
//           companyId,
//           whatsappAccountId,
//           customerPhone
//         );

//       console.log(
//         "Conversation ID:",
//         conversation.id
//       );

//       if (conversation.customer) {
//         console.log(
//           "Customer:",
//           conversation.customer.name
//         );
//       } else {
//         console.log(
//           "Customer: Not linked yet"
//         );
//       }

//       // ============================================
//       // SAVE MESSAGE
//       // ============================================

//       await saveIncomingMessage(
//         conversation.id,
//         text
//       );

//       console.log(
//         "SaaS incoming message saved successfully"
//       );
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
//         } catch (error) {
//           console.error(
//             "Failed to update SaaS message status:",
//             error
//           );
//         }
//       }
//     }

//     // ============================================
//     // ALWAYS RETURN 200 TO META
//     // ============================================

//     return res.sendStatus(200);

//   } catch (error) {
//     console.error(
//       "SAAS WEBHOOK ERROR:",
//       error
//     );

//     /*
//      * For production we generally want to acknowledge
//      * webhook events quickly. Logging the error allows
//      * us to investigate without causing Meta to retry
//      * endlessly.
//      */

//     return res.sendStatus(200);
//   }
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

const {
  getOrCreateSaaSConversation,
} = require("../helpers/saasConversationHelper");

const {
  saveIncomingMessage,
} = require("../helpers/messageHelper");

const {
  resolveMessageContent,
} = require("../helpers/whatsappMediaHelper");

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
router.post("/", async (req, res) => {
  try {
    console.log(
      "========== SAAS WHATSAPP WEBHOOK =========="
    );

    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const field = change?.field;
    const value = change?.value;

    if (!value) {
      return res.sendStatus(200);
    }

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

      return res.sendStatus(200);
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
        return res.sendStatus(200);
      }

      const account = await prisma.whatsAppAccount.findFirst({
        where: { displayPhoneNumber },
      });

      if (!account) {
        console.log(
          "No WhatsApp account found for account_update phone_number:",
          displayPhoneNumber
        );
        return res.sendStatus(200);
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
          await prisma.whatsAppAccount.update({
            where: { id: account.id },
            data: { status: "CONNECTED", disconnectedAt: null },
          });
        }
      } catch (error) {
        console.error("Failed to process account_update webhook:", error);
      }

      return res.sendStatus(200);
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

      return res.sendStatus(200);
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

      return res.sendStatus(200);
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

    const message = value.messages?.[0];

    if (message) {
      const customerPhone = message.from;

      const text =
        message.text?.body ||
        message.button?.text ||
        message.interactive?.button_reply?.title ||
        message.interactive?.list_reply?.title ||
        `[${message.type || "unsupported"} message]`;

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
      // SAVE MESSAGE
      // ============================================

      await saveIncomingMessage(
        conversation.id,
        text
      );

      console.log(
        "SaaS incoming message saved successfully"
      );
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

          await prisma.message.create({
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
          await prisma.customer.updateMany({
            where: {
              companyId,
              phone: contactPhone,
              OR: [{ name: null }, { name: "" }],
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

    // ============================================
    // ALWAYS RETURN 200 TO META
    // ============================================

    return res.sendStatus(200);

  } catch (error) {
    console.error(
      "SAAS WEBHOOK ERROR:",
      error
    );

    /*
     * For production we generally want to acknowledge
     * webhook events quickly. Logging the error allows
     * us to investigate without causing Meta to retry
     * endlessly.
     */

    return res.sendStatus(200);
  }
});

module.exports = router;