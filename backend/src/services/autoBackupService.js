// // backend/src/services/autoBackupService.js  (NEW FILE)
// //
// // Automatic backups. This file does NOT build the Excel file itself -
// // it calls your existing createManualBackup() so the automatic backup is
// // exactly the same Excel file as the manual one (same sheets, same
// // excluded passwords/tokens).
// //
// // What this file does:
// //   1. Gives every ACTIVE company a default schedule (Weekly, ON).
// //   2. Finds companies whose backup is due and backs them up, ONE at a time.
// //   3. Deletes old AUTOMATIC backups beyond the company's "keep last N".
// //      MANUAL backups are never touched.

// const fs = require("fs");
// const path = require("path");
// const prisma = require("../config/prisma");
// const { createManualBackup } = require("./backupService");
// const {
//   FREQUENCIES,
//   clamp,
//   computeNextRunAt,
// } = require("../utils/backupSchedule");

// // Same folder backupService.js writes to.
// const BACKUP_DIRECTORY = path.join(process.cwd(), "backups");

// // Defaults for a company that has never touched the setting.
// const DEFAULT_SETTING = {
//   enabled: true,
//   frequency: "WEEKLY",
//   dayOfWeek: 1, // Monday
//   dayOfMonth: 1,
//   retentionCount: 7,
// };

// // At most this many companies are backed up per hourly check, so one check
// // can never hog the server. The rest are picked up on the next check.
// const MAX_PER_RUN = Number(process.env.AUTO_BACKUP_MAX_PER_RUN) || 20;

// // If a backup fails (or the server stops halfway), try again after this long.
// const RETRY_AFTER_MS = 6 * 60 * 60 * 1000;

// // An automatic backup stuck IN_PROGRESS longer than this is marked FAILED.
// const STALE_AFTER_MS = 60 * 60 * 1000;

// // Failed automatic backup rows older than this are removed from history.
// const FAILED_ROW_KEEP_DAYS = 30;

// //////////////////////////////////////////////////////
// // SETTINGS (used by the controller)
// //////////////////////////////////////////////////////

// /**
//  * Returns the company's backup setting, creating the default one the first
//  * time. The first automatic backup is scheduled for the next quiet hour,
//  * so a new company is protected from its first night.
//  */
// const getOrCreateSetting = async (companyId) => {
//   const existing = await prisma.backupSetting.findUnique({
//     where: { companyId },
//   });

//   if (existing) return existing;

//   try {
//     return await prisma.backupSetting.create({
//       data: {
//         companyId,
//         ...DEFAULT_SETTING,
//         nextRunAt: computeNextRunAt(DEFAULT_SETTING, new Date(), {
//           forceDaily: true,
//         }),
//       },
//     });
//   } catch (error) {
//     // Two requests created it at the same moment - just read the winner.
//     const again = await prisma.backupSetting.findUnique({
//       where: { companyId },
//     });
//     if (again) return again;
//     throw error;
//   }
// };

// /**
//  * Validates and saves the settings sent by the admin.
//  * Throws an Error with .status = 400 for bad input.
//  */
// const updateSetting = async (companyId, input = {}) => {
//   const current = await getOrCreateSetting(companyId);

//   const badRequest = (message) => {
//     const error = new Error(message);
//     error.status = 400;
//     return error;
//   };

//   const next = {
//     enabled: current.enabled,
//     frequency: current.frequency,
//     dayOfWeek: current.dayOfWeek,
//     dayOfMonth: current.dayOfMonth,
//     retentionCount: current.retentionCount,
//   };

//   if (input.enabled !== undefined) {
//     if (typeof input.enabled !== "boolean") {
//       throw badRequest("enabled must be true or false");
//     }
//     next.enabled = input.enabled;
//   }

//   if (input.frequency !== undefined) {
//     if (!FREQUENCIES.includes(input.frequency)) {
//       throw badRequest("frequency must be DAILY, WEEKLY or MONTHLY");
//     }
//     next.frequency = input.frequency;
//   }

//   if (input.dayOfWeek !== undefined) {
//     const n = Number(input.dayOfWeek);
//     if (!Number.isInteger(n) || n < 0 || n > 6) {
//       throw badRequest("dayOfWeek must be a number from 0 (Sunday) to 6 (Saturday)");
//     }
//     next.dayOfWeek = n;
//   }

//   if (input.dayOfMonth !== undefined) {
//     const n = Number(input.dayOfMonth);
//     if (!Number.isInteger(n) || n < 1 || n > 28) {
//       throw badRequest("dayOfMonth must be a number from 1 to 28");
//     }
//     next.dayOfMonth = n;
//   }

