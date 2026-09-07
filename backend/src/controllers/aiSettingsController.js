const prisma = require("../config/prisma");
const { getAiSettings: getOrCreateSettings } = require("../services/grokService");

// GET /api/ai-settings
const getAiSettings = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admins can view AI settings",
      });
    }

    const settings = await getOrCreateSettings();

    // Never send the raw key back to the frontend — just confirm
    // whether one is set, so the settings page can show a masked state.
    const { apiKey, ...safeSettings } = settings;

    res.status(200).json({
      success: true,
      settings: {
        ...safeSettings,
        hasApiKey: Boolean(apiKey),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch AI settings",
    });
  }
};

// PATCH /api/ai-settings
const updateAiSettings = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admins can update AI settings",
      });
    }

    const { isEnabled, apiKey, model, systemPrompt, historyLimit } = req.body;

    const existing = await getOrCreateSettings();

    const data = {};

    if (typeof isEnabled === "boolean") data.isEnabled = isEnabled;
    // Only overwrite the stored key if a new non-empty one was sent,
    // so the frontend can leave the masked field untouched.
    if (typeof apiKey === "string" && apiKey.trim()) data.apiKey = apiKey.trim();
    if (typeof model === "string" && model.trim()) data.model = model.trim();
    if (typeof systemPrompt === "string" && systemPrompt.trim()) data.systemPrompt = systemPrompt.trim();
    if (typeof historyLimit === "number" && historyLimit > 0) data.historyLimit = historyLimit;

    const settings = await prisma.aiSettings.update({
      where: { id: existing.id },
      data,
    });

    const { apiKey: _key, ...safeSettings } = settings;

    res.status(200).json({
      success: true,
      message: "AI settings updated successfully",
      settings: {
        ...safeSettings,
        hasApiKey: Boolean(settings.apiKey),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update AI settings",
    });
  }
};

module.exports = {
  getAiSettings,
  updateAiSettings,
};