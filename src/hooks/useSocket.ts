import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return globalSocket;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    const onConnect = () => {
      setConnected(true);
      setConnecting(false);
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onConnectError = () => {
      setConnecting(false);
    };

    if (socket.connected) {
      setConnected(true);
      setConnecting(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  const emit = useCallback(<T = any>(event: string, ...args: any[]): Promise<T> => {
    return new Promise((resolve) => {
      socketRef.current.emit(event, ...args, (response: T) => {
        resolve(response);
      });
    });
  }, []);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    socketRef.current.on(event, callback);
    return () => {
      socketRef.current.off(event, callback);
    };
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (callback) {
      socketRef.current.off(event, callback);
    } else {
      socketRef.current.off(event);
    }
  }, []);

  return {
    socket: socketRef.current,
    connected,
    connecting,
    emit,
    on,
    off,
  };
}

export { getSocket };
