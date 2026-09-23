const crypto = require("crypto");

// ======================================================
// STRIPE ADAPTER
// ======================================================
//
// Docs: https://docs.stripe.com/webhooks/signatures
//
// Stripe sends a header:
//   Stripe-Signature: t=1699999999,v1=<hex hmac>
//
// The signed payload is: `${timestamp}.${rawBody}`
// hashed with HMAC-SHA256 using your webhook signing secret
// (the "webhookSecret" you store on the Integration record -
// for Stripe this must be the signing secret from Stripe's
// dashboard, NOT a value your CRM generates).
// ======================================================

const TOLERANCE_SECONDS = 5 * 60; // reject events older than 5 minutes

function verifySignature({ rawBody, headers, secret }) {
  const signatureHeader = headers["stripe-signature"];

  if (!signatureHeader || !secret) {
    return false;
  }

  // Header looks like: "t=1699999999,v1=abc123,v1=def456"
  const parts = String(signatureHeader)
    .split(",")
    .reduce((acc, part) => {
      const [key, value] = part.split("=");
      if (key === "t") acc.timestamp = value;
      if (key === "v1") acc.signatures.push(value);
      return acc;
    }, { timestamp: null, signatures: [] });

  if (!parts.timestamp || parts.signatures.length === 0) {
    return false;
  }

  // Reject stale/replayed events
  const age = Math.abs(Date.now() / 1000 - Number(parts.timestamp));
  if (age > TOLERANCE_SECONDS) {
    console.warn("[stripeAdapter] Signature timestamp outside tolerance window");
    return false;
  }

  const signedPayload = `${parts.timestamp}.${rawBody.toString("utf8")}`;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");

  // Stripe can send multiple v1 signatures during secret rotation -
  // valid if ANY of them match.
  return parts.signatures.some((sig) => {
    const sigBuffer = Buffer.from(sig, "utf8");
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, sigBuffer);
  });
}

// ------------------------------------------------------
// EVENT TYPE MAP
// Stripe's raw event names -> our canonical event types.
// Add more rows here as you enable more events in the
// Stripe dashboard for this webhook endpoint.
// ------------------------------------------------------

const EVENT_TYPE_MAP = {
  "checkout.session.completed": "payment.succeeded",
  "invoice.paid": "subscription.payment.succeeded",
  "invoice.payment_failed": "subscription.payment.failed",
  "customer.subscription.created": "subscription.created",
  "customer.subscription.updated": "subscription.updated",
  "customer.subscription.deleted": "subscription.cancelled",
};

// ------------------------------------------------------
// normalize
// ------------------------------------------------------
//
// IMPORTANT / KNOWN LIMITATION:
// Most Stripe objects (invoice, subscription, charge) do NOT
// include the customer's phone number directly - Stripe is
// email/card first. Options, in order of reliability:
//
//   1. Ask customers to fill "phone" in Stripe Customer
//      metadata at signup - read it from
//      `data.object.metadata.phone` (used below).
//   2. Call the Stripe API (customers.retrieve) using
//      data.object.customer to fetch the phone field.
//   3. If neither is available, the event will be saved and
//      marked FAILED with "Customer phone is required" -
//      check IntegrationEvent records for these and reconcile
//      manually until metadata/API lookup is wired up.
//
// This adapter does the metadata-based lookup only (no extra
// API call) to keep the webhook fast and dependency-free. Add
// the Stripe SDK call in this function if you need option 2.
// ------------------------------------------------------

function normalize({ body }) {
  const rawType = body?.type;
  const object = body?.data?.object || {};

  const phone =
    object.customer_details?.phone ||
    object.metadata?.phone ||
    object.customer_phone ||
    null;

  const email =
    object.customer_details?.email ||
    object.customer_email ||
    object.email ||
    null;

  const name =
    object.customer_details?.name ||
    object.metadata?.name ||
    null;

  // Amount fields differ by object type; Stripe amounts are
  // always in the smallest currency unit (e.g. cents/paise).
  const amountInSmallestUnit =
    object.amount_paid ??
    object.amount_total ??
    object.amount ??
    0;

  return {
    eventId: body?.id,
    eventType: EVENT_TYPE_MAP[rawType] || rawType,
    customer: {
      phone,
      email,
      name,
    },
    order: {
      orderId: object.id || object.payment_intent || null,
      amount: Number(amountInSmallestUnit) / 100,
      currency: (object.currency || "usd").toUpperCase(),
      purchaseDate: object.created
        ? new Date(object.created * 1000)
        : new Date(),
    },
  };
}

module.exports = {
  verifySignature,
  normalize,
};