import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CircuitBreaker } from '../circuitBreaker';

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker('test', { failureThreshold: 3, successThreshold: 2, timeout: 1000 });
  });

  it('startet im CLOSED-Zustand', () => {
    expect(cb.getState()).toBe('CLOSED');
  });

  it('führt erfolgreiche Aufrufe durch', async () => {
    const result = await cb.call(() => Promise.resolve(42));
    expect(result).toBe(42);
    expect(cb.getState()).toBe('CLOSED');
  });

  it('öffnet den Circuit nach Überschreiten des Fehler-Schwellwerts', async () => {
    const failing = () => Promise.reject(new Error('Service down'));
    for (let i = 0; i < 3; i++) {
      await cb.call(failing).catch(() => {});
    }
    expect(cb.getState()).toBe('OPEN');
  });

  it('wirft sofort im OPEN-Zustand ohne echten Aufruf', async () => {
    const failing = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < 3; i++) await cb.call(failing).catch(() => {});

    const spy = vi.fn();
    await expect(cb.call(spy)).rejects.toThrow('Circuit is OPEN');
    expect(spy).not.toHaveBeenCalled();
  });

  it('wechselt zu HALF_OPEN nach Timeout', async () => {
    vi.useFakeTimers();
    const failing = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < 3; i++) await cb.call(failing).catch(() => {});
    expect(cb.getState()).toBe('OPEN');

    vi.advanceTimersByTime(1001);
    const spy = vi.fn().mockResolvedValue('ok');
    await cb.call(spy);
    vi.useRealTimers();
  });

  it('schließt den Circuit nach ausreichend Erfolgen im HALF_OPEN', async () => {
    vi.useFakeTimers();
    const failing = () => Promise.reject(new Error('fail'));
    for (let i = 0; i < 3; i++) await cb.call(failing).catch(() => {});

    vi.advanceTimersByTime(1001);
    const ok = () => Promise.resolve('ok');
    await cb.call(ok);
    await cb.call(ok);
    expect(cb.getState()).toBe('CLOSED');
    vi.useRealTimers();
  });
});
