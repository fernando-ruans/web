import React, { useState, useEffect } from 'react';
import { FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

interface Pedido {
  id: number;
  status: string;
  total: number;
  data_criacao: string;
  user: {
    nome: string;
    email: string;
  };
  orderItems: Array<{
    id: number;
    quantidade: number;
    preco_unitario: number;
    product: {
      nome: string;
    };
  }>;
  address: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
  };
}

export default function LojistaPedidosPage() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizando, setAtualizando] = useState<number | null>(null);

  // Buscar pedidos
  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lojista/orders', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Erro ao carregar pedidos');
      const data = await res.json();
      setPedidos(data.data || []);
    } catch (err) {
      setErro('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (pedidoId: number, novoStatus: string) => {
    setAtualizando(pedidoId);
    try {
      const res = await fetch(`/api/lojista/orders/${pedidoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) throw new Error('Erro ao atualizar status');
      await fetchPedidos(); // Recarrega os pedidos para mostrar o status atualizado
    } catch (err) {
      setErro('Erro ao atualizar status do pedido');
    } finally {
      setAtualizando(null);
    }
  };

  if (loading) return <div className="text-center text-gray-700 mt-10">Carregando...</div>;
  if (erro) return <div className="text-center text-red-400 mt-10">{erro}</div>;

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center justify-center pb-24 sm:pb-32'}>
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-6 py-10">
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 border-t-4 border-orange-400 w-full flex flex-col items-center gap-6">
          <h2 className="text-2xl font-extrabold text-orange-500 mb-2 flex items-center gap-2">
            <FaClipboardList size={24} /> Pedidos Recebidos
          </h2>
          <div className="text-gray-600 mb-2 text-center text-lg">Gerencie os pedidos dos seus clientes</div>

          <div className="w-full grid grid-cols-1 gap-4">
            {pedidos.length === 0 ? (
              <div className="text-gray-400 text-center">Nenhum pedido recebido ainda.</div>
            ) : (
              pedidos.map(pedido => (
                <div key={pedido.id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 border border-orange-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-orange-600 text-lg">Pedido #{pedido.id}</div>
                      <div className="text-gray-600">Cliente: {pedido.user.nome}</div>
                      <div className="text-gray-500 text-sm">Email: {pedido.user.email}</div>
                    </div>
                    <div className="text-lg font-bold text-green-500">
                      R$ {pedido.total.toFixed(2)}
                    </div>
                  </div>

                  <div className="border-t border-orange-100 pt-4">
                    <div className="font-semibold text-orange-600 mb-2">Itens do Pedido:</div>
                    <ul className="space-y-1">
                      {pedido.orderItems.map(item => (
                        <li key={item.id} className="text-gray-600">
                          {item.quantidade}x {item.product.nome} - R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-orange-100 pt-4">
                    <div className="font-semibold text-orange-600 mb-2">Endereço de Entrega:</div>
                    <p className="text-gray-600">
                      {pedido.address.rua}, {pedido.address.numero}
                      {pedido.address.complemento && `, ${pedido.address.complemento}`}<br />
                      {pedido.address.bairro} - {pedido.address.cidade}
                    </p>
                  </div>

                  <div className="border-t border-orange-100 pt-4">
                    <div className="font-semibold text-orange-600 mb-2">Status do Pedido:</div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                          pedido.status === 'Pendente' 
                            ? 'bg-yellow-100 text-yellow-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'
                        }`}
                        onClick={() => atualizarStatus(pedido.id, 'Pendente')}
                        disabled={atualizando === pedido.id}
                      >
                        Pendente
                      </button>
                      <button 
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                          pedido.status === 'Em Preparo' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500'
                        }`}
                        onClick={() => atualizarStatus(pedido.id, 'Em Preparo')}
                        disabled={atualizando === pedido.id}
                      >
                        Em Preparo
                      </button>
                      <button 
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                          pedido.status === 'Saiu para Entrega' 
                            ? 'bg-orange-100 text-orange-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-orange-50 hover:text-orange-500'
                        }`}
                        onClick={() => atualizarStatus(pedido.id, 'Saiu para Entrega')}
                        disabled={atualizando === pedido.id}
                      >
                        Saiu para Entrega
                      </button>
                      <button 
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                          pedido.status === 'Entregue' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
                        }`}
                        onClick={() => atualizarStatus(pedido.id, 'Entregue')}
                        disabled={atualizando === pedido.id}
                      >
                        Entregue
                      </button>
                      <button 
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                          pedido.status === 'Cancelado' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                        }`}
                        onClick={() => atualizarStatus(pedido.id, 'Cancelado')}
                        disabled={atualizando === pedido.id}
                      >
                        Cancelado
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 mt-2">
                    Pedido feito em: {new Date(pedido.data_criacao).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>    </div>
  );
}
