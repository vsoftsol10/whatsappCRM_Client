

// // ============================================================
// // MESSENGER / INSTAGRAM REPLY (used by messageController.sendMessage)
// //
// // Called only when conversation.channel is "MESSENGER" or "INSTAGRAM".
// // WhatsApp conversations never reach this file.
// // ============================================================
// const prisma = require("../config/prisma");
// const { decryptSecret } = require("../utils/secretCrypto");
// const {
//   sendMessengerText,
//   sendInstagramText,
//   isTokenError,
//   isOutsideWindowError,
// } = require("../services/facebookService");
// const { sendInstagramLoginText } = require("../services/instagramService");
// const {
//   INSTAGRAM_CHANNEL,
//   fromExternalId,
// } = require("./instagramHelper");

// const WINDOW_MS = 24 * 60 * 60 * 1000; // free replies for 24h

// const WINDOW_CLOSED_MESSAGE =
//   "The 24-hour reply window has closed. You can reply again once this person messages your Page or Instagram account.";

// const RECONNECT_MESSAGE =
//   "The Facebook connection has expired. Please reconnect Facebook in Settings → Security.";

// // Instagram connected directly (no Facebook) has its own wording / token type
// const isInstagramLogin = (page) => page?.connectionType === "INSTAGRAM_LOGIN";

// const reconnectMessageFor = (page) =>
//   isInstagramLogin(page)
//     ? "The Instagram connection has expired. Please reconnect Instagram in Settings → Security."
//     : RECONNECT_MESSAGE;

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
//   const isInstagram = conversation.channel === INSTAGRAM_CHANNEL;
//   let metaMessageId;

//   // Only AGENT messages are actually delivered
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
//         message: isInstagramLogin(page)
//           ? "Instagram account is not connected"
//           : "Facebook Page is not connected",
//       });
//     }

//     if (page.status === "RECONNECT_NEEDED") {
//       return res.status(400).json({
//         success: false,
//         code: "FACEBOOK_RECONNECT_NEEDED",
//         message: reconnectMessageFor(page),
//       });
//     }

//     if (isInstagram && !page.instagramAccountId) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "No Instagram account is linked to this Facebook Page. Link it, then click Add / Update Pages in Settings → Security.",
//       });
//     }

//     if (!conversation.externalUserId) {
//       return res.status(400).json({
//         success: false,
//         message: "Recipient not found for this chat",
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
//         message: reconnectMessageFor(page),
//       });
//     }

//     // Instagram chats store the person's ID with a prefix - strip it.
//     const recipientId = fromExternalId(conversation.externalUserId);

//     // Instagram connected directly uses graph.instagram.com + its own token;
//     // Instagram connected via a Facebook Page uses the Page token.
//     const result = isInstagram
//       ? isInstagramLogin(page)
//         ? await sendInstagramLoginText(token, recipientId, text)
//         : await sendInstagramText(token, page.pageId, recipientId, text)
//       : await sendMessengerText(token, recipientId, text);

//     if (!result.success) {
//       if (isTokenError(result.error)) {
//         await markReconnectNeeded(page.id);
//         return res.status(400).json({
//           success: false,
//           code: "FACEBOOK_RECONNECT_NEEDED",
//           message: reconnectMessageFor(page),
//         });
//       }

//       if (isOutsideWindowError(result.error)) {
//         return res.status(400).json({
//           success: false,
//           code: "MESSENGER_WINDOW_CLOSED",
//           message: WINDOW_CLOSED_MESSAGE,
//         });
//       }

//       console.error(
//         `${isInstagram ? "Instagram" : "Messenger"} send failed:`,
//         result.error
//       );
//       return res.status(500).json({
//         success: false,
//         message: `Failed to send ${isInstagram ? "Instagram" : "Messenger"} message`,
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
  sendMessengerAttachment,
  sendInstagramAttachment,
  isTokenError,
  isOutsideWindowError,
} = require("../services/facebookService");
const {
  sendInstagramLoginText,
  sendInstagramLoginAttachment,
} = require("../services/instagramService");
const { uploadBufferToCloudinary } = require("../services/cloudinaryService");
const {
  INSTAGRAM_CHANNEL,
  fromExternalId,
} = require("./instagramHelper");

