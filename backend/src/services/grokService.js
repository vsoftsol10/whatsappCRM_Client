const axios = require("axios");
const prisma = require("../config/prisma");

// xAI Grok uses an OpenAI-compatible chat completions endpoint.
const GROK_API_URL = "https://api.x.ai/v1/chat/completions";

// GET GLOBAL AI SETTINGS (creates the singleton row on first use)
const getAiSettings = async () => {
  let settings = await prisma.aiSettings.findFirst();

  if (!settings) {
    settings = await prisma.aiSettings.create({ data: {} });
  }

  return settings;
};

// BUILD CHAT HISTORY FOR GROK
// Grok/OpenAI format expects alternating user/assistant turns.
// CUSTOMER -> user, AGENT/BOT -> assistant.
const buildHistoryMessages = (messages) => {
  return messages.map((msg) => ({
    role: msg.sender === "CUSTOMER" ? "user" : "assistant",
    content: msg.content,
  }));
};

// GET AUTO-REPLY FROM GROK
// Returns { success, reply } or { success: false, error }
const getAutoReply = async (conversationId) => {
  try {
    const settings = await getAiSettings();

    if (!settings.isEnabled) {
      return { success: false, error: "AI auto-reply is disabled globally" };
    }

    if (!settings.apiKey) {
      return { success: false, error: "Grok API key not configured" };
    }

    const recentMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: settings.historyLimit,
    });

    // findMany with desc + take gives newest-first, flip back to
    // chronological order for the conversation history.
    const history = buildHistoryMessages(recentMessages.reverse());

    const response = await axios.post(
      GROK_API_URL,
      {
        model: settings.model,
        messages: [
          { role: "system", content: settings.systemPrompt },
          ...history,
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 20000,
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;

    if (!reply || !reply.trim()) {
      return { success: false, error: "Empty response from Grok" };
    }

    return { success: true, reply: reply.trim() };
  } catch (error) {
    console.error("GROK AUTO-REPLY ERROR");

    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

module.exports = {
  getAiSettings,
  getAutoReply,
};