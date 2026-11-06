// ============================================
// SUPPORT CHATBOT - CONFIG + USAGE HELPERS
// ============================================

const prisma = require("../../config/prisma");
const { decryptSecret } = require("../../utils/secretCrypto");

// The chatbot settings live in ONE row (id = 1).
const getOrCreateConfig = () =>
  prisma.chatbotConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

const getApiKey = (config) => decryptSecret(config?.apiKeyEnc);

// Usage periods are calculated in UTC.
const monthStartUtc = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

const dayStartUtc = () => {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
};

const calcCost = (config, promptTokens, completionTokens) =>
  ((promptTokens || 0) * (config?.inputPricePerM || 0) +
    (completionTokens || 0) * (config?.outputPricePerM || 0)) /
  1_000_000;

module.exports = {
  getOrCreateConfig,
  getApiKey,
  monthStartUtc,
  dayStartUtc,
  calcCost,
};
