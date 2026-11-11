// backend/src/jobs/autoBackupScheduler.js  (NEW FILE)
//
// Checks every hour whether any company's automatic backup is due.
// Same style as campaignScheduler.js. No new npm package needed.
//
// To switch the whole feature off without changing code, put this in .env:
//   AUTO_BACKUP_ENABLED=false

const { runDueBackups } = require("../services/autoBackupService");

const CHECK_EVERY_MS = 60 * 60 * 1000; // 1 hour

let isRunning = false; // prevents two checks overlapping

const runCheck = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    await runDueBackups();
  } catch (error) {
    console.error("Auto backup scheduler error:", error);
  } finally {
    isRunning = false;
  }
};

const startAutoBackupScheduler = () => {
  if (process.env.AUTO_BACKUP_ENABLED === "false") {
    console.log("Auto backup scheduler is disabled (AUTO_BACKUP_ENABLED=false).");
    return;
  }

  console.log("Auto backup scheduler started (checks every 1 hour).");

  // Run once shortly after start-up (catches backups that became due while
  // the server was down), then every hour.
  setTimeout(runCheck, 60 * 1000);
  setInterval(runCheck, CHECK_EVERY_MS);
};

module.exports = { startAutoBackupScheduler };