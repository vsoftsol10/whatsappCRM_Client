const crypto = require("crypto");

// ======================================================
// RAZORPAY ADAPTER
// ======================================================
//
// Docs: https://razorpay.com/docs/webhooks/validate-test/
//
// Razorpay sends a header:
//   X-Razorpay-Signature: <hex hmac>
//
// It's the HMAC-SHA256 of the raw request body, using the
// webhook secret you configured in the Razorpay dashboard for
// that specific webhook (store this same value as the
// Integration's webhookSecret).
// ======================================================

function verifySignature({ rawBody, headers, secret }) {
  const signatureHeader = headers["x-razorpay-signature"];

  if (!signatureHeader || !secret) {
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
// EVENT TYPE MAP
// Razorpay's raw event names -> our canonical event types.
// Add more rows as you enable more events for this webhook
// in the Razorpay dashboard.
// ------------------------------------------------------

const EVENT_TYPE_MAP = {
  "payment.captured": "payment.succeeded",
  "payment.failed": "payment.failed",
  "subscription.activated": "subscription.created",
  "subscription.charged": "subscription.payment.succeeded",
  "subscription.cancelled": "subscription.cancelled",
  "order.paid": "payment.succeeded",
};

// ------------------------------------------------------
// normalize
// ------------------------------------------------------
//
// Razorpay's webhook body shape depends on the event:
//   payload.payment.entity      (payment.* events)
//   payload.subscription.entity (subscription.* events)
//   payload.order.entity        (order.* events)
//
// We check each in order and use whichever is present.
// ------------------------------------------------------

function normalize({ body }) {
  const rawType = body?.event;

  const entity =
    body?.payload?.payment?.entity ||
    body?.payload?.subscription?.entity ||
    body?.payload?.order?.entity ||
    {};

  // Razorpay doesn't send one global "event id" the way Stripe
  // does - the entity id + event name together are unique per
  // delivery, which is exactly what our duplicate-check needs.
  const eventId = `${rawType}:${entity.id || body?.created_at}`;

  const phone =
    entity.contact ||
    entity.notes?.phone ||
    null;

  const email = entity.email || entity.notes?.email || null;
  const name = entity.notes?.name || null;

  return {
    eventId,
    eventType: EVENT_TYPE_MAP[rawType] || rawType,
    customer: {
      phone,
      email,
      name,
    },
    order: {
      orderId: entity.order_id || entity.id || null,
      // Razorpay amounts are in paise.
      amount: Number(entity.amount || 0) / 100,
      currency: entity.currency || "INR",
      purchaseDate: entity.created_at
        ? new Date(entity.created_at * 1000)
        : new Date(),
    },
  };
}

module.exports = {
  verifySignature,
  normalize,
};