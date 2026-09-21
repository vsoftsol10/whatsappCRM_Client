const prisma = require("../config/prisma");

// CREATE CONVERSATION
const createConversation = async (req, res) => {
  try {
    const {
      customerId,
      status = "OPEN",
      channel = "WHATSAPP",
      lastMessage = "",
      unreadCount = 0,
    } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const companyId = req.user.companyId;

    // 1. Check customer belongs to this company
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 2. Get connected WhatsApp account for this company
    const whatsappAccount =
      await prisma.whatsAppAccount.findFirst({
        where: {
          companyId,
          status: "CONNECTED",
        },
      });

    // 3. Check whether this customer already has a conversation
    const existingConversation =
      await prisma.conversation.findUnique({
        where: {
          customerId,
        },
        include: {
          customer: true,
          whatsappAccount: true,
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    // 4. If conversation already exists, reuse it
    if (existingConversation) {
      let conversation = existingConversation;

      // Attach connected WhatsApp account if missing
      if (
        !existingConversation.whatsappAccountId &&
        whatsappAccount
      ) {
        conversation = await prisma.conversation.update({
          where: {
            id: existingConversation.id,
          },
          data: {
            whatsappAccountId: whatsappAccount.id,
          },
          include: {
            customer: true,
            whatsappAccount: true,
            messages: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        conversation,
      });
    }

    // 5. Check if an old conversation exists with this phone
    // but is not linked to a customer yet
    const phoneConversation =
      await prisma.conversation.findFirst({
        where: {
          phone: customer.phone,
          companyId,
          customerId: null,
        },
        include: {
          customer: true,
          whatsappAccount: true,
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    // 6. Link old conversation to this customer
    if (phoneConversation) {
      const updatedConversation =
        await prisma.conversation.update({
          where: {
            id: phoneConversation.id,
          },
          data: {
            customerId: customer.id,
            ...(whatsappAccount && {
              whatsappAccountId: whatsappAccount.id,
            }),
          },
          include: {
            customer: true,
            whatsappAccount: true,
            messages: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

      return res.status(200).json({
        success: true,
        message: "Existing conversation linked to customer",
        conversation: updatedConversation,
      });
    }

    // 7. Create a brand-new conversation
    const conversation = await prisma.conversation.create({
      data: {
        companyId,
        customerId: customer.id,
        phone: customer.phone,
        status,
        channel,
        lastMessage,
        unreadCount,
        ...(whatsappAccount && {
          whatsappAccountId: whatsappAccount.id,
        }),
      },
      include: {
        customer: true,
        whatsappAccount: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};

// GET ALL CONVERSATIONS
const getConversations = async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        companyId: req.user.companyId,
      },
      include: {
        customer: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
    });
  }
};

// GET CONVERSATION BY CUSTOMER ID
const getConversationByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Make sure customer belongs to logged-in company
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId: req.user.companyId,
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const conversation =
      await prisma.conversation.findFirst({
        where: {
          customerId,
          companyId: req.user.companyId,
        },
        include: {
          customer: true,
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    return res.status(200).json({
      success: true,
      conversation: conversation || null,
    });
  } catch (error) {
    console.error(
      "Get conversation by customer error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer conversation",
    });
  }
};

// GET CONVERSATION BY ID
const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id,
          companyId: req.user.companyId,
        },
        include: {
          customer: true,
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(
      "Get conversation by ID error:",
      error
    );

    return res.status(500).json({
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

    const conversation =
      await prisma.conversation.updateMany({
        where: {
          id,
          companyId: req.user.companyId,
        },
        data: {
          status,
        },
      });

    if (conversation.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const updatedConversation =
      await prisma.conversation.findUnique({
        where: {
          id,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Conversation updated successfully",
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error(
      "Update conversation status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update conversation",
    });
  }
};

// MARK CONVERSATION AS READ
const markConversationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation =
      await prisma.conversation.updateMany({
        where: {
          id,
          companyId: req.user.companyId,
        },
        data: {
          unreadCount: 0,
        },
      });

    if (conversation.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation marked as read",
    });
  } catch (error) {
    console.error(
      "Mark conversation as read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to mark conversation as read",
    });
  }
};

// MARK CONVERSATION AS UNREAD
const markConversationAsUnread = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation =
      await prisma.conversation.updateMany({
        where: {
          id,
          companyId: req.user.companyId,
        },
        data: {
          unreadCount: 1,
        },
      });

    if (conversation.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation marked as unread",
    });
  } catch (error) {
    console.error(
      "Mark conversation as unread error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to mark conversation as unread",
    });
  }
};

// TOGGLE BOT
const toggleConversationBot = async (req, res) => {
  try {
    const { id } = req.params;
    const { botEnabled } = req.body;

    if (typeof botEnabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "botEnabled must be true or false",
      });
    }

    const conversation =
      await prisma.conversation.updateMany({
        where: {
          id,
          companyId: req.user.companyId,
        },
        data: {
          botEnabled,
        },
      });

    if (conversation.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Bot ${
        botEnabled ? "enabled" : "disabled"
      } for this conversation`,
    });
  } catch (error) {
    console.error(
      "Toggle conversation bot error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update bot status",
    });
  }
};

// CLEAR CHAT
const clearConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id,
          companyId: req.user.companyId,
        },
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    await prisma.message.deleteMany({
      where: {
        conversationId: id,
      },
    });

    const updatedConversation =
      await prisma.conversation.update({
        where: {
          id,
        },
        data: {
          lastMessage: "",
          unreadCount: 0,
        },
      });

    return res.status(200).json({
      success: true,
      message: "Chat cleared successfully",
      conversation: updatedConversation,
    });
  } catch (error) {
    console.error(
      "Clear conversation messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to clear chat",
    });
  }
};

// DELETE CONVERSATION
const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;

    const conversation =
      await prisma.conversation.findFirst({
        where: {
          id,
          companyId: req.user.companyId,
        },
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    await prisma.conversation.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete conversation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete conversation",
    });
  }
};

module.exports = {
  createConversation,
  getConversations,
  getConversationByCustomerId,
  getConversationById,
  updateConversationStatus,
  toggleConversationBot,
  markConversationAsRead,
  markConversationAsUnread,
  clearConversationMessages,
  deleteConversation,
};