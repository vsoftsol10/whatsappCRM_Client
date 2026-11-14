const jwt = require("jsonwebtoken");

const {
  previewRestore,
  restoreBackup,
  listRestores,
  RestoreError,
} = require("../services/backupRestoreService");
const { logAction } = require("../services/auditLogService");

// The admin must type this word in the confirmation step.
const CONFIRM_WORD = "RESTORE";
const TOKEN_PURPOSE = "backup-restore-confirm";
const TOKEN_LIFETIME = "10m";

const sendError = (res, error, fallbackMessage) => {
  if (error instanceof RestoreError) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
    });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

// companyId ALWAYS comes from the verified JWT, never from the request body.
const getScope = (req) => ({
  companyId: Number(req.user.companyId),
  userId: req.user.userId,
});

//////////////////////////////////////////////////////
// STEP 1 - PREVIEW  (GET /api/backups/:id/restore-preview)
// Shows what a restore would do. Changes nothing. Returns a short-lived
// confirmation token that the restore step requires, so a restore can never
// be triggered without this step having been shown first.
//////////////////////////////////////////////////////

const previewBackupRestore = async (req, res) => {
  try {
    const { companyId, userId } = getScope(req);
    const backupId = req.params.id;

    const preview = await previewRestore({
      companyId,
      backupId,
      requestedById: userId,
    });

    const confirmToken = jwt.sign(
      { purpose: TOKEN_PURPOSE, backupId, companyId, userId },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_LIFETIME }
    );

    return res.json({
      success: true,
      preview,
      confirmToken,
      confirmWord: CONFIRM_WORD,
    });
  } catch (error) {
    return sendError(res, error, "Failed to check the backup");
  }
};

//////////////////////////////////////////////////////
// STEP 2 - RESTORE  (POST /api/backups/:id/restore)
// Body: { confirmToken, confirmText: "RESTORE" }
//////////////////////////////////////////////////////

const restoreBackupData = async (req, res) => {
  try {
    const { companyId, userId } = getScope(req);
    const backupId = req.params.id;
    const { confirmToken, confirmText } = req.body || {};

    if (confirmText !== CONFIRM_WORD) {
      return res.status(400).json({
        success: false,
        message: `Type ${CONFIRM_WORD} to confirm the restore.`,
      });
    }

    let payload;
    try {
      payload = jwt.verify(String(confirmToken || ""), process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "The confirmation expired. Please start the restore again.",
      });
    }

    if (
      payload.purpose !== TOKEN_PURPOSE ||
      payload.backupId !== backupId ||
      Number(payload.companyId) !== companyId ||
      payload.userId !== userId
    ) {
      return res.status(400).json({
        success: false,
        message: "The confirmation does not match this backup. Please start again.",
      });
    }

    const result = await restoreBackup({
      companyId,
      backupId,
      requestedById: userId,
    });

    await logAction({
      req,
      action: "RESTORE",
      module: "BACKUP",
      entityId: backupId,
      entityName: "Backup restore",
      changes: {
        after: {
          restoreId: result.restoreId,
          safetyBackupId: result.safetyBackupId,
          restored: result.summary.restored,
        },
      },
    });

    return res.json({
      success: true,
      message: "Your data was restored from the backup.",
      restore: result,
    });
  } catch (error) {
    return sendError(res, error, "Failed to restore the backup");
  }
};

//////////////////////////////////////////////////////
// RESTORE HISTORY  (GET /api/backups/restores)
//////////////////////////////////////////////////////

const getRestoreHistory = async (req, res) => {
  try {
    const { companyId } = getScope(req);
    const restores = await listRestores(companyId);
    return res.json({ success: true, restores });
  } catch (error) {
    return sendError(res, error, "Failed to fetch restore history");
  }
};

module.exports = {
  previewBackupRestore,
  restoreBackupData,
  getRestoreHistory,
  CONFIRM_WORD,
};