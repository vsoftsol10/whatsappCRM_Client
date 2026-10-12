// const prisma = require("../config/prisma");

// const saveIncomingMessage = async (
//   conversationId,
//   text
// ) => {
//   try {
//     console.log("========== SAVE MESSAGE ==========");
//     console.log("Conversation ID:", conversationId);
//     console.log("Message:", text);

//     // Save incoming message
//     const message = await prisma.message.create({
//       data: {
//         conversationId,
//         content: text,
//         sender: "CUSTOMER",
//         messageType: "TEXT",
//         status: "RECEIVED",
//       },
//     });

//     // Update conversation
//     await prisma.conversation.update({
//       where: {
//         id: conversationId,
//       },
//       data: {
//         lastMessage: text,
//         unreadCount: {
//           increment: 1,
//         },
//       },
//     });

//     console.log("Message Saved Successfully");
//     console.log(message);

//     return message;
//   } catch (error) {
//     console.error("SAVE MESSAGE ERROR");
//     console.error(error);

//     throw error;
//   }
// };

// module.exports = {
//   saveIncomingMessage,
// };


const prisma = require("../config/prisma");

/**
 * Save an incoming (customer) message.
 *
 * Backward compatible: existing callers can still call
 *   saveIncomingMessage(conversationId, text)
 *
 * New optional 3rd argument:
 *   { metaMessageId, messageType, imageUrl }
 *
 * Returns the saved message, or NULL when Meta re-delivered a message
 * we already have (same metaMessageId). Callers must skip any follow-up
 * work (like triggering the AI bot) when null is returned.
 */
const saveIncomingMessage = async (
  conversationId,
  text,
  options = {}
) => {
  const { metaMessageId, messageType = "TEXT", imageUrl = null } = options;

  try {
    console.log("========== SAVE MESSAGE ==========");
    console.log("Conversation ID:", conversationId);
    console.log("Message:", text);

    // Save incoming message
    const message = await prisma.message.create({
      data: {
        conversationId,
        content: text,
        sender: "CUSTOMER",
        messageType,
        status: "RECEIVED",
        ...(imageUrl && { imageUrl }),
        ...(metaMessageId && { metaMessageId }),
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        lastMessage: text,
        unreadCount: {
          increment: 1,
        },
      },
    });

    console.log("Message Saved Successfully");
    console.log(message);

    return message;
  } catch (error) {
    // P2002 = unique constraint failed. With metaMessageId this means two
    // deliveries of the same WhatsApp message raced each other. The other
    // one already saved it, so this is not an error.
    if (error?.code === "P2002" && metaMessageId) {
      console.log("Duplicate incoming message ignored:", metaMessageId);
      return null;
    }

    console.error("SAVE MESSAGE ERROR");
    console.error(error);

    throw error;
  }
};

module.exports = {
  saveIncomingMessage,
};