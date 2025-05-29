import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface Pedido {
  id: number;
  status: string;
  total: number;
  observacao?: string;
  data_criacao: string;
  clienteNome: string;
  items: Array<{
    id: number;
    quantidade: number;
    produto: {
      id: number;
      nome: string;
      preco: number;
    };
  }>;
  address?: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    complemento?: string;
    cep: string;
  };
}

interface WebSocketMessage {
  type: 'pedidos' | 'order-update' | 'new-order';
  data: any;
}

interface WebSocketContextType {
  pedidos: Pedido[];
  connected: boolean;
  socket: WebSocket | null;
  sendMessage: (type: string, data: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  pedidos: [],
  connected: false,
  socket: null,
  sendMessage: () => {} // Função vazia como valor padrão
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [connected, setConnected] = useState(false);
  const token = localStorage.getItem('token');
  const apiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:3333').replace(/^http/, 'ws');

  const connect = useCallback(() => {
    if (!token) return;
    try {
      console.log('[WS][GLOBAL] Tentando conectar em:', `${apiUrl}?token=${token}`); // LOG de tentativa de conexão
      const websocket = new WebSocket(`${apiUrl}?token=${token}`);
      websocket.onopen = () => {
        console.log('[WS][GLOBAL] Conectado!');
        setConnected(true);
        websocket.send(JSON.stringify({ type: 'identify', data: { token } }));
      };
      websocket.onclose = () => {
        console.log('[WS][GLOBAL] Desconectado!');
        setConnected(false);
        setTimeout(connect, 5000);
      };
      websocket.onerror = (error) => {
        console.error('[WS][GLOBAL] Erro no WebSocket:', error);
      };
      websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WS][GLOBAL] Mensagem recebida no contexto:', message); // LOG GLOBAL
          switch (message.type) {
            case 'pedidos':
              // Compatibilizar campos de data para ambos os nomes
              const pedidosCorrigidos = (message.data || []).map((pedido: any) => ({
                ...pedido,
                status: (pedido.status || '').toLowerCase(),
                createdAt: pedido.createdAt || pedido.data_criacao || '',
                data_criacao: pedido.data_criacao || pedido.createdAt || '',
              }));
              setPedidos(pedidosCorrigidos);
              console.log('Pedidos processados:', pedidosCorrigidos);
              (pedidosCorrigidos as any[]).forEach((p: any) => {
                console.log(`[WS][Pedido] id=${p.id} createdAt=${p.createdAt} data_criacao=${p.data_criacao}`);
              });
              break;
            case 'order-update':
              if (message.data.type === 'status-update') {
                setPedidos(prevPedidos => 
                  prevPedidos.map(pedido => 
                    pedido.id === message.data.orderId 
                      ? { ...pedido, ...message.data.order } 
                      : pedido
                  )
                );
              }
              break;
            case 'new-order':
              // Tratar especificamente novos pedidos
              console.log('Novo pedido recebido via WebSocket:', message.data);
              setPedidos(prevPedidos => {
                const novoPedido = {
                  ...message.data,
                  status: (message.data.status || '').toLowerCase(),
                  createdAt: message.data.createdAt || message.data.data_criacao || '',
                  data_criacao: message.data.data_criacao || message.data.createdAt || '',
                };
                return [novoPedido, ...prevPedidos];
              });
              break;
            default:
              console.log('Tipo de mensagem não tratado:', message.type);
          }
        } catch (err) {
          console.error('Erro ao processar mensagem:', err);
        }
      };

      setSocket(websocket);

      return () => {
        websocket.close();
      };
    } catch (err) {
      console.error('Erro ao configurar WebSocket:', err);
    }
  }, [token, apiUrl]);

  useEffect(() => {
    connect();
  }, [connect]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, data }));
    } else {
      console.error('WebSocket não está conectado');
    }
  }, [socket]);

  return (
    <WebSocketContext.Provider value={{ socket, pedidos, connected, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket deve ser usado dentro de um WebSocketProvider');
  }
  return context;
};