// backend/src/services/backupFailureNotifier.js  (NEW FILE)
//
// Tells a company's ADMINS (in-app notification / bell icon only, NO email)
// when an AUTOMATIC backup has failed.
//
// Safe by design:
//   - It NEVER throws. A problem while notifying can never affect the
//     backup scheduler or any other feature.
//   - Anti-spam: a failed backup is retried every 6 hours, so each company
//     is told at most once every 24 hours (NOTIFY_COOLDOWN_HOURS).
//   - Admins are only ever looked up inside the failing company.
//
// No database change, no new npm package, no new .env value needed.

const prisma = require("../config/prisma");
const { notifyUser } = require("./notificationService");

const NOTIFY_COOLDOWN_HOURS = 24;
const TITLE = "Automatic backup failed";

// Keep the reason short and on one line.
const shortReason = (reason) => {
  const text = String(reason || "Unknown error")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 200 ? `${text.slice(0, 197)}...` : text;
};

// Was this company already told about a failure recently?
const alreadyNotifiedRecently = async (companyId) => {
  const since = new Date(Date.now() - NOTIFY_COOLDOWN_HOURS * 60 * 60 * 1000);

  const existing = await prisma.userNotification.findFirst({
    where: {
      type: "SYSTEM",
      title: TITLE,
      createdAt: { gte: since },
      user: { companyId },
    },
    select: { id: true },
  });

  return Boolean(existing);
};

/**
 * Call this when an AUTOMATIC backup of a company has failed.
 *   companyId : numeric company id (Company.id)
 *   reason    : error message (optional)
 * Never throws.
 */
const notifyBackupFailed = async ({ companyId, reason } = {}) => {
  try {
    if (companyId === undefined || companyId === null) return;

    if (await alreadyNotifiedRecently(companyId)) return;

    const admins = await prisma.user.findMany({
      where: { companyId, role: "ADMIN", status: "ACTIVE" },
      select: { id: true },
    });

    const cleanReason = shortReason(reason);

    for (const admin of admins) {
      try {
        await notifyUser({
          userId: admin.id,
          title: TITLE,
          message: `Your scheduled automatic backup failed (${cleanReason}). It will be retried automatically. You can also take a manual backup from the Backup page.`,
          type: "SYSTEM",
        });
      } catch (error) {
        console.error("Backup failure in-app notification error:", error.message);
      }
    }
  } catch (error) {
    console.error("notifyBackupFailed error:", error.message);
  }
};

module.exports = { notifyBackupFailed };