import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Anmelden',
  description: 'Melden Sie sich bei JobFlow an.',
  robots: { index: false, follow: false },
};

export default function AnmeldenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
