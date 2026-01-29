import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

admin.initializeApp();

const db = admin.firestore();
const TRIAL_STATUS = 'TRIAL';
const REMINDER_WINDOW_HOURS = 24;
const REMINDER_COLLECTION = 'billingReminders';

export const processTrialSubscriptions = functions.pubsub
  .schedule('every 60 minutes')
  .timeZone('Etc/UTC')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const reminderWindowEnd = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + REMINDER_WINDOW_HOURS * 60 * 60 * 1000
    );

    functions.logger.info('Trial processor triggered', {
      timestamp: now.toDate().toISOString(),
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

    functions.logger.info('Found trial subscriptions', {
      expired: expiredSnapshot.size,
      reminders: reminderSnapshot.size,
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
      functions.logger.info('Marked trials as cancelled', {
        count: expiredSnapshot.size,
      });
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
      functions.logger.info('Queued trial reminders', {
        count: reminderSnapshot.size,
      });
    }

    return null;
  });
