import { redirect } from 'next/navigation';

/** Legacy route: /nachrichten/[channelId] → Redirect to home. */
export default function NachrichtenChannelRedirect() {
  redirect('/');
}

