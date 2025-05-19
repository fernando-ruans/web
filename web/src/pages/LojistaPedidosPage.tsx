import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import useSound from 'use-sound';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Pedido {
  id: number;
  clienteNome: string;
  status: string;
  createdAt: string;
  items: Array<{
    id: number;
    quantidade: number;
    produto: {
      nome: string;
      preco: number;
    };
  }>;
}

const LojistaPedidosPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const { socket, connected } = useWebSocket();
  const [play] = useSound('/sounds/orderSound.mp3', { volume: 0.5 });

  useEffect(() => {
    if (socket) {
      // Carregar pedidos existentes
      socket.emit('getPedidos');

      // Ouvir novos pedidos
      socket.on('novoPedido', (pedido: Pedido) => {
        setPedidos(pedidosAtuais => [...pedidosAtuais, pedido]);
        play(); // Tocar som de notificação
      });

      // Ouvir atualizações de pedidos
      socket.on('atualizacaoPedido', (pedidoAtualizado: Pedido) => {
        setPedidos(pedidosAtuais =>
          pedidosAtuais.map(pedido =>
            pedido.id === pedidoAtualizado.id ? pedidoAtualizado : pedido
          )
        );
      });

      // Ouvir lista inicial de pedidos
      socket.on('pedidos', (pedidosIniciais: Pedido[]) => {
        setPedidos(pedidosIniciais);
      });
    }

    return () => {
      if (socket) {
        socket.off('novoPedido');
        socket.off('atualizacaoPedido');
        socket.off('pedidos');
      }
    };
  }, [socket, play]);

  const formatarData = (data: string) => {
    return format(new Date(data), "d 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  const calcularTotal = (items: Pedido['items']) => {
    return items.reduce((total, item) => total + (item.produto.preco * item.quantidade), 0);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <div className={`flex items-center ${connected ? 'text-green-500' : 'text-red-500'}`}>
          <span className="h-3 w-3 rounded-full mr-2 bg-current"></span>
          {connected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>

      <div className="grid gap-4">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">Pedido #{pedido.id}</h3>
                <p className="text-gray-600">{pedido.clienteNome}</p>
                <p className="text-sm text-gray-500">{formatarData(pedido.createdAt)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                pedido.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                pedido.status === 'CONFIRMADO' ? 'bg-blue-100 text-blue-800' :
                pedido.status === 'EM_PREPARO' ? 'bg-purple-100 text-purple-800' :
                pedido.status === 'PRONTO' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {pedido.status}
              </span>
            </div>

            <div className="space-y-2">
              {pedido.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <span>{item.quantidade}x {item.produto.nome}</span>
                  <span className="text-gray-600">
                    R$ {(item.produto.preco * item.quantidade).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span>R$ {calcularTotal(pedido.items).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LojistaPedidosPage;