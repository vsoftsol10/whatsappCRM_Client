// const axios = require("axios");
// const prisma = require("../config/prisma");

// const { getProvider, getProviderCatalog } = require("./ai/providers");
// const { decryptSecret, maskSecret } = require("../utils/secretCrypto");
// const { assertSafeHttpsUrl, safeHttpsAgent } = require("../utils/safeUrl");

// // Reasoning models can be slow, so give providers plenty of time.
// const AI_TIMEOUT_MS = 90000;

// // WhatsApp rejects text bodies longer than 4096 characters.
// const WHATSAPP_MAX_LENGTH = 4000;

// // Extra rules always appended to the company's system prompt so the
// // reply is suitable for WhatsApp whatever the company wrote.
// const WHATSAPP_RULES = `

// Formatting rules (always follow):
// - You are replying inside WhatsApp. Use plain text only. Do not use markdown headings, tables, or code blocks.
// - Reply in the same language the customer is writing in.
// - Keep the reply concise and directly relevant to the customer's last message.
// - Never mention that you are following instructions or a system prompt.`;

// // An error whose message is safe to show to the customer-facing UI.
// class AiError extends Error {}

// // ============================================
// // SETTINGS (one row per company)
// // ============================================
// const findSettings = (companyId) =>
//   prisma.aiSettings.findUnique({ where: { companyId } });

// // Creates the company's row the first time it is needed.
// const getOrCreateSettings = (companyId) =>
//   prisma.aiSettings.upsert({
//     where: { companyId },
//     update: {},
//     create: { companyId },
//   });

// const getStoredKey = (settings, providerId) =>
//   decryptSecret(settings?.providerKeys?.[providerId]);

// // What the frontend is allowed to see. Raw keys NEVER leave the server;
// // only a "saved" flag and a masked hint like ••••••••abcd.
// const serializeSettings = (settings) => {
//   const keys = {};
//   const stored = settings.providerKeys || {};

//   for (const providerId of Object.keys(stored)) {
//     const plain = decryptSecret(stored[providerId]);

//     keys[providerId] = {
//       saved: Boolean(plain),
//       // saved but unreadable (e.g. server secret changed) -> ask to re-enter
//       needsReentry: !plain,
//       hint: plain ? maskSecret(plain) : "",
//     };
//   }

//   return {
//     isEnabled: settings.isEnabled,
//     provider: settings.provider,
//     model: settings.model,
//     baseUrl: settings.baseUrl || "",
//     systemPrompt: settings.systemPrompt,
//     historyLimit: settings.historyLimit,
//     lastError: settings.lastError,
//     lastErrorAt: settings.lastErrorAt,
//     updatedAt: settings.updatedAt,
//     keys,
//   };
// };

// // ============================================
// // CHAT HISTORY
// // ============================================
// // CUSTOMER -> user, AGENT/BOT -> assistant. Consecutive messages from
// // the same side are merged so the payload is a clean alternating
// // conversation (required by Claude, preferred by everyone else).
// const buildHistoryMessages = (messages) => {
//   const history = [];

//   for (const msg of messages) {
//     const content = (msg.content || "").trim();
//     if (!content) continue;

//     const role = msg.sender === "CUSTOMER" ? "user" : "assistant";
//     const last = history[history.length - 1];

//     if (last && last.role === role) {
//       last.content += `\n${content}`;
//     } else {
//       history.push({ role, content });
//     }
//   }

//   // The model must be answering a customer, so drop any leading
//   // assistant turns (history was cut in the middle of a conversation).
//   while (history.length && history[0].role !== "user") {
//     history.shift();
//   }

//   return history;
// };

// // ============================================
// // ERROR HANDLING
// // ============================================
// const extractProviderDetail = (error) => {
//   let data = error.response?.data;

//   // Gemini sometimes answers with an array: [{ error: {...} }]
//   if (Array.isArray(data)) data = data[0];

