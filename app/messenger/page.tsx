import { redirect } from 'next/navigation';

/**
 * Legacy route: /messenger → Redirect to employee dashboard.
 */
export default function MessengerRedirect() {
  redirect('/employee/arbeitsplatz');
}

