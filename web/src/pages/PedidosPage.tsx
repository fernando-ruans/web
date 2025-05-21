import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import theme from '../theme';
import { FaCheckCircle, FaClock, FaStar, FaUtensils, FaSearch, FaSpinner, FaMotorcycle, FaTruckLoading } from 'react-icons/fa';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Pedido {
  id: number;
  status: PedidoStatus;
  total: number;
  data_criacao: string;
  restaurant: { nome: string };
  review?: { nota: number; comentario: string };
  items?: Array<{
    id: number;
    quantidade: number;
    nome: string;
    preco: number;
    adicionais?: Array<{
      id: number;
      nome: string;
      preco: number;
      quantidade: number;
    }>;
  }>;
  taxa_entrega: number;
  observacao?: string;
  endereco?: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  usuario?: {
    nome: string;
    telefone: string;
  };
}

type PedidoStatus = 'Pendente' | 'Em Preparo' | 'Pronto' | 'Entregue' | 'Cancelado';

const STATUS_COLORS: Record<PedidoStatus, string> = {
  'Pendente': 'bg-yellow-100 text-yellow-800',
  'Em Preparo': 'bg-blue-100 text-blue-800',
  'Pronto': 'bg-orange-100 text-orange-800',
  'Entregue': 'bg-green-100 text-green-800',
  'Cancelado': 'bg-red-100 text-red-800'
};

const STATUS_ICONS = {
  'Pendente': <FaClock color="#a16207" />,
  'Em Preparo': <FaTruckLoading color="#1d4ed8" />,
  'Pronto': <FaMotorcycle color="#ea580c" />,
  'Entregue': <FaCheckCircle color="#15803d" />,
  'Cancelado': <FaClock color="#b91c1c" />
};

