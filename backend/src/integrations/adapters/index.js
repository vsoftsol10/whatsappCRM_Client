// ======================================================
// INTEGRATION ADAPTERS - REGISTRY
// ======================================================
//
// PROBLEM THIS SOLVES:
// Every billing/e-commerce provider sends webhooks in its
// own shape, with its own event names and its own signature
// scheme. Our internal processing logic (customer upsert +
// purchase creation) only understands ONE shape:
//
//   {
//     eventId: "...",
//     eventType: "...",
//     customer: { phone, name, email },
//     order: { orderId, amount, currency, purchaseDate }
//   }
//
// An "adapter" is a small module, one per provider, that:
//
//   1. verifySignature({ rawBody, headers, secret })
//        -> true / false
//        Confirms the request really came from that provider
//        (not a forged POST from anyone who has the URL).
//
//   2. normalize({ body, headers })
//        -> { eventId, eventType, customer, order }
//        Converts that provider's raw payload into our
//        common internal shape.
//
// To support a new billing system: add one file here that
// implements both functions, then register it below. Nothing
// else in the codebase needs to change.
// ======================================================

const genericAdapter = require("./genericAdapter");
const stripeAdapter = require("./stripeAdapter");
const razorpayAdapter = require("./razorpayAdapter");
const squareAdapter = require("./squareAdapter");

// ------------------------------------------------------
// REGISTRY
// Keys MUST be uppercase - integration.provider is always
// normalized to uppercase before it's saved (see
// integrationController.js), so lookups here are safe.
// ------------------------------------------------------

const ADAPTERS = {
  STRIPE: stripeAdapter,
  RAZORPAY: razorpayAdapter,
  SQUARE: squareAdapter,
  GENERIC: genericAdapter,
};

// ------------------------------------------------------
// SUPPORTED_PROVIDERS
// Single source of truth, reused by:
//   - integrationController.js  (validates provider on create)
//   - GET /api/integrations/providers (frontend dropdown)
// ------------------------------------------------------

const SUPPORTED_PROVIDERS = Object.keys(ADAPTERS);

// ------------------------------------------------------
// getAdapter
// Falls back to the generic adapter for CUSTOM integrations
// or any provider name we don't have a dedicated adapter for
// yet, so nothing breaks - it just won't get provider-specific
// event-name mapping until an adapter is added for it.
// ------------------------------------------------------

function getAdapter(providerName) {
  const key = (providerName || "").toUpperCase();
  return ADAPTERS[key] || genericAdapter;
}

module.exports = {
  getAdapter,
  SUPPORTED_PROVIDERS,
};