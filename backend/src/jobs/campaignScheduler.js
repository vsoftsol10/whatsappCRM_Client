// backend/src/jobs/campaignScheduler.js  (NEW FILE)
//
// Checks the database every minute for campaigns that are SCHEDULED and whose
// scheduledAt time has arrived, then sends them automatically.
// No new npm package needed.

const {
  processScheduledCampaigns,
} = require("../controllers/campaignController");

const CHECK_EVERY_MS = 60 * 1000; // 1 minute

let isRunning = false; // prevents two checks overlapping

const runCheck = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    await processScheduledCampaigns();
  } catch (error) {
    console.error("Campaign scheduler error:", error);
  } finally {
    isRunning = false;
  }
};

const startCampaignScheduler = () => {
  console.log("Campaign scheduler started (checks every 1 minute).");

  // Run once shortly after start-up (catches campaigns that became due
  // while the server was down), then every minute.
  setTimeout(runCheck, 10 * 1000);
  setInterval(runCheck, CHECK_EVERY_MS);
};

module.exports = { startCampaignScheduler };