// backend/src/utils/backupSchedule.js  (NEW FILE)
//
// Pure date logic for automatic backups. No database, no packages.
//
// Backups always run at a quiet hour of the night (default 2 AM India time),
// no matter what the customer's own clock says.
//
// Optional .env settings (all have safe defaults, you do not need to add them):
//   AUTO_BACKUP_HOUR=2                    hour of the day (0-23) to run backups
//   AUTO_BACKUP_TZ_OFFSET_MINUTES=330     330 = India (UTC+5:30, no daylight saving)

const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
};

const getRunHour = () => clamp(process.env.AUTO_BACKUP_HOUR, 0, 23, 2);

const getTzOffsetMinutes = () =>
  clamp(process.env.AUTO_BACKUP_TZ_OFFSET_MINUTES, -720, 840, 330);

const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"];

/**
 * Returns the next moment (a real UTC Date) after `from` at which a backup
 * should run for the given schedule.
 *
 * schedule = { frequency, dayOfWeek (0=Sunday..6=Saturday), dayOfMonth (1..28) }
 *
 * Pass { forceDaily: true } to get simply "the next quiet hour" - used for the
 * very first backup of a company, so it is protected from the first night.
 */
const computeNextRunAt = (
  schedule,
  from = new Date(),
  { forceDaily = false } = {}
) => {
  const frequency = forceDaily ? "DAILY" : schedule.frequency;
  const dayOfWeek = clamp(schedule.dayOfWeek, 0, 6, 1);
  const dayOfMonth = clamp(schedule.dayOfMonth, 1, 28, 1);

  const runHour = getRunHour();
  const offsetMs = getTzOffsetMinutes() * 60 * 1000;

  // Shift "now" into the business timezone, then work with UTC getters
  // on the shifted value (they now read as local clock time).
  const local = new Date(from.getTime() + offsetMs);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();

  // Look at each upcoming day (max ~2 months) until one matches.
  for (let i = 0; i < 70; i += 1) {
    const localCandidate = new Date(Date.UTC(y, m, d + i, runHour, 0, 0, 0));
    const realCandidate = new Date(localCandidate.getTime() - offsetMs);

    if (realCandidate.getTime() <= from.getTime()) continue;

    if (frequency === "DAILY") return realCandidate;
    if (frequency === "WEEKLY" && localCandidate.getUTCDay() === dayOfWeek) {
      return realCandidate;
    }
    if (frequency === "MONTHLY" && localCandidate.getUTCDate() === dayOfMonth) {
      return realCandidate;
    }
  }

  // Should never happen, but never return nothing.
  return new Date(from.getTime() + 24 * 60 * 60 * 1000);
};

module.exports = {
  FREQUENCIES,
  clamp,
  getRunHour,
  getTzOffsetMinutes,
  computeNextRunAt,
};