// ============================================================
// MESSENGER HELPERS
//  - getOrCreateMessengerConversation : one conversation per (Page, person)
//  - resolveMessengerContent          : Messenger payload -> CRM message fields
// ============================================================
const axios = require("axios");
const prisma = require("../config/prisma");
const { decryptSecret } = require("../utils/secretCrypto");
const { getUserProfile } = require("../services/facebookService");
const { uploadBufferToCloudinary } = require("../services/cloudinaryService");

// ------------------------------------------------------------
// CONVERSATION
// ------------------------------------------------------------
const getOrCreateMessengerConversation = async (page, psid) => {
  const where = {
    facebookPageId_externalUserId: {
      facebookPageId: page.id,
      externalUserId: psid,
    },
  };

  const existing = await prisma.conversation.findUnique({
    where,
    include: { customer: true },
  });

  if (existing) return existing;

  // New person: try to get their name (needs "Business Asset User Profile
  // Access" on the Meta app - if missing we fall back to a generic name).
  let profile = null;
  const token = page.pageAccessToken ? decryptSecret(page.pageAccessToken) : null;
  if (token) {
    profile = await getUserProfile(token, psid);
  }

  try {
    return await prisma.conversation.create({
      data: {
        companyId: page.companyId,
        facebookPageId: page.id,
        externalUserId: psid,
        contactName: profile?.name || `Facebook user ${psid.slice(-4)}`,
        status: "OPEN",
        channel: "MESSENGER",
        unreadCount: 0,
        // AI auto-reply for Messenger is not enabled yet.
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

// Messenger attachment type -> CRM messageType + placeholder text
const ATTACHMENT_MAP = {
  image: { messageType: "IMAGE", label: "📷 Photo", resourceType: "image" },
  video: { messageType: "VIDEO", label: "🎥 Video", resourceType: "video" },
  audio: { messageType: "AUDIO", label: "🎤 Voice message", resourceType: "video" },
  file: { messageType: "DOCUMENT", label: "📎 File", resourceType: "raw" },
};

// Facebook's attachment links are temporary CDN links. Copy the file to
// Cloudinary so it keeps working. If anything fails we keep the original link.
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
