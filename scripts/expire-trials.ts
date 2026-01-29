/**
 * Trial expiration is handled locally in the app — no Firebase, no cron.
 *
 * - New users get a 30-day trial (see localTrialService.initLocalTrial).
 * - Expiration is checked on each page load via checkLocalTrialStatus.
 * - When now > trialEndsAt, the user hits the trial wall (AccountLocked).
 *
 * Run this script only to log that local trials don't need a server job:
 *   npx tsx scripts/expire-trials.ts
 */

console.log(
  'Local trial mode: expiration is checked in the browser on load. No cron or Firebase needed.'
);
process.exit(0);
