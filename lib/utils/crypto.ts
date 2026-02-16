// Einfaches AES-GCM Crypto-Utility für clientseitige E2E-Verschlüsselung
// Hinweis: Demo-Schlüsselverwaltung per localStorage pro Channel

import { logger } from '@/lib/logging';

import { auth } from '@/lib/firebase';

const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();
const CHANNEL_KEY_PREFIX = 'chat:e2e:key:';
const STORAGE_VERSION = 1;

async function importKey(rawKey: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', true, ['encrypt', 'decrypt']);
}

async function generateKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('raw', key);
}

function toBase64(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin);
}

function fromBase64(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

const getLocalStorage = (): Storage | null => {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
};

const getKeySeed = async (): Promise<ArrayBuffer> => {
  const fallbackSeed =
    (typeof navigator !== 'undefined' ? navigator.userAgent : 'jobflow-offline') + '|jobflow';
  const firebaseUser = auth?.currentUser;
  const seed = firebaseUser
    ? `${firebaseUser.uid}::${firebaseUser.metadata?.creationTime ?? ''}`
    : fallbackSeed;
  return crypto.subtle.digest('SHA-256', TEXT_ENCODER.encode(seed));
};

const getMasterKey = async (): Promise<CryptoKey> => {
  const material = await getKeySeed();
  return crypto.subtle.importKey('raw', material, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

const loadChannelKey = async (channelId: string): Promise<ArrayBuffer | null> => {
  const storage = getLocalStorage();
  if (!storage) return null;
  const storageKey = `${CHANNEL_KEY_PREFIX}${channelId}`;
  const stored = storage.getItem(storageKey);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as { iv: string; data: string; v?: number };
    if (!parsed?.iv || !parsed?.data) {
      storage.removeItem(storageKey);
      return null;
    }
    const masterKey = await getMasterKey();
    const iv = new Uint8Array(fromBase64(parsed.iv));
    const encrypted = fromBase64(parsed.data);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, masterKey, encrypted);
    return decrypted;
  } catch (error) {
    storage.removeItem(storageKey);
    logger.warn('Konnte gespeicherten Chat-Schlüssel nicht entschlüsseln und entferne ihn.', error);
    return null;
  }
};

const storeChannelKey = async (channelId: string, rawKey: ArrayBuffer): Promise<void> => {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    const masterKey = await getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, masterKey, rawKey);
    const payload = JSON.stringify({
      v: STORAGE_VERSION,
      iv: toBase64(iv.buffer),
      data: toBase64(encrypted),
    });
    storage.setItem(`${CHANNEL_KEY_PREFIX}${channelId}`, payload);
  } catch (error) {
    logger.error('Speichern des Chat-Schlüssels fehlgeschlagen:', error);
  }
};

async function getOrCreateChannelKey(channelId: string): Promise<CryptoKey> {
  const existingRaw = await loadChannelKey(channelId);
  if (existingRaw) {
    return importKey(existingRaw);
  }

  const key = await generateKey();
  const raw = await exportKey(key);
  await storeChannelKey(channelId, raw);
  return key;
}

export async function encryptForChannel(channelId: string, plaintext: string): Promise<{ ciphertextB64: string; ivB64: string; algo: 'AES-GCM' }>{
  const key = await getOrCreateChannelKey(channelId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = TEXT_ENCODER.encode(plaintext);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return { ciphertextB64: toBase64(ct), ivB64: toBase64(iv.buffer), algo: 'AES-GCM' };
}

export async function decryptForChannel(channelId: string, ciphertextB64: string, ivB64: string): Promise<string> {
  const key = await getOrCreateChannelKey(channelId);
  const iv = new Uint8Array(fromBase64(ivB64));
  const ct = fromBase64(ciphertextB64);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return TEXT_DECODER.decode(pt);
}


