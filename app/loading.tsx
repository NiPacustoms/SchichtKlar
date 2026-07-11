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
        color: 'var(--color-petrol-500)',
      }}
      aria-label="Seite wird geladen"
    >
      JobFlow wird geladen…
    </div>
  );
}
