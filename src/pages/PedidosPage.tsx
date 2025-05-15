import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import List from '../components/List';
import theme from '../theme';

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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className={theme.title + ' mb-6 text-center'}>Meus Pedidos</h1>
      <List
        items={pedidos}
        renderItem={pedido => (
          <Card>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-gray-900">Restaurante: {pedido.restaurant?.nome}</div>
                <div className="text-gray-500 text-sm">Status: {pedido.status}</div>
                <div className="text-gray-500 text-sm">Data: {new Date(pedido.data_criacao).toLocaleString()}</div>
                {pedido.review ? (
                  <div className="mt-2 text-yellow-600 text-sm">
                    Avaliação: {pedido.review.nota} / 5<br />
                    <span className="text-gray-600">{pedido.review.comentario}</span>
                  </div>
                ) : pedido.status === 'Entregue' ? (
                  <button className="mt-2 px-3 py-1 rounded bg-orange-500 text-white font-bold hover:bg-orange-600 transition text-sm">
                    Avaliar pedido
                  </button>
                ) : null}
              </div>
              <div className="text-lg font-bold text-green-500">R$ {pedido.total.toFixed(2)}</div>
            </div>
          </Card>
        )}
      />
    </div>
  );
}
