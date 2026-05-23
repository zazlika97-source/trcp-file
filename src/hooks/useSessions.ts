import { useState, useEffect, useCallback } from 'react';
import type { Session, SessionCreateData } from '@/types';
import { useSocket } from './useSocket';

export function useSessions() {
  const { emit, on, off, connected } = useSocket();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connected) return;

    emit('session:list').then((response: any) => {
      if (response?.sessions) {
        setSessions(response.sessions);
      }
      setLoading(false);
    });

    const handleUpdate = (session: Session) => {
      setSessions(prev =>
        prev.map(s => (s.id === session.id ? session : s))
      );
    };

    const handleCreate = (session: Session) => {
      setSessions(prev => [...prev, session]);
    };

    const handleDelete = ({ sessionId }: { sessionId: string }) => {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    };

    on('session:update', handleUpdate);
    on('session:create', handleCreate);
    on('session:delete', handleDelete);

    return () => {
      off('session:update', handleUpdate);
      off('session:create', handleCreate);
      off('session:delete', handleDelete);
    };
  }, [connected, emit, on, off]);

  const createSession = useCallback(
    async (data: SessionCreateData) => {
      const response: any = await emit('session:create', data);
      return response;
    },
    [emit]
  );

  const startSession = useCallback(
    async (sessionId: string) => {
      const response: any = await emit('session:start', sessionId);
      return response;
    },
    [emit]
  );

  const stopSession = useCallback(
    async (sessionId: string) => {
      const response: any = await emit('session:stop', sessionId);
      return response;
    },
    [emit]
  );

  const restartSession = useCallback(
    async (sessionId: string) => {
      const response: any = await emit('session:restart', sessionId);
      return response;
    },
    [emit]
  );

  const killSession = useCallback(
    async (sessionId: string) => {
      const response: any = await emit('session:kill', sessionId);
      return response;
    },
    [emit]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      const response: any = await emit('session:delete', sessionId);
      return response;
    },
    [emit]
  );

  const duplicateSession = useCallback(
    async (sessionId: string) => {
      const response: any = await emit('session:duplicate', sessionId);
      return response;
    },
    [emit]
  );

  return {
    sessions,
    loading,
    createSession,
    startSession,
    stopSession,
    restartSession,
    killSession,
    deleteSession,
    duplicateSession,
  };
}
