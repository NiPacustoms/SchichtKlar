import { auth } from '@/lib/firebase';
import { OAuthProvider, signInWithRedirect } from 'firebase/auth';

export async function signInWithOidc(providerId?: string) {
  if (!auth) throw new Error('Firebase Auth ist nicht initialisiert');
  const id = providerId || process.env.NEXT_PUBLIC_OIDC_PROVIDER_ID;
  if (!id) throw new Error('OIDC Provider ID is not configured');
  const provider = new OAuthProvider(id);
  await signInWithRedirect(auth, provider);
}


