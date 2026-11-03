// backend/src/utils/botDefault.js   (NEW FILE)
//
// Decides the STARTING value of a conversation's "Bot" switch
// (Conversation.botEnabled) when a brand-new conversation is created.
//
//   Settings > AI Auto-Reply  "Auto-reply enabled"  = ON   -> new chats start with Bot ON
//   Settings > AI Auto-Reply  "Auto-reply enabled"  = OFF  -> new chats start with Bot OFF
//
// This only decides the DEFAULT for NEW conversations. Everything else is
// untouched: the per-chat toggle, the automatic switch-off when an employee
// replies, and the "AI doesn't know -> notify employee + bot OFF" hand-off.
//
// It never creates the AiSettings row (read-only) and never throws: if
// anything goes wrong it returns false (bot OFF), the safe choice.

const prisma = require("../config/prisma");

const getDefaultBotEnabled = async (companyId) => {
  if (!companyId) return false;

  try {
    const settings = await prisma.aiSettings.findUnique({
      where: { companyId },
      select: { isEnabled: true },
    });

    return settings?.isEnabled === true;
  } catch (error) {
    console.error("getDefaultBotEnabled error:", error.message);
    return false;
  }
};

module.exports = { getDefaultBotEnabled };