/* Standalone-Vorschau der neuen Dokument-Layouts (spiegelt documentLayout.ts + documentGeneration.ts).
   Erzeugt zwei PDFs mit Beispieldaten zur visuellen Begutachtung. Logo wird weggelassen (null). */
const { jsPDF } = require('jspdf');
const autoTableModule = require('jspdf-autotable');
const autoTable = autoTableModule.default || autoTableModule.applyPlugin ? autoTableModule.default : autoTableModule;
const fs = require('fs');
const path = require('path');

const DOC_COLORS = {
  accent: [31, 78, 121],
  text: [33, 37, 41],
  muted: [108, 117, 125],
  line: [206, 212, 218],
  zebra: [245, 247, 250],
};

const company = {
  companyName: 'AufAbruf GmbH',
  street: 'Musterstraße 12',
  postalCode: '80331',
  city: 'München',
  phone: '089 / 123 456 78',
  email: 'info@aufabruf.de',
  web: 'www.aufabruf.de',
  registerCourt: 'Amtsgericht München',
  registerNumber: 'HRB 234567',
  managingDirectors: 'Max Mustermann',
  vatId: 'DE123456789',
  auegPermit: 'Erlaubnis zur Arbeitnehmerüberlassung gem. § 1 AÜG unbefristet erteilt durch die Bundesagentur für Arbeit',
};

function drawLetterhead(doc, company, margin = 18) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const top = 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...DOC_COLORS.accent);
  doc.text(company.companyName, margin, top + 8);
  const sender = [company.street, [company.postalCode, company.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...DOC_COLORS.muted);
  doc.text(sender, margin, top + 14);
  const ruleY = top + 20;
  doc.setDrawColor(...DOC_COLORS.accent);
  doc.setLineWidth(0.8);
  doc.line(margin, ruleY, pageWidth - margin, ruleY);
  doc.setTextColor(...DOC_COLORS.text);
  return ruleY + 10;
}

