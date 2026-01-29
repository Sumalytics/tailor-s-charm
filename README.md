# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Billing automation (optional backend)

This repo now ships with a Firebase Cloud Function in `functions/src/index.ts` that:

- runs hourly (`processTrialSubscriptions`) to expire 3-day trials and record a 24-hour reminder in Firestore,
- writes reminder records to the `billingReminders` collection so you can later hook an email/push service,
- keeps `trialReminderSentAt` on the `subscriptions` documents so the job never doubles up.

### Deploy & schedule

1. `cd functions && npm install` (once) and run `npm run build`.
2. Configure Firebase credentials (`firebase login` + `firebase use <project>`).
3. Deploy with `firebase deploy --only functions`.
4. Wire a Cloud Scheduler job (via Google Cloud Console or `gcloud`):
   ```
   gcloud scheduler jobs create pubsub expire-trials \
     --schedule="0 * * * *" \
     --topic firebase-schedule \
     --message-body="trigger processTrialSubscriptions"
   ```
   Make sure the scheduler topic matches the one Firebase expects (`firebase-schedule` by default) and set the function target to `processTrialSubscriptions`.

### Surface the countdown in the dashboard

Trial users now see the countdown banner on every dashboard page thanks to the new `TrialCountdown` component rendered inside `DashboardLayout`. It uses `SubscriptionContext` so the upgrade CTA always points to `/settings?tab=billing`.

### Alternative to Firebase Functions (free)

If you prefer not to deploy Cloud Functions, this repo now includes a standalone `scripts/expire-trials.ts` script that performs the exact same trial expiry + 24h reminder logic using the Firebase Admin SDK. You can run it locally or via any scheduler (crontab, GitHub Actions, etc.) without extra platform cost.

1. Provide credentials to the script through `FIREBASE_SERVICE_ACCOUNT_KEY_PATH`, `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON string), or `GOOGLE_APPLICATION_CREDENTIALS`.  
2. Run it manually with `npm run expire:trials` (uses `tsx` so it works without transpiling).  
3. Automate it with `cron`/`systemd`/`GitHub Actions` using the same command – e.g., `crontab -e` entry:
   ```
   0 * * * * cd /path/to/tailor-s-charm && npm run expire:trials >> /var/log/trial-expiry.log 2>&1
   ```
4. The script writes reminder documents to `billingReminders` and sets `trialReminderSentAt`, just like the scheduled function.

Use whichever deployment path fits your budget; both the `functions` codebase and the local script rely on Firestore security rules that permit the necessary reads/updates with your admin credentials.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
