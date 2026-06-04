import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('toast.undoable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('führt die Aktion nach dem Delay aus', async () => {
    // Direkter Import – setzt setToastState auf null (kein Provider).
    // undoable fällt dann auf sofortige Ausführung zurück.
    const { toast } = await import('../toast');
    const action = vi.fn().mockResolvedValue(undefined);

    const promise = toast.undoable('Test löschen', action, 5000);
    vi.runAllTimers();
    await promise;

    expect(action).toHaveBeenCalledOnce();
  });
});
