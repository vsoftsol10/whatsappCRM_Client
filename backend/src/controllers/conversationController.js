const prisma = require("../config/prisma");


const createConversation = async (req, res) => {
  try {
    const {
      customerId,
      status,
      channel,
      lastMessage,
      unreadCount,
    } = req.body;

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check by phone, not customerId — a conversation may already
    // exist for this phone (e.g. created by an inbound webhook
    // message before this customer record existed / was linked)
    const existingConversation = await prisma.conversation.findUnique({
      where: {
        phone: customer.phone,
      },
      include: {
        customer: true,
      },
    });

    if (existingConversation) {
      // Link it to this customer if it isn't already
      if (existingConversation.customerId !== customerId) {
        const updated = await prisma.conversation.update({
          where: { id: existingConversation.id },
          data: { customerId },
          include: { customer: true },
        });

        return res.status(200).json({
          success: true,
          message: "Conversation already existed and was linked to this customer",
          conversation: updated,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        conversation: existingConversation,
      });
    }

    const conversation = await prisma.conversation.create({
      data: {
        customerId,
        phone: customer.phone,
        status,
        channel,
        lastMessage,
        unreadCount,
      },
      include: {
        customer: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      conversation,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
    });
  }
};

// GET ALL CONVERSATIONS
const getConversations = async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};

// GET CONVERSATION BY ID
const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
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

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation",
    });
  }
};

// UPDATE CONVERSATION STATUS
const updateConversationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        status,
      },
    });

    res.status(200).json({
      success: true,
      message: "Conversation updated successfully",
      conversation,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update conversation",
    });
  }
};

// MARK CONVERSATION AS READ
const markConversationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        unreadCount: 0,
      },
    });

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to mark conversation as read",
    });
  }
};

// MARK CONVERSATION AS UNREAD
const markConversationAsUnread = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        unreadCount: 1,
      },
    });

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to mark conversation as unread",
    });
  }
};

// CLEAR CHAT (delete all messages in a conversation)
const clearConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.message.deleteMany({
      where: {
        conversationId: id,
      },
    });

    const conversation = await prisma.conversation.update({
      where: { id },
      data: {
        lastMessage: "",
      },
    });

    res.status(200).json({
      success: true,
      message: "Chat cleared successfully",
      conversation,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to clear chat",
    });
  }
};

// DELETE CONVERSATION
const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.conversation.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete conversation",
    });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationById,
  updateConversationStatus,
  markConversationAsRead,
  markConversationAsUnread,
  clearConversationMessages,
  deleteConversation,
};