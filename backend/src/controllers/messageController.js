// const prisma = require("../config/prisma");
// const {
//   sendTextMessage,
//   uploadMediaToMeta,
//   sendMediaMessage: sendWhatsAppMedia,
// } = require("../services/whatsappService");
// const { uploadBufferToCloudinary } = require("../services/cloudinaryService");
// const { classifyMedia } = require("../middleware/mediaUploadMiddleware");
// const { sendMessengerReply } = require("../helpers/messengerSend");

// // SEND MESSAGE
// const sendMessage = async (req, res) => {
//   try {
//     const {
//       conversationId,
//       content,
//       sender,
//       messageType = "TEXT",
//       status = "SENT",
//     } = req.body;

//     if (!conversationId) {
//       return res.status(400).json({
//         success: false,
//         message: "Conversation ID is required",
//       });
//     }

//     if (!content || !content.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Message content is required",
//       });
//     }

//     if (!sender) {
//       return res.status(400).json({
//         success: false,
//         message: "Sender is required",
//       });
//     }

//     // Get conversation only from the logged-in company
//     const conversation = await prisma.conversation.findFirst({
//       where: {
//         id: conversationId,
//         companyId: req.user.companyId,
//       },
//       include: {
//         customer: true,
//         whatsappAccount: true,
//         facebookPage: true,
//       },
//     });

//     if (!conversation) {
//       return res.status(404).json({
//         success: false,
//         message: "Conversation not found",
//       });
//     }

//     // FACEBOOK MESSENGER chats are handled by their own helper.
//     // WhatsApp chats skip this and continue exactly as before.
//     if (conversation.channel === "MESSENGER") {
//       return sendMessengerReply(res, conversation, {
//         content,
//         sender,
//         messageType,
//         status,
//       });
//     }

//     // Send only AGENT messages to WhatsApp
//     // Meta's id for the message we send. Saved below so delivered/read
//     // status webhooks can find this message later.
//     let metaMessageId;

//     if (sender === "AGENT") {
//       const recipientPhone =
//         conversation.phone || conversation.customer?.phone;

//       if (!recipientPhone) {
//         return res.status(400).json({
//           success: false,
//           message: "Recipient phone number not found",
//         });
//       }

//       if (!conversation.whatsappAccount) {
//         return res.status(400).json({
//           success: false,
//           message: "WhatsApp account is not connected",
//         });
//       }

//       if (
//         conversation.whatsappAccount.status !== "CONNECTED"
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "WhatsApp account is not connected",
//         });
//       }

//       const result = await sendTextMessage(
//         recipientPhone,
//         content,
//         conversation.whatsappAccount
//       );

//       if (!result.success) {
//         return res.status(500).json({
//           success: false,
//           message: "Failed to send WhatsApp message",
//           error: result.error,
//         });
//       }

//       metaMessageId = result.data?.messages?.[0]?.id || undefined;
//     }

//     // Save message after successful WhatsApp send
//     const message = await prisma.message.create({
//       data: {
//         conversationId,
//         content: content.trim(),
//         sender,
//         messageType,
//         status,
//         ...(metaMessageId && { metaMessageId }),
//       },
//     });

//     // Update conversation
//     await prisma.conversation.update({
//       where: {
//         id: conversationId,
//       },
//       data: {
//         lastMessage: content.trim(),

//         ...(sender === "CUSTOMER" && {
//           unreadCount: {
//             increment: 1,
//           },
//         }),

//         // Agent manually replied,
//         // so disable bot auto-reply.
//         ...(sender === "AGENT" && {
//           botEnabled: false,
//         }),
//       },
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Message sent successfully",
//       data: message,
//     });
//   } catch (error) {
//     console.error("Send message error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to send message",
//     });
//   }
// };

// // GET MESSAGES BY CONVERSATION ID
// const getMessagesByConversation = async (req, res) => {
//   try {
//     const { conversationId } = req.params;

//     // Verify the conversation belongs to the authenticated company before
//     // returning any messages. Keep the existing response shape and ordering.
//     const conversation = await prisma.conversation.findFirst({
//       where: {
//         id: conversationId,
//         companyId: req.user.companyId,
//       },
//       select: { id: true },
//     });

//     if (!conversation) {
//       return res.status(404).json({
//         success: false,
//         message: "Conversation not found",
//       });
//     }

//     const messages = await prisma.message.findMany({
//       where: {
//         conversationId: conversation.id,
//       },
//       orderBy: {
//         createdAt: "asc",
//       },
//     });

//     res.status(200).json({
//       success: true,
//       messages,
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch messages",
//     });
//   }
// };

// // EDIT MESSAGE
// const editMessage = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { content } = req.body;

//     if (!content || !content.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Message content is required",
//       });
//     }