const WINDOW_MS = 24 * 60 * 60 * 1000; // free replies for 24h

const WINDOW_CLOSED_MESSAGE =
  "The 24-hour reply window has closed. You can reply again once this person messages your Page or Instagram account.";

const RECONNECT_MESSAGE =
  "The Facebook connection has expired. Please reconnect Facebook in Settings → Security.";

// Instagram connected directly (no Facebook) has its own wording / token type
const isInstagramLogin = (page) => page?.connectionType === "INSTAGRAM_LOGIN";

const reconnectMessageFor = (page) =>
  isInstagramLogin(page)
    ? "The Instagram connection has expired. Please reconnect Instagram in Settings → Security."
    : RECONNECT_MESSAGE;

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
        message: isInstagramLogin(page)
          ? "Instagram account is not connected"
          : "Facebook Page is not connected",
      });
    }

    if (page.status === "RECONNECT_NEEDED") {
      return res.status(400).json({
        success: false,
        code: "FACEBOOK_RECONNECT_NEEDED",
        message: reconnectMessageFor(page),
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
        message: reconnectMessageFor(page),
      });
    }

    // Instagram chats store the person's ID with a prefix - strip it.
    const recipientId = fromExternalId(conversation.externalUserId);

    // Instagram connected directly uses graph.instagram.com + its own token;
    // Instagram connected via a Facebook Page uses the Page token.
    const result = isInstagram
      ? isInstagramLogin(page)
        ? await sendInstagramLoginText(token, recipientId, text)
        : await sendInstagramText(token, page.pageId, recipientId, text)
      : await sendMessengerText(token, recipientId, text);

    if (!result.success) {
      if (isTokenError(result.error)) {
        await markReconnectNeeded(page.id);
        return res.status(400).json({
          success: false,
          code: "FACEBOOK_RECONNECT_NEEDED",
          message: reconnectMessageFor(page),
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

// ============================================================
// SEND A FILE (image / video / audio / document) on Messenger or Instagram
// Used by messageController.sendMediaMessage. Text replies above are untouched.
//
//   1. same safety checks as a text reply (connected, 24h window, token)
//   2. keep a stable copy on Cloudinary (also gives Meta a public url)
//   3. send it through the Send API
//   4. send the caption (if any) as a separate text message
//   5. save it in the same shape incoming media already uses
//
// @param file   multer file ({ buffer, originalname, size })
// @param media  classifyMedia() result ({ type, cloudinaryResourceType })
// ============================================================
const sendMessengerMediaReply = async (
  res,
  conversation,
  { file, media, caption = "" }
) => {
  const isInstagram = conversation.channel === INSTAGRAM_CHANNEL;
  const platform = isInstagram ? "Instagram" : "Messenger";
  const page = conversation.facebookPage;

  // ---- 1. safety checks (same rules as sendMessengerReply) ----
  if (
    !page ||
    page.companyId !== conversation.companyId ||
    page.status === "DISCONNECTED" ||
    !page.pageAccessToken
  ) {
    return res.status(400).json({
      success: false,
      message: isInstagramLogin(page)
        ? "Instagram account is not connected"
        : "Facebook Page is not connected",
    });
  }

  if (page.status === "RECONNECT_NEEDED") {
    return res.status(400).json({
      success: false,
      code: "FACEBOOK_RECONNECT_NEEDED",
      message: reconnectMessageFor(page),
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
      message: reconnectMessageFor(page),
    });
  }

  const recipientId = fromExternalId(conversation.externalUserId);

  // ---- 2. keep a stable copy (Meta also downloads from this url) ----
  const safeName =
    (file.originalname || "file")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-80) || "file";

  let stored;
  try {
    stored = await uploadBufferToCloudinary(file.buffer, {
      folder: "crm-sent-media",
      resourceType: media.cloudinaryResourceType,
      // Documents are "raw" files: keep the name (with extension) in the
      // public id so the url keeps its extension.
      ...(media.type === "document" && {
        publicId: `${Date.now()}-${safeName}`,
      }),
    });
  } catch (uploadError) {
    console.error(`${platform} send media - storage upload failed:`, uploadError);
    return res.status(500).json({
      success: false,
      message: "Failed to store the file",
    });
  }

  if (!stored?.imageUrl) {
    return res.status(500).json({
      success: false,
      message: "Failed to store the file",
    });
  }

  // ---- 3. send the attachment ----
  // Messenger / Instagram call documents "file".
  const attachmentType = media.type === "document" ? "file" : media.type;

  const result = isInstagram
    ? isInstagramLogin(page)
      ? await sendInstagramLoginAttachment(
          token,
          recipientId,
          attachmentType,
          stored.imageUrl
        )
      : await sendInstagramAttachment(
          token,
          page.pageId,
          recipientId,
          attachmentType,
          stored.imageUrl
        )
    : await sendMessengerAttachment(
        token,
        recipientId,
        attachmentType,
        stored.imageUrl
      );

  if (!result.success) {
    if (isTokenError(result.error)) {
      await markReconnectNeeded(page.id);
      return res.status(400).json({
        success: false,
        code: "FACEBOOK_RECONNECT_NEEDED",
        message: reconnectMessageFor(page),
      });
    }

    if (isOutsideWindowError(result.error)) {
      return res.status(400).json({
        success: false,
        code: "MESSENGER_WINDOW_CLOSED",
        message: WINDOW_CLOSED_MESSAGE,
      });
    }

    console.error(`${platform} media send failed:`, result.error);
    return res.status(500).json({
      success: false,
      message: `Failed to send file on ${platform}`,
      error: result.error?.message,
    });
  }

  const metaMessageId = result.data?.message_id || undefined;

  // ---- 4. caption goes out as its own text message ----
  const canCaption = media.type === "image" || media.type === "video";
  const captionText = canCaption ? String(caption || "").trim() : "";

  if (captionText) {
    const captionResult = isInstagram
      ? isInstagramLogin(page)
        ? await sendInstagramLoginText(token, recipientId, captionText)
        : await sendInstagramText(token, page.pageId, recipientId, captionText)
      : await sendMessengerText(token, recipientId, captionText);

    if (!captionResult.success) {
      // The file already went out - do not fail the whole request.
      console.warn(
        `${platform} caption not sent:`,
        captionResult.error?.message
      );
    }
  }

  // ---- 5. save (same shape as incoming media) ----
  const messageType = media.type.toUpperCase();

  const content =
    media.type === "document"
      ? file.originalname || safeName
      : media.type === "audio"
      ? ""
      : captionText;

  const lastMessage =
    media.type === "image"
      ? captionText || "📷 Photo"
      : media.type === "video"
      ? captionText || "🎥 Video"
      : media.type === "audio"
      ? "🎤 Voice message"
      : `📄 ${content}`;

  let message;
  try {
    message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content,
        sender: "AGENT",
        messageType,
        status: "SENT",
        imageUrl: stored.imageUrl,
        ...(metaMessageId && { metaMessageId }),
      },
    });
  } catch (error) {
    if (error?.code === "P2002" && metaMessageId) {
      message = await prisma.message.findUnique({ where: { metaMessageId } });
    } else {
      throw error;
    }
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessage,
      // Agent replied manually - same rule as the text reply.
      botEnabled: false,
    },
  });

  return res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: message,
  });
};

module.exports = { sendMessengerReply, sendMessengerMediaReply };
 