//   if (!data) return "";
//   if (typeof data === "string") return data.slice(0, 300);

//   const detail =
//     data.error?.message ||
//     (typeof data.error === "string" ? data.error : "") ||
//     data.message ||
//     "";

//   return String(detail).slice(0, 300);
// };

// const friendlyError = (error, apiKey) => {
//   if (error instanceof AiError) return error.message;

//   let message;
//   const status = error.response?.status;
//   const detail = extractProviderDetail(error);

//   if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
//     message = "The AI provider took too long to respond. Please try again.";
//   } else if (!error.response && (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED" || error.code === "EAI_AGAIN")) {
//     message = "Could not reach the AI provider. Check the Base URL / network.";
//   } else if (status === 401 || status === 403) {
//     message = `The API key was rejected or does not have access${detail ? ` — ${detail}` : "."}`;
//   } else if (status === 404) {
//     message = `Model or endpoint not found. Check the model name${detail ? ` — ${detail}` : "."}`;
//   } else if (status === 429) {
//     message = `Rate limit or quota exceeded on the AI account${detail ? ` — ${detail}` : "."}`;
//   } else if (status === 400) {
//     message = `The provider rejected the request${detail ? ` — ${detail}` : "."}`;
//   } else if (status) {
//     message = `AI provider error (${status})${detail ? ` — ${detail}` : ""}`;
//   } else {
//     message = error.message || "Unknown AI error";
//   }

//   // Never echo the secret back, even if a provider includes it.
//   if (apiKey) message = message.split(apiKey).join("***");

//   return message;
// };

// // ============================================
// // PROVIDER CALLS
// // ============================================
// const resolveTarget = async (provider, baseUrl) => {
//   if (!provider.requiresBaseUrl) {
//     return { url: provider.endpoint, httpsAgent: undefined };
//   }

//   if (!baseUrl || !baseUrl.trim()) {
//     throw new AiError("Base URL is required for a custom provider");
//   }

//   let url = (await assertSafeHttpsUrl(baseUrl)).replace(/\/+$/, "");

//   if (!url.endsWith("/chat/completions")) {
//     url = `${url}/chat/completions`;
//   }

//   return { url, httpsAgent: safeHttpsAgent };
// };

// const cleanReplyText = (text) =>
//   String(text || "")
//     // some open models print their reasoning inside <think> tags
//     .replace(/<think>[\s\S]*?<\/think>/gi, "")
//     .trim()
//     .slice(0, WHATSAPP_MAX_LENGTH);

// // Sends the conversation to the chosen provider and returns reply text.
// // Throws on failure (callers turn it into a friendly message).
// const callProvider = async ({
//   providerId,
//   model,
//   apiKey,
//   baseUrl,
//   systemPrompt,
//   messages,
// }) => {
//   const provider = getProvider(providerId);

//   if (!provider) throw new AiError("Unknown AI provider");
//   if (!apiKey) throw new AiError(`No API key saved for ${provider.name}`);
//   if (!model) throw new AiError("Model name is required");

//   const { url, httpsAgent } = await resolveTarget(provider, baseUrl);
//   const system = `${systemPrompt}${WHATSAPP_RULES}`;

//   let text;

//   if (provider.type === "anthropic") {
//     const response = await axios.post(
//       url,
//       { model, max_tokens: 1024, system, messages },
//       {
//         headers: {
//           "x-api-key": apiKey,
//           "anthropic-version": "2023-06-01",
//           "Content-Type": "application/json",
//         },
//         timeout: AI_TIMEOUT_MS,
//         maxRedirects: 0,
//       }
//     );

//     text = (response.data?.content || [])
//       .filter((block) => block.type === "text")
//       .map((block) => block.text)
//       .join("\n");
//   } else {
//     const response = await axios.post(
//       url,
//       { model, messages: [{ role: "system", content: system }, ...messages] },
//       {
//         headers: {
//           Authorization: `Bearer ${apiKey}`,
//           "Content-Type": "application/json",
//         },
//         timeout: AI_TIMEOUT_MS,
//         maxRedirects: 0,
//         httpsAgent,
//       }
//     );

