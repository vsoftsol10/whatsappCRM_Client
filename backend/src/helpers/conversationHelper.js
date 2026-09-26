// const prisma = require("../config/prisma");

// const getOrCreateConversation = async (phone) => {
//   // 1. Try find conversation by phone
//   let conversation = await prisma.conversation.findUnique({
//     where: {
//       phone,
//     },
//     include: {
//       customer: true,
//     },
//   });

//   if (conversation) {
//     return conversation;
//   }

//   // 2. Find customer by phone
//   const customer = await prisma.customer.findUnique({
//     where: {
//       phone,
//     },
//   });

//   // 3. If customer exists, check if a conversation already exists for them
//   //    (covers cases where phone field mismatch happened, e.g. formatting)
//   if (customer) {
//     conversation = await prisma.conversation.findUnique({
//       where: {
//         customerId: customer.id,
//       },
//       include: {
//         customer: true,
//       },
//     });

//     if (conversation) {
//       // Backfill the phone field so future lookups work directly
//       if (!conversation.phone) {
//         conversation = await prisma.conversation.update({
//           where: { id: conversation.id },
//           data: { phone },
//           include: { customer: true },
//         });
//       }
//       return conversation;
//     }
//   }

//   // 4. Nothing found — safe to create a new conversation
//   conversation = await prisma.conversation.create({
//     data: {
//       phone: customer ? customer.phone : phone,
//       customerId: customer ? customer.id : null,
//       status: "OPEN",
//       channel: "WHATSAPP",
//       unreadCount: 0,
//     },
//     include: {
//       customer: true,
//     },
//   });

//   return conversation;
// };

// module.exports = {
//   getOrCreateConversation,
// };


const prisma = require("../config/prisma");

// accountContext (optional): { companyId, whatsappAccountId }
// Pass this whenever the caller knows which WhatsApp account /
// company a webhook event belongs to (every webhook handler should
// pass it — this is how a conversation gets correctly linked to a
// WhatsApp account, which conversation.whatsappAccount relies on for
// Coexistence status, message sending, and the Grok auto-reply guard).
const getOrCreateConversation = async (phone, accountContext = null) => {
  const companyId = accountContext?.companyId ?? null;
  const whatsappAccountId = accountContext?.whatsappAccountId ?? null;

  // 1. Try find conversation by phone
  let conversation = await prisma.conversation.findUnique({
    where: {
      phone,
    },
    include: {
      customer: true,
      whatsappAccount: true,
    },
  });

  if (conversation) {
    // Backfill the WhatsApp account link if it's missing — e.g. the
    // conversation was created before this number was connected, or
    // by a webhook that didn't have this context yet.
    if (!conversation.whatsappAccountId && whatsappAccountId) {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { whatsappAccountId },
        include: { customer: true, whatsappAccount: true },
      });
    }
    return conversation;
  }

  // 2. Find customer by phone
  const customer = await prisma.customer.findUnique({
    where: {
      phone,
    },
  });

  // 3. If customer exists, check if a conversation already exists for them
  //    (covers cases where phone field mismatch happened, e.g. formatting)
  if (customer) {
    conversation = await prisma.conversation.findUnique({
      where: {
        customerId: customer.id,
      },
      include: {
        customer: true,
        whatsappAccount: true,
      },
    });

    if (conversation) {
      const needsPhone = !conversation.phone;
      const needsAccount = !conversation.whatsappAccountId && whatsappAccountId;

      if (needsPhone || needsAccount) {
        // Backfill the phone field and/or account link so future
        // lookups and sends work directly.
        conversation = await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            ...(needsPhone && { phone }),
            ...(needsAccount && { whatsappAccountId }),
          },
          include: { customer: true, whatsappAccount: true },
        });
      }
      return conversation;
    }
  }

  // 4. Nothing found — safe to create a new conversation.
  // companyId is a REQUIRED field on Conversation, so it must be
  // resolved from somewhere: prefer the WhatsApp account's company
  // (every webhook should supply this), falling back to the
  // customer's company if we somehow don't have it.
  const resolvedCompanyId = companyId ?? customer?.companyId ?? null;

  if (!resolvedCompanyId) {
    throw new Error(
      `Cannot create conversation for phone ${phone}: no companyId could be resolved. ` +
        `Pass { companyId, whatsappAccountId } as the second argument to getOrCreateConversation.`
    );
  }

  conversation = await prisma.conversation.create({
    data: {
      companyId: resolvedCompanyId,
      whatsappAccountId,
      phone: customer ? customer.phone : phone,
      customerId: customer ? customer.id : null,
      status: "OPEN",
      channel: "WHATSAPP",
      unreadCount: 0,
    },
    include: {
      customer: true,
      whatsappAccount: true,
    },
  });

  return conversation;
};

module.exports = {
  getOrCreateConversation,
};