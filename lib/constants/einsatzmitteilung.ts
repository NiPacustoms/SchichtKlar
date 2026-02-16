/**
 * Wortlaut der Einsatzmitteilung nach § 11 Abs. 2 Satz 4 AÜG
 * Entspricht der offiziellen Vorlage (2025-05 Einsatzmitteilung 2.docx).
 * Wird für die PDF-Generierung bei Einsatzzuweisung verwendet.
 */

export const EINSATZMITTEILUNG = {
  /** Überschrift */
  title: 'Einsatzmitteilung nach § 11 Absatz 2 Satz 4 AÜG',

  /** Label: Mitarbeiter */
  labelEmployee: 'Mitarbeiter:',

  /** Kenntnissetzung (Platzhalter {companyName}) */
  knowledgeText:
    'Hiermit setze ich Sie in Kenntnis, dass Sie als Zeitarbeitnehmer für die {companyName} tätig werden.',

  /** Label: Einsatzort */
  labelFacility: 'Einsatzort:',

  /** Label: Station/Etage */
  labelStation: 'Station/Etage:',

  /** Label: Schichtart */
  labelShiftType: 'Schichtart:',

  /** Label: Ansprechpartner */
  labelContactPerson: 'Ansprechpartner:',

  /** Label: Qualifikation */
  labelQualification: 'Qualifikation:',

  /** Label: Anmerkungen */
  labelNotes: 'Anmerkungen:',

  /** Label: Einsatzzeiten */
  labelSchedule: 'Einsatzzeiten:',

  /** Tabellenkopf: Datum */
  scheduleHeaderDate: 'Datum',

  /** Tabellenkopf: Zeiten */
  scheduleHeaderTimes: 'Zeiten',

  /** Hinweis Zeiterfassung (Platzhalter: {companyName}) – App-basiert */
  hintZeiterfassung:
    'Die Einsatzzeit wird über die App erfasst. Bitte lassen Sie die Zeiterfassung vom Berechtigten am Einsatzort in der App digital unterschreiben. Die erfassten Zeiten werden automatisch an die {companyName} Zentrale übermittelt.',

  /** Optionaler Zusatz mit Kontakt-E-Mail (wird angehängt, wenn angegeben) */
  hintZeiterfassungContact: ' ({contactEmail})',

  /** Hinweis Arbeitsschutz */
  hintArbeitsschutz:
    'Bitte denken Sie an entsprechende Arbeitsschutzkleidung (Kasack, festes Schuhwerk) und achten die Hygienevorschriften sowie den zur Verfügung gestellten Hautschutzplan.',

  /** Überschrift Ablehnungsblock */
  declineTitle: 'Ablehnung der angeforderten Dienste',

  /** Text Ablehnung (Platzhalter: {declineDate} = Einsatzdatum/Schichtdatum des abgelehnten Dienstes) */
  declineText:
    'Hiermit lehne ich den angeforderten Dienst am {declineDate} ab. Mir ist bewusst, dass mir diese Zeit von meiner vertraglich vereinbarten Betriebszeit in Abzug gebracht wird.',

  /** Label Unterschrift */
  signatureLabel: 'Datum / Unterschrift Mitarbeiter/in',

  /** Label Begründung (bei ausgefüllter Ablehnung) */
  declineReasonLabel: 'Begründung:',

  /** Status-Badge: Einsatz angenommen */
  statusAccepted: 'EINSATZ ANGENOMMEN',

  /** Status-Badge: Einsatz abgelehnt */
  statusDeclined: 'EINSATZ ABGELEHNT',

  /** Bei Annahme: Bestätigungstext vor Unterschrift */
  acceptedConfirmationText: 'Hiermit bestätige ich den Einsatz.',
} as const;

export function formatEinsatzmitteilung(
  key: keyof typeof EINSATZMITTEILUNG,
  replacements: Record<string, string>
): string {
  let text: string = EINSATZMITTEILUNG[key];
  Object.entries(replacements).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });
  return text;
}
