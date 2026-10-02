// ============================================
// AI PROVIDER REGISTRY
// ============================================
// To add a new provider, add one entry here. Providers that speak the
// OpenAI "chat completions" format (type: "openai") need nothing else.
// Providers with their own format (type: "anthropic") are handled in
// aiService.js.
//
// `models` are only suggestions shown in the UI. Customers can type
// any model name their account has access to.

const PROVIDERS = {
  GEMINI: {
    id: "GEMINI",
    name: "Google Gemini",
    description: "Fast and generous free tier",
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
    description: "GPT models",
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
    description: "Thoughtful, safe replies",
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
    description: "Grok models from xAI",
    type: "openai",
    endpoint: "https://api.x.ai/v1/chat/completions",
    defaultModel: "grok-4",
    models: ["grok-4", "grok-3", "grok-3-mini"],
    keyUrl: "https://console.x.ai",
    keyPlaceholder: "xai-...",
  },

  DEEPSEEK: {
    id: "DEEPSEEK",
    name: "DeepSeek",
    description: "Low-cost, strong reasoning",
    type: "openai",
    endpoint: "https://api.deepseek.com/chat/completions",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner"],
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyPlaceholder: "sk-...",
  },

  GROQ: {
    id: "GROQ",
    name: "Groq",
    description: "Very fast open models",
    type: "openai",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"],
    keyUrl: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_...",
  },

  MISTRAL: {
    id: "MISTRAL",
    name: "Mistral AI",
    description: "European open-weight models",
    type: "openai",
    endpoint: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "mistral-small-latest",
    models: ["mistral-small-latest", "mistral-large-latest"],
    keyUrl: "https://console.mistral.ai/api-keys",
    keyPlaceholder: "Paste your Mistral key",
  },

  CUSTOM: {
    id: "CUSTOM",
    name: "Custom (OpenAI-compatible)",
    description: "Any OpenAI-compatible API",
    type: "openai",
    endpoint: null, // supplied by the customer as baseUrl
    requiresBaseUrl: true,
    defaultModel: "",
    models: [],
    keyUrl: null,
    keyPlaceholder: "Paste your API key",
  },
};

const getProvider = (id) => PROVIDERS[String(id || "").toUpperCase()] || null;

// Safe-to-send description of every provider for the settings page.
const getProviderCatalog = () =>
  Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    defaultModel: p.defaultModel,
    models: p.models,
    keyUrl: p.keyUrl,
    keyPlaceholder: p.keyPlaceholder,
    requiresBaseUrl: Boolean(p.requiresBaseUrl),
  }));

module.exports = { PROVIDERS, getProvider, getProviderCatalog };