//     const content = response.data?.choices?.[0]?.message?.content;

//     text = Array.isArray(content)
//       ? content.map((part) => part.text || "").join("\n")
//       : content;
//   }

//   const reply = cleanReplyText(text);

//   if (!reply) throw new AiError("The AI returned an empty reply");

//   return reply;
// };

// // ============================================
// // FAILURE TRACKING (shown on the settings page)
// // ============================================
// const recordFailure = (companyId, message) =>
//   prisma.aiSettings
//     .update({
//       where: { companyId },
//       data: { lastError: String(message).slice(0, 500), lastErrorAt: new Date() },
//     })
//     .catch(() => {});

// const clearFailure = (companyId) =>
//   prisma.aiSettings
//     .update({
//       where: { companyId },
//       data: { lastError: null, lastErrorAt: null },
//     })
//     .catch(() => {});

// // ============================================
// // AUTO-REPLY FOR A CONVERSATION
// // ============================================
// // Returns { success: true, reply } or { success: false, error }.
// // Uses the settings + key of the company that owns the conversation.
// const getAutoReply = async (conversationId) => {
//   let companyId = null;
//   let apiKey = null;

//   try {
//     const conversation = await prisma.conversation.findUnique({
//       where: { id: conversationId },
//       select: { companyId: true },
//     });

//     if (!conversation) {
//       return { success: false, error: "Conversation not found" };
//     }

//     companyId = conversation.companyId;

//     const settings = await findSettings(companyId);

//     if (!settings || !settings.isEnabled) {
//       return { success: false, error: "AI auto-reply is disabled for this company" };
//     }

//     apiKey = getStoredKey(settings, settings.provider);

//     if (!apiKey) {
//       const message = `No API key saved for ${settings.provider}`;
//       await recordFailure(companyId, message);
//       return { success: false, error: message };
//     }

//     const recentMessages = await prisma.message.findMany({
//       where: { conversationId },
//       orderBy: { createdAt: "desc" },
//       take: Math.max(1, settings.historyLimit || 10),
//     });

//     const history = buildHistoryMessages(recentMessages.reverse());

//     if (history.length === 0) {
//       return { success: false, error: "No customer message to reply to" };
//     }

//     // An agent/bot already answered the latest customer message.
//     if (history[history.length - 1].role !== "user") {
//       return { success: false, error: "Latest message is not from the customer" };
//     }

//     const reply = await callProvider({
//       providerId: settings.provider,
//       model: settings.model,
//       apiKey,
//       baseUrl: settings.baseUrl,
//       systemPrompt: settings.systemPrompt,
//       messages: history,
//     });

//     if (settings.lastError) await clearFailure(companyId);

//     return { success: true, reply };
//   } catch (error) {
//     const message = friendlyError(error, apiKey);

//     console.error("AI AUTO-REPLY ERROR:", message);

//     if (companyId) await recordFailure(companyId, message);

//     return { success: false, error: message };
//   }
// };

// // ============================================
// // TEST CONNECTION (from the settings page)
// // ============================================
// // Works with unsaved form values: `overrides` may carry provider,
// // model, baseUrl, apiKey and systemPrompt exactly as typed. A blank
// // apiKey falls back to the key already saved for that provider.
// const testAutoReply = async (companyId, overrides = {}) => {
//   let apiKey = null;

//   try {
//     const settings = await getOrCreateSettings(companyId);

//     const providerId = String(overrides.provider || settings.provider).toUpperCase();
//     const provider = getProvider(providerId);

//     if (!provider) return { success: false, error: "Unknown AI provider" };

//     const model = (overrides.model || "").trim() || settings.model;
//     const baseUrl = overrides.baseUrl ?? settings.baseUrl;
//     const systemPrompt = (overrides.systemPrompt || "").trim() || settings.systemPrompt;

