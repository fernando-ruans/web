import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

export interface WebSocketContextType {
  socket: ReturnType<typeof io> | null;
  connected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Criar conexão Socket.IO com o backend
    const newSocket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    // Manipuladores de eventos de conexão
    newSocket.on('connect', () => {
      console.log('WebSocket conectado');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket desconectado');
      setConnected(false);
    });

    setSocket(newSocket);

    // Limpar socket ao desmontar
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
