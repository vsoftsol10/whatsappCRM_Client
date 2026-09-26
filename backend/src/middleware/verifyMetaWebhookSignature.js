const crypto = require("crypto");

// ============================================
// META WHATSAPP WEBHOOK SIGNATURE VERIFICATION
// ============================================
// Docs: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#validating-payloads
//
// Meta signs every webhook POST with a header:
//   X-Hub-Signature-256: sha256=<hex hmac>
// which is the HMAC-SHA256 of the EXACT raw request body, keyed with
// your app's App Secret (META_APP_SECRET).
//
// Without this check, anyone who finds the webhook URL can POST fake
// payloads — including a fake "account_update" event that flips a
// tenant's WhatsApp account to DISCONNECTED, or fake messages injected
// straight into a company's conversation history.
//
// Requires req.rawBody to already be populated (server.js's
// express.json({ verify }) does this globally, so no change needed
// there). Only applies to POST — Meta's GET request (the one-time
// hub.challenge handshake when you save the callback URL in the App
// Dashboard) carries no body and no signature.
// ============================================

function verifyMetaWebhookSignature(req, res, next) {
  if (req.method === "GET") {
    return next();
  }

  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret) {
    console.error(
      "META WEBHOOK SIGNATURE: META_APP_SECRET is not set — refusing to process unverified webhook"
    );
    return res.sendStatus(500);
  }

  const signatureHeader = req.headers["x-hub-signature-256"];

  if (!signatureHeader || !req.rawBody) {
    console.error(
      "META WEBHOOK SIGNATURE: missing signature header or raw body — rejecting request"
    );
    return res.sendStatus(401);
  }

  const expected =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(req.rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(String(signatureHeader), "utf8");

  const isValid =
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!isValid) {
    console.error("META WEBHOOK SIGNATURE: signature mismatch — rejecting request");
    return res.sendStatus(401);
  }

  return next();
}

module.exports = verifyMetaWebhookSignature;