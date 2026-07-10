import { notFound } from 'next/navigation';

// Debug-Seiten sind in Produktion nicht erreichbar (Go-Live-Checkliste).
export default function DebugLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return children;
}