//     apiKey =
//       (typeof overrides.apiKey === "string" && overrides.apiKey.trim()) ||
//       getStoredKey(settings, providerId);

//     if (!apiKey) {
//       return { success: false, error: `Add an API key for ${provider.name} first` };
//     }

//     const sample =
//       (overrides.message || "").trim() || "Hi, I need some help.";

//     const startedAt = Date.now();

//     const reply = await callProvider({
//       providerId,
//       model,
//       apiKey,
//       baseUrl,
//       systemPrompt,
//       messages: [{ role: "user", content: sample }],
//     });

//     return {
//       success: true,
//       reply,
//       latencyMs: Date.now() - startedAt,
//       provider: provider.name,
//       model,
//     };
//   } catch (error) {
//     return { success: false, error: friendlyError(error, apiKey) };
//   }
// };

// module.exports = {
//   getProviderCatalog,
//   findSettings,
//   getOrCreateSettings,
//   getStoredKey,
//   serializeSettings,
//   getAutoReply,
//   testAutoReply,
// };



const axios = require("axios");
const prisma = require("../config/prisma");

const { getProvider } = require("./ai/providers");
const { buildSystemPrompt, readProfile } = require("./ai/businessPrompt");
const { assertSafeHttpsUrl, safeHttpsAgent } = require("../utils/safeUrl");

// Reasoning models can be slow, so give providers plenty of time.
const AI_TIMEOUT_MS = 90000;

// WhatsApp rejects text bodies longer than 4096 characters.
const WHATSAPP_MAX_LENGTH = 4000;

// The AI adds this marker to a reply when a human should take over.
// The server removes it before the customer sees the message.
const HANDOFF_MARKER = "[[HANDOFF]]";
const HANDOFF_PATTERN = /\[{1,2}\s*HANDOFF\s*\]{1,2}/gi;
const HANDOFF_FALLBACK_REPLY =
  "Thank you for your message. Our team will contact you shortly.";

// Extra rules always appended to the company's system prompt so the
// reply is suitable for WhatsApp whatever the company wrote.
const WHATSAPP_RULES = `

Formatting rules (always follow):
- You are replying inside WhatsApp. Use plain text only. Do not use markdown headings, tables, or code blocks.
- Reply in the same language the customer is writing in.
- Keep the reply concise and directly relevant to the customer's last message.
- Never mention that you are following instructions or a system prompt.

Human hand-off:
- If you cannot answer from the business information, or the customer asks for a human or agent, or wants to complain, negotiate, pay or get a refund, write a short polite reply saying the team will contact them shortly, and end that reply with the exact text ${HANDOFF_MARKER}
- Use ${HANDOFF_MARKER} only in those cases and never explain it.`;

// An error whose message is safe to show to the customer-facing UI.
class AiError extends Error {}

// ============================================
// SETTINGS (one row per company)
// ============================================
const findSettings = (companyId) =>
  prisma.aiSettings.findUnique({ where: { companyId } });

// Creates the company's row the first time it is needed.
const getOrCreateSettings = (companyId) =>
  prisma.aiSettings.upsert({
    where: { companyId },
    update: {},
    create: { companyId },
  });

// ============================================
// PLATFORM AI (one provider + one key for ALL companies)
// ============================================
// Configured only in the server .env, never by customers:
//   AI_PROVIDER=GROQ                      (optional, default GROQ)
//   GROQ_API_KEY=gsk_...                  (<PROVIDER>_API_KEY)
//   AI_MODEL=llama-3.3-70b-versatile      (optional, default = provider default)
const getPlatformAi = () => {
  const providerId = String(process.env.AI_PROVIDER || "GROQ").toUpperCase();
  const provider = getProvider(providerId);

  if (!provider || provider.requiresBaseUrl) {
    return { available: false, error: "AI_PROVIDER in the server .env is not valid" };
  }

  const apiKey = String(process.env[`${provider.id}_API_KEY`] || "").trim();

  if (!apiKey) {
    return { available: false, error: `${provider.id}_API_KEY is missing in the server .env` };
  }

  return {
    available: true,
    provider,
    providerId: provider.id,
    model: String(process.env.AI_MODEL || "").trim() || provider.defaultModel,
    apiKey,
  };
};