//   if (input.retentionCount !== undefined) {
//     const n = Number(input.retentionCount);
//     if (!Number.isInteger(n) || n < 1 || n > 30) {
//       throw badRequest("retentionCount must be a number from 1 to 30");
//     }
//     next.retentionCount = n;
//   }

//   // Work out when the next backup should happen.
//   const scheduleChanged =
//     next.frequency !== current.frequency ||
//     next.dayOfWeek !== current.dayOfWeek ||
//     next.dayOfMonth !== current.dayOfMonth;

//   let nextRunAt = current.nextRunAt;

//   if (!next.enabled) {
//     nextRunAt = null;
//   } else if (scheduleChanged || !current.enabled || !current.nextRunAt) {
//     nextRunAt = computeNextRunAt(next, new Date());
//   }

//   return prisma.backupSetting.update({
//     where: { companyId },
//     data: { ...next, nextRunAt },
//   });
// };

// //////////////////////////////////////////////////////
// // HELPERS FOR THE SCHEDULER
// //////////////////////////////////////////////////////

// /**
//  * Every ACTIVE company without a schedule gets the default one (ON, Weekly).
//  * This is how "automatic backup is on by default" works - including for
//  * companies that sign up in the future - without touching signup code.
//  */
// const ensureDefaultSettings = async () => {
//   const missing = await prisma.company.findMany({
//     where: {
//       status: "ACTIVE",
//       backupSetting: { is: null },
//     },
//     select: { id: true },
//     take: 500,
//   });

//   if (missing.length === 0) return 0;

//   // Everyone's first backup is tonight at the quiet hour (the runner then
//   // handles them a few at a time, so the server is not overloaded).
//   const firstRun = computeNextRunAt(DEFAULT_SETTING, new Date(), {
//     forceDaily: true,
//   });

//   const result = await prisma.backupSetting.createMany({
//     data: missing.map((company) => ({
//       companyId: company.id,
//       ...DEFAULT_SETTING,
//       nextRunAt: firstRun,
//     })),
//     skipDuplicates: true,
//   });

//   return result.count;
// };

// /**
//  * Marks AUTOMATIC backups that got stuck in IN_PROGRESS (for example the
//  * server restarted in the middle) as FAILED, so the history is not wrong.
//  */
// const failStaleBackups = async () => {
//   await prisma.backup.updateMany({
//     where: {
//       backupType: "AUTOMATIC",
//       status: "IN_PROGRESS",
//       startedAt: { lt: new Date(Date.now() - STALE_AFTER_MS) },
//     },
//     data: {
//       status: "FAILED",
//       errorMessage: "Backup did not finish (server stopped or timed out)",
//       completedAt: new Date(),
//     },
//   });
// };

// // Delete a backup file, but only if it really is inside the backups folder.
// const safeDeleteFile = (filePath) => {
//   try {
//     if (!filePath) return;

//     const resolved = path.resolve(filePath);
//     const root = path.resolve(BACKUP_DIRECTORY) + path.sep;

//     if (!resolved.startsWith(root)) {
//       console.warn("Auto backup cleanup skipped (outside backups folder):", filePath);
//       return;
//     }

//     if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
//   } catch (error) {
//     console.error("Auto backup cleanup: could not delete file:", error.message);
//   }
// };

// /**
//  * Keeps only the newest `keep` COMPLETED automatic backups of the company.
//  * MANUAL backups are never deleted here.
//  */
// const cleanupOldAutomaticBackups = async (companyId, keep) => {
//   const completed = await prisma.backup.findMany({
//     where: {
//       companyId,
//       backupType: "AUTOMATIC",
//       status: "COMPLETED",
//     },
//     orderBy: { createdAt: "desc" },
//     select: { id: true, storagePath: true },
//   });

//   const old = completed.slice(keep);

//   for (const backup of old) {
//     safeDeleteFile(backup.storagePath);
//     await prisma.backup.delete({ where: { id: backup.id } });
//   }

//   // Old failed automatic rows (no file exists for them).
//   await prisma.backup.deleteMany({
//     where: {
//       companyId,
//       backupType: "AUTOMATIC",
//       status: "FAILED",
//       createdAt: {
//         lt: new Date(Date.now() - FAILED_ROW_KEEP_DAYS * 24 * 60 * 60 * 1000),
//       },
//     },
//   });

//   return old.length;
// };

// //////////////////////////////////////////////////////
// // MAIN RUNNER (called by the scheduler job)
// //////////////////////////////////////////////////////

// /**
//  * Backs up every company whose scheduled time has arrived.
//  * Safe to call often: companies that are not due are skipped.
//  */
// const runDueBackups = async () => {
//   await failStaleBackups();

