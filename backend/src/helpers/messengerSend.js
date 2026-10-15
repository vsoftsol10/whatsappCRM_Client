// // ============================================================
// // MESSENGER REPLY (used by messageController.sendMessage)
// //
// // Called only when conversation.channel === "MESSENGER".
// // WhatsApp conversations never reach this file.
// // ============================================================
// const prisma = require("../config/prisma");
// const { decryptSecret } = require("../utils/secretCrypto");
// const {
//   sendMessengerText,
//   isTokenError,
//   isOutsideWindowError,
// } = require("../services/facebookService");

// const WINDOW_MS = 24 * 60 * 60 * 1000; // Messenger: free replies for 24h

// const WINDOW_CLOSED_MESSAGE =
//   "The 24-hour Messenger reply window has closed. You can reply again once this person messages your Page.";

// const RECONNECT_MESSAGE =
//   "The Facebook connection has expired. Please reconnect Facebook in Settings → Security.";

// const markReconnectNeeded = (pageId) =>
//   prisma.facebookPage
//     .update({ where: { id: pageId }, data: { status: "RECONNECT_NEEDED" } })
//     .catch((err) => console.error("Could not flag Page for reconnect:", err));

// /**
//  * @param res          Express response
//  * @param conversation Conversation row including `facebookPage`
//  * @param body         { content, sender, messageType, status }
//  */
// const sendMessengerReply = async (
//   res,
//   conversation,
//   { content, sender, messageType = "TEXT", status = "SENT" }
// ) => {
//   const text = content.trim();
//   let metaMessageId;

//   // Only AGENT messages are actually delivered to Messenger
//   // (same rule the WhatsApp path uses).
//   if (sender === "AGENT") {
//     const page = conversation.facebookPage;

//     // Safety: the Page must belong to the same company as the chat.
//     if (
//       !page ||
//       page.companyId !== conversation.companyId ||
//       page.status === "DISCONNECTED" ||
//       !page.pageAccessToken
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Facebook Page is not connected",
//       });
//     }

//     if (page.status === "RECONNECT_NEEDED") {
//       return res.status(400).json({
//         success: false,
//         code: "FACEBOOK_RECONNECT_NEEDED",
//         message: RECONNECT_MESSAGE,
//       });
//     }

//     if (!conversation.externalUserId) {
//       return res.status(400).json({
//         success: false,
//         message: "Recipient not found for this Messenger chat",
//       });
//     }

//     // 24-hour rule: free-form replies are only allowed within 24 hours of
//     // the person's last message.
//     const lastCustomerMessage = await prisma.message.findFirst({
//       where: { conversationId: conversation.id, sender: "CUSTOMER" },
//       orderBy: { createdAt: "desc" },
//       select: { createdAt: true },
//     });

//     if (
//       !lastCustomerMessage ||
//       Date.now() - lastCustomerMessage.createdAt.getTime() > WINDOW_MS
//     ) {
//       return res.status(400).json({
//         success: false,
//         code: "MESSENGER_WINDOW_CLOSED",
//         message: WINDOW_CLOSED_MESSAGE,
//       });
//     }

//     const token = decryptSecret(page.pageAccessToken);
//     if (!token) {
//       await markReconnectNeeded(page.id);
//       return res.status(400).json({
//         success: false,
//         code: "FACEBOOK_RECONNECT_NEEDED",
//         message: RECONNECT_MESSAGE,
//       });
//     }

//     const result = await sendMessengerText(
//       token,
//       conversation.externalUserId,
//       text
//     );

//     if (!result.success) {
//       if (isTokenError(result.error)) {
//         await markReconnectNeeded(page.id);
//         return res.status(400).json({
//           success: false,
//           code: "FACEBOOK_RECONNECT_NEEDED",
//           message: RECONNECT_MESSAGE,
//         });
//       }

//       if (isOutsideWindowError(result.error)) {
//         return res.status(400).json({
//           success: false,
//           code: "MESSENGER_WINDOW_CLOSED",
//           message: WINDOW_CLOSED_MESSAGE,
//         });
//       }

//       console.error("Messenger send failed:", result.error);
//       return res.status(500).json({
//         success: false,
//         message: "Failed to send Messenger message",
//         error: result.error?.message,
//       });
//     }

//     metaMessageId = result.data?.message_id || undefined;
//   }

//   // Save the message (same shape as the WhatsApp path)
//   let message;
//   try {
//     message = await prisma.message.create({
//       data: {
//         conversationId: conversation.id,
//         content: text,
//         sender,
//         messageType,
//         status,
//         ...(metaMessageId && { metaMessageId }),
//       },
//     });
//   } catch (error) {
//     // The echo webhook may have stored it first - reuse that row.
//     if (error?.code === "P2002" && metaMessageId) {
//       message = await prisma.message.findUnique({ where: { metaMessageId } });
//     } else {
//       throw error;
//     }
//   }

//   await prisma.conversation.update({
//     where: { id: conversation.id },
//     data: {
//       lastMessage: text,

//       ...(sender === "CUSTOMER" && { unreadCount: { increment: 1 } }),

//       // Agent replied manually -> keep bot auto-reply off
//       ...(sender === "AGENT" && { botEnabled: false }),
//     },
//   });

//   return res.status(201).json({
//     success: true,
//     message: "Message sent successfully",
//     data: message,
//   });
// };

// module.exports = { sendMessengerReply };


