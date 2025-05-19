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
  const { socket, connected } = useWebSocket();
  const { user } = useAuth();
  const [play] = useSound('/sounds/orderSound.mp3', { volume: 0.5 });

  const formatarData = (dataString: string) => {
    return format(new Date(dataString), "d 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('identify', { userId: user.id });

      socket.on('order-update', (data: OrderUpdateData) => {
        if (data.type === 'NEW_ORDER') {
          setPedidos(prev => [data.order, ...prev]);
          play(); // Tocar som ao receber novo pedido
        } else if (data.type === 'UPDATE_STATUS') {
          setPedidos(prev => prev.map(p => 
            p.id === data.orderId ? { ...p, status: data.order.status } : p
          ));
        }
      });

      // Carregar pedidos ativos inicialmente
      fetch('/api/orders/active')
        .then(res => res.json())
        .then(data => setPedidos(data))
        .catch(err => console.error('Erro ao carregar pedidos:', err));

      return () => {
        socket.off('order-update');
      };
    }
  }, [socket, user, play]);

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
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                pedido.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                pedido.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                pedido.status === 'READY' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {pedido.status === 'PENDING' ? 'Pendente' :
                 pedido.status === 'PREPARING' ? 'Preparando' :
                 pedido.status === 'READY' ? 'Pronto' :
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