//   const created = await ensureDefaultSettings();
//   if (created > 0) {
//     console.log(`Auto backup: default schedule created for ${created} company(ies).`);
//   }

//   const due = await prisma.backupSetting.findMany({
//     where: {
//       enabled: true,
//       nextRunAt: { lte: new Date() },
//       company: { status: "ACTIVE" },
//     },
//     orderBy: { nextRunAt: "asc" },
//     take: MAX_PER_RUN,
//   });

//   if (due.length === 0) return { ran: 0, failed: 0 };

//   console.log(`Auto backup: ${due.length} company(ies) due.`);

//   let ran = 0;
//   let failed = 0;

//   // One company at a time - never in parallel.
//   for (const setting of due) {
//     // CLAIM the job. If the server is running twice, or a previous check is
//     // still busy, only ONE of them wins this update (count === 1).
//     // The temporary nextRunAt also acts as the "retry later" time if this
//     // backup fails or the server stops halfway.
//     const claim = await prisma.backupSetting.updateMany({
//       where: {
//         id: setting.id,
//         enabled: true,
//         nextRunAt: setting.nextRunAt,
//       },
//       data: { nextRunAt: new Date(Date.now() + RETRY_AFTER_MS) },
//     });

//     if (claim.count !== 1) continue;

//     try {
//       await createManualBackup(setting.companyId, null, {
//         backupType: "AUTOMATIC",
//       });

//       ran += 1;

//       // Read the latest setting (the admin may have changed it meanwhile).
//       const fresh = await prisma.backupSetting.findUnique({
//         where: { id: setting.id },
//       });

//       if (fresh) {
//         const finishedAt = new Date();

//         await prisma.backupSetting.update({
//           where: { id: fresh.id },
//           data: {
//             lastRunAt: finishedAt,
//             nextRunAt: fresh.enabled
//               ? computeNextRunAt(fresh, finishedAt)
//               : null,
//           },
//         });

//         try {
//           await cleanupOldAutomaticBackups(
//             fresh.companyId,
//             clamp(fresh.retentionCount, 1, 30, 7)
//           );
//         } catch (cleanupError) {
//           // Cleanup problems must never make a good backup look failed.
//           console.error("Auto backup cleanup error:", cleanupError);
//         }
//       }
//     } catch (error) {
//       failed += 1;
//       // createManualBackup already saved a FAILED row with the reason.
//       console.error(
//         `Auto backup failed for company id ${setting.companyId}:`,
//         error.message
//       );
//     }
//   }

//   return { ran, failed };
// };

// module.exports = {
//   getOrCreateSetting,
//   updateSetting,
//   runDueBackups,
//   cleanupOldAutomaticBackups,
// };


// backend/src/services/autoBackupService.js  (NEW FILE)
//
// Automatic backups. This file does NOT build the Excel file itself -
// it calls your existing createManualBackup() so the automatic backup is
// exactly the same Excel file as the manual one (same sheets, same
// excluded passwords/tokens).
//
// What this file does:
//   1. Gives every ACTIVE company a default schedule (Weekly, ON).
//   2. Finds companies whose backup is due and backs them up, ONE at a time.
//   3. Deletes old AUTOMATIC backups beyond the company's "keep last N".
//      MANUAL backups are never touched.

const fs = require("fs");
const path = require("path");
const prisma = require("../config/prisma");
const { createManualBackup } = require("./backupService");
const { deleteBackupFile } = require("./backupStorage");
const {
  FREQUENCIES,
  clamp,
  computeNextRunAt,
} = require("../utils/backupSchedule");

// Same folder backupService.js writes to.
const BACKUP_DIRECTORY = path.join(process.cwd(), "backups");

// Defaults for a company that has never touched the setting.
const DEFAULT_SETTING = {
  enabled: true,
  frequency: "WEEKLY",
  dayOfWeek: 1, // Monday
  dayOfMonth: 1,
  retentionCount: 7,
};

// At most this many companies are backed up per hourly check, so one check
// can never hog the server. The rest are picked up on the next check.
const MAX_PER_RUN = Number(process.env.AUTO_BACKUP_MAX_PER_RUN) || 20;

// If a backup fails (or the server stops halfway), try again after this long.
const RETRY_AFTER_MS = 6 * 60 * 60 * 1000;

// An automatic backup stuck IN_PROGRESS longer than this is marked FAILED.
const STALE_AFTER_MS = 60 * 60 * 1000;

// Failed automatic backup rows older than this are removed from history.
const FAILED_ROW_KEEP_DAYS = 30;

//////////////////////////////////////////////////////
// SETTINGS (used by the controller)
//////////////////////////////////////////////////////