// ============================================================
// MESSENGER / INSTAGRAM REPLY (used by messageController.sendMessage)
//
// Called only when conversation.channel is "MESSENGER" or "INSTAGRAM".
// WhatsApp conversations never reach this file.
// ============================================================
const prisma = require("../config/prisma");
const { decryptSecret } = require("../utils/secretCrypto");
const {
  sendMessengerText,
  sendInstagramText,
  isTokenError,
  isOutsideWindowError,
} = require("../services/facebookService");
const {
  INSTAGRAM_CHANNEL,
  fromExternalId,
} = require("./instagramHelper");

const WINDOW_MS = 24 * 60 * 60 * 1000; // free replies for 24h

const WINDOW_CLOSED_MESSAGE =
  "The 24-hour reply window has closed. You can reply again once this person messages your Page or Instagram account.";

const RECONNECT_MESSAGE =
  "The Facebook connection has expired. Please reconnect Facebook in Settings → Security.";

const markReconnectNeeded = (pageId) =>
  prisma.facebookPage
    .update({ where: { id: pageId }, data: { status: "RECONNECT_NEEDED" } })
    .catch((err) => console.error("Could not flag Page for reconnect:", err));

/**
 * @param res          Express response
 * @param conversation Conversation row including `facebookPage`
 * @param body         { content, sender, messageType, status }
 */
const sendMessengerReply = async (
  res,
  conversation,
  { content, sender, messageType = "TEXT", status = "SENT" }
) => {
  const text = content.trim();
  const isInstagram = conversation.channel === INSTAGRAM_CHANNEL;
  let metaMessageId;

  // Only AGENT messages are actually delivered
  // (same rule the WhatsApp path uses).
  if (sender === "AGENT") {
    const page = conversation.facebookPage;

    // Safety: the Page must belong to the same company as the chat.
    if (
      !page ||
      page.companyId !== conversation.companyId ||
      page.status === "DISCONNECTED" ||
      !page.pageAccessToken
    ) {
      return res.status(400).json({
        success: false,
        message: "Facebook Page is not connected",
      });
    }

    if (page.status === "RECONNECT_NEEDED") {
      return res.status(400).json({
        success: false,
        code: "FACEBOOK_RECONNECT_NEEDED",
        message: RECONNECT_MESSAGE,
      });
    }

    if (isInstagram && !page.instagramAccountId) {
      return res.status(400).json({
        success: false,
        message:
          "No Instagram account is linked to this Facebook Page. Link it, then click Add / Update Pages in Settings → Security.",
      });
    }

    if (!conversation.externalUserId) {
      return res.status(400).json({
        success: false,
        message: "Recipient not found for this chat",
      });
    }

    // 24-hour rule: free-form replies are only allowed within 24 hours of
    // the person's last message.
    const lastCustomerMessage = await prisma.message.findFirst({
      where: { conversationId: conversation.id, sender: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    if (
      !lastCustomerMessage ||
      Date.now() - lastCustomerMessage.createdAt.getTime() > WINDOW_MS
    ) {
      return res.status(400).json({
        success: false,
        code: "MESSENGER_WINDOW_CLOSED",
        message: WINDOW_CLOSED_MESSAGE,
      });
    }

    const token = decryptSecret(page.pageAccessToken);
    if (!token) {
      await markReconnectNeeded(page.id);
      return res.status(400).json({
        success: false,
        code: "FACEBOOK_RECONNECT_NEEDED",
        message: RECONNECT_MESSAGE,
      });
    }

    // Instagram chats store the person's ID with a prefix - strip it.
    const recipientId = fromExternalId(conversation.externalUserId);

    const result = isInstagram
      ? await sendInstagramText(token, page.pageId, recipientId, text)
      : await sendMessengerText(token, recipientId, text);

    if (!result.success) {
      if (isTokenError(result.error)) {
        await markReconnectNeeded(page.id);
        return res.status(400).json({
          success: false,
          code: "FACEBOOK_RECONNECT_NEEDED",
          message: RECONNECT_MESSAGE,
        });
      }

      if (isOutsideWindowError(result.error)) {
        return res.status(400).json({
          success: false,
          code: "MESSENGER_WINDOW_CLOSED",
          message: WINDOW_CLOSED_MESSAGE,
        });
      }

      console.error(
        `${isInstagram ? "Instagram" : "Messenger"} send failed:`,
        result.error
      );
      return res.status(500).json({
        success: false,
        message: `Failed to send ${isInstagram ? "Instagram" : "Messenger"} message`,
        error: result.error?.message,
      });
    }

    metaMessageId = result.data?.message_id || undefined;
  }

  // Save the message (same shape as the WhatsApp path)
  let message;
  try {
    message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: text,
        sender,
        messageType,
        status,
        ...(metaMessageId && { metaMessageId }),
      },
    });
  } catch (error) {
    // The echo webhook may have stored it first - reuse that row.
    if (error?.code === "P2002" && metaMessageId) {
      message = await prisma.message.findUnique({ where: { metaMessageId } });
    } else {
      throw error;
    }
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessage: text,

      ...(sender === "CUSTOMER" && { unreadCount: { increment: 1 } }),

      // Agent replied manually -> keep bot auto-reply off
      ...(sender === "AGENT" && { botEnabled: false }),
    },
  });

  return res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: message,
  });
};

module.exports = { sendMessengerReply };
