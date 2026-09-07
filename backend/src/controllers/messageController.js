const prisma = require("../config/prisma");
const { sendTextMessage } = require("../services/whatsappService");

// SEND MESSAGE
const sendMessage = async (req, res) => {
  try {
    const {
      conversationId,
      content,
      sender,
      messageType,
      status,
    } = req.body;

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        customer: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Send only AGENT messages to WhatsApp
    if (sender === "AGENT") {
      const recipientPhone =
        conversation.phone || conversation.customer?.phone;

      if (!recipientPhone) {
        return res.status(400).json({
          success: false,
          message: "Recipient phone number not found",
        });
      }

      const result = await sendTextMessage(
        recipientPhone,
        content
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send WhatsApp message",
          error: result.error,
        });
      }
    }

    // Save message after successful send
    const message = await prisma.message.create({
      data: {
        conversationId,
        content,
        sender,
        messageType,
        status,
      },
    });

    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessage: content,
        ...(sender === "CUSTOMER" && {
          unreadCount: {
            increment: 1,
          },
        }),
        // An agent stepping in manually means the bot should stop
        // auto-replying on this chat until someone turns it back on.
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
    console.error(error);

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

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
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

    const existingMessage = await prisma.message.findUnique({
      where: { id },
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

    await prisma.message.delete({
      where: {
        id,
      },
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

module.exports = {
  sendMessage,
  getMessagesByConversation,
  editMessage,
  deleteMessage,
};