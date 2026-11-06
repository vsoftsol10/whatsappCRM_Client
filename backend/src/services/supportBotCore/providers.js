// ============================================
// SUPPORT CHATBOT - PROVIDER CATALOG
// ============================================
// Shared by the SuperAdmin backend and the client CRM backend (keep both
// copies identical). Only fixed, well-known endpoints are allowed here on
// purpose: the SuperAdmin cannot point the chatbot at an arbitrary URL.

const PROVIDERS = {
  GROQ: {
    id: "GROQ",
    name: "Groq",
    type: "openai",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "openai/gpt-oss-20b",
    models: ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.8-27b"],
    keyUrl: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_...",
  },
  GEMINI: {
    id: "GEMINI",
    name: "Google Gemini",
    type: "openai",
    endpoint:
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    defaultModel: "gemini-2.5-flash",
    models: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"],
    keyUrl: "https://aistudio.google.com/apikey",
    keyPlaceholder: "AIza...",
  },
  OPENAI: {
    id: "OPENAI",
    name: "OpenAI",
    type: "openai",
    endpoint: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
    keyUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-...",
  },
  ANTHROPIC: {
    id: "ANTHROPIC",
    name: "Anthropic Claude",
    type: "anthropic",
    endpoint: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-haiku-4-5-20251001",
    models: ["claude-haiku-4-5-20251001", "claude-sonnet-5-5", "claude-opus-5-5"],
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyPlaceholder: "sk-ant-...",
  },
  GROK: {
    id: "GROK",
    name: "xAI Grok",
    type: "openai",
    endpoint: "https://api.x.ai/v1/chat/completions",
    defaultModel: "grok-3-mini",
    models: ["grok-4", "grok-3", "grok-3-mini"],
    keyUrl: "https://console.x.ai",
    keyPlaceholder: "xai-...",
  },
  DEEPSEEK: {
    id: "DEEPSEEK",
    name: "DeepSeek",
    type: "openai",
    endpoint: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyPlaceholder: "sk-...",
  },
  MISTRAL: {
    id: "MISTRAL",
    name: "Mistral",
    type: "openai",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "mistral-small-latest",
    models: ["mistral-small-latest", "mistral-large-latest"],
    keyUrl: "https://console.mistral.ai/api-keys",
    keyPlaceholder: "",
  },
};

const getProvider = (id) => PROVIDERS[String(id || "").toUpperCase()] || null;

// Safe to send to the browser (no secrets in here).
const getProviderCatalog = () =>
  Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    name: p.name,
    defaultModel: p.defaultModel,
    models: p.models,
    keyUrl: p.keyUrl,
    keyPlaceholder: p.keyPlaceholder,
  }));

module.exports = { PROVIDERS, getProvider, getProviderCatalog };