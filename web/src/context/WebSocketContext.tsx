import React, { createContext, useContext, useEffect, useState } from 'react';
import { Manager } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Definindo uma interface básica para o Socket
interface SocketInterface {
  on: (event: string, callback: Function) => void;
  off: (event: string, callback?: Function) => void;
  emit: (event: string, ...args: any[]) => void;
  disconnect: () => void;
}

interface WebSocketContextType {
  socket: SocketInterface | null;
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<SocketInterface | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const manager = new Manager(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
      autoConnect: true,
      auth: {
        token: localStorage.getItem('token')
      }
    });
    
    const newSocket = manager.socket('/');

    newSocket.on('connect', () => {
      console.log('WebSocket conectado');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket desconectado');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <WebSocketContext.Provider value={{ socket, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;