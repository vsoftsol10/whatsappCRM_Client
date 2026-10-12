const prisma = require("../config/prisma");

// ============================================
// CAN THIS COMPANY SEND WHATSAPP MESSAGES?
// ============================================
// Same rule as middleware/allowWriteAccess.js, but returns true/false
// so it can be used outside a request (e.g. the AI auto-reply that
// runs from the Meta webhook, where there is no logged-in user).
//
// Allowed:  status ACTIVE (or TRIAL) AND expiryDate not in the past.
// Blocked:  INACTIVE, EXPIRED, expired date, or company not found.

const canCompanySendMessages = async (companyId) => {
  if (!companyId) return false;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { status: true, expiryDate: true },
  });

  if (!company) return false;

  if (company.status !== "ACTIVE" && company.status !== "TRIAL") {
    return false;
  }

  if (company.expiryDate && company.expiryDate < new Date()) {
    return false;
  }

  return true;
};

module.exports = {
  canCompanySendMessages,
};