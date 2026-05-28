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

    // Filter relevant assignments
    const relevantAssignments = assignmentsSnap.docs.filter((d) => {
      const data = d.data() as { formStatus?: string };
      return data.formStatus !== 'acknowledged' && data.formStatus !== 'declined';
    });

    // Batch-load all unique user docs in parallel (fixes N+1 query)
    const uniqueUserIds = [
      ...new Set(relevantAssignments.map((d) => (d.data() as { userId: string }).userId)),
    ];
    const userDocs = await Promise.all(
      uniqueUserIds.map((uid) => getDoc(doc(db, 'users', uid)))
    );
    const userMap = new Map<string, { email?: string; displayName?: string }>();
    for (const ud of userDocs) {
      if (ud.exists()) {
        userMap.set(ud.id, ud.data() as { email?: string; displayName?: string });
      }
    }

    // Send all emails in parallel
    const emailPromises = relevantAssignments.map(async (assignmentDoc) => {
      const data = assignmentDoc.data() as { userId: string };
      const user = userMap.get(data.userId);
      const email = user?.email;
      if (!email) return null;

      const formLink = `${origin}/employee/formulare/einsaetze/${assignmentDoc.id}`;
      try {
        await sendAssignmentFormEmail({
          to: email,
          employeeName: user?.displayName,
          formLink,
          shiftInfo: undefined,
        });
        return 1;
      } catch {
        return 0;
      }
    });

    const results = await Promise.all(emailPromises);
    const sent = results.reduce<number>((acc, r) => acc + (r ?? 0), 0);

    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
