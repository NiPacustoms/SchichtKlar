import { httpsCallable, getFunctions } from 'firebase/functions';
import app from '@/lib/firebase';

export const exportTokenService = {
  async requestToken(): Promise<{ token: string; expiresAt: string }> {
    if (!app) {
      throw new Error('Firebase App ist nicht initialisiert');
    }
    const functions = getFunctions(app);
    const callable = httpsCallable(functions, 'requestExportToken');
    const res = await callable({});
    const data = res.data as { token?: string; expiresAt?: string };
    if (!data?.token) throw new Error('Kein Export-Token erhalten');
    return { token: data.token!, expiresAt: data.expiresAt || '' };
  },
  async validateToken(token: string): Promise<void> {
    if (!app) {
      throw new Error('Firebase App ist nicht initialisiert');
    }
    const functions = getFunctions(app);
    const callable = httpsCallable(functions, 'validateExportToken');
    await callable({ token });
  }
};


