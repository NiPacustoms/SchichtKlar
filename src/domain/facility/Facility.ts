/**
 * Facility entity – pure domain model (read-focused).
 * Uses lib/types/facility for compatibility.
 */
import type { Facility as IFacility, Station } from '@/lib/types/facility';

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (
    value != null &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}

export class Facility {
  readonly id: string;
  readonly companyId?: string;
  readonly name: string;
  readonly address: string;
  readonly contactPerson: string;
  readonly phone: string;
  readonly email: string;
  readonly stations: Station[];
  readonly colorCode: string;
  readonly debtorNumber: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: IFacility) {
    this.id = data.id;
    this.companyId = data.companyId;
    this.name = data.name;
    this.address = data.address;
    this.contactPerson = data.contactPerson;
    this.phone = data.phone;
    this.email = data.email;
    this.stations = data.stations ?? [];
    this.colorCode = data.colorCode ?? '#005f73';
    this.debtorNumber = data.debtorNumber ?? '';
    this.createdAt = toDate(data.createdAt);
    this.updatedAt = toDate(data.updatedAt);
  }

  get stationCount(): number {
    return this.stations.length;
  }

  toPlain(): IFacility {
    return {
      id: this.id,
      companyId: this.companyId,
      name: this.name,
      address: this.address,
      contactPerson: this.contactPerson,
      phone: this.phone,
      email: this.email,
      stations: this.stations,
      colorCode: this.colorCode,
      debtorNumber: this.debtorNumber,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
