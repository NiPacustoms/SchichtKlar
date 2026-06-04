import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum und Anbieterkennzeichnung gemäß § 5 TMG.',
  robots: { index: true, follow: false },
};

export default function ImpressumLayout({ children }: { children: React.ReactNode }) {
  return children;
}