//     // Scope the message lookup through its conversation's company.
//     const existingMessage = await prisma.message.findFirst({
//       where: {
//         id,
//         conversation: { companyId: req.user.companyId },
//       },
//     });

//     if (!existingMessage) {
//       return res.status(404).json({
//         success: false,
//         message: "Message not found",
//       });
//     }

//     const message = await prisma.message.update({
//       where: { id },
//       data: {
//         content: content.trim(),
//         isEdited: true,
//       },
//     });

//     res.status(200).json({
//       success: true,
//       message: "Message updated successfully",
//       data: message,
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to update message",
//     });
//   }
// };

// // DELETE MESSAGE
// const deleteMessage = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Delete only if the message belongs to the authenticated company.
//     const existingMessage = await prisma.message.findFirst({
//       where: {
//         id,
//         conversation: { companyId: req.user.companyId },
//       },
//       select: { id: true },
//     });

//     if (!existingMessage) {
//       return res.status(404).json({
//         success: false,
//         message: "Message not found",
//       });
//     }

//     await prisma.message.delete({
//       where: { id: existingMessage.id },
//     });

//     res.status(200).json({
//       success: true,
//       message: "Message deleted successfully",
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       message: "Failed to delete message",
//     });
//   }
// };

// // SEND MEDIA MESSAGE (image / audio / video / document)
// // Multipart request: field "file" + conversationId (+ optional caption).
// // Existing text flow (sendMessage above) is untouched.
// const sendMediaMessage = async (req, res) => {
//   try {
//     const { conversationId } = req.body;
//     const caption = (req.body.caption || "").trim();
//     const file = req.file;

//     if (!conversationId) {
//       return res.status(400).json({
//         success: false,
//         message: "Conversation ID is required",
//       });
//     }

//     if (!file || !file.buffer) {
//       return res.status(400).json({
//         success: false,
//         message: "File is required",
//       });
//     }

//     const media = classifyMedia(file.mimetype);

//     if (!media) {
//       return res.status(400).json({
//         success: false,
//         message: "Unsupported file type",
//       });
//     }

//     if (file.size > media.maxBytes) {
//       return res.status(400).json({
//         success: false,
//         message: `${media.type} files can be at most ${Math.round(
//           media.maxBytes / (1024 * 1024)
//         )} MB on WhatsApp.`,
//       });
//     }

//     const conversation = await prisma.conversation.findFirst({
//       where: {
//         id: conversationId,
//         companyId: req.user.companyId,
//       },
//       include: {
//         customer: true,
//         whatsappAccount: true,
//       },
//     });

//     if (!conversation) {
//       return res.status(404).json({
//         success: false,
//         message: "Conversation not found",
//       });
//     }

//     // Sending files is WhatsApp-only for now (Messenger supports text replies).
//     if (conversation.channel === "MESSENGER") {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Sending files is not supported on Messenger yet. Please send a text message.",
//       });
//     }

//     const recipientPhone =
//       conversation.phone || conversation.customer?.phone;

//     if (!recipientPhone) {
//       return res.status(400).json({
//         success: false,
//         message: "Recipient phone number not found",
//       });
//     }

//     if (
//       !conversation.whatsappAccount ||
//       conversation.whatsappAccount.status !== "CONNECTED"
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "WhatsApp account is not connected",
//       });
//     }

//     const safeName =
//       (file.originalname || "file")
//         .replace(/[^a-zA-Z0-9._-]/g, "_")
//         .slice(-80) || "file";

//     // 1. Keep a stable copy so the CRM can show the file later.
//     let stored;

//     try {
//       stored = await uploadBufferToCloudinary(file.buffer, {
//         folder: "crm-sent-media",
//         resourceType: media.cloudinaryResourceType,
//         // Documents are "raw" files: put the name (with extension) in
//         // the public id so the URL keeps its extension.
//         ...(media.type === "document" && {
//           publicId: `${Date.now()}-${safeName}`,
//         }),
//       });
//     } catch (uploadError) {
//       console.error("Send media - storage upload failed:", uploadError);

//       return res.status(500).json({
//         success: false,
//         message: "Failed to store the file",
//       });
//     }

//     if (!stored?.imageUrl) {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to store the file",
//       });
//     }

//     // 2. Upload the bytes to WhatsApp and get a media id.
//     const uploaded = await uploadMediaToMeta(
//       file.buffer,
//       media.mime,
//       safeName,
//       conversation.whatsappAccount
//     );

//     if (!uploaded.success) {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to upload file to WhatsApp",
//         error: uploaded.error,
//       });
//     }

