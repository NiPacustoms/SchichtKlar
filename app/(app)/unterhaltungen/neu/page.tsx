'use client';

// Channel anlegen (nur Admin/Dispatcher)

import { useAuth } from '@/contexts/AuthContext';
import { useChatChannels } from '@/lib/hooks/useChatChannels';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { logger } from '@/lib/logging';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';

export default function NewChannelPage() {
  const { user } = useAuth();
  const { createChannel } = useChatChannels(user?.id || '');
  const router = useRouter();
  const [channelName, setChannelName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [channelType, setChannelType] = useState<'private' | 'group' | 'system'>('group');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = user?.role === 'admin' || user?.role === 'dispatcher';

  useEffect(() => {
    if (!canCreate) {
      router.push('/unterhaltungen');
      return;
    }

    // Load available users
    const loadUsers = async () => {
      if (!db) return;
      try {
        const usersSnapshot = await getDocs(
          query(collection(db, 'users'), where('active', '==', true))
        );
        const users = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setAvailableUsers(users);
      } catch (err) {
        logger.error('Error loading users', err instanceof Error ? err : new Error(String(err)));
      }
    };

    loadUsers();
  }, [canCreate, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !channelName.trim() || selectedParticipants.length === 0) {
      setError('Bitte fülle alle Felder aus');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ensure creator is in participants
      const participants = selectedParticipants.includes(user.id)
        ? selectedParticipants
        : [...selectedParticipants, user.id];

      const result = await createChannel({
        name: channelName.trim(),
        participants,
        type: channelType,
        createdBy: user.id,
      });

      router.push(`/unterhaltungen/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen');
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  if (!canCreate) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Neuen Channel erstellen</h1>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="channelName" className="block text-sm font-medium mb-2">
            Channel-Name *
          </label>
          <input
            id="channelName"
            type="text"
            value={channelName}
            onChange={e => setChannelName(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Schichtplanung, Allgemein"
            required
          />
        </div>

        <div>
          <label htmlFor="channelType" className="block text-sm font-medium mb-2">
            Typ *
          </label>
          <select
            id="channelType"
            value={channelType}
            onChange={e => setChannelType(e.target.value as 'private' | 'group' | 'system')}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="private">Privat (1:1)</option>
            <option value="group">Gruppe</option>
            <option value="system">System</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Teilnehmer * (mindestens 1)</label>
          <div className="border rounded p-4 max-h-64 overflow-y-auto">
            {availableUsers.length === 0 ? (
              <p className="text-gray-500">Lade Benutzer...</p>
            ) : (
              <div className="space-y-2">
                {availableUsers.map(u => (
                  <label
                    key={u.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(u.id)}
                      onChange={() => toggleParticipant(u.id)}
                      className="rounded"
                    />
                    <span>{u.displayName || u.email}</span>
                    {u.role && <span className="text-xs text-gray-500">({u.role})</span>}
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedParticipants.length > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              {selectedParticipants.length} Teilnehmer ausgewählt
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded hover:bg-gray-50"
            disabled={loading}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading || !channelName.trim() || selectedParticipants.length === 0}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Erstelle...' : 'Channel erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
}
