const prisma = require("../config/prisma");

const { getProvider, getProviderCatalog } = require("../services/ai/providers");
const {
  getOrCreateSettings,
  serializeSettings,
  getStoredKey,
  testAutoReply,
} = require("../services/aiService");

const { encryptSecret } = require("../utils/secretCrypto");
const { assertSafeHttpsUrl } = require("../utils/safeUrl");

const MODEL_PATTERN = /^[A-Za-z0-9._:\/\-]{1,100}$/;
const MAX_PROMPT_LENGTH = 4000;
const MAX_KEY_LENGTH = 500;

const isAdmin = (req) => req.user?.role === "ADMIN";

const forbidden = (res, action) =>
  res.status(403).json({
    success: false,
    message: `Only admins can ${action}`,
  });

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });

// Tiny in-memory limiter for the test button (10 tests / minute / company)
const testCalls = new Map();

const isTestRateLimited = (companyId) => {
  const now = Date.now();
  const recent = (testCalls.get(companyId) || []).filter(
    (time) => now - time < 60000
  );

  if (recent.length >= 10) {
    testCalls.set(companyId, recent);
    return true;
  }

  recent.push(now);
  testCalls.set(companyId, recent);
  return false;
};

// ============================================
// GET /api/ai-settings
// ============================================
const getAiSettings = async (req, res) => {
  try {
    if (!isAdmin(req)) return forbidden(res, "view AI settings");

    const settings = await getOrCreateSettings(req.user.companyId);

    return res.status(200).json({
      success: true,
      settings: serializeSettings(settings),
      providers: getProviderCatalog(),
    });
  } catch (error) {
    console.error("Get AI settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AI settings",
    });
  }
};

