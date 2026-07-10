/**
 * Test-Daten-Generatoren für E2E-Tests
 */

/**
 * Generiert einen zufälligen String
 */
export function randomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generiert eine zufällige E-Mail-Adresse
 */
export function randomEmail(prefix: string = 'test'): string {
  return `${prefix}-${randomString(6)}@test.schichtklar.local`;
}

/**
 * Generiert Test-Daten für einen Mitarbeiter
 */
export function generateEmployeeData() {
  const firstName = `Test-${randomString(4)}`;
  const lastName = `User-${randomString(4)}`;
  
  return {
    email: randomEmail(`${firstName.toLowerCase()}.${lastName.toLowerCase()}`),
    displayName: `${firstName} ${lastName}`,
    phone: `+49${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    qualifications: ['Pflegefachkraft', 'Intensivpflege'],
    workingHoursPerWeek: 40,
  };
}

/**
 * Generiert Test-Daten für eine Einrichtung
 */
export function generateFacilityData() {
  const name = `Test-Einrichtung-${randomString(4)}`;
  
  return {
    name,
    address: {
      street: `Teststraße ${Math.floor(Math.random() * 100)}`,
      houseNumber: `${Math.floor(Math.random() * 200)}`,
      postalCode: `${Math.floor(Math.random() * 90000) + 10000}`,
      city: 'Berlin',
      state: 'Berlin',
      country: 'Deutschland',
    },
    contact: {
      name: `Kontakt ${randomString(4)}`,
      email: randomEmail('contact'),
      phone: `+49${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    },
  };
}

/**
 * Generiert Test-Daten für eine Schicht
 */
export function generateShiftData() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1); // Morgen
  startDate.setHours(8, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(16, 0, 0, 0);
  
  return {
    title: `Test-Schicht ${randomString(4)}`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    requiredQualifications: ['Pflegefachkraft'],
    capacity: 2,
  };
}

/**
 * Generiert Test-Daten für ein Assignment
 */
export function generateAssignmentData() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(8, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setHours(16, 0, 0, 0);
  
  return {
    title: `Test-Assignment ${randomString(4)}`,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'pending',
  };
}

/**
 * Formatiert ein Datum für Eingabefelder (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Formatiert eine Zeit für Eingabefelder (HH:mm)
 */
export function formatTimeForInput(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

