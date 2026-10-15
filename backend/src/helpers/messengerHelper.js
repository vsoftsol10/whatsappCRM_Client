
// // ============================================================
// // MESSENGER / INSTAGRAM HELPERS
// //  - getOrCreateMessengerConversation : one conversation per (Page, person)
// //  - resolveMessengerContent          : platform payload -> CRM message fields
// //
// // Works for both Messenger (channel "MESSENGER") and Instagram DMs
// // (channel "INSTAGRAM"). Messenger behaviour is unchanged.
// // ============================================================
// const axios = require("axios");
// const prisma = require("../config/prisma");
// const { decryptSecret } = require("../utils/secretCrypto");
// const {
//   getUserProfile,
//   getInstagramUserProfile,
// } = require("../services/facebookService");
// const { uploadBufferToCloudinary } = require("../services/cloudinaryService");
// const {
//   INSTAGRAM_CHANNEL,
//   toInstagramExternalId,
//   INSTAGRAM_ATTACHMENT_LABELS,
// } = require("./instagramHelper");

// // ------------------------------------------------------------
// // CONVERSATION
// // ------------------------------------------------------------
// // `personId` is the Page-scoped ID (Messenger) or Instagram-scoped ID
// // (Instagram) exactly as Meta sends it.
// const getOrCreateMessengerConversation = async (
//   page,
//   personId,
//   channel = "MESSENGER"
// ) => {
//   const isInstagram = channel === INSTAGRAM_CHANNEL;

//   // Instagram IDs are stored with a prefix so they never clash with Messenger IDs.
//   const externalUserId = isInstagram
//     ? toInstagramExternalId(personId)
//     : personId;

//   const where = {
//     facebookPageId_externalUserId: {
//       facebookPageId: page.id,
//       externalUserId,
//     },
//   };

//   const existing = await prisma.conversation.findUnique({
//     where,
//     include: { customer: true },
//   });

//   if (existing) return existing;

//   // New person: try to get their name (Messenger needs "Business Asset User
//   // Profile Access"; if missing we fall back to a generic name).
//   let profile = null;
//   const token = page.pageAccessToken
//     ? decryptSecret(page.pageAccessToken)
//     : null;
//   if (token) {
//     profile = isInstagram
//       ? await getInstagramUserProfile(token, personId)
//       : await getUserProfile(token, personId);
//   }

//   const fallbackName = `${isInstagram ? "Instagram" : "Facebook"} user ${String(
//     personId
//   ).slice(-4)}`;

//   try {
//     return await prisma.conversation.create({
//       data: {
//         companyId: page.companyId,
//         facebookPageId: page.id,
//         externalUserId,
//         contactName: profile?.name || fallbackName,
//         status: "OPEN",
//         channel: isInstagram ? INSTAGRAM_CHANNEL : "MESSENGER",
//         unreadCount: 0,
//         // AI auto-reply for Messenger / Instagram is not enabled yet.
//         botEnabled: false,
//       },
//       include: { customer: true },
//     });
//   } catch (error) {
//     // Two webhook events for a brand-new person can race. The unique
//     // index protects us - just load the row the other request created.
//     if (error?.code === "P2002") {
//       return prisma.conversation.findUnique({
//         where,
//         include: { customer: true },
//       });
//     }
//     throw error;
//   }
// };

// // ------------------------------------------------------------
// // MESSAGE CONTENT
// // ------------------------------------------------------------
// const MAX_MEDIA_BYTES = 15 * 1024 * 1024; // 15 MB

// // Attachment type -> CRM messageType + placeholder text
// const ATTACHMENT_MAP = {
//   image: { messageType: "IMAGE", label: "📷 Photo", resourceType: "image" },
//   video: { messageType: "VIDEO", label: "🎥 Video", resourceType: "video" },
//   audio: { messageType: "AUDIO", label: "🎤 Voice message", resourceType: "video" },
//   file: { messageType: "DOCUMENT", label: "📎 File", resourceType: "raw" },
// };

// // Facebook / Instagram attachment links are temporary CDN links. Copy the
// // file to Cloudinary so it keeps working. If anything fails we keep the
// // original link.
// const rehostAttachment = async (url, resourceType) => {
//   if (!url) return null;

