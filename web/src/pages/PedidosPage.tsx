import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import List from '../components/List';
import theme from '../theme';
import { FaCheckCircle, FaClock, FaStar, FaUtensils } from 'react-icons/fa';

interface Pedido {
  id: number;
  status: string;
  total: number;
  data_criacao: string;
  restaurant: { nome: string };
  review?: { nota: number; comentario: string };
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/cliente/orders')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setPedidos(data.data || []))
      .catch(() => setErro('Erro ao carregar pedidos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-gray-700 mt-10">Carregando...</div>;
  if (erro) return <div className="text-center text-red-400 mt-10">{erro}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen pb-24 sm:pb-32">
      <h1 className={theme.title + ' mb-6 text-center'}>Meus Pedidos</h1>
      <List
        items={pedidos}
        renderItem={pedido => (
          <Card className="flex flex-col gap-2 p-4 rounded-xl shadow-md bg-white/90 border-t-4 border-orange-200 hover:shadow-lg transition mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex flex-col gap-1">
                <div className="font-bold text-orange-600 flex items-center gap-2"><FaUtensils size={16} color="#fb923c" /> {pedido.restaurant?.nome}</div>
                <div className="text-gray-500 text-xs flex items-center gap-2"><FaClock size={12} /> {new Date(pedido.data_criacao).toLocaleString()}</div>
                <div className="text-gray-500 text-xs flex items-center gap-2">
                  {pedido.status === 'Entregue' ? (
                    <FaCheckCircle size={12} color="#22c55e" />
                  ) : (
                    <FaClock size={12} color="#fbbf24" />
                  )}
                  <span className={pedido.status === 'Entregue' ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'}>{pedido.status}</span>
                </div>
                {pedido.review ? (
                  <div className="mt-2 text-yellow-600 text-sm flex items-center gap-1">
                    <FaStar size={14} color="#fbbf24" /> {pedido.review.nota} / 5
                    <span className="text-gray-600 ml-2">{pedido.review.comentario}</span>
                  </div>
                ) : pedido.status === 'Entregue' ? (
                  <button className="mt-2 px-3 py-1 rounded bg-orange-500 text-white font-bold hover:bg-orange-600 transition text-sm">
                    Avaliar pedido
                  </button>
                ) : null}
              </div>
              <div className="text-lg font-bold text-green-500 whitespace-nowrap">R$ {pedido.total.toFixed(2)}</div>
            </div>
          </Card>
        )}
      />
    </div>
  );
}
