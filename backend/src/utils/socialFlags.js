// backend/src/utils/socialFlags.js
//
// Facebook and Instagram are now connected SEPARATELY:
//   - "Connect Facebook"  -> connects the Facebook Page (Messenger) only.
//   - "Connect Instagram" -> connects the Instagram account directly
//                            (Instagram Login, no Facebook needed).
//
// The OLD behaviour (the Facebook button also linked + subscribed the
// Instagram account that is attached to the Page) is kept in the code and
// can be switched back on by setting this on Render:
//
//   FACEBOOK_LINK_INSTAGRAM=true
//
// Default (variable missing or anything else) = separate connections.
const facebookLinksInstagram = () =>
  String(process.env.FACEBOOK_LINK_INSTAGRAM || "").trim().toLowerCase() ===
  "true";

module.exports = { facebookLinksInstagram };