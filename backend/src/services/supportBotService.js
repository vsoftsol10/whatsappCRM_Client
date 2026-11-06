// ============================================
// AI SUPPORT CHATBOT (client dashboard)
// ============================================
// Answers "how do I use the CRM?" questions from the documentation the
// Super Admin wrote. Settings, key and limits come from the shared database.
// This is NOT the customer auto-reply feature (see aiService.js).

const prisma = require("../config/prisma");
const { callLLM } = require("./supportBotCore/llm");
const { searchKnowledge, listTopics } = require("./supportBotCore/retrieval");
const { buildSystemPrompt, parseAnswer } = require("./supportBotCore/prompt");
const {
  getOrCreateConfig,
  getApiKey,
  monthStartUtc,
  dayStartUtc,
  calcCost,
} = require("./supportBotCore/config");

const MAX_MESSAGE_LENGTH = 1000;
const RESUME_WITHIN_MS = 7 * 24 * 60 * 60 * 1000; // reopen last chat if < 7 days old

class SupportBotError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "SupportBotError";
    this.status = status;
    this.code = code;
  }
}

const sumTokens = (agg) =>
  (agg?._sum?.promptTokens || 0) + (agg?._sum?.completionTokens || 0);

// ------------------------------------------------
// Is the chatbot available for this company right now?
// ------------------------------------------------
const getState = async (companyId) => {
  const config = await getOrCreateConfig();

  if (!config.isEnabled) return { config, enabled: false, reason: "DISABLED" };

  const tenant = await prisma.chatbotTenantSetting.findUnique({
    where: { companyId },
  });

  if (tenant && !tenant.isEnabled) {
    return { config, enabled: false, reason: "DISABLED" };
  }

  if (!getApiKey(config)) {
    return { config, enabled: false, reason: "NOT_CONFIGURED" };
  }

  const monthLimit = tenant?.monthlyTokenLimit ?? config.defaultMonthlyTokenLimit;
  const dailyLimit = tenant?.dailyUserMessageLimit ?? config.defaultDailyUserMessages;
  const since = monthStartUtc();

  const usageWhere = { role: "assistant", createdAt: { gte: since } };
  const sum = { promptTokens: true, completionTokens: true };

  const [companyAgg, globalAgg] = await Promise.all([
    prisma.chatbotMessage.aggregate({
      where: { ...usageWhere, companyId },
      _sum: sum,
    }),
    config.globalMonthlyTokenLimit > 0
      ? prisma.chatbotMessage.aggregate({ where: usageWhere, _sum: sum })
      : Promise.resolve(null),
  ]);

  const used = sumTokens(companyAgg);
  let limited = false;

  if (monthLimit > 0 && used >= monthLimit) limited = true;

  if (globalAgg && sumTokens(globalAgg) >= config.globalMonthlyTokenLimit) {
    limited = true;
  }

  return { config, enabled: true, limited, used, monthLimit, dailyLimit };
};

// ------------------------------------------------
// What the widget needs to decide how to look
// ------------------------------------------------
const getPublicStatus = async (companyId) => {
  const state = await getState(companyId);

  if (!state.enabled) return { enabled: false };

  const { config } = state;

  return {
    enabled: true,
    limited: state.limited,
    botName: config.botName,
    welcomeMessage:
      config.welcomeMessage ||
      "Hi! I can help you use the CRM. Ask me anything about its features.",
    suggestedQuestions: config.suggestedQuestions || [],
    maxMessageLength: MAX_MESSAGE_LENGTH,
  };
};