const STATUS_DESC = {
  'Pendente': 'Aguardando confirmação do restaurante',
  'Em Preparo': 'O restaurante está preparando seu pedido',
  'Pronto': 'Pedido pronto para entrega',
  'Entregue': 'Pedido entregue com sucesso',
  'Cancelado': 'Pedido foi cancelado'
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'andamento' | 'entregues'>('todos');
  const [busca, setBusca] = useState('');
  const [avaliando, setAvaliando] = useState<number | null>(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);

  useEffect(() => {
    buscarPedidos();

    // Atualizar pedidos a cada 30 segundos
    const interval = setInterval(buscarPedidos, 30000);
    return () => clearInterval(interval);
  }, []);

  const buscarPedidos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cliente/orders', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPedidos(data.data || []);
    } catch {
      setErro('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleAvaliar = async (pedidoId: number) => {
    setEnviandoAvaliacao(true);
    try {
      const res = await fetch('/api/cliente/orders/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: pedidoId,
          nota,
          comentario
        })
      });

      if (!res.ok) throw new Error();
      await buscarPedidos();
      setAvaliando(null);
      setNota(5);
      setComentario('');
    } catch {
      setErro('Erro ao enviar avaliação');
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    if (filtro === 'andamento') return p.status !== 'Entregue' && p.status !== 'Cancelado';
    if (filtro === 'entregues') return p.status === 'Entregue';
    return true;
  }).filter(p => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      p.restaurant.nome.toLowerCase().includes(termo) ||
      p.id.toString().includes(termo)
    );
  });

  const getStatusPercentage = (status: PedidoStatus): number => {
    switch (status) {
      case 'Pendente': return 25;
      case 'Em Preparo': return 50;
      case 'Pronto': return 75;
      case 'Entregue': return 100;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-32">
        <div className="animate-spin text-orange-500">
          <FaSpinner size={48} />
        </div>
        <p className="text-gray-500 text-lg mt-4">Carregando pedidos...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-32">
        <div className="text-red-500 text-lg">{erro}</div>
        <button 
          onClick={buscarPedidos}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const formatarData = (data: string) => {
    return format(new Date(data), "d 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  const formatarPedidoParaModal = (pedido: Pedido) => {
    return {
      id: pedido.id,
      status: pedido.status.toLowerCase(),
      createdAt: pedido.data_criacao,
      usuario: {
        nome: pedido.usuario?.nome || 'Cliente',
        telefone: pedido.usuario?.telefone || 'Telefone não disponível'
      },
      items: pedido.items || [],
      taxa_entrega: pedido.taxa_entrega,
      observacao: pedido.observacao,
      endereco: pedido.endereco || {
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      }
    };
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen pb-24 sm:pb-32">
      {/* Título aprimorado */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <FaUtensils color="#f97316" size={32} />
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm">
          Meus Pedidos
        </h1>
      </div>

      {/* Filtros e Busca aprimorados */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative shadow-sm">
            <input
              type="text"
              placeholder="Buscar por restaurante ou número do pedido"
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-400 text-base shadow-inner transition"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <FaSearch color="#9ca3af" size={18} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 bg-white rounded-xl shadow-sm px-2 py-1 items-center">
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
              filtro === 'todos'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltro('andamento')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
              filtro === 'andamento'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Em Andamento
          </button>
          <button
            onClick={() => setFiltro('entregues')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
              filtro === 'entregues'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            Entregues
          </button>
        </div>
      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-6">
        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum pedido encontrado
          </div>
        ) : (
          pedidosFiltrados.map(pedido => (
            <Link 
              key={pedido.id}
              to={`/pedidos/${pedido.id}`}
              className="block group"
            >
              <div className={`relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 border-l-8 ${
                pedido.status === 'Pendente' ? 'border-yellow-400' :
                pedido.status === 'Em Preparo' ? 'border-blue-400' :
                pedido.status === 'Pronto' ? 'border-orange-400' :
                pedido.status === 'Entregue' ? 'border-green-500' :
                'border-red-400'
              } p-6 flex flex-col gap-4 cursor-pointer hover:-translate-y-1`}>  
                {/* Cabeçalho do Pedido */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FaUtensils color="#f97316" size={20} />
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">
                        {pedido.restaurant.nome}
                      </h3>
                    </div>
                    <div className="text-gray-500 text-xs">
                      Pedido #{pedido.id} • {formatarData(pedido.data_criacao)}
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm ${STATUS_COLORS[pedido.status]}`}> 
                    {STATUS_ICONS[pedido.status]}
                    <span>{pedido.status}</span>
                  </div>
                </div>

                {/* Barra de Progresso e Status */}
                {pedido.status !== 'Cancelado' && (
                  <div className="pt-2">
                    <div className="relative">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${getStatusPercentage(pedido.status)}%` }}
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-700 ease-in-out"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                        <span className={pedido.status === 'Pendente' ? 'text-orange-500' : ''}>Recebido</span>
                        <span className={pedido.status === 'Em Preparo' ? 'text-orange-500' : ''}>Preparando</span>
                        <span className={pedido.status === 'Pronto' ? 'text-orange-500' : ''}>Pronto</span>
                        <span className={pedido.status === 'Entregue' ? 'text-orange-500' : ''}>Entregue</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{STATUS_DESC[pedido.status]}</p>
                  </div>
                )}

                {/* Resumo do Pedido e Ações */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
                  <div className="text-2xl font-extrabold text-green-600 tracking-tight">
                    R$ {pedido.total.toFixed(2)}
                  </div>
                  {pedido.review && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar
                          key={i}
                          size={18}
                          color={i < pedido.review!.nota ? '#fbbf24' : '#d1d5db'}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Avaliação existente */}
                {pedido.review && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs text-gray-700 font-medium">{pedido.review.comentario}</span>
                  </div>
                )}

                {/* Form de Avaliação */}
                {avaliando === pedido.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-gray-900 font-medium mb-2">Avaliar Pedido</h4>
                    <div className="flex items-center gap-2 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setNota(i + 1)}
                          className="hover:scale-110 transition"
                        >
                          <FaStar
                            size={24}
                            color={i < nota ? '#fbbf24' : '#d1d5db'}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Conte-nos sua experiência (opcional)"
                      className="w-full p-2 border border-gray-300 rounded-lg resize-none mb-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      rows={2}
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAvaliar(pedido.id)}
                        disabled={enviandoAvaliacao}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {enviandoAvaliacao ? (
                          <>
                            <div className="animate-spin">
                              <FaSpinner size={16} />
                            </div>
                            <span>Enviando...</span>
                          </>
                        ) : (
                          'Enviar Avaliação'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setAvaliando(null);
                          setNota(5);
                          setComentario('');
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