// What the frontend is allowed to see. Provider, model and key are
// platform details and are never sent to customers.
const serializeSettings = (settings) => ({
  isEnabled: settings.isEnabled,
  businessProfile: readProfile(settings.businessProfile),
  systemPrompt: settings.systemPrompt,
  historyLimit: settings.historyLimit,
  leadCaptureEnabled: Boolean(settings.leadCaptureEnabled),
  leadAssigneeId: settings.leadAssigneeId || null,
  lastError: settings.lastError,
  lastErrorAt: settings.lastErrorAt,
  updatedAt: settings.updatedAt,
  aiAvailable: getPlatformAi().available,
});

// ============================================
// SYSTEM PROMPT FOR A COMPANY
// ============================================
// Built from the company's business profile + its extra instructions.
// Overrides let the settings page test values that are not saved yet.
const composeSystemPrompt = async (companyId, settings, overrides = {}) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { companyName: true },
  });

  return buildSystemPrompt({
    companyName: company?.companyName,
    profile:
      overrides.businessProfile !== undefined
        ? overrides.businessProfile
        : settings.businessProfile,
    extraInstructions:
      overrides.systemPrompt !== undefined
        ? overrides.systemPrompt
        : settings.systemPrompt,
  });
};

// ============================================
// CHAT HISTORY
// ============================================
// CUSTOMER -> user, AGENT/BOT -> assistant. Consecutive messages from
// the same side are merged so the payload is a clean alternating
// conversation (required by Claude, preferred by everyone else).
const buildHistoryMessages = (messages) => {
  const history = [];

  for (const msg of messages) {
    const content = (msg.content || "").trim();
    if (!content) continue;

    const role = msg.sender === "CUSTOMER" ? "user" : "assistant";
    const last = history[history.length - 1];

    if (last && last.role === role) {
      last.content += `\n${content}`;
    } else {
      history.push({ role, content });
    }
  }

  // The model must be answering a customer, so drop any leading
  // assistant turns (history was cut in the middle of a conversation).
  while (history.length && history[0].role !== "user") {
    history.shift();
  }

  return history;
};

// ============================================
// ERROR HANDLING
// ============================================
const extractProviderDetail = (error) => {
  let data = error.response?.data;

  // Gemini sometimes answers with an array: [{ error: {...} }]
  if (Array.isArray(data)) data = data[0];

  if (!data) return "";
  if (typeof data === "string") return data.slice(0, 300);

  const detail =
    data.error?.message ||
    (typeof data.error === "string" ? data.error : "") ||
    data.message ||
    "";

  return String(detail).slice(0, 300);
};

const friendlyError = (error, apiKey) => {
  if (error instanceof AiError) return error.message;

  let message;
  const status = error.response?.status;
  const detail = extractProviderDetail(error);

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    message = "The AI provider took too long to respond. Please try again.";
  } else if (!error.response && (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED" || error.code === "EAI_AGAIN")) {
    message = "Could not reach the AI service. Please try again shortly.";
  } else if (status === 401 || status === 403) {
    message = "The AI service is temporarily unavailable.";
  } else if (status === 404) {
    message = "The AI service is temporarily unavailable.";
  } else if (status === 429) {
    message = "The AI service is busy right now. Please try again shortly.";
  } else if (status === 400) {
    message = `The provider rejected the request${detail ? ` — ${detail}` : "."}`;
  } else if (status) {
    message = `AI provider error (${status})${detail ? ` — ${detail}` : ""}`;
  } else {
    message = error.message || "Unknown AI error";
  }

  // Never echo the secret back, even if a provider includes it.
  if (apiKey) message = message.split(apiKey).join("***");

  // Customers only see the short message; the platform owner needs the
  // real provider detail (wrong key, quota, bad model) in the server log.
  if (status || detail) {
    let logged = `AI provider error ${status || ""} ${detail}`.trim();
    if (apiKey) logged = logged.split(apiKey).join("***");
    console.error(logged);
  }

  return message;
};

