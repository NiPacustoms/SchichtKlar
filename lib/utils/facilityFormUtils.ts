/**
 * Gemeinsame Typen und Validierung für Einrichtungs-Formulare (Create/Edit).
 */

export interface FacilityFormData {
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  debtorNumber: string;
  billingName: string;
  billingAddress: string;
  billingZip: string;
  billingCity: string;
  billingEmail: string;
  billingPhone: string;
  paymentTerms: string;
  taxId: string;
  vatId: string;
  colorCode: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createInitialFacilityFormData(primaryColor: string): FacilityFormData {
  return {
    name: '',
    address: '',
    contactPerson: '',
    phone: '',
    email: '',
    debtorNumber: '',
    billingName: '',
    billingAddress: '',
    billingZip: '',
    billingCity: '',
    billingEmail: '',
    billingPhone: '',
    paymentTerms: '30 Tage netto',
    taxId: '',
    vatId: '',
    colorCode: primaryColor,
  };
}

export function validateFacilityForm(
  formData: FacilityFormData
): { valid: boolean; errors: Partial<Record<keyof FacilityFormData, string>> } {
  const errors: Partial<Record<keyof FacilityFormData, string>> = {};

  if (!formData.name.trim()) errors.name = 'Name ist erforderlich';
  if (!formData.address.trim()) errors.address = 'Adresse ist erforderlich';
  if (!formData.contactPerson.trim()) errors.contactPerson = 'Ansprechpartner ist erforderlich';
  if (!formData.phone.trim()) errors.phone = 'Telefon ist erforderlich';
  if (!formData.email.trim()) errors.email = 'E-Mail ist erforderlich';
  if (!formData.debtorNumber.trim()) errors.debtorNumber = 'Debitornummer ist erforderlich';

  if (formData.email && !EMAIL_REGEX.test(formData.email)) {
    errors.email = 'Ungültige E-Mail-Adresse';
  }
  if (formData.billingEmail && !EMAIL_REGEX.test(formData.billingEmail)) {
    errors.billingEmail = 'Ungültige E-Mail-Adresse';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
