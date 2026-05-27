import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung gemäß DSGVO für die JobFlow-App.',
  robots: { index: true, follow: false },
};

export default function DatenschutzLayout({ children }: { children: React.ReactNode }) {
  return children;
}
