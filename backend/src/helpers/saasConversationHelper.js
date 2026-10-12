// const prisma = require("../config/prisma");

// const getOrCreateSaaSConversation = async (
//   companyId,
//   whatsappAccountId,
//   phone
// ) => {
//   if (!companyId) {
//     throw new Error("Company ID is required");
//   }

//   if (!whatsappAccountId) {
//     throw new Error("WhatsApp account ID is required");
//   }

//   if (!phone) {
//     throw new Error("Customer phone number is required");
//   }

//   // Make sure the WhatsApp account belongs
//   // to this company.
//   const whatsappAccount = await prisma.whatsAppAccount.findFirst({
//     where: {
//       id: whatsappAccountId,
//       companyId,
//       status: "CONNECTED",
//     },
//   });

//   if (!whatsappAccount) {
//     throw new Error(
//       "WhatsApp account does not belong to this company"
//     );
//   }

//   // Find customer ONLY inside this company.
//   const customer = await prisma.customer.findFirst({
//     where: {
//       companyId,
//       phone,
//     },
//   });

//   // Existing customer
//   if (customer) {
//     let conversation = await prisma.conversation.findUnique({
//       where: {
//         customerId: customer.id,
//       },
//       include: {
//         customer: true,
//       },
//     });

//     if (conversation) {
//       // Make sure conversation belongs to this company.
//       if (conversation.companyId !== companyId) {
//         throw new Error(
//           "Conversation belongs to another company"
//         );
//       }

//       // Associate WhatsApp account if not already set.
//       if (conversation.whatsappAccountId !== whatsappAccountId) {
//         conversation = await prisma.conversation.update({
//           where: {
//             id: conversation.id,
//           },
//           data: {
//             whatsappAccountId,
//           },
//           include: {
//             customer: true,
//           },
//         });
//       }

//       return conversation;
//     }

//     conversation = await prisma.conversation.create({
//       data: {
//         companyId,
//         whatsappAccountId,
//         customerId: customer.id,
//         phone: customer.phone,
//         status: "OPEN",
//         channel: "WHATSAPP",
//         unreadCount: 0,
//       },
//       include: {
//         customer: true,
//       },
//     });

//     return conversation;
//   }

//   // No customer yet
//   return prisma.conversation.create({
//     data: {
//       companyId,
//       whatsappAccountId,
//       customerId: null,
//       phone,
//       status: "OPEN",
//       channel: "WHATSAPP",
//       unreadCount: 0,
//     },
//     include: {
//       customer: true,
//     },
//   });
// };

// module.exports = {
//   getOrCreateSaaSConversation,
// };



const prisma = require("../config/prisma");

// ------------------------------------------------------
// Tiny in-process lock, keyed by company + phone.
//
// Two WhatsApp messages from the same NEW number can arrive within
// milliseconds. Without a lock both would find "no conversation" and
// both would create one. This makes the second wait for the first.
// (Works for a single server process. If you run several instances,
// also add the partial unique index described in the notes.)
// ------------------------------------------------------
const locks = new Map();

const withLock = async (key, fn) => {
  const previous = locks.get(key) || Promise.resolve();

  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });

  const chain = previous.then(() => current);
  locks.set(key, chain);

  await previous;

  try {
    return await fn();
  } finally {
    release();
    if (locks.get(key) === chain) {
      locks.delete(key);
    }
  }
};

const findOrCreateConversation = async (
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

  const customer = await prisma.customer.findFirst({
    where: {
      companyId,
      phone,
    },
  });

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
      if (conversation.companyId !== companyId) {
        throw new Error(
          "Conversation belongs to another company"
        );
      }

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

    // NEW: this number chatted with us BEFORE it was saved as a customer,
    // so a phone-only conversation may already exist. Link it to the
    // customer instead of starting a second chat (keeps the history).
    const phoneOnly = await prisma.conversation.findFirst({
      where: {
        companyId,
        phone,
        customerId: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (phoneOnly) {
      return prisma.conversation.update({
        where: {
          id: phoneOnly.id,
        },
        data: {
          customerId: customer.id,
          whatsappAccountId,
        },
        include: {
          customer: true,
        },
      });
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

  // NEW: unknown number. Reuse the existing phone-only conversation
  // (oldest one wins, in case duplicates already exist in the database)
  // instead of creating a brand new chat for every message.
  const existing = await prisma.conversation.findFirst({
    where: {
      companyId,
      phone,
      customerId: null,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      customer: true,
    },
  });

  if (existing) {
    if (existing.whatsappAccountId !== whatsappAccountId) {
      return prisma.conversation.update({
        where: {
          id: existing.id,
        },
        data: {
          whatsappAccountId,
        },
        include: {
          customer: true,
        },
      });
    }

    return existing;
  }

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

// Same name and arguments as before, so no caller needs to change.
const getOrCreateSaaSConversation = (
  companyId,
  whatsappAccountId,
  phone
) =>
  withLock(`${companyId}:${phone}`, () =>
    findOrCreateConversation(companyId, whatsappAccountId, phone)
  );

module.exports = {
  getOrCreateSaaSConversation,
};