/**
 * Returns the company's backup setting, creating the default one the first
 * time. The first automatic backup is scheduled for the next quiet hour,
 * so a new company is protected from its first night.
 */
const getOrCreateSetting = async (companyId) => {
  const existing = await prisma.backupSetting.findUnique({
    where: { companyId },
  });

  if (existing) return existing;

  try {
    return await prisma.backupSetting.create({
      data: {
        companyId,
        ...DEFAULT_SETTING,
        nextRunAt: computeNextRunAt(DEFAULT_SETTING, new Date(), {
          forceDaily: true,
        }),
      },
    });
  } catch (error) {
    // Two requests created it at the same moment - just read the winner.
    const again = await prisma.backupSetting.findUnique({
      where: { companyId },
    });
    if (again) return again;
    throw error;
  }
};

/**
 * Validates and saves the settings sent by the admin.
 * Throws an Error with .status = 400 for bad input.
 */
const updateSetting = async (companyId, input = {}) => {
  const current = await getOrCreateSetting(companyId);

  const badRequest = (message) => {
    const error = new Error(message);
    error.status = 400;
    return error;
  };

  const next = {
    enabled: current.enabled,
    frequency: current.frequency,
    dayOfWeek: current.dayOfWeek,
    dayOfMonth: current.dayOfMonth,
    retentionCount: current.retentionCount,
  };

  if (input.enabled !== undefined) {
    if (typeof input.enabled !== "boolean") {
      throw badRequest("enabled must be true or false");
    }
    next.enabled = input.enabled;
  }

  if (input.frequency !== undefined) {
    if (!FREQUENCIES.includes(input.frequency)) {
      throw badRequest("frequency must be DAILY, WEEKLY or MONTHLY");
    }
    next.frequency = input.frequency;
  }

  if (input.dayOfWeek !== undefined) {
    const n = Number(input.dayOfWeek);
    if (!Number.isInteger(n) || n < 0 || n > 6) {
      throw badRequest("dayOfWeek must be a number from 0 (Sunday) to 6 (Saturday)");
    }
    next.dayOfWeek = n;
  }

  if (input.dayOfMonth !== undefined) {
    const n = Number(input.dayOfMonth);
    if (!Number.isInteger(n) || n < 1 || n > 28) {
      throw badRequest("dayOfMonth must be a number from 1 to 28");
    }
    next.dayOfMonth = n;
  }

  if (input.retentionCount !== undefined) {
    const n = Number(input.retentionCount);
    if (!Number.isInteger(n) || n < 1 || n > 30) {
      throw badRequest("retentionCount must be a number from 1 to 30");
    }
    next.retentionCount = n;
  }

  // Work out when the next backup should happen.
  const scheduleChanged =
    next.frequency !== current.frequency ||
    next.dayOfWeek !== current.dayOfWeek ||
    next.dayOfMonth !== current.dayOfMonth;

  let nextRunAt = current.nextRunAt;

  if (!next.enabled) {
    nextRunAt = null;
  } else if (scheduleChanged || !current.enabled || !current.nextRunAt) {
    nextRunAt = computeNextRunAt(next, new Date());
  }

  return prisma.backupSetting.update({
    where: { companyId },
    data: { ...next, nextRunAt },
  });
};

//////////////////////////////////////////////////////
// HELPERS FOR THE SCHEDULER
//////////////////////////////////////////////////////

/**
 * Every ACTIVE company without a schedule gets the default one (ON, Weekly).
 * This is how "automatic backup is on by default" works - including for
 * companies that sign up in the future - without touching signup code.
 */
const ensureDefaultSettings = async () => {
  const missing = await prisma.company.findMany({
    where: {
      status: "ACTIVE",
      backupSetting: { is: null },
    },
    select: { id: true },
    take: 500,
  });

  if (missing.length === 0) return 0;

  // Everyone's first backup is tonight at the quiet hour (the runner then
  // handles them a few at a time, so the server is not overloaded).
  const firstRun = computeNextRunAt(DEFAULT_SETTING, new Date(), {
    forceDaily: true,
  });

  const result = await prisma.backupSetting.createMany({
    data: missing.map((company) => ({
      companyId: company.id,
      ...DEFAULT_SETTING,
      nextRunAt: firstRun,
    })),
    skipDuplicates: true,
  });

  return result.count;
};

/**
 * Marks AUTOMATIC backups that got stuck in IN_PROGRESS (for example the
 * server restarted in the middle) as FAILED, so the history is not wrong.
 */
