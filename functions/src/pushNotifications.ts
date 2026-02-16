import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';

const db = getFirestore();
const messaging = getMessaging();

type PushDataValue = string | number | boolean | null | undefined;

interface UserPushNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, PushDataValue>;
  link?: string | null;
  notificationType?: string;
}

const INVALID_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/mismatched-credential',
]);

export async function sendUserPushNotification({
  userId,
  title,
  body,
  data,
  link,
  notificationType,
}: UserPushNotificationParams): Promise<void> {
  try {
    const [pushAllowed, tokens] = await Promise.all([
      isPushAllowed(userId, notificationType),
      getUserPushTokens(userId),
    ]);

    if (!pushAllowed) {
      logger.info('Push disabled for user', { userId, notificationType });
      return;
    }

    if (tokens.length === 0) {
      logger.info('No push tokens found for user', { userId });
      return;
    }

    const payloadData: Record<string, string> = {};
    if (data) {
      for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) continue;
        payloadData[key] = String(value);
      }
    }
    if (notificationType && !payloadData.type) {
      payloadData.type = notificationType;
    }

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data: Object.keys(payloadData).length > 0 ? payloadData : undefined,
      webpush: link
        ? {
            fcmOptions: {
              link,
            },
            headers: {
              Urgency: 'high',
            },
          }
        : undefined,
      android: {
        priority: 'high',
        notification: {
          channelId: 'shift_updates',
          sound: 'default',
        },
      },
    });

    const invalidTokens: string[] = [];
    response.responses.forEach((res, idx) => {
      if (res.success) {
        return;
      }
      const code = res.error?.code;
      if (code && INVALID_TOKEN_ERRORS.has(code)) {
        invalidTokens.push(tokens[idx]);
      } else {
        logger.warn('Push delivery failed', {
          userId,
          error: res.error?.message,
          code,
        });
      }
    });

    if (invalidTokens.length > 0) {
      await removeInvalidTokens(userId, invalidTokens);
    }
  } catch (error) {
    logger.error('Failed to send push notification', { userId, error });
  }
}

async function isPushAllowed(userId: string, notificationType?: string): Promise<boolean> {
  try {
    const settingsSnap = await db.collection('notificationSettings').doc(userId).get();
    if (!settingsSnap.exists) {
      return true;
    }
    const settings = (settingsSnap.data() || {}) as Record<string, unknown>;
    const channels = (settings.channels || {}) as Record<string, unknown>;
    const typeChannels = (settings.typeChannels || {}) as Record<
      string,
      { push?: boolean; app?: boolean }
    >;
    const legacyTypes = (settings.types || {}) as Record<string, unknown>;

    const pushChannelFlag =
      (channels.push as boolean | undefined) ?? (channels.app as boolean | undefined);
    if (pushChannelFlag === false) {
      return false;
    }

    if (notificationType) {
      if (legacyTypes[notificationType] === false) {
        return false;
      }
      const typeConfig = typeChannels[notificationType];
      if (typeConfig?.push === false || typeConfig?.app === false) {
        return false;
      }
    }
    return true;
  } catch (error) {
    logger.warn('Failed to evaluate push settings', { userId, error });
    return true;
  }
}

async function getUserPushTokens(userId: string): Promise<string[]> {
  const tokens = new Set<string>();
  try {
    const tokenDoc = await db.collection('fcmTokens').doc(userId).get();
    if (tokenDoc.exists) {
      const tokenData = tokenDoc.data() || {};
      const primaryToken = tokenData.token as string | undefined;
      const tokenList = Array.isArray(tokenData.tokens) ? (tokenData.tokens as string[]) : [];
      if (primaryToken) {
        tokens.add(primaryToken);
      }
      tokenList.filter(Boolean).forEach(token => tokens.add(token));
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data() || {};
      const legacyToken = userData.fcmToken as string | undefined;
      const legacyTokens = Array.isArray(userData.fcmTokens)
        ? (userData.fcmTokens as string[])
        : [];
      if (legacyToken) {
        tokens.add(legacyToken);
      }
      legacyTokens.filter(Boolean).forEach(token => tokens.add(token));
    }
  } catch (error) {
    logger.warn('Failed to fetch push tokens', { userId, error });
  }

  return Array.from(tokens);
}

async function removeInvalidTokens(userId: string, invalidTokens: string[]): Promise<void> {
  if (invalidTokens.length === 0) {
    return;
  }
  try {
    const docRef = db.collection('fcmTokens').doc(userId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return;
    }
    const data = docSnap.data() || {};
    const updatedTokens = Array.isArray(data.tokens)
      ? (data.tokens as string[]).filter(token => !invalidTokens.includes(token))
      : [];
    const primaryToken = data.token as string | undefined;
    const primaryStillValid =
      primaryToken && !invalidTokens.includes(primaryToken) ? primaryToken : undefined;

    const update: Record<string, unknown> = {
      tokens: updatedTokens,
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (primaryStillValid) {
      update.token = primaryStillValid;
    } else if (primaryToken) {
      update.token = FieldValue.delete();
    }
    await docRef.set(update, { merge: true });
  } catch (error) {
    logger.warn('Failed to remove invalid push tokens', { userId, error });
  }
}

