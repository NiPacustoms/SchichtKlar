#!/usr/bin/env node
/**
 * Demo-Daten für den lokalen Firebase-Emulator (NICHT für Produktion).
 *
 * Erzeugt eine vollständige Mandanten-Welt mit Firma, Admin, Pflegekräften,
 * Einrichtungen, Schichten, Einsätzen und Zeiterfassungen – geeignet für
 * UI-Arbeit, Screenshots und manuelle Tests.
 *
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *   GCLOUD_PROJECT=demo-schichtklar node scripts/seed-emulator-demo.mjs
 *
 * Login danach: admin@demo.schichtklar.de / Demo1234!   (Pflege: lea.becker@demo.schichtklar.de)
 */
import admin from 'firebase-admin';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('Abbruch: Nur gegen den Emulator ausführen (FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST fehlen).');
  process.exit(1);
}

const projectId = process.env.GCLOUD_PROJECT || 'demo-schichtklar';
admin.initializeApp({ projectId });
const db = admin.firestore();
const auth = admin.auth();
const { Timestamp, FieldValue } = admin.firestore;

const COMPANY_ID = 'demo-firma';
const PASSWORD = 'Demo1234!';

// Berliner Mitternacht eines Tages relativ zu heute (so speichert der Datepicker)
function berlinDay(offsetDays) {
  const now = new Date();
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(now);
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const hourInBerlin = Number(
    new Intl.DateTimeFormat('en', { timeZone: 'Europe/Berlin', hour: 'numeric', hourCycle: 'h23' }).format(d)
  );
  return new Date(d.getTime() - hourInBerlin * 3600_000);
}

