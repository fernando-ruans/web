import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaClock, FaMotorcycle, FaTruckLoading, FaStar, FaSpinner } from 'react-icons/fa';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import theme from '../theme';
import { useWebSocket } from '../context/WebSocketContext';
import { resumoHorarioFuncionamento } from '../utils/horarioResumo';

interface Pedido {
  id: number;
  status: PedidoStatus;
  total: number;
  data_criacao: string;
  restaurant: { 
    nome: string;
    telefone?: string;
    horario_funcionamento?: Record<string, string> | null;
  };
  review?: { 
    nota: number; 
    comentario: string; 
  };
  items: Array<{
    id: number;
    quantidade: number;
    nome: string;
    preco: number;
    adicionais?: Array<{
      nome: string;
      quantidade: number;
      preco: number;
    }>;
  }>;
  taxa_entrega: number;
  observacao?: string;
  endereco: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  formaPagamento?: string;
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
  'Pendente': <FaClock color="#a16207" size={24} />,
  'Em Preparo': <FaTruckLoading color="#1d4ed8" size={24} />,
  'Em Entrega': <FaMotorcycle color="#ea580c" size={24} />,
  'Entregue': <FaCheckCircle color="#15803d" size={24} />,
  'Cancelado': <FaClock color="#b91c1c" size={24} />,
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

export default function DetalhePedidoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const [nota, setNota] = useState(5);
  const [comentario, setComentario] = useState('');
  const { socket } = useWebSocket();

  useEffect(() => {
    buscarPedido();
    // Atualizar pedido a cada 30 segundos
    const interval = setInterval(buscarPedido, 30000);
    return () => clearInterval(interval);
  }, [id]);

