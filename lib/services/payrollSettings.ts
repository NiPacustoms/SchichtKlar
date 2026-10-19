import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { DEFAULT_PAYROLL_SETTINGS, type PayrollExportSettings } from '@/lib/domain/datevLodas';

/** Lohnexport-Einstellungen je Firma (payrollSettings/{companyId}, nur Admins) */
export const payrollSettingsService = {
  async get(companyId: string): Promise<PayrollExportSettings> {
    const snap = await getDoc(doc(getDb(), 'payrollSettings', companyId));
    const d = snap.exists() ? (snap.data() as Partial<PayrollExportSettings>) : {};
    return {
      ...DEFAULT_PAYROLL_SETTINGS,
      ...d,
      lohnarten: { ...DEFAULT_PAYROLL_SETTINGS.lohnarten, ...(d.lohnarten ?? {}) },
    };
  },
  async save(companyId: string, s: PayrollExportSettings): Promise<void> {
    await setDoc(doc(getDb(), 'payrollSettings', companyId), { ...s, updatedAt: serverTimestamp() }, { merge: true });
  },
};
