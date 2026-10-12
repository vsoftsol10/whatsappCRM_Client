const prisma = require("../config/prisma");

// ============================================
// MATCH A WEBHOOK PHONE NUMBER TO A SAVED ACCOUNT
// ============================================
// Meta's account_update webhook sends "phone_number" in one format
// (e.g. "919876543210") while we save display_phone_number from the
// Graph API in another (e.g. "+91 98765 43210"). A plain string
// comparison misses these, so a phone-side disconnect never reached
// the CRM. Here we compare digits only.

const digitsOnly = (value) => String(value ?? "").replace(/\D/g, "");

const isSamePhone = (a, b) => {
  const x = digitsOnly(a);
  const y = digitsOnly(b);

  if (!x || !y) return false;
  if (x === y) return true;

  // Tolerate a missing country code: compare the last 10 digits.
  return x.length >= 10 && y.length >= 10 && x.slice(-10) === y.slice(-10);
};

const findAccountByDisplayPhone = async (phone) => {
  if (!phone) return null;

  // 1. Fast path: exact string match (works when formats already agree).
  const exact = await prisma.whatsAppAccount.findFirst({
    where: { displayPhoneNumber: phone },
  });
  if (exact) return exact;

  // 2. Fallback: compare digits only.
  const candidates = await prisma.whatsAppAccount.findMany({
    where: { displayPhoneNumber: { not: null } },
    select: { id: true, displayPhoneNumber: true },
  });

  const match = candidates.find((c) =>
    isSamePhone(c.displayPhoneNumber, phone)
  );

  if (!match) return null;

  return prisma.whatsAppAccount.findUnique({ where: { id: match.id } });
};

module.exports = {
  findAccountByDisplayPhone,
};