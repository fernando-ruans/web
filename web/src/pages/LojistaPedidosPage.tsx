import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import useSound from 'use-sound';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OrderUpdateData {
  type: string;
  orderId: number;
  order: Pedido;
}

interface Pedido {
  id: number;
  status: string;
  total: number;
  observacao?: string;
  createdAt: string;
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
  address: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    complemento?: string;
  };
}

const LojistaPedidosPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const { socket, connected, sendMessage } = useWebSocket();
  const { user } = useAuth();
  const [play] = useSound('/sounds/orderSound.mp3', { volume: 0.5 });

  const formatarData = (dataString: string) => {
    return format(new Date(dataString), "d 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  useEffect(() => {
    if (socket && user?.id) {
      console.log('Enviando identificação para o WebSocket...');
      sendMessage('identify', { userId: user.id });

      // Configurar handler de mensagens para o WebSocket
      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Mensagem WebSocket recebida:', data);

          switch (data.type) {
            case 'pedidos':
              console.log('Pedidos recebidos via WebSocket:', data.data);
              setPedidos(data.data);
              break;
            case 'order-update':
              console.log('Atualização de pedido recebida:', data.data);
              if (data.data.type === 'NEW_ORDER') {
                setPedidos(prev => [data.data.order, ...prev]);
                play(); // Tocar som ao receber novo pedido
              } else if (data.data.type === 'UPDATE_STATUS') {
                setPedidos(prev => prev.map(p => 
                  p.id === data.data.orderId ? { ...p, status: data.data.order.status } : p
                ));
              }
              break;
          }
        } catch (error) {
          console.error('Erro ao processar mensagem do WebSocket:', error);
        }
      };

      // Adicionar o handler de mensagens
      socket.addEventListener('message', messageHandler);

      // Carregar pedidos via API como fallback
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      console.log('Tentando carregar pedidos via API...');
      fetch(`${apiUrl}/lojista/orders/active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
        .then(res => {
          console.log('Status da resposta da API:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('Pedidos recebidos via API:', data);
          if (!pedidos.length) { // Só atualiza se ainda não tiver pedidos do WebSocket
            setPedidos(Array.isArray(data) ? data : []);
          }
        })
        .catch(err => console.error('Erro ao carregar pedidos via API:', err));

      // Cleanup: remover o handler quando o componente for desmontado
      return () => {
        socket.removeEventListener('message', messageHandler);
      };
    }
  }, [socket, user, play, sendMessage]);

  const calcularTotal = (items: Pedido['items']) => {
    return items.reduce((acc: number, item) => acc + (item.produto.preco * item.quantidade), 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Pedidos Ativos</h1>
      {!connected && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          Aguardando conexão com o servidor...
        </div>
      )}
      <div className="grid gap-6">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Pedido #{pedido.id}</h2>
                <p className="text-gray-600">{pedido.clienteNome}</p>
                <p className="text-sm text-gray-500">{formatarData(pedido.createdAt)}</p>
              </div>              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                pedido.status === 'PENDING' || pedido.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                pedido.status === 'PREPARING' || pedido.status === 'Em Preparo' ? 'bg-blue-100 text-blue-800' :
                pedido.status === 'READY' || pedido.status === 'Pronto' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {pedido.status === 'PENDING' || pedido.status === 'Pendente' ? 'Pendente' :
                 pedido.status === 'PREPARING' || pedido.status === 'Em Preparo' ? 'Em Preparo' :
                 pedido.status === 'READY' || pedido.status === 'Pronto' ? 'Pronto' :
                 pedido.status}
              </span>
            </div>
            
            <div className="space-y-2">
              {pedido.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span className="flex-1">
                    {item.quantidade}x {item.produto.nome}
                  </span>
                  <span>R$ {(item.produto.preco * item.quantidade).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span>R$ {calcularTotal(pedido.items).toFixed(2)}</span>
              </div>
              
              {pedido.observacao && (
                <p className="mt-2 text-sm text-gray-600">
                  <strong>Observação:</strong> {pedido.observacao}
                </p>
              )}
              
              <div className="mt-4">
                <strong>Endereço de entrega:</strong>
                <p className="text-sm text-gray-600">
                  {pedido.address.rua}, {pedido.address.numero} - {pedido.address.bairro}
                  {pedido.address.complemento && `, ${pedido.address.complemento}`}
                  <br />
                  {pedido.address.cidade}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LojistaPedidosPage;