import { describe, it, expect } from 'vitest';
import type * as functions from 'firebase-functions/v1';

import { exportUserDataHandler } from '../src/dsr/exportUserData';
import { deleteUserDataHandler } from '../src/dsr/deleteUserData';

function createContext(overrides?: Partial<functions.https.CallableContext>): functions.https.CallableContext {
  return {
    auth: {
      uid: 'user-1',
      token: { companyId: 'company-1' },
    },
    ...overrides,
  } as functions.https.CallableContext;
}

function createMockDb() {
  const calls: { type: string; args: any[] }[] = [];

  const collections: Record<string, any[]> = {
    users: [
      {
        id: 'user-1',
        companyId: 'company-1',
        email: 'user@example.com',
      },
    ],
    assignments: [
      { id: 'a1', companyId: 'company-1', userId: 'user-1' },
      { id: 'a2', companyId: 'company-1', userId: 'other-user' },
    ],
    timesheets: [
      { id: 't1', companyId: 'company-1', userId: 'user-1' },
    ],
    documents: [],
    notifications: [],
    messages: [],
  };

  const db = {
    _calls: calls,
    collection(name: string) {
      const col = collections[name] ?? [];

    const api: any = {
      doc(id: string) {
        const docData = col.find((d) => d.id === id) ?? null;
        return {
          async get() {
            return {
              exists: !!docData,
              id,
              data: () => docData,
              get: (field: string) => (docData as any)?.[field],
            };
          },
        };
      },
      where(field: string, _op: string, value: unknown) {
        // einfache Filter-Simulation; Unterstützt Kettenaufrufe .where(...).where(...)
        let filtered = col.filter((d) => (d as any)[field] === value);

        const chain: any = {
          where(nextField: string, _nextOp: string, nextValue: unknown) {
            filtered = filtered.filter((d) => (d as any)[nextField] === nextValue);
            return chain;
          },
          async get() {
            return {
              docs: filtered.map((d) => ({
                id: d.id,
                data: () => d,
                ref: { id: d.id },
              })),
              forEach(cb: (doc: any) => void) {
                filtered.forEach((d) =>
                  cb({
                    id: d.id,
                    data: () => d,
                    ref: { id: d.id },
                  }),
                );
              },
            };
          },
        };

        return chain;
      },
    };

    return api;
    },
    batch() {
      const ops: any[] = [];
      calls.push({ type: 'batch', args: [ops] });

      return {
        delete(ref: any) {
          ops.push({ type: 'delete', ref });
        },
        update(ref: any, data: any) {
          ops.push({ type: 'update', ref, data });
        },
        async commit() {
          calls.push({ type: 'commit', args: [ops] });
        },
      };
    },
  };

  return db as any;
}

describe('DSR Cloud Functions (Handler-Ebene)', () => {
  it('exportUserDataHandler exportiert nur Daten der Company und des Users', async () => {
    const db = createMockDb();

    const result = await exportUserDataHandler(
      { uid: 'user-1' },
      createContext(),
      db,
    );

    expect(result.uid).toBe('user-1');
    expect(result.companyId).toBe('company-1');
    expect(result.data.users).toHaveLength(1);
    expect(result.data.assignments).toHaveLength(1);
    expect(result.data.assignments[0]).toMatchObject({
      id: 'a1',
      userId: 'user-1',
    });
    expect(result.data.timesheets).toHaveLength(1);
  });

  it('deleteUserDataHandler führt Soft-Delete für User- und Folgedokumente aus', async () => {
    const db = createMockDb();
    const result = await deleteUserDataHandler(
      { uid: 'user-1', hardDelete: false },
      createContext(),
      db,
    );

    expect(result.uid).toBe('user-1');
    expect(result.hardDelete).toBe(false);

    const calls = (db as any)._calls as { type: string; args: any[] }[];
    const batchCall = calls.find((c) => c.type === 'batch');
    expect(batchCall).toBeTruthy();

    const commitCall = calls.find((c) => c.type === 'commit');
    expect(commitCall).toBeTruthy();
  });
});

