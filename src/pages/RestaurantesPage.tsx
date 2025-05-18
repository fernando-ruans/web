import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { FaMapMarkerAlt, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface Restaurante {
  id: number;
  nome: string;
  cidade: string;
  imagem: string;
  banner: string;
  taxa_entrega: number;
  tempo_entrega: number;
  status: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  aberto: boolean;
}

export default function RestaurantesPage() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('');

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

  // Função de filtro
  const restaurantesFiltrados = restaurantes.filter(rest => {
    const busca = filtro.toLowerCase();
    return (
      rest.nome.toLowerCase().includes(busca) ||
      rest.cidade.toLowerCase().includes(busca) ||
      (rest.cnpj ? rest.cnpj.toLowerCase().includes(busca) : false)
    );
  });

  return (
    <div className="min-h-screen pb-24 sm:pb-32 bg-[#fff8e9]">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-orange-500 mb-6 text-center">Restaurantes</h1>
        
        {/* Barra de busca centralizada */}
        <div className="max-w-2xl mx-auto mb-8">
          <input
            type="text"
            placeholder="Buscar por nome, cidade ou CNPJ..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-gray-700 bg-white/90 shadow-sm transition"
          />
        </div>

        {/* Grid de cards centralizado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center max-w-4xl mx-auto">
          {restaurantesFiltrados.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-8">
              Nenhum restaurante encontrado.
            </div>
          ) : (
            restaurantesFiltrados.map(rest => (
              <Card 
                key={rest.id} 
                className={`relative w-full min-h-[220px] h-auto rounded-2xl shadow-lg ${
                  rest.aberto ? 'bg-white' : 'bg-gray-100'
                } border border-orange-100 overflow-hidden hover:shadow-xl transition flex flex-col p-0 m-0 cursor-pointer`} 
                onClick={() => window.location.href = `/restaurantes/${rest.id}`}
              >
                {/* Banner */}
                <div className="relative w-full" style={{height: '120px', zIndex: 1}}>
                  <img
                    src={rest.banner || '/banner-default.png'}
                    alt={rest.nome + ' banner'}
                    className={`w-full h-full object-cover border-none shadow-none ${!rest.aberto && 'opacity-50 grayscale'}`}
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
                  {/* Status overlay */}
                  <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-sm font-bold ${
                    rest.aberto 
                      ? 'bg-green-100 text-green-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {rest.aberto ? '🟢 Aberto' : '🔴 Fechado'}
                  </div>
                </div>

                {/* Detalhes */}
                <div className="flex flex-col justify-between flex-1 pt-12 sm:pt-14 pb-4 px-4 sm:px-6 gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-bold text-orange-600 flex items-center gap-2">
                      <span className="hidden sm:inline">🍽️</span> {rest.nome}
                    </span>
                    {rest.status === 'ativo' ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-0.5 rounded-full">
                        <FaCheckCircle size={12} /> Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-50 px-2 py-0.5 rounded-full">
                        <FaTimesCircle size={12} /> {rest.status}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-gray-500 text-xs mt-1">
                    {rest.endereco ? (
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt size={12} color="#fb923c" /> 
                        {rest.endereco} - {rest.cidade}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt size={12} color="#fb923c" /> 
                        {rest.cidade}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FaClock size={12} color="#fb923c" /> {rest.tempo_entrega} min
                    </span>
                    <span className="flex items-center gap-1">
                      • Entrega: R$ {rest.taxa_entrega.toFixed(2)}
                    </span>
                    {rest.telefone && (
                      <span className="flex items-center gap-1">
                        • 📞 {rest.telefone}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
