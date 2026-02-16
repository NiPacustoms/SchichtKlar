/**
 * Facility & Station Types
 */

export interface Station {
  id: string;
  name: string;
  requiredQualifications: string[];
  maxStaff: number;
}

export interface Facility {
  id: string;
  companyId?: string;
  name: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  stations: Station[];
  colorCode: string;
  type?: string;
  status?: string;
  debtorNumber: string;
  billingName?: string;
  billingAddress?: string;
  billingZip?: string;
  billingCity?: string;
  billingEmail?: string;
  billingPhone?: string;
  paymentTerms?: string;
  taxId?: string;
  vatId?: string;
  createdAt: Date;
  updatedAt: Date;
}
