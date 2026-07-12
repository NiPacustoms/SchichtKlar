import { describe, it, expect } from 'vitest';

describe('AuthService', () => {
  it('signIn wirft Fehler, wenn Firebase Auth nicht initialisiert ist', async () => {
    const { AuthService } = await import('../authService');

    await expect(
      AuthService.signIn('test@example.com', 'secret'),
    ).rejects.toThrow(/Firebase Auth is not initialized/);
  });

  it('signUp wirft Fehler, da öffentliche Registrierung deaktiviert ist', async () => {
    const { AuthService } = await import('../authService');

    await expect(
      AuthService.signUp('new@example.com', 'secret', 'New User'),
    ).rejects.toThrow(/öffentliche Registrierung ist deaktiviert/i);
  });

  it('signOut wirft Fehler, wenn Firebase Auth nicht initialisiert ist', async () => {
    const { AuthService } = await import('../authService');

    await expect(AuthService.signOut()).rejects.toThrow(/Firebase Auth is not initialized/);
  });

  it('getUserProfile wirft Fehler, wenn Firestore serverseitig (ohne window) verwendet wird', async () => {
    // In der Node-Testumgebung gibt es kein window, daher wirft getDb()
    // "Firestore kann nur clientseitig initialisiert werden."
    const { AuthService } = await import('../authService');

    await expect(AuthService.getUserProfile('user-1')).rejects.toThrow(
      /Firestore kann nur clientseitig initialisiert werden/,
    );
  });
});


