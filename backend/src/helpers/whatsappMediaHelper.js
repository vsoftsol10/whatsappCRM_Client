const {
  downloadAndStoreWhatsAppMedia,
} = require("../services/metaMediaDownloadService");

// ============================================
// WHATSAPP MESSAGE CONTENT RESOLVER
// ============================================
// Shared by the live "messages" field, Coexistence "smb_message_echoes"
// (message_echoes), and Coexistence "history" webhooks — all three
// deliver the same per-message shape from Meta (type + a payload object
// keyed by that type), so one resolver covers all of them.
//
// Text messages resolve immediately. Media messages (image, video,
// audio, document, sticker) are downloaded from Meta via the media id
// and re-hosted on Cloudinary so the CRM has a stable, public URL
// instead of Meta's short-lived signed one. Anything else (buttons,
// interactive replies, locations, unsupported types) falls back to a
// short text summary so the message is never silently lost.
//
// Returns: { content: string, messageType: string, imageUrl: string|null }
// ============================================

const MEDIA_TYPES = ["image", "video", "audio", "document", "sticker"];

async function resolveMessageContent(waMessage, accessToken) {
  const type = waMessage?.type;

  if (type === "text") {
    return {
      content: waMessage.text?.body || "",
      messageType: "TEXT",
      imageUrl: null,
    };
  }

  if (MEDIA_TYPES.includes(type)) {
    const mediaPayload = waMessage[type];
    const mediaId = mediaPayload?.id;
    const caption = mediaPayload?.caption || `[${type} message]`;

    if (mediaId && accessToken) {
      try {
        const stored = await downloadAndStoreWhatsAppMedia(
          mediaId,
          mediaPayload?.mime_type,
          accessToken,
          type
        );

        if (stored?.url) {
          return {
            content: caption,
            messageType: type.toUpperCase(),
            imageUrl: stored.url,
          };
        }
      } catch (error) {
        console.error(
          `Failed to download WhatsApp ${type} media (${mediaId}):`,
          error.response?.data || error.message
        );
      }
    }

    // No media id, no access token, or the download failed — save the
    // caption (or a placeholder) as plain text so the message still
    // shows up in the CRM, just without the attachment.
    return { content: caption, messageType: "TEXT", imageUrl: null };
  }

  const fallbackText =
    waMessage?.button?.text ||
    waMessage?.interactive?.button_reply?.title ||
    waMessage?.interactive?.list_reply?.title ||
    `[${type || "unsupported"} message]`;

  return { content: fallbackText, messageType: "TEXT", imageUrl: null };
}

module.exports = { resolveMessageContent };