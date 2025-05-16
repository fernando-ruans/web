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
    <div className="max-w-5xl mx-auto p-2 sm:p-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-400 mb-4 sm:mb-6 text-left">Restaurantes</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 justify-start">
        {restaurantes.map(rest => (
          <Card key={rest.id} className="relative w-full max-w-full sm:max-w-[420px] h-[340px] rounded-xl shadow-md bg-white/90 border border-orange-100 overflow-hidden hover:shadow-lg transition flex flex-col p-0 m-0">
            {/* Banner de fundo, preenchendo topo e laterais do card */}
            <div className="absolute top-0 left-0 w-full" style={{height: '180px', zIndex: 1}}>
              <img
                src={rest.banner || '/banner-default.png'}
                alt={rest.nome + ' banner'}
                className="w-full h-full object-cover p-0 m-0 border-none shadow-none"
                onError={e => (e.currentTarget.src = '/banner-default.png')}
                style={{ display: 'block' }}
              />
            </div>
            {/* Logo sobreposto, sem margem branca */}
            <div className="absolute left-4 sm:left-6" style={{top: '130px', zIndex: 2}}>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl shadow-lg bg-transparent flex items-center justify-center p-0 m-0">
                <img
                  src={rest.imagem || '/logo192.png'}
                  alt={rest.nome}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl p-0 m-0 border-4 border-white/80"
                  onError={e => (e.currentTarget.src = '/logo192.png')}
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                />
              </div>
            </div>
            {/* Detalhes */}
            <div className="relative z-10 flex-1 flex flex-col justify-end pt-8 pb-4 px-3 sm:px-5 gap-1" style={{marginTop: '180px'}}>
              <div className="text-base sm:text-lg font-bold text-orange-600 flex items-center gap-2">{rest.nome}</div>
              <div className="text-gray-500 text-xs flex items-center gap-2"><FaMapMarkerAlt size={12} color="#fb923c" /> {rest.cidade}</div>
              <div className="text-gray-500 text-xs flex items-center gap-2"><FaClock size={12} color="#fb923c" /> {rest.tempo_entrega} min &bull; Entrega: R$ {rest.taxa_entrega.toFixed(2)}</div>
              <div className="text-xs flex items-center gap-1 mt-1">
                {rest.status === 'ativo' ? (
                  <><FaCheckCircle size={12} color="#22c55e" /> <span className="text-green-600 font-bold">Ativo</span></>
                ) : (
                  <><FaTimesCircle size={12} color="#f87171" /> <span className="text-red-400 font-bold">{rest.status}</span></>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
