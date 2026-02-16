import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { sendAssignmentFormEmail } from '@/lib/services/email';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    const twentyFourHoursAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

    const db = getDb();
    const assignmentsQuery = query(
      collection(db, 'assignments'),
      where('status', '==', 'assigned'),
      where('assignedAt', '<=', twentyFourHoursAgo)
    );
    const assignmentsSnap = await getDocs(assignmentsQuery);

    let sent = 0;
    for (const assignmentDoc of assignmentsSnap.docs) {
      const data = assignmentDoc.data() as { formStatus?: string; userId: string };
      if (data.formStatus === 'acknowledged' || data.formStatus === 'declined') continue;

      const userDocRef = doc(db, 'users', data.userId);
      const userDoc = await getDoc(userDocRef);
      const user = userDoc.exists()
        ? (userDoc.data() as { email?: string; displayName?: string })
        : null;
      const email = user?.email;
      if (!email) continue;

      const formLink = `${origin}/employee/formulare/einsaetze/${assignmentDoc.id}`;
      await sendAssignmentFormEmail({
        to: email,
        employeeName: user?.displayName,
        formLink,
        shiftInfo: undefined,
      });
      sent += 1;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
