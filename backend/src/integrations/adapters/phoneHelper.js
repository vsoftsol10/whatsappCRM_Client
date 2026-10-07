// ======================================================
// SHARED PHONE HELPER FOR ADAPTERS
// ======================================================
// Shopify / WooCommerce / WordPress forms send phone numbers in
// free-text formats: "+91 98765-43210", "098765 43210", "(555) 123 4567".
// The CRM matches customers by EXACT phone string, so every adapter
// must output the same format. This produces digits only, in the same
// style your WhatsApp code uses (e.g. 919876543210).
//
// ASSUMPTION: a bare 10-digit number starting with 6-9 is treated as an
// Indian mobile and gets "91" added. Change DEFAULT_COUNTRY_CODE (or set
// env DEFAULT_PHONE_COUNTRY_CODE) if most of your customers are elsewhere.
// ======================================================

const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_PHONE_COUNTRY_CODE || "91";

function normalizePhone(raw) {
  if (!raw) return null;

  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2); // 0091... -> 91...

  // 0 + 10-digit Indian mobile (trunk prefix)
  if (/^0[6-9]\d{9}$/.test(digits)) digits = digits.slice(1);

  // Bare 10-digit mobile -> add default country code
  if (/^[6-9]\d{9}$/.test(digits)) return `${DEFAULT_COUNTRY_CODE}${digits}`;

  // E.164 allows 8-15 digits; anything else is not a usable number
  if (digits.length < 8 || digits.length > 15) return null;

  return digits;
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a), "utf8");
  const bufB = Buffer.from(String(b), "utf8");
  if (bufA.length !== bufB.length) return false;
  return require("crypto").timingSafeEqual(bufA, bufB);
}

module.exports = { normalizePhone, safeEqual };