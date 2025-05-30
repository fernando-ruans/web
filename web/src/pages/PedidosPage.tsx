import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import theme from '../theme';
import { FaCheckCircle, FaClock, FaStar, FaUtensils, FaSearch, FaSpinner, FaMotorcycle, FaTruckLoading } from 'react-icons/fa';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWebSocket } from '../context/WebSocketContext';

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

// Novo tipo de status para integração total com o painel do lojista
// Inclui todos os status possíveis do painel do lojista
// Pendente, Aceito, Em Preparo, Em Entrega, Pronto, Entregue, Cancelado

type PedidoStatus =
  | 'Pendente'
  | 'Em Preparo'
  | 'Em Entrega'
  | 'Entregue'
  | 'Cancelado';

const STATUS_COLORS: Record<PedidoStatus, string> = {
  'Pendente': 'bg-yellow-100 text-yellow-800',
  'Em Preparo': 'bg-blue-100 text-blue-800',
  'Em Entrega': 'bg-orange-100 text-orange-800',
  'Entregue': 'bg-green-100 text-green-800',
  'Cancelado': 'bg-red-100 text-red-800',
};

const STATUS_ICONS: Record<PedidoStatus, React.ReactNode> = {
  'Pendente': <FaClock color="#a16207" />,
  'Em Preparo': <FaTruckLoading color="#1d4ed8" />,
  'Em Entrega': <FaMotorcycle color="#ea580c" />,
  'Entregue': <FaCheckCircle color="#15803d" />,
  'Cancelado': <FaClock color="#b91c1c" />,
};

const STATUS_DESC: Record<PedidoStatus, string> = {
  'Pendente': 'Aguardando confirmação do restaurante',
  'Em Preparo': 'O restaurante está preparando seu pedido',
  'Em Entrega': 'Pedido saiu para entrega',
  'Entregue': 'Pedido entregue com sucesso',
  'Cancelado': 'Pedido foi cancelado',
};