// ============================================
// HAND-OFF MARKER
// ============================================
// Returns { reply, handoff }: the reply without the marker, and whether
// the AI asked for a human to take over.
const splitHandoff = (text) => {
  const raw = String(text || "");
  const handoff = new RegExp(HANDOFF_PATTERN.source, "i").test(raw);

  if (!handoff) return { reply: raw.trim(), handoff: false };

  const reply = raw.replace(HANDOFF_PATTERN, "").trim();

  return { reply: reply || HANDOFF_FALLBACK_REPLY, handoff: true };
};

// ============================================
// PROVIDER CALLS
// ============================================
const resolveTarget = async (provider, baseUrl) => {
  if (!provider.requiresBaseUrl) {
    return { url: provider.endpoint, httpsAgent: undefined };
  }

  if (!baseUrl || !baseUrl.trim()) {
    throw new AiError("Base URL is required for a custom provider");
  }

  let url = (await assertSafeHttpsUrl(baseUrl)).replace(/\/+$/, "");

  if (!url.endsWith("/chat/completions")) {
    url = `${url}/chat/completions`;
  }

  return { url, httpsAgent: safeHttpsAgent };
};

const cleanReplyText = (text) =>
  String(text || "")
    // some open models print their reasoning inside <think> tags
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim()
    .slice(0, WHATSAPP_MAX_LENGTH);

// Sends the conversation to the chosen provider and returns reply text.
// Throws on failure (callers turn it into a friendly message).
const callProvider = async ({
  providerId,
  model,
  apiKey,
  baseUrl,
  systemPrompt,
  messages,
  rawSystem = false,
}) => {
  const provider = getProvider(providerId);

  if (!provider) throw new AiError("Unknown AI provider");
  if (!apiKey) throw new AiError(`No API key saved for ${provider.name}`);
  if (!model) throw new AiError("Model name is required");

  const { url, httpsAgent } = await resolveTarget(provider, baseUrl);
  // rawSystem = background jobs (e.g. lead capture) that are not WhatsApp replies
  const system = rawSystem ? systemPrompt : `${systemPrompt}${WHATSAPP_RULES}`;

  let text;

  if (provider.type === "anthropic") {
    const response = await axios.post(
      url,
      { model, max_tokens: 1024, system, messages },
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        timeout: AI_TIMEOUT_MS,
        maxRedirects: 0,
      }
    );

    text = (response.data?.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");
  } else {
    const response = await axios.post(
      url,
      { model, messages: [{ role: "system", content: system }, ...messages] },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: AI_TIMEOUT_MS,
        maxRedirects: 0,
        httpsAgent,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;

    text = Array.isArray(content)
      ? content.map((part) => part.text || "").join("\n")
      : content;
  }

  const reply = cleanReplyText(text);

  if (!reply) throw new AiError("The AI returned an empty reply");

  return reply;
};

// ============================================
// FAILURE TRACKING (shown on the settings page)
// ============================================
const recordFailure = (companyId, message) =>
  prisma.aiSettings
    .update({
      where: { companyId },
      data: { lastError: String(message).slice(0, 500), lastErrorAt: new Date() },
    })
    .catch(() => {});

const clearFailure = (companyId) =>
  prisma.aiSettings
    .update({
      where: { companyId },
      data: { lastError: null, lastErrorAt: null },
    })
    .catch(() => {});

// ============================================
// AUTO-REPLY FOR A CONVERSATION
// ============================================
// Returns { success: true, reply, handoff } or { success: false, error }.
// handoff = true when the AI wants a human to take over this chat.
// Uses the company's own settings (on/off, prompt, history) but the
// platform's AI provider, model and key.
const getAutoReply = async (conversationId) => {
  let companyId = null;
  let apiKey = null;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { companyId: true },
    });

    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }

    companyId = conversation.companyId;

    const settings = await findSettings(companyId);

    if (!settings || !settings.isEnabled) {
      return { success: false, error: "AI auto-reply is disabled for this company" };
    }

    const platform = getPlatformAi();

    if (!platform.available) {
      console.error("AI auto-reply unavailable:", platform.error);
      const message = "The AI service is temporarily unavailable.";
      await recordFailure(companyId, message);
      return { success: false, error: message };
    }

    apiKey = platform.apiKey;

    const recentMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: Math.max(1, settings.historyLimit || 10),
    });

    const history = buildHistoryMessages(recentMessages.reverse());

    if (history.length === 0) {
      return { success: false, error: "No customer message to reply to" };
    }

    // An agent/bot already answered the latest customer message.
    if (history[history.length - 1].role !== "user") {
      return { success: false, error: "Latest message is not from the customer" };
    }

    const systemPrompt = await composeSystemPrompt(companyId, settings);

    const raw = await callProvider({
      providerId: platform.providerId,
      model: platform.model,
      apiKey,
      systemPrompt,
      messages: history,
    });

    const { reply, handoff } = splitHandoff(raw);

    if (settings.lastError) await clearFailure(companyId);

    return { success: true, reply, handoff };
  } catch (error) {
    const message = friendlyError(error, apiKey);

    console.error("AI AUTO-REPLY ERROR:", message);

    if (companyId) await recordFailure(companyId, message);

    return { success: false, error: message };
  }
};