//   try {
//     const response = await axios.get(url, {
//       responseType: "arraybuffer",
//       timeout: 8000,
//       maxContentLength: MAX_MEDIA_BYTES,
//       maxBodyLength: MAX_MEDIA_BYTES,
//     });

//     const uploaded = await uploadBufferToCloudinary(Buffer.from(response.data), {
//       folder: "messenger-media",
//       resourceType,
//     });

//     return uploaded?.imageUrl || url;
//   } catch (error) {
//     console.warn("Messenger media re-host skipped:", error.message);
//     return url;
//   }
// };

// const resolveMessengerContent = async (message) => {
//   const attachments = Array.isArray(message?.attachments)
//     ? message.attachments
//     : [];
//   const first = attachments[0];

//   let content = (message?.text || "").trim();
//   let messageType = "TEXT";
//   let imageUrl = null;

//   if (first) {
//     const mapped = ATTACHMENT_MAP[first.type];
//     const url = first.payload?.url || null;

//     if (mapped) {
//       messageType = mapped.messageType;
//       imageUrl = await rehostAttachment(url, mapped.resourceType);
//       if (!content) content = mapped.label;
//     } else if (first.type === "location") {
//       if (!content) {
//         content = url ? `📍 Location: ${url}` : "📍 Location shared";
//       }
//     } else if (INSTAGRAM_ATTACHMENT_LABELS[first.type]) {
//       // Instagram shares / story mentions / reels
//       if (!content) {
//         const label = INSTAGRAM_ATTACHMENT_LABELS[first.type];
//         content = url ? `${label}: ${url}` : label;
//       }
//     } else if (!content) {
//       content = `[${first.type || "unsupported"} attachment]`;
//     }

//     if (attachments.length > 1) {
//       content = `${content} (+${attachments.length - 1} more attachment${
//         attachments.length - 1 > 1 ? "s" : ""
//       })`;
//     }
//   }

//   if (!content) content = "[Unsupported message]";

//   return { content, messageType, imageUrl };
// };

// module.exports = {
//   getOrCreateMessengerConversation,
//   resolveMessengerContent,
// };



// ============================================================
// MESSENGER / INSTAGRAM HELPERS
//  - getOrCreateMessengerConversation : one conversation per (Page, person)
//  - resolveMessengerContent          : platform payload -> CRM message fields
//
// Works for both Messenger (channel "MESSENGER") and Instagram DMs
// (channel "INSTAGRAM"). Messenger behaviour is unchanged.
// ============================================================
const axios = require("axios");
const prisma = require("../config/prisma");
const { decryptSecret } = require("../utils/secretCrypto");
const {
  getUserProfile,
  getInstagramUserProfile,
} = require("../services/facebookService");
const {
  getInstagramLoginUserProfile,
} = require("../services/instagramService");
const { uploadBufferToCloudinary } = require("../services/cloudinaryService");
const {
  INSTAGRAM_CHANNEL,
  toInstagramExternalId,
  INSTAGRAM_ATTACHMENT_LABELS,
} = require("./instagramHelper");

