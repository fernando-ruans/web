import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import List from '../components/List';

interface Restaurante {
  id: number;
  nome: string;
  cidade: string;
  imagem: string;
  taxa_entrega: number;
  tempo_entrega: number;
  status: string;
}

export default function RestaurantesPage() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/cliente/restaurants')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setRestaurantes(data.data || []))
      .catch(() => setErro('Erro ao carregar restaurantes'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-white mt-10">Carregando...</div>;
  if (erro) return <div className="text-center text-red-400 mt-10">{erro}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">Restaurantes</h1>
      <List
        items={restaurantes}
        renderItem={rest => (
          <Card className="flex items-center gap-4">
            <img
              src={rest.imagem || '/logo192.png'}
              alt={rest.nome}
              className="w-20 h-20 object-cover rounded"
              onError={e => (e.currentTarget.src = '/logo192.png')}
            />
            <div>
              <div className="text-lg font-bold text-gray-900">{rest.nome}</div>
              <div className="text-gray-500 text-sm">Cidade: {rest.cidade}</div>
              <div className="text-gray-500 text-sm">Entrega: R$ {rest.taxa_entrega.toFixed(2)} | {rest.tempo_entrega} min</div>
              <div className="text-xs text-green-500">{rest.status}</div>
            </div>
          </Card>
        )}
      />
    </div>
  );
}
