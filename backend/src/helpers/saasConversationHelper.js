const prisma = require("../config/prisma");

const getOrCreateSaaSConversation = async (
  companyId,
  whatsappAccountId,
  phone
) => {
  if (!companyId) {
    throw new Error("Company ID is required");
  }

  if (!whatsappAccountId) {
    throw new Error("WhatsApp account ID is required");
  }

  if (!phone) {
    throw new Error("Customer phone number is required");
  }

  // Make sure the WhatsApp account belongs
  // to this company.
  const whatsappAccount = await prisma.whatsAppAccount.findFirst({
    where: {
      id: whatsappAccountId,
      companyId,
      status: "CONNECTED",
    },
  });

  if (!whatsappAccount) {
    throw new Error(
      "WhatsApp account does not belong to this company"
    );
  }

  // Find customer ONLY inside this company.
  const customer = await prisma.customer.findFirst({
    where: {
      companyId,
      phone,
    },
  });

  // Existing customer
  if (customer) {
    let conversation = await prisma.conversation.findUnique({
      where: {
        customerId: customer.id,
      },
      include: {
        customer: true,
      },
    });

    if (conversation) {
      // Make sure conversation belongs to this company.
      if (conversation.companyId !== companyId) {
        throw new Error(
          "Conversation belongs to another company"
        );
      }

      // Associate WhatsApp account if not already set.
      if (conversation.whatsappAccountId !== whatsappAccountId) {
        conversation = await prisma.conversation.update({
          where: {
            id: conversation.id,
          },
          data: {
            whatsappAccountId,
          },
          include: {
            customer: true,
          },
        });
      }

      return conversation;
    }

    conversation = await prisma.conversation.create({
      data: {
        companyId,
        whatsappAccountId,
        customerId: customer.id,
        phone: customer.phone,
        status: "OPEN",
        channel: "WHATSAPP",
        unreadCount: 0,
      },
      include: {
        customer: true,
      },
    });

    return conversation;
  }

  // No customer yet
  return prisma.conversation.create({
    data: {
      companyId,
      whatsappAccountId,
      customerId: null,
      phone,
      status: "OPEN",
      channel: "WHATSAPP",
      unreadCount: 0,
    },
    include: {
      customer: true,
    },
  });
};

module.exports = {
  getOrCreateSaaSConversation,
};