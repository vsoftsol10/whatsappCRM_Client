const crypto = require("crypto");

// ======================================================
// GENERIC ADAPTER
// ======================================================
//
// Used for:
//   - provider = "GENERIC" or "CUSTOM"
//   - any provider name we don't have a dedicated adapter for
//
// This is exactly the format your CRM already expects today:
//
//   {
//     eventId: "...",
//     eventType: "...",
//     customer: { phone, name, email },
//     order: { orderId, amount, currency, purchaseDate }
//   }
//
// So a business whose billing tool can't be pre-mapped can
// still integrate, as long as whoever wires up the webhook on
// their side sends payloads in this shape directly.
// ======================================================

// ------------------------------------------------------
// verifySignature
//
// The generic integration doesn't have a fixed, known
// signature scheme (unlike Stripe/Razorpay), so we support
// an OPTIONAL HMAC-SHA256 signature:
//
//   header: x-webhook-signature
//   value : hex( HMAC_SHA256(rawBody, integration.webhookSecret) )
//
// Behavior:
//   - Header present  -> must match, otherwise reject (401)
//   - Header missing  -> allowed through, but logged as
//                        unsigned. This keeps manual/Postman
//                        testing and simple no-code tools
//                        working, while still rewarding
//                        integrators who DO sign their
//                        requests with real protection.
//
// If you want to REQUIRE signatures for all generic
// integrations in production, change the "header missing"
// branch below to `return false`.
// ------------------------------------------------------

function verifySignature({ rawBody, headers, secret }) {
  const signatureHeader = headers["x-webhook-signature"];

  if (!signatureHeader) {
    console.warn(
      "[genericAdapter] No x-webhook-signature header present - accepting unsigned request. " +
        "Configure the sender to sign requests for production use."
    );
    return true;
  }

  if (!secret) {
    // A signature was sent but we have no secret to check it
    // against - treat as invalid rather than silently passing.
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(String(signatureHeader), "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

// ------------------------------------------------------
// normalize
// Already in our internal shape - just pass it through,
// with light defensive defaults.
// ------------------------------------------------------

function normalize({ body }) {
  const { eventId, eventType, customer, order } = body || {};

  return {
    eventId,
    eventType,
    customer: customer || null,
    order: order || null,
  };
}

module.exports = {
  verifySignature,
  normalize,
};