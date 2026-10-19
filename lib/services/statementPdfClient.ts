import type { User } from '@/lib/types';
import type { LoadedStatement } from '@/lib/services/timesheetStatements';
import type { StatementPdfInput } from '@/lib/services/pdf/stundennachweisPdf';

export interface StatementPerson {
  user: Pick<User, 'displayName' | 'email'> & { personnelNumber?: string; qualifications?: string[] };
  loaded: LoadedStatement;
}

/** Erzeugt das PDF eines oder mehrerer Monatsnachweise (lädt jsPDF erst bei Bedarf) */
export async function buildStatementPdf(people: StatementPerson[]): Promise<Blob> {
  const [{ generateStatementPdf, generateStatementsPdf }, { buildCompanyFooterInfo }, { getLegalInfo }] = await Promise.all([
    import('@/lib/services/pdf/stundennachweisPdf'),
    import('@/lib/services/documentGeneration'),
    import('@/lib/config/legal'),
  ]);
  const legal = getLegalInfo();
  const inputs: StatementPdfInput[] = people.map(p => ({
    statement: p.loaded.statement,
    signatures: p.loaded.signatures,
    employeeName: p.user.displayName || p.user.email || 'Mitarbeiter/in',
    personnelNumber: p.user.personnelNumber,
    functionLabel: p.user.qualifications?.[0],
    companyName: legal.companyName,
    place: legal.address.city,
  }));
  const footer = buildCompanyFooterInfo();
  return inputs.length === 1 ? generateStatementPdf(inputs[0], footer) : generateStatementsPdf(inputs, footer);
}