// ------------------------------------------------
// Ask a question
// ------------------------------------------------
const ask = async ({ user, message, conversationId, page }) => {
  const companyId = Number(user.companyId);
  const userId = String(user.userId);

  const text = String(message || "").trim();

  if (!text) throw new SupportBotError(400, "EMPTY", "Please type your question.");
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new SupportBotError(
      400,
      "TOO_LONG",
      `Please keep your question under ${MAX_MESSAGE_LENGTH} characters.`
    );
  }

  const state = await getState(companyId);

  if (!state.enabled) {
    throw new SupportBotError(403, "DISABLED", "The assistant is not available.");
  }

  if (state.limited) {
    throw new SupportBotError(
      429,
      "LIMIT_REACHED",
      "The assistant has reached its monthly limit. Please raise a support ticket and our team will help you."
    );
  }

  if (state.dailyLimit > 0) {
    const today = await prisma.chatbotMessage.count({
      where: { userId, role: "user", createdAt: { gte: dayStartUtc() } },
    });

    if (today >= state.dailyLimit) {
      throw new SupportBotError(
        429,
        "DAILY_LIMIT",
        "You have reached today's question limit. Please try again tomorrow or raise a support ticket."
      );
    }
  }

  const { config } = state;

  // ---- existing conversation + short memory ----
  let conversation = null;
  let history = [];

  if (conversationId) {
    conversation = await prisma.chatbotConversation.findFirst({
      where: { id: String(conversationId), companyId, userId },
    });

    if (!conversation) {
      throw new SupportBotError(404, "NO_CONVERSATION", "Conversation not found.");
    }

    if (config.historyLimit > 0) {
      const rows = await prisma.chatbotMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { id: "desc" },
        take: config.historyLimit,
        select: { role: true, content: true },
      });

      history = rows.reverse();

      // providers need the first message to come from the user
      while (history.length && history[0].role !== "user") history.shift();
    }
  }

  // ---- find the relevant documentation ----
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const searchText =
    text.length < 30 && lastUser ? `${lastUser.content} ${text}` : text;

  const [chunks, topics] = await Promise.all([
    searchKnowledge(searchText, config.topK),
    listTopics(),
  ]);

  // ---- ask the AI ----
  let result;

  try {
    result = await callLLM({
      providerId: config.provider,
      model: config.model,
      apiKey: getApiKey(config),
      system: buildSystemPrompt({
        config,
        chunks,
        topics,
        page,
        role: user.role,
      }),
      messages: [...history, { role: "user", content: text }],
      temperature: config.temperature,
      maxTokens: config.maxOutputTokens,
    });
  } catch (error) {
    // Details go to the server log only; the user gets a friendly message.
    console.error("Support chatbot AI call failed:", error.message);

    throw new SupportBotError(
      502,
      "AI_UNAVAILABLE",
      "The assistant is temporarily unavailable. Please try again in a moment or raise a support ticket."
    );
  }

  const { text: answerText, answered } = parseAnswer(result.text);

  const sources = answered
    ? [...new Map(chunks.map((c) => [c.docId, { id: c.docId, title: c.title }])).values()]
    : [];

  const cost = calcCost(config, result.promptTokens, result.completionTokens);

  // ---- save the exchange ----
  const saved = await prisma.$transaction(async (tx) => {
    let convo = conversation;

    if (!convo) {
      convo = await tx.chatbotConversation.create({
        data: { companyId, userId, title: text.slice(0, 80) },
      });
    } else {
      await tx.chatbotConversation.update({
        where: { id: convo.id },
        data: { updatedAt: new Date() },
      });
    }

    await tx.chatbotMessage.create({
      data: {
        conversationId: convo.id,
        companyId,
        userId,
        role: "user",
        content: text,
      },
    });

    const assistant = await tx.chatbotMessage.create({
      data: {
        conversationId: convo.id,
        companyId,
        userId,
        role: "assistant",
        content: answerText,
        question: text,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        cost,
        model: config.model,
        sources,
        answered,
      },
    });

    return { convo, assistant };
  });

  return {
    conversationId: saved.convo.id,
    message: {
      id: saved.assistant.id,
      role: "assistant",
      content: answerText,
      sources,
      answered,
      feedback: null,
      createdAt: saved.assistant.createdAt,
    },
    suggestTicket: !answered,
  };
};

// ------------------------------------------------
// Re-open the user's most recent chat
// ------------------------------------------------
const getLatestConversation = async (user) => {
  const companyId = Number(user.companyId);
  const userId = String(user.userId);

  const convo = await prisma.chatbotConversation.findFirst({
    where: { companyId, userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!convo || Date.now() - convo.updatedAt.getTime() > RESUME_WITHIN_MS) {
    return null;
  }

  const rows = await prisma.chatbotMessage.findMany({
    where: { conversationId: convo.id },
    orderBy: { id: "desc" },
    take: 60,
    select: {
      id: true,
      role: true,
      content: true,
      sources: true,
      answered: true,
      feedback: true,
      createdAt: true,
    },
  });

  return { conversationId: convo.id, messages: rows.reverse() };
};

// ------------------------------------------------
// Thumbs up / down on an answer
// ------------------------------------------------
const saveFeedback = async ({ user, messageId, value }) => {
  const result = await prisma.chatbotMessage.updateMany({
    where: {
      id: Number(messageId),
      companyId: Number(user.companyId),
      userId: String(user.userId),
      role: "assistant",
    },
    data: { feedback: value },
  });

  if (result.count === 0) {
    throw new SupportBotError(404, "NO_MESSAGE", "Message not found.");
  }
};

module.exports = {
  SupportBotError,
  getPublicStatus,
  ask,
  getLatestConversation,
  saveFeedback,
};