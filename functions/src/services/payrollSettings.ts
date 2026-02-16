import * as admin from 'firebase-admin';

const db = admin.firestore();

export const payrollSettingsService = {
  async getByUserId(userId: string) {
    if (!userId) {
      return null;
    }
    const doc = await db.collection('payrollSettings').doc(userId).get();
    return doc.exists ? doc.data() : null;
  },
};