// ============================================
// PATCH /api/ai-settings
// ============================================
// Body (all optional):
//   isEnabled, provider, model, baseUrl, systemPrompt, historyLimit,
//   apiKey        -> saved (encrypted) for the provider in this request
//   removeKeyFor  -> provider id whose saved key should be deleted
const updateAiSettings = async (req, res) => {
  try {
    if (!isAdmin(req)) return forbidden(res, "update AI settings");

    const companyId = req.user.companyId;
    const body = req.body || {};

    const existing = await getOrCreateSettings(companyId);
    const data = {};

    // ---------- provider ----------
    let providerId = existing.provider;

    if (body.provider !== undefined) {
      const provider = getProvider(body.provider);
      if (!provider) return badRequest(res, "Unknown AI provider");

      providerId = provider.id;
      data.provider = providerId;
    }

    const providerDef = getProvider(providerId);
    const providerChanged = providerId !== existing.provider;

    // ---------- model ----------
    let model = existing.model;

    if (body.model !== undefined) {
      const trimmed = String(body.model).trim();

      if (trimmed && !MODEL_PATTERN.test(trimmed)) {
        return badRequest(res, "Model name contains invalid characters");
      }

      model = trimmed || providerDef.defaultModel;
      data.model = model;
    } else if (providerChanged) {
      // switching provider without a model -> use that provider's default
      model = providerDef.defaultModel;
      data.model = model;
    }

    // ---------- base URL (custom provider) ----------
    let baseUrl = existing.baseUrl;

    if (body.baseUrl !== undefined) {
      const trimmed = String(body.baseUrl).trim();

      if (!trimmed) {
        baseUrl = null;
      } else {
        try {
          baseUrl = await assertSafeHttpsUrl(trimmed);
        } catch (error) {
          return badRequest(res, error.message);
        }
      }

      data.baseUrl = baseUrl;
    }

    // ---------- API keys (encrypted, one per provider) ----------
    const keys = { ...(existing.providerKeys || {}) };
    let keysChanged = false;

    if (body.apiKey !== undefined && body.apiKey !== null) {
      const apiKey = String(body.apiKey).trim();

      if (apiKey) {
        if (apiKey.length > MAX_KEY_LENGTH || /\s/.test(apiKey)) {
          return badRequest(res, "That does not look like a valid API key");
        }

        keys[providerId] = encryptSecret(apiKey);
        keysChanged = true;
      }
    }

    if (body.removeKeyFor !== undefined) {
      const toRemove = getProvider(body.removeKeyFor);
      if (!toRemove) return badRequest(res, "Unknown AI provider");

      delete keys[toRemove.id];
      keysChanged = true;

      // Removing the key of the active provider must also stop the bot,
      // otherwise it would keep trying and failing.
      if (toRemove.id === providerId) data.isEnabled = false;
    }

    if (keysChanged) data.providerKeys = keys;

    // ---------- system prompt ----------
    if (body.systemPrompt !== undefined) {
      const prompt = String(body.systemPrompt).trim();

      if (!prompt) return badRequest(res, "System prompt cannot be empty");
      if (prompt.length > MAX_PROMPT_LENGTH) {
        return badRequest(
          res,
          `System prompt must be ${MAX_PROMPT_LENGTH} characters or fewer`
        );
      }

      data.systemPrompt = prompt;
    }

    // ---------- history limit ----------
    if (body.historyLimit !== undefined) {
      const limit = Number(body.historyLimit);

      if (!Number.isFinite(limit) || limit < 1) {
        return badRequest(res, "History limit must be a number from 1 to 50");
      }

      data.historyLimit = Math.min(50, Math.floor(limit));
    }

    // ---------- master switch ----------
    if (body.isEnabled !== undefined) {
      if (typeof body.isEnabled !== "boolean") {
        return badRequest(res, "isEnabled must be true or false");
      }

      data.isEnabled = body.isEnabled;
    }

    // ---------- can it actually run? ----------
    const willBeEnabled = data.isEnabled ?? existing.isEnabled;

    if (willBeEnabled) {
      const hasKey = Boolean(
        getStoredKey({ providerKeys: keys }, providerId)
      );

      if (!hasKey) {
        return badRequest(
          res,
          `Add an API key for ${providerDef.name} before enabling auto-reply`
        );
      }

      if (!model) return badRequest(res, "Choose a model before enabling auto-reply");

      if (providerDef.requiresBaseUrl && !baseUrl) {
        return badRequest(res, "Enter the Base URL before enabling auto-reply");
      }
    }

    // A changed provider / model / key / URL deserves a fresh start,
    // so an old error message doesn't linger on the page.
    if (providerChanged || keysChanged || data.model || data.baseUrl !== undefined) {
      data.lastError = null;
      data.lastErrorAt = null;
    }

    const settings = await prisma.aiSettings.update({
      where: { id: existing.id },
      data,
    });

    return res.status(200).json({
      success: true,
      message: "AI settings updated successfully",
      settings: serializeSettings(settings),
    });
  } catch (error) {
    console.error("Update AI settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update AI settings",
    });
  }
};

// ============================================
// POST /api/ai-settings/test
// ============================================
// Sends ONE sample customer message to the AI and returns its reply.
// Nothing is sent on WhatsApp. Accepts unsaved form values.
const testAiSettings = async (req, res) => {
  try {
    if (!isAdmin(req)) return forbidden(res, "test AI settings");

    const companyId = req.user.companyId;

    if (isTestRateLimited(companyId)) {
      return res.status(429).json({
        success: false,
        message: "Too many tests. Please wait a minute and try again.",
      });
    }

    const body = req.body || {};

    if (body.provider !== undefined && !getProvider(body.provider)) {
      return badRequest(res, "Unknown AI provider");
    }

    if (typeof body.message === "string" && body.message.length > 500) {
      return badRequest(res, "Test message must be 500 characters or fewer");
    }

    const result = await testAutoReply(companyId, {
      provider: body.provider,
      model: typeof body.model === "string" ? body.model : undefined,
      baseUrl: typeof body.baseUrl === "string" ? body.baseUrl : undefined,
      apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
      systemPrompt:
        typeof body.systemPrompt === "string" ? body.systemPrompt : undefined,
      message: typeof body.message === "string" ? body.message : undefined,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    return res.status(200).json({
      success: true,
      reply: result.reply,
      latencyMs: result.latencyMs,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    console.error("Test AI settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to test AI settings",
    });
  }
};

module.exports = {
  getAiSettings,
  updateAiSettings,
  testAiSettings,
};
