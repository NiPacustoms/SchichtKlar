import { firebaseStorageService } from '@/lib/services/firebaseStorage';

export interface DailyProofInput {
  timesheet: {
    id: string;
    userId: string;
    date: Date;
    startTime: string;
    endTime: string;
    breakMinutes: number;
    totalHours: number;
    notes?: string;
    facilitySignatureUrl?: string;
    facilitySignedAt?: Date;
    facilitySignerName?: string;
    facilityConfirmationStatus?: 'performed' | 'aborted' | 'no-show';
  };
  employee: { id: string; name?: string; email?: string };
  facility?: { id?: string; name?: string; address?: string };
}

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export const timesheetProofService = {
  async generateDailyProofPDF(input: DailyProofInput): Promise<{ url: string; path: string }> {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const margin = 40;
    let y = margin;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Tagesnachweis – Einrichtung', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y += 18;
    doc.text(`Erstellt am: ${new Date().toLocaleString('de-DE')}`, margin, y);
    y += 14;

    // Mitarbeiter / Einrichtung
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Angaben', margin, y);
    doc.setFont('helvetica', 'normal');
    y += 16;
    const lines: Array<[string, string]> = [
      ['Mitarbeiter', `${input.employee.name || input.employee.id} (${input.employee.email || ''})`],
      ['Einrichtung', `${input.facility?.name || '-'}${input.facility?.address ? ' – ' + input.facility.address : ''}`],
      ['Datum', new Date(input.timesheet.date).toLocaleDateString('de-DE')],
    ];
    lines.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value || ''), margin + 120, y);
      y += 14;
    });

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Arbeitszeiten', margin, y);
    doc.setFont('helvetica', 'normal');
    y += 16;
    const timeRows: Array<[string, string]> = [
      ['Start', input.timesheet.startTime || '-'],
      ['Ende', input.timesheet.endTime || '-'],
      ['Pause (Min)', String(input.timesheet.breakMinutes ?? 0)],
      ['Gesamt (Std.)', String(input.timesheet.totalHours ?? 0)],
    ];
    timeRows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(String(value || ''), margin + 120, y);
      y += 14;
    });

    if (input.timesheet.notes) {
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Notizen:', margin, y);
      doc.setFont('helvetica', 'normal');
      y += 14;
      const split = doc.splitTextToSize(input.timesheet.notes, 515);
      doc.text(split, margin, y);
      y += split.length * 12 + 6;
    }

    // Bestätigung Einrichtung
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Bestätigung der Einrichtung', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    const statusMap: Record<string, string> = {
      performed: 'Dienst geleistet',
      aborted: 'Abgebrochen',
      'no-show': 'Nicht angetreten',
    };
    const statusText = input.timesheet.facilityConfirmationStatus ? statusMap[input.timesheet.facilityConfirmationStatus] : '-';
    doc.text(`Status: ${statusText}`, margin, y);
    y += 14;
    doc.text(`Name der unterzeichnenden Person: ${input.timesheet.facilitySignerName || '-'}`, margin, y);
    y += 14;
    doc.text(`Unterschrieben am: ${input.timesheet.facilitySignedAt ? new Date(input.timesheet.facilitySignedAt).toLocaleString('de-DE') : '-'}`, margin, y);
    y += 16;

    if (input.timesheet.facilitySignatureUrl) {
      try {
        const dataUrl = await fetchAsDataUrl(input.timesheet.facilitySignatureUrl);
        const imgWidth = 220; // px in pt bei 72dpi passt gut
        const imgHeight = 90;
        doc.text('Unterschrift:', margin, y);
        doc.addImage(dataUrl, 'PNG', margin + 100, y - 12, imgWidth, imgHeight);
        y += imgHeight + 8;
      } catch {
        doc.text('Unterschrift: [Bild konnte nicht geladen werden]', margin, y);
        y += 14;
      }
    } else {
      doc.text('Unterschrift: –', margin, y);
      y += 14;
    }

    // Footer
    y = 800;
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Timesheet-ID: ${input.timesheet.id} • Mitarbeiter: ${input.employee.id} • Generiert von Schichtklar`, margin, y);

    const pdfBytes = doc.output('arraybuffer');
    const file = new File([new Uint8Array(pdfBytes)], `tagesnachweis_${input.timesheet.id}.pdf`, { type: 'application/pdf' });
    const upload = await firebaseStorageService.uploadFile(file, `proofs/timesheets/${input.timesheet.userId}/${input.timesheet.id}.pdf`, {
      kind: 'timesheet-daily-proof',
      timesheetId: input.timesheet.id,
      userId: input.timesheet.userId,
      date: input.timesheet.date.toISOString?.() || String(input.timesheet.date),
    });
    return { url: upload.url, path: upload.path };
  },
};


