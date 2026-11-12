// backend/src/jobs/billingReconcileScheduler.js  (NEW FILE)
//
// Every 30 minutes, compares Razorpay payments with our Payment and
// Subscription records and fixes / reports mismatches.
// No new npm package needed.
//
// Optional .env:
//   BILLING_RECONCILE_ENABLED=false         -> turn the job off
//   BILLING_RECONCILE_INTERVAL_MIN=30       -> how often it runs
//   BILLING_RECONCILE_LOOKBACK_HOURS=72     -> how far back it looks in Razorpay

const {
  runBillingReconciliation,
} = require("../services/billingReconciliationService");

const intervalMinutes =
  Number(process.env.BILLING_RECONCILE_INTERVAL_MIN) || 30;

const CHECK_EVERY_MS = intervalMinutes * 60 * 1000;

let isRunning = false; // prevents two runs overlapping

const runCheck = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    await runBillingReconciliation();
  } catch (error) {
    console.error("Billing reconcile scheduler error:", error);
  } finally {
    isRunning = false;
  }
};

const startBillingReconcileScheduler = () => {
  if (process.env.BILLING_RECONCILE_ENABLED === "false") {
    console.log("Billing reconcile scheduler is disabled.");
    return;
  }

  console.log(
    `Billing reconcile scheduler started (every ${intervalMinutes} minutes).`
  );

  // First run 2 minutes after start-up (catches payments missed while the
  // server was down), then on the interval.
  setTimeout(runCheck, 2 * 60 * 1000);
  setInterval(runCheck, CHECK_EVERY_MS);
};

module.exports = { startBillingReconcileScheduler };