const prisma = require("../../config/prisma");
const { notifyUser } = require("../notificationService");
const { emitToCompany } = require("../../socket");

// ============================================
// AI HAND-OFF TO A HUMAN
// ============================================
// Called after the AI has sent a reply that ended with the hand-off
// marker. It
//   1. switches the bot OFF for this chat, so a human can take over
//      without the AI talking over them,
//   2. notifies the customer's owner (if any) and the company admins,
//   3. tells open browsers so the Bot switch updates immediately.
// It never throws: a failed notification must not break message flow.
const handleAiHandoff = async (conversation) => {
  try {
    const { id: conversationId, companyId } = conversation;

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { botEnabled: false },
    });

    emitToCompany(companyId, "conversation:bot", {
      conversationId,
      botEnabled: false,
      handoff: true,
    });

    const contactName =
      conversation.customer?.name ||
      conversation.contactName ||
      conversation.phone ||
      "a customer";

    // Customer owner + active admins of THIS company only.
    const recipients = await prisma.user.findMany({
      where: {
        companyId,
        status: "ACTIVE",
        OR: [
          { role: "ADMIN" },
          ...(conversation.customer?.userId
            ? [{ id: conversation.customer.userId }]
            : []),
        ],
      },
      select: { id: true },
    });

    for (const user of recipients) {
      try {
        await notifyUser({
          userId: user.id,
          title: "Customer needs a human reply",
          message: `The AI handed over the chat with ${contactName}. The bot is now OFF for this chat. Please reply.`,
          type: "CUSTOMER",
        });
      } catch (error) {
        console.error("AI hand-off notification failed:", error.message);
      }
    }

    console.log("AI hand-off done for conversation:", conversationId);
  } catch (error) {
    console.error("AI hand-off failed:", error);
  }
};

module.exports = { handleAiHandoff };