const axios = require("axios");
const { uploadBufferToCloudinary } = require("./cloudinaryService");

const GRAPH_API_VERSION = "v23.0";

// WhatsApp message type -> Cloudinary resource_type. Cloudinary has no
// dedicated "audio" bucket — audio/voice notes upload fine under "video".
// Documents (pdf, docx, etc.) must go under "raw" or Cloudinary rejects them.
const RESOURCE_TYPE_MAP = {
  image: "image",
  sticker: "image",
  video: "video",
  audio: "video",
  voice: "video",
  document: "raw",
};

// ============================================
// DOWNLOAD + RE-HOST A WHATSAPP MEDIA MESSAGE
// ============================================
// Two-step Graph API dance (per Meta's docs):
//   1. GET /{media-id}            -> { url, mime_type, ... }
//   2. GET <that url>             -> the actual bytes (needs the same
//      bearer token; the URL is short-lived, so step 2 must follow
//      step 1 immediately rather than being cached/reused later)
//
// accessToken MUST be the WhatsApp account's own token (the one saved
// on WhatsAppAccount from Embedded Signup) — this is a multi-tenant
// SaaS, so a shared/global token would fail for any tenant other than
// whichever one it belongs to.
// ============================================
const downloadAndStoreWhatsAppMedia = async (
  mediaId,
  mimeTypeHint,
  accessToken,
  waMessageType
) => {
  if (!mediaId || !accessToken) return null;

  // 1. Resolve the temporary media URL + metadata from Meta
  const metaRes = await axios.get(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${mediaId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const { url, mime_type: mimeType } = metaRes.data || {};
  if (!url) return null;

  // 2. Download the actual bytes
  const fileRes = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    responseType: "arraybuffer",
  });

  const buffer = Buffer.from(fileRes.data);

  // 3. Re-host on Cloudinary so the CRM has a stable, public URL that
  // doesn't expire the way Meta's does.
  const resourceType = RESOURCE_TYPE_MAP[waMessageType] || "auto";

  const uploadResult = await uploadBufferToCloudinary(buffer, {
    folder: "whatsapp-media",
    resourceType,
  });

  if (!uploadResult?.imageUrl) return null;

  return {
    url: uploadResult.imageUrl,
    mimeType: mimeType || mimeTypeHint || null,
  };
};

module.exports = { downloadAndStoreWhatsAppMedia };