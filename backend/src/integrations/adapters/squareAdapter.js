const crypto = require("crypto");

// ======================================================
// SQUARE ADAPTER
// ======================================================
//
// Docs: https://developer.squareup.com/docs/webhooks/step3validate
//
// Square sends a header:
//   x-square-hmacsha256-signature: <base64 hmac>
//
// UNLIKE Stripe/Razorpay, Square signs:
//   notificationUrl + rawBody
// (URL first, body second, no separator) - not the body alone.
// The notificationUrl must match EXACTLY what's configured in
// the Square Developer Dashboard for this subscription
// (scheme, host, path, trailing slash all matter). Also,
// Square base64-encodes the digest, not hex.
// ======================================================

function verifySignature({ rawBody, headers, secret, notificationUrl }) {
  const signatureHeader = headers["x-square-hmacsha256-signature"];

  if (!signatureHeader || !secret || !notificationUrl) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(notificationUrl + rawBody.toString("utf8"))
    .digest("base64");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(String(signatureHeader), "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

// ------------------------------------------------------
// EVENT TYPE MAP
// Square's raw event names -> our canonical event types.
// ------------------------------------------------------

const EVENT_TYPE_MAP = {
  "payment.created": "payment.succeeded",
  "payment.updated": "payment.updated",
  "refund.created": "payment.refunded",
  "invoice.payment_made": "subscription.payment.succeeded",
  "subscription.created": "subscription.created",
  "subscription.updated": "subscription.updated",
  "customer.created": "customer.created",
};

// ------------------------------------------------------
// normalize
// ------------------------------------------------------
//
// Square's body shape:
//   { merchant_id, type, event_id, created_at,
//     data: { type, id, object: { payment: {...} } } }
// (object key varies: payment / refund / invoice / subscription
// / customer, depending on `type`).
//
// KNOWN LIMITATION (same as Stripe): Square's payment/refund
// objects do NOT include the customer's phone number - Square
// is card/email first. Reliable phone sources, in order:
//   1. order.fulfillments[].pickup_details.recipient.phone_number
//      (needs a separate Orders API call using order_id)
//   2. Customers API lookup using object.payment.customer_id
//   3. If neither is wired up, event is saved and marked FAILED
//      with "Customer phone is required" - check IntegrationEvent
//      records to reconcile manually until one of the above is
//      added.
// This adapter does NOT call the Square API (kept dependency-free
// and fast) - add a Square SDK call here if you need option 1/2.
// ------------------------------------------------------

function normalize({ body }) {
  const rawType = body?.type;
  const dataObject = body?.data?.object || {};

  // Whichever entity is present for this event type.
  const entity =
    dataObject.payment ||
    dataObject.refund ||
    dataObject.invoice ||
    dataObject.subscription ||
    dataObject.customer ||
    {};

  const phone =
    entity.buyer_phone_number ||
    entity.phone_number ||
    null;

  const email =
    entity.buyer_email_address ||
    entity.email_address ||
    null;

  const name =
    entity.billing_address?.first_name && entity.billing_address?.last_name
      ? `${entity.billing_address.first_name} ${entity.billing_address.last_name}`
      : entity.given_name || null;

  const amountMoney =
    entity.amount_money || entity.total_money || null;

  return {
    eventId: body?.event_id,
    eventType: EVENT_TYPE_MAP[rawType] || rawType,
    customer: {
      phone,
      email,
      name,
    },
    order: {
      orderId: entity.order_id || entity.id || null,
      // Square amounts are in the smallest currency unit (cents).
      amount: amountMoney ? Number(amountMoney.amount || 0) / 100 : 0,
      currency: amountMoney?.currency || "USD",
      purchaseDate: body?.created_at
        ? new Date(body.created_at)
        : new Date(),
    },
  };
}

module.exports = {
  verifySignature,
  normalize,
};