  // Atualização em tempo real via WebSocket
  useEffect(() => {
    if (!socket || !id) return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'order-update' && message.data?.type === 'status-update') {
          if (String(message.data.orderId) === String(id)) {
            setPedido((prev) => prev ? { ...prev, ...message.data.order } : prev);
          }
        }
      } catch (err) {
        // Ignorar erros de parse
      }
    };
    socket.addEventListener('message', handleMessage);
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, id]);

  const buscarPedido = async () => {
    try {
      const res = await fetch(`/api/cliente/orders/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPedido(data);
      setErro('');
    } catch {
      setErro('Erro ao carregar detalhes do pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleAvaliar = async () => {
    if (!pedido) return;
    
    setEnviandoAvaliacao(true);
    try {
      const res = await fetch('/api/cliente/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          orderId: pedido.id,
          nota,
          comentario
        })
      });

      if (!res.ok) throw new Error();
      await buscarPedido();
      setNota(5);
      setComentario('');
    } catch {
      setErro('Erro ao enviar avaliação');
    } finally {
      setEnviandoAvaliacao(false);
    }
  };

  const formatarData = (data: string) => {
    return format(new Date(data), "d 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

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
        <p className="text-gray-500 text-lg mt-4">Carregando detalhes do pedido...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-32">
        <div className="text-red-500 text-lg">{erro}</div>
        <button 
          onClick={buscarPedido}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-32">
        <div className="text-gray-500 text-lg">Pedido não encontrado</div>
        <button 
          onClick={() => navigate('/pedidos')}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
        >
          Voltar para Meus Pedidos
        </button>
      </div>
    );
  }

  // Normaliza o status para garantir consistência visual e lógica
  const statusNormalizado = normalizarStatus(pedido.status as string);

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-6 min-h-screen pb-28 sm:pb-32">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/pedidos')}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white text-orange-600 font-bold shadow hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all border border-orange-100 text-sm sm:text-base"
        >
          <span className="text-lg sm:text-xl">←</span>
          Voltar para Meus Pedidos
        </button>
        <h1 className={theme.title + ' text-lg sm:text-3xl'}>Pedido #{pedido.id}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Cabeçalho com Status */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 sm:pb-6 gap-2 sm:gap-0">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {STATUS_ICONS[statusNormalizado]}
              <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${STATUS_COLORS[statusNormalizado]}`}>{statusNormalizado}</span>
            </div>
            <p className="text-gray-600 text-xs sm:text-base">{STATUS_DESC[statusNormalizado]}</p>
          </div>
          <div className="text-right">
            <div className="text-xs sm:text-sm text-gray-500">Realizado em</div>
            <div className="font-medium text-sm sm:text-base">{formatarData(pedido.data_criacao)}</div>
          </div>
        </div>

        {/* Barra de Progresso */}
        {statusNormalizado !== 'Cancelado' && (
          <div className="space-y-2">
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden flex items-center">
              <div 
                style={{ width: `${getStatusPercentage(statusNormalizado)}%` }}
                className="absolute left-0 top-0 h-full bg-orange-500 rounded-full transition-all duration-700 ease-in-out"
              />
              {/* Checkpoints - agora 4 pontos para 4 status principais */}
              {['Pendente', 'Em Preparo', 'Em Entrega', 'Entregue'].map((etapa, idx, arr) => {
                const statusIdx = arr.indexOf(statusNormalizado);
                const isDone = idx < statusIdx;
                const isCurrent = idx === statusIdx;
                const left = `${(idx / (arr.length - 1)) * 100}%`;
                return (
                  <div
                    key={etapa}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left }}
                  >
                    <div className={`w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full border-2 transition-all duration-300
                      ${isDone ? 'bg-orange-500 border-orange-500 text-white' : isCurrent ? 'bg-white border-orange-500 text-orange-500' : 'bg-white border-gray-300 text-gray-300'}`}
                    >
                      {isDone ? <FaCheckCircle size={12} /> : <span className="w-2 h-2 rounded-full block" style={{ background: isCurrent ? '#fb923c' : '#d1d5db' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-2">
              <span className={statusNormalizado === 'Pendente' ? 'font-medium text-orange-600' : ''}>Pendente</span>
              <span className={statusNormalizado === 'Em Preparo' ? 'font-medium text-blue-600' : ''}>Em Preparo</span>
              <span className={statusNormalizado === 'Em Entrega' ? 'font-medium text-orange-600' : ''}>Em Entrega</span>
              <span className={statusNormalizado === 'Entregue' ? 'font-medium text-green-600' : ''}>Entregue</span>
            </div>
          </div>
        )}

        {/* Informações do Restaurante */}
        <div className="bg-orange-50 rounded-xl p-3 sm:p-4">
          <h3 className="font-medium text-orange-800 mb-1 sm:mb-2 text-sm sm:text-base">Restaurante</h3>
          <div className="flex flex-col sm:flex-row justify-between items-start">
            <div>
              <p className="font-medium text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                {pedido.restaurant.nome}
              </p>
              {pedido.restaurant.telefone && (
                <p className="text-gray-600 text-xs sm:text-sm mt-1">{pedido.restaurant.telefone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Endereço de Entrega */}
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
          <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Endereço de Entrega</h3>
          <p className="text-gray-800 text-sm sm:text-base">{pedido.endereco.rua}, {pedido.endereco.numero}</p>
          {pedido.endereco.complemento && (
            <p className="text-gray-600 text-xs sm:text-sm">Complemento: {pedido.endereco.complemento}</p>
          )}
          <p className="text-gray-600 text-xs sm:text-sm">{pedido.endereco.bairro}</p>
          <p className="text-gray-600 text-xs sm:text-sm">{pedido.endereco.cidade} - {pedido.endereco.estado}</p>
          <p className="text-gray-600 text-xs sm:text-sm">CEP: {pedido.endereco.cep}</p>
        </div>

        {/* Itens do Pedido */}
        <div>
          <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Itens do Pedido</h3>
          <div className="space-y-3 sm:space-y-4">
            {pedido.items.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                  <div>
                    <p className="font-medium text-gray-900 text-sm sm:text-base">
                      {item.quantidade}x {item.nome}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      R$ {item.preco.toFixed(2)} cada
                    </p>
                  </div>
                  <p className="text-orange-500 font-medium text-sm sm:text-base">
                    R$ {(item.preco * item.quantidade).toFixed(2)}
                  </p>
                </div>

                {item.adicionais && item.adicionais.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Adicionais:
                    </p>
                    <div className="space-y-1">
                      {item.adicionais.map((adicional, idx) => (
                        <div key={idx} className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">
                            {adicional.quantidade}x {adicional.nome}
                          </span>
                          <span className="text-gray-900">
                            R$ {(adicional.preco * adicional.quantidade).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Observações */}
        {pedido.observacao && (
          <div className="bg-orange-50 rounded-xl p-3 sm:p-4">
            <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">Observações</h3>
            <p className="text-gray-600 text-xs sm:text-sm">{pedido.observacao}</p>
          </div>
        )}

        {/* Resumo do Valor */}
        <div className="border-t border-gray-200 pt-3 sm:pt-4">
          {/* Forma de Pagamento acima do subtotal */}
          {pedido.formaPagamento && (
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
              <span>Forma de Pagamento:</span>
              <span className="text-gray-900 font-semibold">{pedido.formaPagamento.charAt(0).toUpperCase() + pedido.formaPagamento.slice(1)}</span>
            </div>
          )}
          <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
            <span>Subtotal:</span>
            <span>R$ {(pedido.total - pedido.taxa_entrega).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-2">
            <span>Taxa de Entrega:</span>
            <span>R$ {pedido.taxa_entrega.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base sm:text-lg font-bold mt-2">
            <span className="text-gray-900">Total:</span>
            <span className="text-green-600">R$ {pedido.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Avaliação */}
        {pedido.status === 'Entregue' && !pedido.review && (
          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <h3 className="font-medium text-gray-900 mb-2 sm:mb-4 text-sm sm:text-base">Avaliar Pedido</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-1 sm:gap-2">
                {[...Array(5)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setNota(i + 1)}
                    className="hover:scale-110 transition"
                  >
                    <FaStar
                      size={20}
                      color={i < nota ? '#fbbf24' : '#d1d5db'}
                    />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Conte-nos sua experiência (opcional)"
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs sm:text-sm"
                rows={2}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
              />
              <button
                onClick={handleAvaliar}
                disabled={enviandoAvaliacao}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-base"
              >
                {enviandoAvaliacao ? (
                  <>
                    <div className="animate-spin">
                      <FaSpinner size={16} />
                    </div>
                    <span>Enviando avaliação...</span>
                  </>
                ) : (
                  'Enviar Avaliação'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Avaliação Existente */}
        {pedido.review && (
          <div className="border-t border-gray-200 pt-4 sm:pt-6">
            <h3 className="font-medium text-gray-900 mb-2 sm:mb-4 text-sm sm:text-base">Sua Avaliação</h3>
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-1 sm:gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    size={16}
                    color={i < pedido.review!.nota ? '#fbbf24' : '#d1d5db'}
                  />
                ))}
              </div>
              {pedido.review.comentario && (
                <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">{pedido.review.comentario}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