// ============================================
// TEST (from the settings page)
// ============================================
// Works with the unsaved values typed on the page: `overrides` may carry
// businessProfile, systemPrompt and message. Always runs on the platform AI.
const testAutoReply = async (companyId, overrides = {}) => {
  const platform = getPlatformAi();

  try {
    const settings = await getOrCreateSettings(companyId);

    if (!platform.available) {
      console.error("AI test unavailable:", platform.error);
      return { success: false, error: "The AI service is temporarily unavailable." };
    }

    const systemPrompt = await composeSystemPrompt(companyId, settings, {
      businessProfile: overrides.businessProfile,
      systemPrompt: overrides.systemPrompt,
    });
    const sample = (overrides.message || "").trim() || "Hi, I need some help.";

    const startedAt = Date.now();

    const raw = await callProvider({
      providerId: platform.providerId,
      model: platform.model,
      apiKey: platform.apiKey,
      systemPrompt,
      messages: [{ role: "user", content: sample }],
    });

    const { reply, handoff } = splitHandoff(raw);

    return { success: true, reply, handoff, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return { success: false, error: friendlyError(error, platform.apiKey) };
  }
};

// ============================================
// ONE-OFF COMPLETION (background jobs)
// ============================================
// For jobs that are not a WhatsApp reply, e.g. lead capture. Uses the same
// platform AI, but WITHOUT the WhatsApp reply rules or the hand-off marker.
// Throws on failure; the caller decides what to do.
const completeOnce = async ({ systemPrompt, messages }) => {
  const platform = getPlatformAi();

  if (!platform.available) throw new AiError(platform.error);

  return callProvider({
    providerId: platform.providerId,
    model: platform.model,
    apiKey: platform.apiKey,
    systemPrompt,
    messages,
    rawSystem: true,
  });
};

module.exports = {
  getPlatformAi,
  findSettings,
  getOrCreateSettings,
  serializeSettings,
  getAutoReply,
  testAutoReply,
  splitHandoff,
  completeOnce,
};