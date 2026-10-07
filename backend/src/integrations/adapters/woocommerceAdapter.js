const crypto = require("crypto");
const { normalizePhone, safeEqual } = require("./phoneHelper");

// ======================================================
// WOOCOMMERCE ADAPTER
// ======================================================
//
// Docs: https://woocommerce.github.io/woocommerce-rest-api-docs/#webhooks
//
// WooCommerce sends these headers:
//   X-WC-Webhook-Signature   : base64( HMAC_SHA256(rawBody, secret) )
//   X-WC-Webhook-Topic       : e.g. "order.created", "order.updated"
//   X-WC-Webhook-Delivery-ID : unique per delivery
//
// SECRET: unlike Stripe/Shopify, WooCommerce lets YOU type the secret
// when you create the webhook. Copy the webhookSecret your CRM generated
// into WooCommerce > Settings > Advanced > Webhooks > Secret. No pasting
// back needed.
//
// DELIVERY URL: https://<your-api-domain>/api/integrations/webhook/<webhookKey>
// RECOMMENDED TOPICS: "Order created" and "Order updated" (+ "Customer created")
// ======================================================

function verifySignature({ rawBody, headers, secret }) {
  const received = headers["x-wc-webhook-signature"];
  if (!received || !secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  return safeEqual(expected, received);
}

const EVENT_TYPE_MAP = {
  "order.created": "order.created",
  "order.updated": "order.updated",
  "customer.created": "customer.created",
  "customer.updated": "customer.updated",
};

function normalize({ body, headers }) {
  const topic = headers["x-wc-webhook-topic"] || "";
  const isCustomerTopic = topic.startsWith("customer.");
  const data = body || {};

  const rawPhone = data.billing?.phone || data.shipping?.phone || null;

  const name =
    [data.billing?.first_name, data.billing?.last_name]
      .filter(Boolean)
      .join(" ") ||
    [data.first_name, data.last_name].filter(Boolean).join(" ") ||
    null;

  const email = data.billing?.email || data.email || null;

  // Paid = has a paid date, or is completed. "processing" alone is NOT
  // enough: cash-on-delivery orders sit in "processing" unpaid.
  const isPaid =
    !isCustomerTopic &&
    (!!(data.date_paid_gmt || data.date_paid) || data.status === "completed");

  // order.updated fires on every status change, so include the modified
  // time to keep each distinct update a distinct event (retries still dedupe).
  const eventId =
    data.id !== undefined
      ? `${topic}:${data.id}:${data.date_modified_gmt || data.date_created_gmt || ""}`
      : headers["x-wc-webhook-delivery-id"] || null;

  return {
    eventId,
    eventType: EVENT_TYPE_MAP[topic] || topic || null,
    customer: {
      phone: normalizePhone(rawPhone),
      email,
      name,
    },
    order: isPaid
      ? {
          orderId: String(data.number || data.id),
          amount: Number(data.total) || 0,
          currency: (data.currency || "USD").toUpperCase(),
          purchaseDate:
            data.date_paid_gmt || data.date_created_gmt
              ? new Date(`${data.date_paid_gmt || data.date_created_gmt}Z`)
              : new Date(),
        }
      : null,
  };
}

module.exports = { verifySignature, normalize };