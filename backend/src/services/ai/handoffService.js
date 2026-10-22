const prisma = require("../../config/prisma");
const { notifyUser } = require("../notificationService");
const { emitToCompany } = require("../../socket");

// ============================================
// AI HAND-OFF TO ONE EMPLOYEE
// ============================================
// Called after the AI has sent a reply that ended with the hand-off
// marker. It
//   1. switches the bot OFF for this chat, so a human can take over
//      without the AI talking over them,
//   2. picks ONE employee to handle the chat and notifies them,
//   3. tells open browsers so the Bot switch updates immediately.
// It never throws: a failed notification must not break message flow.

// Set to true if you ALSO want every admin to be notified.
const ALSO_NOTIFY_ADMINS = false;

// ------------------------------------------------------------
// Choose the ONE employee who will handle this chat:
//   1. the customer's owner (the employee the customer belongs to),
//      if that user is still ACTIVE;
//   2. otherwise the ACTIVE employee (role USER) with the FEWEST
//      pending hand-off chats right now, to spread the work;
//   3. otherwise an ACTIVE admin.
// ------------------------------------------------------------
const pickEmployee = async (conversation) => {
  const { companyId } = conversation;

  const ownerId = conversation.customer?.userId;

  if (ownerId) {
    const owner = await prisma.user.findFirst({
      where: { id: ownerId, companyId, status: "ACTIVE" },
      select: { id: true, name: true },
    });

    if (owner) return owner;
  }

  const employees = await prisma.user.findMany({
    where: { companyId, status: "ACTIVE", role: "USER" },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  if (employees.length > 0) {
    // Fewest handed-off (bot OFF) chats among each employee's customers.
    let best = employees[0];
    let bestCount = Infinity;

    for (const employee of employees) {
      const count = await prisma.conversation.count({
        where: {
          companyId,
          botEnabled: false,
          customer: { userId: employee.id },
        },
      });

      if (count < bestCount) {
        best = employee;
        bestCount = count;
      }
    }

    return best;
  }

  return prisma.user.findFirst({
    where: { companyId, status: "ACTIVE", role: "ADMIN" },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });
};

const handleAiHandoff = async (conversation) => {
  try {
    const { id: conversationId, companyId } = conversation;

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { botEnabled: false },
    });

    const contactName =
      conversation.customer?.name ||
      conversation.contactName ||
      conversation.phone ||
      "a customer";

    const employee = await pickEmployee(conversation);

    // If the chat's customer has no owner / an inactive owner, give the
    // customer to the chosen employee so the chat is clearly theirs.
    if (
      employee &&
      conversation.customerId &&
      conversation.customer?.userId !== employee.id
    ) {
      await prisma.customer
        .update({
          where: { id: conversation.customerId },
          data: { userId: employee.id },
        })
        .catch((error) =>
          console.error("AI hand-off: could not assign customer:", error.message)
        );
    }

    emitToCompany(companyId, "conversation:bot", {
      conversationId,
      botEnabled: false,
      handoff: true,
      assignedTo: employee ? { id: employee.id, name: employee.name } : null,
    });

    const recipientIds = new Set();
    if (employee) recipientIds.add(employee.id);

    if (ALSO_NOTIFY_ADMINS || !employee) {
      const admins = await prisma.user.findMany({
        where: { companyId, status: "ACTIVE", role: "ADMIN" },
        select: { id: true },
      });

      admins.forEach((admin) => recipientIds.add(admin.id));
    }

    for (const userId of recipientIds) {
      try {
        await notifyUser({
          userId,
          title: "Customer needs a human reply",
          message:
            employee && userId === employee.id
              ? `The AI handed over the chat with ${contactName} to you. The bot is now OFF for this chat. Please reply.`
              : `The AI handed over the chat with ${contactName}${
                  employee ? ` to ${employee.name}` : ""
                }. The bot is now OFF for this chat.`,
          type: "CUSTOMER",
        });
      } catch (error) {
        console.error("AI hand-off notification failed:", error.message);
      }
    }

    console.log(
      "AI hand-off done for conversation:",
      conversationId,
      "assigned to:",
      employee?.id || "nobody"
    );
  } catch (error) {
    console.error("AI hand-off failed:", error);
  }
};

module.exports = { handleAiHandoff };