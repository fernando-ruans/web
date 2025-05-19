import { Socket } from 'socket.io-client';

export interface ServerToClientEvents {
  'connect': () => void;
  'disconnect': () => void;
  'pedidos': (pedidos: any[]) => void;
  'order-update': (update: { type: string; orderId: number; order: any }) => void;
  'error': (error: { message: string }) => void;
}

export interface ClientToServerEvents {
  'identify': (data: { token: string }) => void;
}

export interface CustomSocket extends Socket<ServerToClientEvents, ClientToServerEvents> {
  auth?: {
    token: string;
  };
}
