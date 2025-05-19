import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import List from '../components/List';
import { FaStar, FaUtensils, FaReceipt } from 'react-icons/fa';

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
    <div className="min-h-screen pb-24 sm:pb-32 bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">Minhas Avaliações</h1>
      <List
        items={reviews}
        renderItem={review => (
          <Card className="flex flex-col gap-2 p-4 rounded-xl shadow-md bg-white/90 border-t-4 border-orange-200 hover:shadow-lg transition mb-4">
            <div className="flex flex-col gap-1">
              <div className="font-bold text-orange-600 flex items-center gap-2"><FaReceipt size={14} color="#fb923c" /> Pedido #{review.order?.id}</div>
              <div className="flex items-center gap-2 text-yellow-500 font-bold text-lg">
                <FaStar size={16} color="#fbbf24" /> {review.nota} / 5
              </div>
              <div className="text-gray-600 text-sm">{review.comentario}</div>
              {review.restaurant && (
                <div className="text-gray-400 text-xs flex items-center gap-1"><FaUtensils size={12} /> Restaurante: {review.restaurant.nome}</div>
              )}
            </div>
          </Card>
        )}
      />
    </div>
  );
}