function applyLegalFooter(doc, company, margin = 18) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const footerTop = pageHeight - 28;
    doc.setDrawColor(...DOC_COLORS.line);
    doc.setLineWidth(0.3);
    doc.line(margin, footerTop, pageWidth - margin, footerTop);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...DOC_COLORS.muted);
    const colWidth = (pageWidth - margin * 2) / 3;
    const lineH = 3.2;
    const col1 = [company.companyName, company.street, [company.postalCode, company.city].filter(Boolean).join(' ')].filter(Boolean);
    const col2 = [[company.registerCourt, company.registerNumber].filter(Boolean).join(' · '), `Geschäftsführer: ${company.managingDirectors}`, `USt-IdNr.: ${company.vatId}`];
    const col3 = [`Tel.: ${company.phone}`, company.email, company.web];
    const drawCol = (lines, x) => lines.forEach((l, i) => doc.text(l, x, footerTop + 5 + i * lineH));
    drawCol(col1, margin);
    drawCol(col2, margin + colWidth);
    drawCol(col3, margin + colWidth * 2);
    const maxLines = Math.max(col1.length, col2.length, col3.length);
    doc.text(company.auegPermit, margin, footerTop + 5 + maxLines * lineH + 1.5);
    doc.text(`Seite ${p} von ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    doc.setTextColor(...DOC_COLORS.text);
  }
}

const fmtHours = (v) => v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ---------- 1) Stundennachweis ----------
function buildTimesheet() {
  const doc = new jsPDF();
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = drawLetterhead(doc, company, margin);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...DOC_COLORS.text);
  doc.text('Stundennachweis / Tätigkeitsnachweis', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...DOC_COLORS.muted);
  doc.text('Arbeitnehmerüberlassung gem. AÜG · Arbeitszeitaufzeichnung nach § 16 Abs. 2 ArbZG / § 17 MiLoG', margin, y);
  y += 10;

  const colGap = 6;
  const colWidth = (pageWidth - margin * 2 - colGap) / 2;
  const rightX = margin + colWidth + colGap;
  const blockTop = y;
  const drawInfoBlock = (x, heading, rows) => {
    let by = blockTop;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...DOC_COLORS.accent);
    doc.text(heading, x, by); by += 5; doc.setTextColor(...DOC_COLORS.text);
    rows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.text(label, x, by);
      doc.setFont('helvetica', 'normal');
      const vl = doc.splitTextToSize(value || '–', colWidth - 32);
      doc.text(vl, x + 32, by); by += Math.max(5, vl.length * 4.6);
    });
    return by;
  };
  const leftEnd = drawInfoBlock(margin, 'Mitarbeiter (Leiharbeitnehmer)', [['Name:', 'Anna Beispiel'], ['Tätigkeit:', 'Examinierte Pflegefachkraft']]);
  const rightEnd = drawInfoBlock(rightX, 'Entleiher (Einsatzbetrieb)', [['Einrichtung:', 'Seniorenresidenz Sonnenhof'], ['Anschrift:', 'Lindenweg 4, 81234 München'], ['Station:', 'Wohnbereich 2']]);
  y = Math.max(leftEnd, rightEnd) + 4;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...DOC_COLORS.text);
  doc.text('Abrechnungszeitraum: 01.05.2026 – 31.05.2026', margin, y);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...DOC_COLORS.muted);
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, pageWidth - margin, y, { align: 'right' });
  y += 8; doc.setTextColor(...DOC_COLORS.text);

  const rows = [
    ['05.05.2026', '06:00', '14:30', '30 Min', '8,00', '0,00', '0,00', 'Genehmigt'],
    ['10.05.2026', '21:45', '06:15', '45 Min', '7,75', '6,00', '0,00', 'Genehmigt'],
    ['17.05.2026', '06:00', '18:00', '60 Min', '11,00', '0,00', '11,00', 'Genehmigt'],
    ['24.05.2026', '13:30', '22:00', '30 Min', '8,00', '1,00', '8,00', 'Eingereicht'],
  ];
  autoTable(doc, {
    head: [['Datum', 'Beginn', 'Ende', 'Pause', 'Std.', 'dav. Nacht', 'dav. So/Ft', 'Status']],
    body: rows,
    startY: y,
    styles: { fontSize: 8.5, cellPadding: 2, textColor: DOC_COLORS.text },
    headStyles: { fillColor: DOC_COLORS.accent, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: DOC_COLORS.zebra },
    theme: 'grid',
    margin: { left: margin, right: margin },
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 8;

  const sumX = pageWidth - margin - 70;
  doc.setDrawColor(...DOC_COLORS.line); doc.setLineWidth(0.3); doc.line(sumX, y, pageWidth - margin, y); y += 5;
  const sumRow = (l, v, b) => { doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.setFontSize(9); doc.text(l, sumX, y); doc.text(v, pageWidth - margin, y, { align: 'right' }); y += 5.5; };
  sumRow('Gesamtstunden:', `${fmtHours(34.75)} h`, true);
  sumRow('davon Nachtstunden:', `${fmtHours(7)} h`);
  sumRow('davon Sonn-/Feiertag:', `${fmtHours(19)} h`);
  sumRow('genehmigte Stunden:', `${fmtHours(26.75)} h`);
  y += 12;

  const sigWidth = (pageWidth - margin * 2 - 16) / 2;
  const sigLineY = y + 16;
  doc.setDrawColor(...DOC_COLORS.text); doc.setLineWidth(0.3);
  doc.line(margin, sigLineY, margin + sigWidth, sigLineY);
  doc.line(margin + sigWidth + 16, sigLineY, margin + sigWidth * 2 + 16, sigLineY);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...DOC_COLORS.muted);
  doc.text('Datum, Unterschrift Mitarbeiter/in', margin, sigLineY + 5);
  doc.text('Datum, Unterschrift / Stempel Entleiher', margin + sigWidth + 16, sigLineY + 5);
  y = sigLineY + 12;
  doc.setFontSize(7.5);
  const legal = doc.splitTextToSize('Mit seiner Unterschrift bestätigt der Entleiher die Richtigkeit der erfassten Arbeitszeiten. Aufzeichnung und Aufbewahrung gemäß § 16 Abs. 2 ArbZG und § 17 MiLoG (Aufbewahrungsfrist: mindestens 2 Jahre).', pageWidth - margin * 2);
  doc.text(legal, margin, y);

  applyLegalFooter(doc, company, margin);
  return doc;
}

// ---------- 2) Einsatzmitteilung ----------
function buildNotification() {
  const doc = new jsPDF();
  const margin = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  const companyName = company.companyName;
  let y = drawLetterhead(doc, company, margin);

  doc.setFontSize(9.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...DOC_COLORS.muted);
  doc.text('Erstellt am: 28.05.2026', pageWidth - margin, y, { align: 'right' });
  doc.setTextColor(...DOC_COLORS.text);

  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...DOC_COLORS.accent);
  doc.text('Einsatzmitteilung', margin, y); y += 5;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...DOC_COLORS.muted);
  doc.text('gemäß § 11 Absatz 2 Satz 4 AÜG', margin, y); y += 11; doc.setTextColor(...DOC_COLORS.text);

  const statusLabel = 'EINSATZ ANGENOMMEN';
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  const badgeW = doc.getTextWidth(statusLabel) + 8;
  doc.setFillColor(27, 94, 32);
  doc.roundedRect(margin, y - 5, badgeW, 8, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255); doc.text(statusLabel, margin + 4, y);
  doc.setTextColor(...DOC_COLORS.text); y += 13;

  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text('Mitarbeiter:', margin, y);
  doc.setFont('helvetica', 'normal'); doc.text('Anna Beispiel', margin + 45, y); y += 10;
  doc.text(`Hiermit setze ich Sie in Kenntnis, dass Sie als Zeitarbeitnehmer für die ${companyName} tätig werden.`, margin, y); y += 10;

  doc.setFont('helvetica', 'bold'); doc.text('Einsatzort:', margin, y);
  doc.setFont('helvetica', 'normal'); doc.text('Seniorenresidenz Sonnenhof, Wohnbereich 2, Lindenweg 4, 81234 München', margin + 45, y); y += 8;
  doc.setFont('helvetica', 'bold'); doc.text('Schichtart:', margin, y);
  doc.setFont('helvetica', 'normal'); doc.text('Spätdienst', margin + 45, y); y += 8;

  doc.setFont('helvetica', 'bold'); doc.text('Einsatzzeiten:', margin, y); y += 7;
  doc.setFont('helvetica', 'normal');
  autoTable(doc, { startY: y, head: [['Datum', 'Zeiten']], body: [['24.05.2026', '13:30 – 22:00 Uhr']], margin: { left: margin }, theme: 'plain', headStyles: { fontStyle: 'bold' } });
  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  doc.setFontSize(10);
  const h1 = doc.splitTextToSize(`Die Einsatzzeit wird über die App erfasst. Bitte lassen Sie die Zeiterfassung vom Berechtigten am Einsatzort in der App digital unterschreiben. Die erfassten Zeiten werden automatisch an die ${companyName} Zentrale übermittelt.`, contentWidth);
  h1.forEach((l) => { doc.text(l, margin, y); y += 6; }); y += 4;
  const h2 = doc.splitTextToSize('Bitte denken Sie an entsprechende Arbeitsschutzkleidung (Kasack, festes Schuhwerk) und achten die Hygienevorschriften sowie den zur Verfügung gestellten Hautschutzplan.', contentWidth);
  h2.forEach((l) => { doc.text(l, margin, y); y += 6; }); y += 6;

  y += 14;
  const signatureY = y + 18;
  doc.setDrawColor(...DOC_COLORS.text);
  doc.line(margin, signatureY, margin + 100, signatureY);
  y = signatureY + 8;
  doc.setFontSize(10); doc.text('Datum / Unterschrift Mitarbeiter/in', margin, y);
  y += 14; doc.text('Datum: 28.05.2026', margin, y);

  applyLegalFooter(doc, company, margin);
  return doc;
}

const outDir = path.join(__dirname, '..', '.preview');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'Stundennachweis.pdf'), Buffer.from(buildTimesheet().output('arraybuffer')));
fs.writeFileSync(path.join(outDir, 'Einsatzmitteilung.pdf'), Buffer.from(buildNotification().output('arraybuffer')));
console.log('OK: PDFs in .preview/ erstellt');
