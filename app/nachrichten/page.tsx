import { redirect } from 'next/navigation';

/** Legacy route: /nachrichten → Redirect to home. */
export default function NachrichtenRedirect() {
  redirect('/');
}

