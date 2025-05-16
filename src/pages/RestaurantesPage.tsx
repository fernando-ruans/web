import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { FaMapMarkerAlt, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface Restaurante {
  id: number;
  nome: string;
  cidade: string;
  imagem: string;
  banner: string; // novo campo
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
    <div className="min-h-screen pb-24 sm:pb-32 max-w-5xl mx-auto p-2 sm:p-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-400 mb-4 sm:mb-6 text-left">Restaurantes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 justify-start">
        {restaurantes.map(rest => (
          <Card key={rest.id} className="relative w-full max-w-full sm:max-w-[420px] min-h-[220px] h-auto rounded-2xl shadow-lg bg-white border border-orange-100 overflow-hidden hover:shadow-xl transition flex flex-col p-0 m-0 cursor-pointer" onClick={() => window.location.href = `/restaurantes/${rest.id}` }>
            {/* Banner de fundo */}
            <div className="relative w-full" style={{height: '120px', zIndex: 1}}>
              <img
                src={rest.banner || '/banner-default.png'}
                alt={rest.nome + ' banner'}
                className="w-full h-full object-cover border-none shadow-none"
                onError={e => (e.currentTarget.src = '/banner-default.png')}
                style={{ display: 'block' }}
              />
              {/* Logo sobreposto */}
              <div className="absolute left-4 sm:left-6 -bottom-8 sm:-bottom-10 w-16 h-16 sm:w-20 sm:h-20 rounded-xl shadow-lg bg-white flex items-center justify-center border-2 border-white">
                <img
                  src={rest.imagem || '/logo192.png'}
                  alt={rest.nome}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg"
                  onError={e => (e.currentTarget.src = '/logo192.png')}
                />
              </div>
            </div>
            {/* Detalhes */}
            <div className="flex flex-col justify-between flex-1 pt-12 sm:pt-14 pb-4 px-4 sm:px-6 gap-1">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-orange-600 flex items-center gap-2"><span className="hidden sm:inline">🍽️</span> {rest.nome}</span>
                {rest.status === 'ativo' ? (
                  <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full"><FaCheckCircle size={12} /> Ativo</span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-50 px-2 py-0.5 rounded-full"><FaTimesCircle size={12} /> {rest.status}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-gray-500 text-xs mt-1">
                <span className="flex items-center gap-1"><FaMapMarkerAlt size={12} color="#fb923c" /> {rest.cidade}</span>
                <span className="flex items-center gap-1"><FaClock size={12} color="#fb923c" /> {rest.tempo_entrega} min</span>
                <span className="flex items-center gap-1">• Entrega: R$ {rest.taxa_entrega.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
