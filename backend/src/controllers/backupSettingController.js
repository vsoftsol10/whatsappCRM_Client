// backend/src/controllers/backupSettingController.js  (NEW FILE)
//
// Lets a company ADMIN see and change the automatic-backup schedule.
// companyId ALWAYS comes from the logged-in user's token, never from the
// request body - same rule as backupController.js.

const {
  getOrCreateSetting,
  updateSetting,
} = require("../services/autoBackupService");

const toResponse = (setting) => ({
  enabled: setting.enabled,
  frequency: setting.frequency,
  dayOfWeek: setting.dayOfWeek,
  dayOfMonth: setting.dayOfMonth,
  retentionCount: setting.retentionCount,
  lastRunAt: setting.lastRunAt,
  nextRunAt: setting.nextRunAt,
});

const getBackupSetting = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company information not found",
      });
    }

    const setting = await getOrCreateSetting(companyId);

    return res.json({ success: true, setting: toResponse(setting) });
  } catch (error) {
    console.error("Get backup setting error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load automatic backup settings",
    });
  }
};

const saveBackupSetting = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Company information not found",
      });
    }

    // Only these fields are accepted from the request.
    const { enabled, frequency, dayOfWeek, dayOfMonth, retentionCount } =
      req.body || {};

    const setting = await updateSetting(companyId, {
      enabled,
      frequency,
      dayOfWeek,
      dayOfMonth,
      retentionCount,
    });

    return res.json({
      success: true,
      message: "Automatic backup settings saved",
      setting: toResponse(setting),
    });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Save backup setting error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save automatic backup settings",
    });
  }
};

module.exports = { getBackupSetting, saveBackupSetting };