// ------------------------------------------------------------
// CONVERSATION
// ------------------------------------------------------------
// `personId` is the Page-scoped ID (Messenger) or Instagram-scoped ID
// (Instagram) exactly as Meta sends it.
const getOrCreateMessengerConversation = async (
  page,
  personId,
  channel = "MESSENGER"
) => {
  const isInstagram = channel === INSTAGRAM_CHANNEL;

  // Instagram IDs are stored with a prefix so they never clash with Messenger IDs.
  const externalUserId = isInstagram
    ? toInstagramExternalId(personId)
    : personId;

  const where = {
    facebookPageId_externalUserId: {
      facebookPageId: page.id,
      externalUserId,
    },
  };

  const existing = await prisma.conversation.findUnique({
    where,
    include: { customer: true },
  });

  if (existing) return existing;

  // New person: try to get their name (Messenger needs "Business Asset User
  // Profile Access"; if missing we fall back to a generic name).
  let profile = null;
  const token = page.pageAccessToken
    ? decryptSecret(page.pageAccessToken)
    : null;
  if (token) {
    // Instagram connected directly (no Facebook) is read from graph.instagram.com
    profile = isInstagram
      ? page.connectionType === "INSTAGRAM_LOGIN"
        ? await getInstagramLoginUserProfile(token, personId)
        : await getInstagramUserProfile(token, personId)
      : await getUserProfile(token, personId);
  }

  const fallbackName = `${isInstagram ? "Instagram" : "Facebook"} user ${String(
    personId
  ).slice(-4)}`;

  try {
    return await prisma.conversation.create({
      data: {
        companyId: page.companyId,
        facebookPageId: page.id,
        externalUserId,
        contactName: profile?.name || fallbackName,
        status: "OPEN",
        channel: isInstagram ? INSTAGRAM_CHANNEL : "MESSENGER",
        unreadCount: 0,
        // AI auto-reply for Messenger / Instagram is not enabled yet.
        botEnabled: false,
      },
      include: { customer: true },
    });
  } catch (error) {
    // Two webhook events for a brand-new person can race. The unique
    // index protects us - just load the row the other request created.
    if (error?.code === "P2002") {
      return prisma.conversation.findUnique({
        where,
        include: { customer: true },
      });
    }
    throw error;
  }
};

// ------------------------------------------------------------
// MESSAGE CONTENT
// ------------------------------------------------------------
const MAX_MEDIA_BYTES = 15 * 1024 * 1024; // 15 MB

// Attachment type -> CRM messageType + placeholder text
const ATTACHMENT_MAP = {
  image: { messageType: "IMAGE", label: "📷 Photo", resourceType: "image" },
  video: { messageType: "VIDEO", label: "🎥 Video", resourceType: "video" },
  audio: { messageType: "AUDIO", label: "🎤 Voice message", resourceType: "video" },
  file: { messageType: "DOCUMENT", label: "📎 File", resourceType: "raw" },
};

// Facebook / Instagram attachment links are temporary CDN links. Copy the
// file to Cloudinary so it keeps working. If anything fails we keep the
// original link.
const rehostAttachment = async (url, resourceType) => {
  if (!url) return null;

  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 8000,
      maxContentLength: MAX_MEDIA_BYTES,
      maxBodyLength: MAX_MEDIA_BYTES,
    });

    const uploaded = await uploadBufferToCloudinary(Buffer.from(response.data), {
      folder: "messenger-media",
      resourceType,
    });

    return uploaded?.imageUrl || url;
  } catch (error) {
    console.warn("Messenger media re-host skipped:", error.message);
    return url;
  }
};

const resolveMessengerContent = async (message) => {
  const attachments = Array.isArray(message?.attachments)
    ? message.attachments
    : [];
  const first = attachments[0];

  let content = (message?.text || "").trim();
  let messageType = "TEXT";
  let imageUrl = null;

  if (first) {
    const mapped = ATTACHMENT_MAP[first.type];
    const url = first.payload?.url || null;

    if (mapped) {
      messageType = mapped.messageType;
      imageUrl = await rehostAttachment(url, mapped.resourceType);
      if (!content) content = mapped.label;
    } else if (first.type === "location") {
      if (!content) {
        content = url ? `📍 Location: ${url}` : "📍 Location shared";
      }
    } else if (INSTAGRAM_ATTACHMENT_LABELS[first.type]) {
      // Instagram shares / story mentions / reels
      if (!content) {
        const label = INSTAGRAM_ATTACHMENT_LABELS[first.type];
        content = url ? `${label}: ${url}` : label;
      }
    } else if (!content) {
      content = `[${first.type || "unsupported"} attachment]`;
    }

    if (attachments.length > 1) {
      content = `${content} (+${attachments.length - 1} more attachment${
        attachments.length - 1 > 1 ? "s" : ""
      })`;
    }
  }

  if (!content) content = "[Unsupported message]";

  return { content, messageType, imageUrl };
};

module.exports = {
  getOrCreateMessengerConversation,
  resolveMessengerContent,
};
