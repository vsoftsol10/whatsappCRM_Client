const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");

const {
  getOrCreateSaaSConversation,
} = require("../helpers/saasConversationHelper");

const {
  saveIncomingMessage,
} = require("../helpers/messageHelper");

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