import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import List from '../components/List';

interface Review {
  id: number;
  nota: number;
  comentario: string;
  order: { id: number };
  restaurant?: { nome: string };
}

export default function AvaliacoesPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    fetch('/api/cliente/reviews')
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setReviews(data.data || []))
      .catch(() => setErro('Erro ao carregar avaliações'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-white mt-10">Carregando...</div>;
  if (erro) return <div className="text-center text-red-400 mt-10">{erro}</div>;

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">Minhas Avaliações</h1>
      <List
        items={reviews}
        renderItem={review => (
          <Card>
            <div className="flex flex-col gap-1">
              <div className="font-bold text-white">Pedido #{review.order?.id}</div>
              <div className="text-yellow-400">Nota: {review.nota} / 5</div>
              <div className="text-gray-300">{review.comentario}</div>
              {review.restaurant && <div className="text-gray-400 text-xs">Restaurante: {review.restaurant.nome}</div>}
            </div>
          </Card>
        )}
      />
    </div>
  );
}
