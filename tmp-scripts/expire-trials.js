import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();
const REMINDER_WINDOW_HOURS = 24;
const TRIAL_STATUS = 'TRIAL';
const REMINDER_COLLECTION = 'billingReminders';
const serviceAccountKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const initializeFirebase = () => {
    if (admin.apps.length > 0)
        return;
    if (serviceAccountKeyJson) {
        const parsed = JSON.parse(serviceAccountKeyJson);
        admin.initializeApp({
            credential: admin.credential.cert(parsed),
        });
        return;
    }
    if (serviceAccountKeyPath) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountKeyPath),
        });
        return;
    }
    admin.initializeApp(); // assumes GOOGLE_APPLICATION_CREDENTIALS is set or running on GCP
};
initializeFirebase();
const db = admin.firestore();
const run = async () => {
    const now = admin.firestore.Timestamp.now();
    const reminderWindowEnd = admin.firestore.Timestamp.fromMillis(now.toMillis() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000);
    console.log('Running trial expiry check', {
        now: now.toDate().toISOString(),
        reminderWindowEnd: reminderWindowEnd.toDate().toISOString(),
    });
    const expiredQuery = db
        .collection('subscriptions')
        .where('status', '==', TRIAL_STATUS)
        .where('trialEndsAt', '<=', now);
    const reminderQuery = db
        .collection('subscriptions')
        .where('status', '==', TRIAL_STATUS)
        .where('trialEndsAt', '>', now)
        .where('trialEndsAt', '<=', reminderWindowEnd)
        .where('trialReminderSentAt', '==', null);
    const [expiredSnapshot, reminderSnapshot] = await Promise.all([
        expiredQuery.get(),
        reminderQuery.get(),
    ]);
    console.log('Query results', {
        expiredCount: expiredSnapshot.size,
        reminderCount: reminderSnapshot.size,
    });
    if (!expiredSnapshot.empty) {
        const expiryBatch = db.batch();
        expiredSnapshot.docs.forEach((doc) => {
            expiryBatch.update(doc.ref, {
                status: 'CANCELLED',
                cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        await expiryBatch.commit();
        console.log(`Marked ${expiredSnapshot.size} trial(s) as cancelled`);
    }
    if (!reminderSnapshot.empty) {
        const reminderBatch = db.batch();
        reminderSnapshot.docs.forEach((doc) => {
            reminderBatch.update(doc.ref, {
                trialReminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            const reminderRef = db.collection(REMINDER_COLLECTION).doc();
            reminderBatch.set(reminderRef, {
                shopId: doc.data().shopId || null,
                subscriptionId: doc.id,
                trialEndsAt: doc.data().trialEndsAt || null,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                type: 'TRIAL_EXPIRY_24H',
                message: 'Your free trial expires in less than 24 hours. Upgrade now to avoid losing access.',
            });
        });
        await reminderBatch.commit();
        console.log(`Queued ${reminderSnapshot.size} reminder(s)`);
    }
};
run()
    .then(() => {
    console.log('Trial expiry script completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Trial expiry script failed', error);
    process.exit(1);
});
