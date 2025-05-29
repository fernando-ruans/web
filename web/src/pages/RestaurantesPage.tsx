import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { FaMapMarkerAlt, FaClock, FaCheckCircle, FaTimesCircle, FaStar } from 'react-icons/fa';
import { resumoHorarioFuncionamento } from '../utils/horarioResumo';
import { useWebSocket } from '../context/WebSocketContext';

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
  horario_funcionamento?: Record<string, string>; // Adicionado para exibir horário resumido
  avaliacaoMedia?: number; // Média de avaliações
  totalAvaliacoes?: number; // Total de avaliações
}

export default function RestaurantesPage() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState('');
  const { socket } = useWebSocket();

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

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data);
        console.log('[WS][RestaurantesPage] Mensagem recebida:', msg); // LOG DETALHADO
        if (msg.type === 'restaurant-status' && msg.data && typeof msg.data.id === 'number') {
          console.log('[WS][RestaurantesPage] Atualizando restaurante:', msg.data.id, 'Novo status aberto:', msg.data.aberto);
          setRestaurantes(prev => prev.map(r => r.id === msg.data.id ? { ...r, aberto: msg.data.aberto } : r));
        }
      } catch (err) {
        console.error('[WS][RestaurantesPage] Erro ao processar mensagem:', err);
      }
    };
    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

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
                  {/* Status badge */}
                  <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full flex items-center gap-2 ${
                    rest.aberto 
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      rest.aberto ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-semibold">
                      {rest.aberto ? 'Aberto' : 'Fechado'}
                    </span>
                  </div>
                </div>

                {/* Detalhes */}
                <div className="flex flex-col justify-between flex-1 pt-12 sm:pt-14 pb-4 px-4 sm:px-6 gap-1">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-bold text-orange-600 flex items-center gap-2">
                        <span className="hidden sm:inline">🍽️</span> {rest.nome}
                      </span>
                    </div>
                    {/* Avaliação média */}
                    {typeof rest.avaliacaoMedia === 'number' && (
                      <span className="flex items-center gap-1 text-yellow-500 text-sm font-semibold mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FaStar key={i} className="w-3.5 h-3.5" color={i < Math.round(rest.avaliacaoMedia!) ? '#fbbf24' : '#e5e7eb'} />
                        ))}
                        <span className="ml-1 text-gray-700">{rest.avaliacaoMedia.toFixed(1)}
                          <span className="text-xs text-gray-400 font-normal ml-2">({rest.totalAvaliacoes || 0} avaliações)</span>
                        </span>
                      </span>
                    )}
                    {/* Horário de funcionamento resumido */}
                    {rest.horario_funcionamento && (
                      <span className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                        <FaClock className="w-3 h-3" color="#fb923c" />
                        {resumoHorarioFuncionamento(rest.horario_funcionamento)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-gray-500 text-xs mt-1">                    {rest.endereco ? (
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt className="w-3 h-3" color="#fb923c" /> 
                        {rest.endereco} - {rest.cidade}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt className="w-3 h-3" color="#fb923c" /> 
                        {rest.cidade}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FaClock className="w-3 h-3" color="#fb923c" /> {rest.tempo_entrega} min
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
