const crypto = require("crypto");
const { normalizePhone, safeEqual } = require("./phoneHelper");

// ======================================================
// SHOPIFY ADAPTER
// ======================================================
//
// Docs: https://shopify.dev/docs/apps/build/webhooks/subscribe/https
//
// Shopify sends these headers:
//   X-Shopify-Hmac-Sha256 : base64( HMAC_SHA256(rawBody, secret) )
//   X-Shopify-Topic       : e.g. "orders/paid"
//   X-Shopify-Webhook-Id  : unique per event, SAME on retries (ideal eventId)
//
// SECRET to store as the Integration's webhookSecret:
//   - Webhook made in Shopify Admin > Settings > Notifications > Webhooks:
//     the signing key shown at the bottom of that page.
//   - Webhook made by a custom app: that app's "Client secret".
//   (Shopify does NOT let you choose the secret, so after creating the
//   integration use the "Paste signing secret" box in your CRM.)
//
// RECOMMENDED TOPICS to enable in Shopify: orders/paid, customers/create
// ======================================================

function verifySignature({ rawBody, headers, secret }) {
  const received = headers["x-shopify-hmac-sha256"];
  if (!received || !secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  return safeEqual(expected, received);
}

const EVENT_TYPE_MAP = {
  "orders/paid": "payment.succeeded",
  "orders/create": "order.created",
  "orders/updated": "order.updated",
  "orders/cancelled": "order.cancelled",
  "customers/create": "customer.created",
  "customers/update": "customer.updated",
};

function normalize({ body, headers }) {
  const topic = headers["x-shopify-topic"] || "";
  const isCustomerTopic = topic.startsWith("customers/");

  // orders/* payload = the order; customers/* payload = the customer itself
  const order = isCustomerTopic ? null : body || {};
  const customerObj = isCustomerTopic ? body || {} : body?.customer || {};

  const rawPhone =
    (order && order.phone) ||
    customerObj.phone ||
    customerObj.default_address?.phone ||
    order?.billing_address?.phone ||
    order?.shipping_address?.phone ||
    null;

  const name =
    [customerObj.first_name, customerObj.last_name].filter(Boolean).join(" ") ||
    order?.billing_address?.name ||
    order?.shipping_address?.name ||
    null;

  const email = customerObj.email || order?.email || order?.contact_email || null;

  // Only create a purchase when Shopify says the order is actually paid.
  // (orders/create fires for unpaid / cash-on-delivery orders too.)
  const isPaid =
    order && ["paid", "partially_paid"].includes(order.financial_status);

  return {
    eventId:
      headers["x-shopify-webhook-id"] ||
      (body?.id ? `${topic}:${body.id}:${body.updated_at || ""}` : null),
    eventType: EVENT_TYPE_MAP[topic] || topic || null,
    customer: {
      phone: normalizePhone(rawPhone),
      email,
      name,
    },
    order: isPaid
      ? {
          orderId: order.name || String(order.id), // "#1001" is what the shop owner sees
          amount: Number(order.total_price) || 0,
          currency: (order.currency || "USD").toUpperCase(),
          purchaseDate: order.processed_at || order.created_at
            ? new Date(order.processed_at || order.created_at)
            : new Date(),
        }
      : null,
  };
}

module.exports = { verifySignature, normalize };