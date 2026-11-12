// ============================================
// WHAT IS A SHORT MESSAGE ABOUT?
// ============================================
// A customer who gets a campaign often answers with something short:
// "how much is this?", "tell me more", "is it available?". The words
// alone say nothing, the campaign message does.
//
// This finds that message, in this order:
//   1. the message the customer TAGGED ("replied to") in WhatsApp /
//      Messenger / Instagram (saved as Message.replyToMetaId)
//   2. otherwise the latest message the BUSINESS sent (sender "AGENT":
//      campaigns and human replies; the AI's own replies are "BOT" and
//      are skipped) within the last KB_CONTEXT_WINDOW_HOURS (default 72)
//
// TENANT / CHAT ISOLATION: every lookup filters on conversationId, which
// the server takes from the conversation row. A tag id that belongs to
// another chat (or another company) can never be found.

const prisma = require("../../config/prisma");

const WINDOW_HOURS =
  Number(process.env.KB_CONTEXT_WINDOW_HOURS) > 0
    ? Number(process.env.KB_CONTEXT_WINDOW_HOURS)
    : 72;

const MAX_CONTEXT_CHARS = 600;

const tidy = (text) =>
  String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CONTEXT_CHARS);

// Messages are oldest -> newest. Looks at the customer's latest burst of
// messages (up to the last message from the business) and returns the most
// recent tag in it.
const findReplyTag = (messages) => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];

    if (message.sender !== "CUSTOMER") break;
    if (message.replyToMetaId) return message.replyToMetaId;
  }

  return null;
};

// -> { text, source: "reply" | "recent" } or null
const resolveReplyContext = async ({ conversationId, replyToMetaId }) => {
  if (!conversationId) return null;

  // 1) the message the customer tagged
  if (replyToMetaId) {
    const quoted = await prisma.message.findFirst({
      where: { conversationId, metaMessageId: String(replyToMetaId) },
      select: { content: true },
    });

    const text = tidy(quoted?.content);

    if (text) return { text, source: "reply" };
  }

  // 2) the latest thing the business sent
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);

  const recent = await prisma.message.findMany({
    where: { conversationId, sender: "AGENT", createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { content: true },
  });

  for (const row of recent) {
    const text = tidy(row.content);
    if (text) return { text, source: "recent" };
  }

  return null;
};

module.exports = { WINDOW_HOURS, findReplyTag, resolveReplyContext };