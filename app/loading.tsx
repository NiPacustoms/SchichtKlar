/**
 * Wird angezeigt, während die Route lädt (z. B. erste Kompilierung kann 10+ Sekunden dauern).
 */
export default function RootLoading() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '1.125rem',
        color: '#0f766e',
      }}
      aria-label="Seite wird geladen"
    >
      Schichtklar wird geladen…
    </div>
  );
}
