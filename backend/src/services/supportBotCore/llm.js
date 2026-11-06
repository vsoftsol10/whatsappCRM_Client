// ============================================
// SUPPORT CHATBOT - LLM CALL
// ============================================
// One function that talks to the chosen provider and, unlike the
// auto-reply code, also returns TOKEN USAGE so cost can be monitored.
// Uses Node's built-in fetch (Node 18+), so no extra package is needed.

const { getProvider } = require("./providers");

const TIMEOUT_MS = 30000;

class BotError extends Error {
  constructor(message, status = 500, code = "BOT_ERROR") {
    super(message);
    this.name = "BotError";
    this.status = status;
    this.code = code;
  }
}

const stripThinking = (text) =>
  String(text || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .trim();

const estimateTokens = (text) => Math.ceil(String(text || "").length / 4);

// messages: [{ role: "user" | "assistant", content: string }]
// returns:  { text, promptTokens, completionTokens }
const callLLM = async ({
  providerId,
  model,
  apiKey,
  system,
  messages,
  temperature = 0.2,
  maxTokens = 700,
}) => {
  const provider = getProvider(providerId);

  if (!provider) throw new BotError("Unknown AI provider", 400, "BAD_PROVIDER");
  if (!apiKey) throw new BotError("No API key saved", 400, "NO_KEY");
  if (!model) throw new BotError("Model name is required", 400, "NO_MODEL");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    let response;

    if (provider.type === "anthropic") {
      response = await fetch(provider.endpoint, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system,
          messages,
        }),
      });
    } else {
      const body = {
        model,
        temperature,
        messages: [{ role: "system", content: system }, ...messages],
      };

      // OpenAI's newer models use a different name for the same limit.
      if (provider.id === "OPENAI") body.max_completion_tokens = maxTokens;
      else body.max_tokens = maxTokens;

      response = await fetch(provider.endpoint, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const detail =
        data?.error?.message || data?.message || `HTTP ${response.status}`;
      throw new BotError(String(detail).slice(0, 300), 502, "PROVIDER_ERROR");
    }

    let text;
    let promptTokens;
    let completionTokens;

    if (provider.type === "anthropic") {
      text = (data?.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      promptTokens = data?.usage?.input_tokens;
      completionTokens = data?.usage?.output_tokens;
    } else {
      const content = data?.choices?.[0]?.message?.content;
      text = Array.isArray(content)
        ? content.map((p) => p.text || "").join("\n")
        : content;
      promptTokens = data?.usage?.prompt_tokens;
      completionTokens = data?.usage?.completion_tokens;
    }

    text = stripThinking(text);

    if (!text) throw new BotError("The AI returned an empty reply", 502, "EMPTY");

    const promptText =
      system + messages.map((m) => m.content).join(" ");

    return {
      text,
      promptTokens: Number.isFinite(promptTokens)
        ? promptTokens
        : estimateTokens(promptText),
      completionTokens: Number.isFinite(completionTokens)
        ? completionTokens
        : estimateTokens(text),
    };
  } catch (error) {
    if (error instanceof BotError) throw error;

    if (error.name === "AbortError") {
      throw new BotError("The AI provider took too long to answer", 504, "TIMEOUT");
    }

    throw new BotError(
      `Could not reach the AI provider: ${error.message}`,
      502,
      "NETWORK"
    );
  } finally {
    clearTimeout(timer);
  }
};

module.exports = { callLLM, BotError };