// Função utilitária para normalizar status para o padrão visual
const normalizarStatus = (status: string): PedidoStatus => {
  const s = (status || '').toLowerCase();
  if (s === 'pendente' || s === 'pending') return 'Pendente';
  if (s === 'em preparo' || s === 'preparando' || s === 'preparation' || s === 'preparado') return 'Em Preparo';
  if (s === 'em entrega' || s === 'em rota' || s === 'out for delivery' || s === 'entregando') return 'Em Entrega';
  if (s === 'entregue' || s === 'delivered' || s === 'concluido' || s === 'concluído') return 'Entregue';
  if (s === 'cancelado' || s === 'canceled' || s === 'cancelled') return 'Cancelado';
  return 'Pendente'; // fallback seguro
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'andamento' | 'entregues' | 'cancelados'>('todos');
  const [busca, setBusca] = useState('');
  const [avaliando, setAvaliando] = useState<number | null>(null);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  // Paginação
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const { socket } = useWebSocket();
  const pageSize = 15;

  useEffect(() => {
    buscarPedidos(pagina);
    const interval = setInterval(() => buscarPedidos(pagina), 30000);
    return () => clearInterval(interval);
  }, [pagina]);

  // Atualização em tempo real via WebSocket
  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'order-update' && message.data?.type === 'status-update') {
          // Atualizar o status do pedido específico na lista
          setPedidos(prevPedidos => 
            prevPedidos.map(pedido => {
              if (pedido.id === message.data.orderId) {
                return { 
                  ...pedido, 
                  status: message.data.order.status as PedidoStatus,
                  // Atualizar outros campos se necessário
                  ...(message.data.order.review && { review: message.data.order.review })
                };
              }
              return pedido;
            })
          );
        }
      } catch (err) {
        // Ignorar erros de parse
        console.warn('Erro ao processar mensagem WebSocket:', err);
      }
    };
    
    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  const buscarPedidos = async (paginaAtual = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cliente/orders?page=${paginaAtual}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPedidos(data.data || []);
      setTotalPaginas(data.pagination?.totalPages || 1);
      setTotalPedidos(data.pagination?.total || 0);
    } catch {
      setErro('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const handleAvaliar = async (pedidoId: number) => {
    setEnviandoAvaliacao(true);
    try {      const res = await fetch('/api/cliente/reviews', {
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

  // Filtro principal
  const pedidosFiltrados = pedidos.filter(p => {
    const statusNormalizado = normalizarStatus(p.status as string);
    // Filtro por status
    if (filtro === 'andamento') return !['Entregue', 'Cancelado'].includes(statusNormalizado);
    if (filtro === 'entregues') return statusNormalizado === 'Entregue';
    if (filtro === 'cancelados') return statusNormalizado === 'Cancelado';
    return true;
  }).filter(p => {
    // Filtro por busca
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      p.restaurant.nome.toLowerCase().includes(termo) ||
      p.id.toString().includes(termo)
    );
  });

  const getStatusPercentage = (status: PedidoStatus): number => {
    switch (status) {
      case 'Pendente': return 10;
      case 'Em Preparo': return 40;
      case 'Em Entrega': return 70;
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
          onClick={() => { setPagina(1); buscarPedidos(1); }}
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
    <div className="max-w-4xl mx-auto p-2 sm:p-6 min-h-screen pb-28 sm:pb-32">
      {/* Título aprimorado */}
      <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <FaTruckLoading color="#f97316" size={28} />
        <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm text-center">
          Meus Pedidos
        </h1>
      </div>

      {/* Filtros e Busca aprimorados */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex-1">
          <div className="relative shadow-sm">
            <input
              type="text"
              placeholder="Buscar por restaurante ou número do pedido"
              className="w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-gray-900 placeholder-gray-400 text-sm sm:text-base shadow-inner transition"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <FaSearch color="#9ca3af" size={16} />
            </div>
          </div>
        </div>
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex gap-2 bg-white rounded-xl shadow-sm px-2 py-1 items-center mt-2 sm:mt-0">
          <button
            onClick={() => setFiltro('todos')}
            className={`w-full sm:w-auto px-2 sm:px-3 py-1 rounded-lg font-semibold text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
              filtro === 'todos'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >Todos</button>
          <button
            onClick={() => setFiltro('andamento')}
            className={`w-full sm:w-auto px-2 sm:px-3 py-1 rounded-lg font-semibold text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
              filtro === 'andamento'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >Andamento</button>
          <button
            onClick={() => setFiltro('entregues')}
            className={`w-full sm:w-auto px-2 sm:px-3 py-1 rounded-lg font-semibold text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
              filtro === 'entregues'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >Entregues</button>
          <button
            onClick={() => setFiltro('cancelados')}
            className={`w-full sm:w-auto px-2 sm:px-3 py-1 rounded-lg font-semibold text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
              filtro === 'cancelados'
                ? 'bg-orange-500 text-white shadow'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >Cancelados</button>
        </div>
      </div>

      {/* Lista de pedidos */}
      <div className="flex flex-col gap-4">
        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Nenhum pedido encontrado
          </div>
        ) : (
          pedidosFiltrados.map(pedido => {
            const statusNormalizado = normalizarStatus(pedido.status as string);
            return (
              <Link 
                key={pedido.id}
                to={`/pedidos/${pedido.id}`}
                className="block group"
              >
                <div className={`relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 border-l-8 ${
                  statusNormalizado === 'Pendente' ? 'border-yellow-400' :
                  statusNormalizado === 'Em Preparo' ? 'border-blue-400' :
                  statusNormalizado === 'Em Entrega' ? 'border-orange-400' :
                  statusNormalizado === 'Entregue' ? 'border-green-500' :
                  'border-red-400'
                } p-4 sm:p-6 flex flex-col gap-4 cursor-pointer hover:-translate-y-1`}>  
                  {/* Cabeçalho do Pedido */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FaTruckLoading color="#f97316" size={20} />
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">
                          {pedido.restaurant.nome}
                        </h3>
                      </div>
                      <div className="text-gray-500 text-xs">
                        Pedido #{pedido.id} • {formatarData(pedido.data_criacao)}
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm ${STATUS_COLORS[statusNormalizado]}`}> 
                      {STATUS_ICONS[statusNormalizado]}
                      <span>{statusNormalizado}</span>
                    </div>
                  </div>

                  {/* Barra de Progresso e Status */}
                  {statusNormalizado !== 'Cancelado' && (
                    <div className="pt-2">
                      <div className="relative">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${getStatusPercentage(statusNormalizado)}%` }}
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-700 ease-in-out"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                          <span className={statusNormalizado === 'Pendente' ? 'text-orange-500' : ''}>Pendente</span>
                          <span className={statusNormalizado === 'Em Preparo' ? 'text-blue-500' : ''}>Em Preparo</span>
                          <span className={statusNormalizado === 'Em Entrega' ? 'text-orange-500' : ''}>Em Entrega</span>
                          <span className={statusNormalizado === 'Entregue' ? 'text-green-600' : ''}>Entregue</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{STATUS_DESC[statusNormalizado]}</p>
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
            );
          })
        )}
      </div>
      {/* Paginação */}
      <div className="flex flex-col items-center gap-2 mt-10 sm:flex-row sm:justify-center sm:items-center sm:gap-4">
        <div className="flex flex-row gap-2 w-full sm:w-auto justify-center">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
          >Anterior</button>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition"
          >Próxima</button>
        </div>
        <span
          className="text-sm text-gray-600 text-center leading-snug px-2"
        >
          <span className="block sm:inline font-semibold">Página {pagina} de {totalPaginas}</span>
          <span className="hidden sm:inline mx-1">&bull;</span>
          <span className="block sm:inline">{totalPedidos} pedidos</span>
        </span>
      </div>
    </div>
  );
}