//     // 3. Send it to the customer.
//     const result = await sendWhatsAppMedia(
//       recipientPhone,
//       {
//         type: media.type,
//         mediaId: uploaded.mediaId,
//         caption: media.type === "image" || media.type === "video" ? caption : "",
//         fileName: media.type === "document" ? file.originalname || safeName : "",
//       },
//       conversation.whatsappAccount
//     );

//     if (!result.success) {
//       return res.status(500).json({
//         success: false,
//         message: "Failed to send WhatsApp message",
//         error: result.error,
//       });
//     }

//     const metaMessageId = result.data?.messages?.[0]?.id || undefined;

//     // 4. Save in the same shape incoming media already uses:
//     //    messageType = IMAGE | AUDIO | VIDEO | DOCUMENT, imageUrl = file URL.
//     const messageType = media.type.toUpperCase();

//     const content =
//       media.type === "document"
//         ? file.originalname || safeName
//         : media.type === "audio"
//         ? ""
//         : caption;

//     const lastMessage =
//       media.type === "image"
//         ? caption || "📷 Photo"
//         : media.type === "video"
//         ? caption || "🎥 Video"
//         : media.type === "audio"
//         ? "🎤 Voice message"
//         : `📄 ${content}`;

//     const message = await prisma.message.create({
//       data: {
//         conversationId,
//         content,
//         sender: "AGENT",
//         messageType,
//         status: "SENT",
//         imageUrl: stored.imageUrl,
//         ...(metaMessageId && { metaMessageId }),
//       },
//     });

//     await prisma.conversation.update({
//       where: { id: conversationId },
//       data: {
//         lastMessage,
//         // Agent manually replied, so disable bot auto-reply (same as text).
//         botEnabled: false,
//       },
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Message sent successfully",
//       data: message,
//     });
//   } catch (error) {
//     console.error("Send media message error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to send media message",
//     });
//   }
// };

// module.exports = {
//   sendMessage,
//   sendMediaMessage,
//   getMessagesByConversation,
//   editMessage,
//   deleteMessage,
// };



const prisma = require("../config/prisma");
const {
  sendTextMessage,
  uploadMediaToMeta,
  sendMediaMessage: sendWhatsAppMedia,
} = require("../services/whatsappService");
const { uploadBufferToCloudinary } = require("../services/cloudinaryService");
const { classifyMedia } = require("../middleware/mediaUploadMiddleware");
const { sendMessengerReply } = require("../helpers/messengerSend");

