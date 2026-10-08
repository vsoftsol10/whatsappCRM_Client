

// const genericAdapter = require("./genericAdapter");
// const stripeAdapter = require("./stripeAdapter");
// const razorpayAdapter = require("./razorpayAdapter");
// const squareAdapter = require("./squareAdapter");

// // ------------------------------------------------------
// // REGISTRY
// // Keys MUST be uppercase - integration.provider is always
// // normalized to uppercase before it's saved (see
// // integrationController.js), so lookups here are safe.
// // ------------------------------------------------------

// const ADAPTERS = {
//   STRIPE: stripeAdapter,
//   RAZORPAY: razorpayAdapter,
//   SQUARE: squareAdapter,
//   GENERIC: genericAdapter,
// };

// // ------------------------------------------------------
// // SUPPORTED_PROVIDERS
// // Single source of truth, reused by:
// //   - integrationController.js  (validates provider on create)
// //   - GET /api/integrations/providers (frontend dropdown)
// // ------------------------------------------------------

// const SUPPORTED_PROVIDERS = Object.keys(ADAPTERS);

// // ------------------------------------------------------
// // getAdapter
// // Falls back to the generic adapter for CUSTOM integrations
// // or any provider name we don't have a dedicated adapter for
// // yet, so nothing breaks - it just won't get provider-specific
// // event-name mapping until an adapter is added for it.
// // ------------------------------------------------------

// function getAdapter(providerName) {
//   const key = (providerName || "").toUpperCase();
//   return ADAPTERS[key] || genericAdapter;
// }

// module.exports = {
//   getAdapter,
//   SUPPORTED_PROVIDERS,
// };


const genericAdapter = require("./genericAdapter");
const stripeAdapter = require("./stripeAdapter");
const razorpayAdapter = require("./razorpayAdapter");
const squareAdapter = require("./squareAdapter");
const shopifyAdapter = require("./shopifyAdapter");
const woocommerceAdapter = require("./woocommerceAdapter");
const websiteAdapter = require("./websiteAdapter");

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
  SHOPIFY: shopifyAdapter,
  WOOCOMMERCE: woocommerceAdapter,
  WEBSITE: websiteAdapter,
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