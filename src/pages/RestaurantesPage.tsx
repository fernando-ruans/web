import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import List from '../components/List';
import { FaMapMarkerAlt, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

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
    const token = localStorage.getItem('token');
    fetch('/api/cliente/restaurants', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
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
          <Card className="flex items-center gap-4 p-4 rounded-xl shadow-md bg-white/90 border-t-4 border-orange-200 hover:shadow-lg transition">
            <img
              src={rest.imagem || '/logo192.png'}
              alt={rest.nome}
              className="w-20 h-20 object-cover rounded-lg border border-orange-100 shadow-sm"
              onError={e => (e.currentTarget.src = '/logo192.png')}
            />
            <div className="flex-1 flex flex-col gap-1">
              <div className="text-lg font-bold text-orange-600 flex items-center gap-2">{rest.nome}</div>
              <div className="text-gray-500 text-sm flex items-center gap-2"><FaMapMarkerAlt size={14} color="#fb923c" /> {rest.cidade}</div>
              <div className="text-gray-500 text-sm flex items-center gap-2"><FaClock size={14} color="#fb923c" /> {rest.tempo_entrega} min &bull; Entrega: R$ {rest.taxa_entrega.toFixed(2)}</div>
              <div className="text-xs flex items-center gap-1 mt-1">
                {rest.status === 'ativo' ? (
                  <><FaCheckCircle size={14} color="#22c55e" /> <span className="text-green-600 font-bold">Ativo</span></>
                ) : (
                  <><FaTimesCircle size={14} color="#f87171" /> <span className="text-red-400 font-bold">{rest.status}</span></>
                )}
              </div>
            </div>
          </Card>
        )}
      />
    </div>
  );
}