// SEND MESSAGE
const sendMessage = async (req, res) => {
  try {
    const {
      conversationId,
      content,
      sender,
      messageType = "TEXT",
      status = "SENT",
    } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    if (!sender) {
      return res.status(400).json({
        success: false,
        message: "Sender is required",
      });
    }

    // Get conversation only from the logged-in company
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        companyId: req.user.companyId,
      },
      include: {
        customer: true,
        whatsappAccount: true,
        facebookPage: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // FACEBOOK MESSENGER and INSTAGRAM chats are handled by their own helper.
    // WhatsApp chats skip this and continue exactly as before.
    if (
      conversation.channel === "MESSENGER" ||
      conversation.channel === "INSTAGRAM"
    ) {
      return sendMessengerReply(res, conversation, {
        content,
        sender,
        messageType,
        status,
      });
    }

    // Send only AGENT messages to WhatsApp
    // Meta's id for the message we send. Saved below so delivered/read
    // status webhooks can find this message later.
    let metaMessageId;

    if (sender === "AGENT") {
      const recipientPhone =
        conversation.phone || conversation.customer?.phone;

      if (!recipientPhone) {
        return res.status(400).json({
          success: false,
          message: "Recipient phone number not found",
        });
      }

      if (!conversation.whatsappAccount) {
        return res.status(400).json({
          success: false,
          message: "WhatsApp account is not connected",
        });
      }

      if (
        conversation.whatsappAccount.status !== "CONNECTED"
      ) {
        return res.status(400).json({
          success: false,
          message: "WhatsApp account is not connected",
        });
      }

      const result = await sendTextMessage(
        recipientPhone,
        content,
        conversation.whatsappAccount
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send WhatsApp message",
          error: result.error,
        });
      }

      metaMessageId = result.data?.messages?.[0]?.id || undefined;
    }

    // Save message after successful WhatsApp send
    const message = await prisma.message.create({
      data: {
        conversationId,
        content: content.trim(),
        sender,
        messageType,
        status,
        ...(metaMessageId && { metaMessageId }),
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessage: content.trim(),

        ...(sender === "CUSTOMER" && {
          unreadCount: {
            increment: 1,
          },
        }),

        // Agent manually replied,
        // so disable bot auto-reply.
        ...(sender === "AGENT" && {
          botEnabled: false,
        }),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// GET MESSAGES BY CONVERSATION ID
const getMessagesByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify the conversation belongs to the authenticated company before
    // returning any messages. Keep the existing response shape and ordering.
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        companyId: req.user.companyId,
      },
      select: { id: true },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

// EDIT MESSAGE
const editMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Scope the message lookup through its conversation's company.
    const existingMessage = await prisma.message.findFirst({
      where: {
        id,
        conversation: { companyId: req.user.companyId },
      },
    });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    const message = await prisma.message.update({
      where: { id },
      data: {
        content: content.trim(),
        isEdited: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: message,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update message",
    });
  }
};

// DELETE MESSAGE
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete only if the message belongs to the authenticated company.
    const existingMessage = await prisma.message.findFirst({
      where: {
        id,
        conversation: { companyId: req.user.companyId },
      },
      select: { id: true },
    });

    if (!existingMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    await prisma.message.delete({
      where: { id: existingMessage.id },
    });

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
};

// SEND MEDIA MESSAGE (image / audio / video / document)
// Multipart request: field "file" + conversationId (+ optional caption).
// Existing text flow (sendMessage above) is untouched.
const sendMediaMessage = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const caption = (req.body.caption || "").trim();
    const file = req.file;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
    }

    if (!file || !file.buffer) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const media = classifyMedia(file.mimetype);

    if (!media) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type",
      });
    }

    if (file.size > media.maxBytes) {
      return res.status(400).json({
        success: false,
        message: `${media.type} files can be at most ${Math.round(
          media.maxBytes / (1024 * 1024)
        )} MB on WhatsApp.`,
      });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        companyId: req.user.companyId,
      },
      include: {
        customer: true,
        whatsappAccount: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Sending files is WhatsApp-only for now (Messenger and Instagram support text replies).
    if (
      conversation.channel === "MESSENGER" ||
      conversation.channel === "INSTAGRAM"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sending files is not supported on Messenger or Instagram yet. Please send a text message.",
      });
    }

    const recipientPhone =
      conversation.phone || conversation.customer?.phone;

    if (!recipientPhone) {
      return res.status(400).json({
        success: false,
        message: "Recipient phone number not found",
      });
    }

    if (
      !conversation.whatsappAccount ||
      conversation.whatsappAccount.status !== "CONNECTED"
    ) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp account is not connected",
      });
    }

    const safeName =
      (file.originalname || "file")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(-80) || "file";

    // 1. Keep a stable copy so the CRM can show the file later.
    let stored;

    try {
      stored = await uploadBufferToCloudinary(file.buffer, {
        folder: "crm-sent-media",
        resourceType: media.cloudinaryResourceType,
        // Documents are "raw" files: put the name (with extension) in
        // the public id so the URL keeps its extension.
        ...(media.type === "document" && {
          publicId: `${Date.now()}-${safeName}`,
        }),
      });
    } catch (uploadError) {
      console.error("Send media - storage upload failed:", uploadError);

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

    // 2. Upload the bytes to WhatsApp and get a media id.
    const uploaded = await uploadMediaToMeta(
      file.buffer,
      media.mime,
      safeName,
      conversation.whatsappAccount
    );

    if (!uploaded.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload file to WhatsApp",
        error: uploaded.error,
      });
    }

    // 3. Send it to the customer.
    const result = await sendWhatsAppMedia(
      recipientPhone,
      {
        type: media.type,
        mediaId: uploaded.mediaId,
        caption: media.type === "image" || media.type === "video" ? caption : "",
        fileName: media.type === "document" ? file.originalname || safeName : "",
      },
      conversation.whatsappAccount
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send WhatsApp message",
        error: result.error,
      });
    }

    const metaMessageId = result.data?.messages?.[0]?.id || undefined;

    // 4. Save in the same shape incoming media already uses:
    //    messageType = IMAGE | AUDIO | VIDEO | DOCUMENT, imageUrl = file URL.
    const messageType = media.type.toUpperCase();

    const content =
      media.type === "document"
        ? file.originalname || safeName
        : media.type === "audio"
        ? ""
        : caption;

    const lastMessage =
      media.type === "image"
        ? caption || "📷 Photo"
        : media.type === "video"
        ? caption || "🎥 Video"
        : media.type === "audio"
        ? "🎤 Voice message"
        : `📄 ${content}`;

    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        sender: "AGENT",
        messageType,
        status: "SENT",
        imageUrl: stored.imageUrl,
        ...(metaMessageId && { metaMessageId }),
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage,
        // Agent manually replied, so disable bot auto-reply (same as text).
        botEnabled: false,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Send media message error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send media message",
    });
  }
};

module.exports = {
  sendMessage,
  sendMediaMessage,
  getMessagesByConversation,
  editMessage,
  deleteMessage,
};