async function upsertUser({ uid, email, displayName, role, ...rest }) {
  try {
    await auth.getUser(uid);
  } catch {
    await auth.createUser({ uid, email, password: PASSWORD, displayName, emailVerified: true });
  }
  await auth.setCustomUserClaims(uid, { role, companyId: COMPANY_ID });
  await db.doc(`users/${uid}`).set({
    email,
    displayName,
    role,
    companyId: COMPANY_ID,
    active: true,
    documents: [],
    notificationSettings: {
      emailNotifications: true,
      pushNotifications: true,
      shiftReminders: true,
      documentExpiry: true,
      systemAnnouncements: true,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ...rest,
  });
}

const nurses = [
  { uid: 'n-lea', first: 'Lea', last: 'Becker', q: ['Pflegefachkraft', 'Intensivpflege'], h: 38.5, city: 'Herten' },
  { uid: 'n-murat', first: 'Murat', last: 'Yılmaz', q: ['Pflegefachkraft', 'Wundmanagement'], h: 30, city: 'Recklinghausen' },
  { uid: 'n-anna', first: 'Anna', last: 'Kowalski', q: ['Pflegehelferin'], h: 20, city: 'Gelsenkirchen' },
  { uid: 'n-jonas', first: 'Jonas', last: 'Schäfer', q: ['Pflegefachkraft', 'Praxisanleitung'], h: 38.5, city: 'Marl' },
  { uid: 'n-sophie', first: 'Sophie', last: 'Hartmann', q: ['Altenpflegerin', 'Palliativ'], h: 32, city: 'Herten' },
  { uid: 'n-david', first: 'David', last: 'Neumann', q: ['Pflegehelfer'], h: 25, city: 'Dorsten' },
  { uid: 'n-elif', first: 'Elif', last: 'Demir', q: ['Erzieherin'], h: 30, city: 'Herne' },
  { uid: 'n-tobias', first: 'Tobias', last: 'Krüger', q: ['Pflegefachkraft'], h: 38.5, city: 'Bochum', status: 'on-leave' },
];

const facilities = [
  { id: 'f-st-elisabeth', name: 'Seniorenzentrum St. Elisabeth', city: 'Herten', street: 'Kaiserstraße 42', type: 'Stationäre Pflege', color: '#2563EB', contact: 'Frau Wagner (PDL)', stations: ['Wohnbereich 1', 'Wohnbereich 2'] },
  { id: 'f-am-park', name: 'Haus am Park', city: 'Recklinghausen', street: 'Parkallee 7', type: 'Stationäre Pflege', color: '#0D9488', contact: 'Herr Lehmann (PDL)', stations: ['Erdgeschoss', '1. OG'] },
  { id: 'f-evk', name: 'Ev. Krankenhaus Gelsenkirchen', city: 'Gelsenkirchen', street: 'Munckelstraße 27', type: 'Klinik', color: '#7C3AED', contact: 'Frau Albers (Pflegedirektion)', stations: ['Intensivstation', 'Innere 3B'] },
  { id: 'f-kita', name: 'Kita Sonnenblume', city: 'Herten', street: 'Schützenstraße 11', type: 'Kindertagesstätte', color: '#D97706', contact: 'Frau Peters (Leitung)', stations: ['Gruppe Igel'] },
  { id: 'f-ambulant', name: 'Pflegedienst Vest', city: 'Marl', street: 'Bergstraße 90', type: 'Ambulante Pflege', color: '#DB2777', contact: 'Herr Brandt (PDL)', stations: ['Tour Nord'] },
];

const SHIFT_TYPES = [
  { type: 'Frühdienst', start: '06:00', end: '14:00' },
  { type: 'Spätdienst', start: '13:30', end: '21:30' },
  { type: 'Nachtdienst', start: '21:00', end: '06:30' },
];

async function main() {
  console.log(`Seed → Projekt ${projectId}`);

  await db.doc(`companies/${COMPANY_ID}`).set({
    name: 'AufAbruf GmbH',
    legalName: 'AufAbruf GmbH',
    address: 'Ewaldstraße 15, 45699 Herten',
    email: 'dispo@aufabruf.example',
    phone: '02366 123 456',
    holidayState: 'NW',
    createdAt: FieldValue.serverTimestamp(),
  });

  await upsertUser({
    uid: 'admin-pepe',
    email: 'admin@demo.schichtklar.de',
    displayName: 'Pepe Disposition',
    role: 'admin',
    qualifications: [],
    phone: '0170 1234567',
  });

  let pnr = 100;
  for (const n of nurses) {
    pnr += 1;
    const ascii = t => t.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/ı/g, 'i').normalize('NFD').replace(/[^a-z]/g, '');
    const email = `${ascii(n.first)}.${ascii(n.last)}@demo.schichtklar.de`;
    await upsertUser({
      uid: n.uid,
      email: n.uid === 'n-lea' ? 'lea.becker@demo.schichtklar.de' : email,
      displayName: `${n.first} ${n.last}`,
      firstName: n.first,
      lastName: n.last,
      role: 'nurse',
      qualifications: n.q,
      workingHoursPerWeek: n.h,
      // eine Person ohne Personalnummer, damit der Lohnexport den Hinweis zeigt
      ...(n.uid === 'n-elif' ? {} : { personnelNumber: String(pnr) }),
      vacationDaysPerYear: n.uid === 'n-elif' ? 28 : 30,
      wochenstundenLimit: 48,
      aktuelleWochenstunden: Math.round(n.h * 0.7),
      limitStatus: 'normal',
      currentStatus: n.status ?? 'active',
      phone: '0151 ' + String(1000000 + nurses.indexOf(n) * 7331).slice(0, 7),
      address: { city: n.city, country: 'Deutschland' },
    });
  }

  for (const f of facilities) {
    await db.doc(`facilities/${f.id}`).set({
      companyId: COMPANY_ID,
      name: f.name,
      address: `${f.street}, ${f.city}`,
      contactPerson: f.contact,
      phone: '02366 98 76 5' + facilities.indexOf(f),
      email: `pdl@${f.id.replace('f-', '')}.example`,
      contactEmail: `pdl@${f.id.replace('f-', '')}.example`,
      type: f.type,
      status: 'active',
      colorCode: f.color,
      debtorNumber: `D-${10010 + facilities.indexOf(f)}`,
      stations: f.stations.map((name, i) => ({ id: `${f.id}-s${i}`, name, requiredQualifications: [], maxStaff: 3 })),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // Schichten: 7 Tage zurück bis 14 Tage voraus
  let shiftCount = 0;
  let asgCount = 0;
  let tsCount = 0;
  const nurseIds = nurses.filter(n => n.status !== 'on-leave').map(n => n.uid);
  let rr = 0;
  for (let day = -7; day <= 14; day++) {
    // Regel „1 Einsatz pro Tag": jede Person höchstens einmal je Kalendertag
    const busyToday = new Set();
    const date = berlinDay(day);
    const weekday = new Date(date.getTime() + 12 * 3600_000).getUTCDay();
    for (const f of facilities) {
      const typesToday = f.type === 'Kindertagesstätte'
        ? (weekday === 0 || weekday === 6 ? [] : [{ type: 'Frühdienst', start: '07:00', end: '15:00' }])
        : SHIFT_TYPES.filter((_, i) => (day + facilities.indexOf(f) + i) % 3 !== 0);
      for (const t of typesToday) {
        const shiftId = `s-${f.id}-${day + 7}-${t.type}`;
        // Belegung: Vergangenheit voll, Zukunft teils offen
        const filled = day < 0 || (day + facilities.indexOf(f)) % 4 !== 0;
        let userId = null;
        if (filled) {
          for (let tries = 0; tries < nurseIds.length && !userId; tries++) {
            const candidate = nurseIds[rr++ % nurseIds.length];
            if (!busyToday.has(candidate)) userId = candidate;
          }
          if (userId) busyToday.add(userId);
        }
        await db.doc(`shifts/${shiftId}`).set({
          companyId: COMPANY_ID,
          facilityId: f.id,
          stationId: `${f.id}-s0`,
          date: Timestamp.fromDate(date),
          startTime: t.start,
          endTime: t.end,
          type: t.type,
          requiredQualifications: [],
          requiredSkills: [],
          maxStaff: 1,
          capacity: 1,
          assignedCount: userId ? 1 : 0,
          status: userId ? 'filled' : 'open',
          tz: 'Europe/Berlin',
          createdBy: 'admin-pepe',
          surchargeNight: t.type === 'Nachtdienst',
          surchargeWeekend: weekday === 0 || weekday === 6,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        shiftCount++;
        if (!userId) continue;
        const status = day < -1 ? 'completed' : day < 0 ? 'pending-signature' : day < 3 ? 'accepted' : 'assigned';
        const asgId = `a-${shiftId}`;
        await db.doc(`assignments/${asgId}`).set({
          companyId: COMPANY_ID,
          userId,
          shiftId,
          facilityId: f.id,
          status,
          startDate: Timestamp.fromDate(date),
          startTime: t.start,
          endTime: t.end,
          assignedAt: FieldValue.serverTimestamp(),
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        asgCount++;
        if (day < 0) {
          const hours = t.type === 'Nachtdienst' ? 9 : 7.5;
          await db.doc(`timesheets/t-${asgId}`).set({
            companyId: COMPANY_ID,
            userId,
            assignmentId: asgId,
            shiftId,
            facilityId: f.id,
            date: Timestamp.fromDate(date),
            startTime: t.start,
            endTime: t.end,
            breakMinutes: 30,
            totalHours: hours,
            status: day < -3 ? 'approved' : 'submitted',
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          tsCount++;
        }
      }
    }
  }

  // Vormonat: freigegebene Zeiten für den Stundennachweis (Lea, Jonas)
  {
    const now = new Date();
    const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const ym = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}`;
    const berlinMidnight = d => {
      const noon = new Date(`${ym}-${String(d).padStart(2, '0')}T12:00:00Z`);
      const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' }).format(noon));
      return new Date(noon.getTime() - h * 3600_000);
    };
    const plan = [
      ['n-lea', 3, '13:30', '21:15', 30, 7.25, facilities[0].id],
      ['n-lea', 11, '07:00', '13:00', 30, 5.5, facilities[1].id],
      ['n-lea', 22, '07:00', '13:00', 30, 5.5, facilities[0].id],
      ['n-lea', 24, '07:00', '11:30', 30, 4, facilities[0].id],
      ['n-jonas', 8, '06:00', '14:00', 30, 7.5, facilities[2].id],
      ['n-jonas', 9, '06:00', '14:00', 30, 7.5, facilities[2].id],
    ];
    for (const [userId, d, start, end, pause, hours, facilityId] of plan) {
      await db.doc(`timesheets/prev-${userId}-${d}`).set({
        companyId: COMPANY_ID, userId, facilityId, date: Timestamp.fromDate(berlinMidnight(d)),
        startTime: start, endTime: end, breakMinutes: pause, totalHours: hours, status: 'approved',
        facilitySignerName: 'Frau Lehmann (PDL)', facilitySignedAt: Timestamp.fromDate(berlinMidnight(d)),
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
      tsCount++;
    }
  }

  // Ein per Matching ausgeschriebener Einsatz (Angebot an Lea)
  await db.doc('assignments/a-angebot-1').set({
    companyId: COMPANY_ID,
    status: 'published',
    userId: null,
    facilityId: 'f-am-park',
    startDate: Timestamp.fromDate(berlinDay(5)),
    startTime: '06:00',
    endTime: '14:00',
    qualification: 'Pflegefachkraft',
    candidateUserIds: ['n-lea', 'n-jonas', 'n-murat'],
    declinedUserIds: [],
    createdBy: 'admin-pepe',
    assignedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Abwesenheiten: genehmigter Urlaub, offene Anträge (teils überlappend), eine Krankmeldung
  const dayKey = d => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(berlinDay(d));
  const absences = [
    { id: 'abs-lea-sommer', userId: 'n-lea', type: 'vacation', fromKey: `${dayKey(0).slice(0, 4)}-08-03`, toKey: `${dayKey(0).slice(0, 4)}-08-14`, status: 'approved', decidedBy: 'admin-pepe' },
    { id: 'abs-lea-antrag', userId: 'n-lea', type: 'vacation', fromKey: dayKey(21), toKey: dayKey(25), status: 'requested', note: 'Familienbesuch' },
    { id: 'abs-jonas-antrag', userId: 'n-jonas', type: 'vacation', fromKey: dayKey(23), toKey: dayKey(30), status: 'requested' },
    { id: 'abs-murat-krank', userId: 'n-murat', type: 'sick', fromKey: dayKey(0), toKey: dayKey(2), status: 'reported', auProvided: false },
  ];
  for (const { id, ...a } of absences) {
    await db.doc(`absences/${id}`).set({ companyId: COMPANY_ID, note: null, ...a, createdAt: FieldValue.serverTimestamp() });
  }

  await db.doc('adminAnnouncements/ann-1').set({
    companyId: COMPANY_ID,
    title: 'Neue Dienstplanung ab November',
    text: 'Ab 1. November bitte Wunschdienste bis zum 20. des Vormonats eintragen.',
    message: 'Ab 1. November bitte Wunschdienste bis zum 20. des Vormonats eintragen.',
    createdAt: FieldValue.serverTimestamp(),
    createdBy: 'admin-pepe',
  });

  console.log(`Fertig: ${nurses.length} Pflegekräfte, ${facilities.length} Einrichtungen, ${shiftCount} Schichten, ${asgCount} Einsätze, ${tsCount} Zeiterfassungen.`);
  console.log(`Login Admin: admin@demo.schichtklar.de / ${PASSWORD}`);
  console.log(`Login Pflege: lea.becker@demo.schichtklar.de / ${PASSWORD}`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
