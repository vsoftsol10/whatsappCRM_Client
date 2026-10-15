// ============================================================
// INSTAGRAM HELPERS
//
// Instagram DMs reuse the Messenger plumbing (same Page, same token,
// same inbox). This file holds the few things that are Instagram-only.
// ============================================================

const INSTAGRAM_CHANNEL = "INSTAGRAM";

// Instagram-scoped IDs (IGSID) and Messenger Page-scoped IDs (PSID) are
// different ID spaces. We store Instagram IDs with this prefix so a person
// on Instagram can never be confused with a person on Messenger.
const IG_PREFIX = "ig:";

const toInstagramExternalId = (igsid) => `${IG_PREFIX}${igsid}`;

// "ig:1784..." -> "1784..."   (Messenger IDs are returned unchanged)
const fromExternalId = (externalId) =>
  typeof externalId === "string" && externalId.startsWith(IG_PREFIX)
    ? externalId.slice(IG_PREFIX.length)
    : externalId;

// Instagram attachment types that are not plain media
const INSTAGRAM_ATTACHMENT_LABELS = {
  share: "🔗 Shared a post",
  story_mention: "📣 Mentioned you in a story",
  reel: "🎬 Shared a reel",
  ig_reel: "🎬 Shared a reel",
  like_heart: "❤️",
  ig_post: "🔗 Shared a post",
};

module.exports = {
  INSTAGRAM_CHANNEL,
  IG_PREFIX,
  toInstagramExternalId,
  fromExternalId,
  INSTAGRAM_ATTACHMENT_LABELS,
};
