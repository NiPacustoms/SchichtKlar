/**
 * Einfache Sanitization/Normalisierung für Freitextfelder.
 * Entfernt HTML-Tags, normalisiert Whitespace.
 * Hinweis: Für komplexere Anforderungen DOMPurify serverseitig nutzen.
 */
/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function stripTags(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  // Remove tags
  const noTags = input.replace(/<[^>]*>/g, '');
  // Collapse whitespace
  const normalized = noTags.replace(/\s+/g, ' ').trim();
  return normalized;
}

export function sanitizeUserUpdate(data: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = { ...data };
  
  // Einfache String-Felder
  if ('displayName' in sanitized) sanitized.displayName = stripTags(sanitized.displayName) ?? '';
  if ('jobTitle' in sanitized) sanitized.jobTitle = stripTags(sanitized.jobTitle);
  if ('group' in sanitized) sanitized.group = stripTags(sanitized.group);
  if ('phone' in sanitized && typeof sanitized.phone === 'string') {
    sanitized.phone = sanitized.phone.trim();
  }

  // Adresse (Objekt)
  if ('address' in sanitized && typeof sanitized.address === 'object' && sanitized.address !== null) {
    const addr = sanitized.address as Record<string, unknown>;
    if ('street' in addr) addr.street = stripTags(addr.street);
    if ('houseNumber' in addr) addr.houseNumber = stripTags(addr.houseNumber);
    if ('postalCode' in addr) addr.postalCode = stripTags(addr.postalCode);
    if ('city' in addr) addr.city = stripTags(addr.city);
    if ('state' in addr) addr.state = stripTags(addr.state);
    if ('country' in addr) addr.country = stripTags(addr.country);
  }

  // Kontaktdaten (Objekt)
  if ('contact' in sanitized && typeof sanitized.contact === 'object' && sanitized.contact !== null) {
    const c = sanitized.contact as Record<string, unknown>;
    if ('phoneMobile' in c && typeof c.phoneMobile === 'string') c.phoneMobile = c.phoneMobile.trim();
    if ('phoneHome' in c && typeof c.phoneHome === 'string') c.phoneHome = c.phoneHome.trim();
    if ('phoneWork' in c && typeof c.phoneWork === 'string') c.phoneWork = c.phoneWork.trim();
    if ('emailPrivate' in c) c.emailPrivate = stripTags(c.emailPrivate);
  }

  // Notfallkontakt (Objekt)
  if ('emergencyContact' in sanitized && typeof sanitized.emergencyContact === 'object' && sanitized.emergencyContact !== null) {
    const ec = sanitized.emergencyContact as Record<string, unknown>;
    if ('name' in ec) ec.name = stripTags(ec.name);
    if ('relation' in ec) ec.relation = stripTags(ec.relation);
    if ('phone' in ec && typeof ec.phone === 'string') ec.phone = ec.phone.trim();
    if ('email' in ec) ec.email = stripTags(ec.email);
    if ('address' in ec) ec.address = stripTags(ec.address);
  }

  // Kontodaten (Objekt) - IBAN ist bereits verschlüsselt, nur andere Felder sanitizen
  if ('bankAccount' in sanitized && typeof sanitized.bankAccount === 'object' && sanitized.bankAccount !== null) {
    const ba = sanitized.bankAccount as Record<string, unknown>;
    // IBAN ist bereits verschlüsselt, nicht nochmal sanitizen
    if ('bic' in ba && typeof ba.bic === 'string') ba.bic = ba.bic.trim().toUpperCase();
    if ('bankName' in ba) ba.bankName = stripTags(ba.bankName);
    if ('accountHolder' in ba) ba.accountHolder = stripTags(ba.accountHolder);
  }

  // Qualifications (Array)
  if ('qualifications' in sanitized && Array.isArray(sanitized.qualifications)) {
    sanitized.qualifications = sanitized.qualifications.map((q: unknown) => 
      typeof q === 'string' ? stripTags(q) || '' : q
    ).filter((q: unknown) => typeof q === 'string' && q.length > 0);
  }

  // preferences are safe - they only contain simple strings (language, timezone, dateFormat, timeFormat)
  // No sanitization needed for preferences
  
  return sanitized;
}


