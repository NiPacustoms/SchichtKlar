/**
 * Alle Cloud Functions laufen in der EU (Belgien, europe-west1) –
 * personenbezogene Daten werden nicht in den USA verarbeitet (DSGVO).
 * Der Client ruft Callables ebenfalls in dieser Region auf (lib/firebase.ts).
 */
export const REGION = 'europe-west1';
