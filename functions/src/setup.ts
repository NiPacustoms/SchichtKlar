/**
 * Muss als erstes Modul geladen werden (siehe index.ts): setzt die Region
 * für alle v2-Functions ohne eigene Angabe. v1-Functions setzen die Region
 * über functions.region(REGION).
 */
import { setGlobalOptions } from 'firebase-functions/v2';
import { REGION } from './utils/region';

setGlobalOptions({ region: REGION });