const failStaleBackups = async () => {
  await prisma.backup.updateMany({
    where: {
      backupType: "AUTOMATIC",
      status: "IN_PROGRESS",
      startedAt: { lt: new Date(Date.now() - STALE_AFTER_MS) },
    },
    data: {
      status: "FAILED",
      errorMessage: "Backup did not finish (server stopped or timed out)",
      completedAt: new Date(),
    },
  });
};

// Delete a backup file, but only if it really is inside the backups folder.
const safeDeleteFile = (filePath) => {
  try {
    if (!filePath) return;

    const resolved = path.resolve(filePath);
    const root = path.resolve(BACKUP_DIRECTORY) + path.sep;

    if (!resolved.startsWith(root)) {
      console.warn("Auto backup cleanup skipped (outside backups folder):", filePath);
      return;
    }

    if (fs.existsSync(resolved)) fs.unlinkSync(resolved);
  } catch (error) {
    console.error("Auto backup cleanup: could not delete file:", error.message);
  }
};

/**
 * Keeps only the newest `keep` COMPLETED automatic backups of the company.
 * MANUAL backups are never deleted here.
 */
const cleanupOldAutomaticBackups = async (companyId, keep) => {
  const completed = await prisma.backup.findMany({
    where: {
      companyId,
      backupType: "AUTOMATIC",
      status: "COMPLETED",
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, storagePath: true },
  });

  const old = completed.slice(keep);

  for (const backup of old) {
    await deleteBackupFile(backup.storagePath);
    await prisma.backup.delete({ where: { id: backup.id } });
  }

  // Old failed automatic rows (no file exists for them).
  await prisma.backup.deleteMany({
    where: {
      companyId,
      backupType: "AUTOMATIC",
      status: "FAILED",
      createdAt: {
        lt: new Date(Date.now() - FAILED_ROW_KEEP_DAYS * 24 * 60 * 60 * 1000),
      },
    },
  });

  return old.length;
};

//////////////////////////////////////////////////////
// MAIN RUNNER (called by the scheduler job)
//////////////////////////////////////////////////////

/**
 * Backs up every company whose scheduled time has arrived.
 * Safe to call often: companies that are not due are skipped.
 */
const runDueBackups = async () => {
  await failStaleBackups();

  const created = await ensureDefaultSettings();
  if (created > 0) {
    console.log(`Auto backup: default schedule created for ${created} company(ies).`);
  }

  const due = await prisma.backupSetting.findMany({
    where: {
      enabled: true,
      nextRunAt: { lte: new Date() },
      company: { status: "ACTIVE" },
    },
    orderBy: { nextRunAt: "asc" },
    take: MAX_PER_RUN,
  });

  if (due.length === 0) return { ran: 0, failed: 0 };

  console.log(`Auto backup: ${due.length} company(ies) due.`);

  let ran = 0;
  let failed = 0;

  // One company at a time - never in parallel.
  for (const setting of due) {
    // CLAIM the job. If the server is running twice, or a previous check is
    // still busy, only ONE of them wins this update (count === 1).
    // The temporary nextRunAt also acts as the "retry later" time if this
    // backup fails or the server stops halfway.
    const claim = await prisma.backupSetting.updateMany({
      where: {
        id: setting.id,
        enabled: true,
        nextRunAt: setting.nextRunAt,
      },
      data: { nextRunAt: new Date(Date.now() + RETRY_AFTER_MS) },
    });

    if (claim.count !== 1) continue;

    try {
      await createManualBackup(setting.companyId, null, {
        backupType: "AUTOMATIC",
      });

      ran += 1;

      // Read the latest setting (the admin may have changed it meanwhile).
      const fresh = await prisma.backupSetting.findUnique({
        where: { id: setting.id },
      });

      if (fresh) {
        const finishedAt = new Date();

        await prisma.backupSetting.update({
          where: { id: fresh.id },
          data: {
            lastRunAt: finishedAt,
            nextRunAt: fresh.enabled
              ? computeNextRunAt(fresh, finishedAt)
              : null,
          },
        });

        try {
          await cleanupOldAutomaticBackups(
            fresh.companyId,
            clamp(fresh.retentionCount, 1, 30, 7)
          );
        } catch (cleanupError) {
          // Cleanup problems must never make a good backup look failed.
          console.error("Auto backup cleanup error:", cleanupError);
        }
      }
    } catch (error) {
      failed += 1;
      // createManualBackup already saved a FAILED row with the reason.
      console.error(
        `Auto backup failed for company id ${setting.companyId}:`,
        error.message
      );
    }
  }

  return { ran, failed };
};

module.exports = {
  getOrCreateSetting,
  updateSetting,
  runDueBackups,
  cleanupOldAutomaticBackups,
};