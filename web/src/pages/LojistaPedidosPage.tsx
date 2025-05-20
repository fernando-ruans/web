import React, { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import useSound from 'use-sound';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';

type PeriodoFiltro = 'hoje' | 'ontem' | 'semana' | 'mes';

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface Produto {
  id: number;
  nome: string;
  preco: number;
}

interface ItemPedido {
  id: number;
  quantidade: number;
  produto: Produto;
}

interface Pedido {
  id: number;
  status: 'pendente' | 'aceito' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
  createdAt: string;
  usuario: Usuario;
  items: ItemPedido[];
}

const statusClasses: Record<Pedido['status'], string> = {
  'pendente': 'bg-yellow-100 text-yellow-800 transition-colors duration-200',
  'aceito': 'bg-blue-100 text-blue-800 transition-colors duration-200',
  'preparando': 'bg-purple-100 text-purple-800 transition-colors duration-200',
  'pronto': 'bg-green-100 text-green-800 transition-colors duration-200',
  'entregue': 'bg-gray-100 text-gray-800 transition-colors duration-200',
  'cancelado': 'bg-red-100 text-red-800 transition-colors duration-200',
};

interface OrderUpdateData {
  type: string;
  orderId: number;
  order: Pedido;
}

const formatarData = (dataString: string) => {
  try {
    if (!dataString) return 'Data indisponível';
    const data = new Date(dataString);
    if (isNaN(data.getTime())) {
      throw new Error('Data inválida');
    }
    return format(data, "d 'de' MMMM 'às' HH:mm", { locale: ptBR });
  } catch (error) {
    return 'Data indisponível';
  }
};

const calcularTotal = (items: ItemPedido[]) => {
  if (!items || !Array.isArray(items)) return 0;
  return items.reduce((acc, item) => {
    if (!item?.produto?.preco || !item?.quantidade) return acc;
    return acc + (item.produto.preco * item.quantidade);
  }, 0);
};

const BotoesAcao = ({ pedido, onAtualizarStatus }: { pedido: Pedido, onAtualizarStatus: (id: number, status: Pedido['status']) => Promise<void> }) => {
  const botoesPorStatus: Record<Pedido['status'], Array<{ status: Pedido['status'], texto: string, cor: string }>> = {
    'pendente': [
      { status: 'aceito', texto: 'Aceitar Pedido', cor: 'bg-green-500 hover:bg-green-600' },
      { status: 'cancelado', texto: 'Recusar', cor: 'bg-red-500 hover:bg-red-600' }
    ],
    'aceito': [
      { status: 'preparando', texto: 'Iniciar Preparo', cor: 'bg-blue-500 hover:bg-blue-600' }
    ],
    'preparando': [
      { status: 'pronto', texto: 'Pronto para Entrega', cor: 'bg-yellow-500 hover:bg-yellow-600' }
    ],
    'pronto': [
      { status: 'entregue', texto: 'Confirmar Entrega', cor: 'bg-purple-500 hover:bg-purple-600' }
    ],
    'entregue': [],
    'cancelado': []
  };

  const botoesAtuais = botoesPorStatus[pedido.status] || [];

  return (
    <div className="flex gap-2 mt-2">
      {botoesAtuais.map((botao) => (
        <button
          key={botao.status}
          onClick={() => onAtualizarStatus(pedido.id, botao.status)}
          className={`${botao.cor} text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200`}
        >
          {botao.texto}
        </button>
      ))}
    </div>
  );
};

interface CardPedidoProps {
  pedido: Pedido;
  onAtualizarStatus: (pedidoId: number, novoStatus: Pedido['status']) => void;
  loadingStatus: number | null;
}

function CardPedido({ pedido, onAtualizarStatus, loadingStatus }: CardPedidoProps) {
  const proximosStatus: Record<Pedido['status'], Pedido['status'][]> = {
    'pendente': ['aceito', 'cancelado'],
    'aceito': ['preparando'],
    'preparando': ['pronto'],
    'pronto': ['entregue'],
    'entregue': [],
    'cancelado': []
  };

  const statusNomes: Record<Pedido['status'], string> = {
    'pendente': 'Pendente',
    'aceito': 'Aceito',
    'preparando': 'Em Preparo',
    'pronto': 'Pronto para Entrega',
    'entregue': 'Entregue',
    'cancelado': 'Cancelado'
  };

  const proximosStatusDisponiveis = proximosStatus[pedido.status] || [];
  const isLoading = loadingStatus === pedido.id;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">#{pedido.id}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[pedido.status]}`}>
                {statusNomes[pedido.status]}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{formatarData(pedido.createdAt)}</p>
          </div>

          {proximosStatusDisponiveis.length > 0 && (
            <select
              className={`form-select text-sm border rounded-lg bg-gray-50 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer min-w-[140px] ${
                isLoading ? 'opacity-50 cursor-wait' : ''
              }`}
              onChange={(e) => onAtualizarStatus(pedido.id, e.target.value as Pedido['status'])}
              defaultValue=""
              disabled={isLoading}
            >
              <option value="" disabled>
                {isLoading ? 'Atualizando...' : 'Atualizar Status'}
              </option>
              {proximosStatusDisponiveis.map((status) => (
                <option key={status} value={status}>
                  {statusNomes[status]}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
          </svg>
          <span className="text-gray-600">{pedido.usuario?.nome || 'Cliente não identificado'}</span>
        </div>

        <div className="mt-2 space-y-1">
          {pedido.items?.map((item, index) => (
            <div key={index} className="flex justify-between text-xs">
              <span className="text-gray-600">
                <span className="font-medium">{item.quantidade}x</span> {item.produto?.nome}
              </span>
              <span className="text-gray-700 font-medium">
                R$ {((item.produto?.preco || 0) * (item.quantidade || 0)).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-500">Total do pedido</span>
          <span className="text-sm font-bold text-orange-600">
            R$ {calcularTotal(pedido.items).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

const ResumoCards = ({ pedidos }: { pedidos: Pedido[] }) => {
  const contarPorStatus = (status: Pedido['status']) => 
    pedidos.filter(p => p.status === status).length;

  const calcularFaturamentoHoje = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return pedidos
      .filter(p => {
        const dataPedido = new Date(p.createdAt);
        dataPedido.setHours(0, 0, 0, 0);
        return dataPedido.getTime() === hoje.getTime() && p.status !== 'cancelado';
      })
      .reduce((total, pedido) => total + calcularTotal(pedido.items), 0);
  };

  const cards = [
    {
      titulo: 'Pendentes',
      valor: contarPorStatus('pendente'),
      cor: 'from-yellow-400 to-yellow-600',
      icone: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      titulo: 'Em Preparo',
      valor: contarPorStatus('preparando'),
      cor: 'from-blue-400 to-blue-600',
      icone: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M15 15L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      titulo: 'Em Entrega',
      valor: contarPorStatus('pronto'),
      cor: 'from-orange-400 to-orange-600',
      icone: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M9 17H6C4.89543 17 4 16.1046 4 15V5C4 3.89543 4.89543 3 6 3H14C15.1046 3 16 3.89543 16 5V7" stroke="currentColor" strokeWidth="2"/>
          <path d="M16 13H19M19 13L17 11M19 13L17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      titulo: 'Hoje',
      valor: pedidos.filter(p => {
        const hoje = new Date();
        const dataPedido = new Date(p.createdAt);
        return dataPedido.toDateString() === hoje.toDateString();
      }).length,
      cor: 'from-green-400 to-green-600',
      icone: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M8 9L11 12L14 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      titulo: 'Faturamento',
      valor: `R$ ${calcularFaturamentoHoje().toFixed(2)}`,
      cor: 'from-green-400 to-green-600',
      icone: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      titulo: 'Concluídos',
      valor: contarPorStatus('entregue'),
      cor: 'from-purple-400 to-purple-600',
      icone: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-200 hover:scale-105">
          <div className={`p-6 bg-gradient-to-r ${card.cor} text-white`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">{card.titulo}</p>
                <p className="text-3xl font-bold">{card.valor}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                {card.icone}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Filtros = ({ 
  filtroStatus, 
  setFiltroStatus,
  filtroPeriodo,
  setFiltroPeriodo,
  termoBusca,
  setTermoBusca
}: { 
  filtroStatus: Pedido['status'] | 'todos',
  setFiltroStatus: (status: Pedido['status'] | 'todos') => void,
  filtroPeriodo: string,
  setFiltroPeriodo: (periodo: string) => void,
  termoBusca: string,
  setTermoBusca: (termo: string) => void
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar pedido por número ou cliente..."
              className="w-full pl-12 pr-4 py-3 border-0 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all duration-200"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 19L14.65 14.65M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {['hoje', 'ontem', 'semana', 'mes'].map((periodo) => (
            <button
              key={periodo}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200
                ${filtroPeriodo === periodo 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              onClick={() => setFiltroPeriodo(periodo)}
            >
              {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export function LojistaPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [atualizandoStatus, setAtualizandoStatus] = useState<number | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<Pedido['status'] | 'todos'>('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('hoje');
  const [termoBusca, setTermoBusca] = useState('');
  const { socket, connected, sendMessage } = useWebSocket();
  const { user } = useAuth();
  const [play] = useSound('/sounds/orderSound.mp3', { volume: 0.5 });
  const [loadingStatus, setLoadingStatus] = useState<number | null>(null);
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('hoje');
  const [textoFiltro, setTextoFiltro] = useState('');

  const buscarPedidos = useCallback(async () => {
    try {
      const response = await axios.get<Pedido[]>('/api/pedidos', {
        params: {
          periodo: periodoFiltro,
          filtro: textoFiltro
        }
      });
      setPedidos(response.data);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    }
  }, [periodoFiltro, textoFiltro]);

  useEffect(() => {
    buscarPedidos();
  }, [buscarPedidos]);

  const pedidosFiltrados = pedidos.filter(pedido => {
    // Filtro por status
    if (filtroStatus !== 'todos' && pedido.status !== filtroStatus) {
      return false;
    }

    // Filtro por período
    const dataPedido = new Date(pedido.createdAt);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    if (filtroPeriodo === 'hoje') {
      const pedidoDate = new Date(dataPedido);
      pedidoDate.setHours(0, 0, 0, 0);
      if (pedidoDate.getTime() !== hoje.getTime()) return false;
    } else if (filtroPeriodo === 'ontem') {
      const pedidoDate = new Date(dataPedido);
      pedidoDate.setHours(0, 0, 0, 0);
      if (pedidoDate.getTime() !== ontem.getTime()) return false;
    } else if (filtroPeriodo === 'semana') {
      if (dataPedido < inicioSemana) return false;
    } else if (filtroPeriodo === 'mes') {
      if (dataPedido < inicioMes) return false;
    }

    // Filtro por termo de busca
    if (termoBusca) {
      const termoLower = termoBusca.toLowerCase();
      const pedidoTexto = `#${pedido.id} ${pedido.usuario.nome}`.toLowerCase();
      if (!pedidoTexto.includes(termoLower)) return false;
    }

    return true;
  });

  const atualizarStatusPedido = async (pedidoId: number, novoStatus: Pedido['status']) => {
    await axios.patch(`/api/pedidos/${pedidoId}/status`, { status: novoStatus });
  };

  const onAtualizarStatus = async (pedidoId: number, novoStatus: Pedido['status']) => {
    try {
      setLoadingStatus(pedidoId);
      await atualizarStatusPedido(pedidoId, novoStatus);
      await buscarPedidos();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setLoadingStatus(null);
    }
  };

  useEffect(() => {
    const carregarPedidos = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Não autorizado');

        const response = await fetch('/api/lojista/orders/active', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Erro ao carregar pedidos');

        const data = await response.json();
        setPedidos(data);
      } catch (err) {
        console.error('Erro ao carregar pedidos:', err);
        setError('Erro ao carregar pedidos');
      } finally {
        setLoading(false);
      }
    };

    carregarPedidos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel de Pedidos</h1>
            <p className="mt-1 text-gray-500">Gerencie os pedidos dos seus clientes</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Sistema atualizado em tempo real
            </div>
          </div>
        </div>

        <ResumoCards pedidos={pedidos} />

        <Filtros
          filtroStatus={filtroStatus}
          setFiltroStatus={setFiltroStatus}
          filtroPeriodo={filtroPeriodo}
          setFiltroPeriodo={setFiltroPeriodo}
          termoBusca={termoBusca}
          setTermoBusca={setTermoBusca}
        />

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
            <p className="text-gray-500 text-lg">Carregando pedidos...</p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum pedido encontrado</h3>
            <p className="mt-1 text-gray-500">Tente alterar os filtros ou aguarde novos pedidos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pedidosFiltrados.map((pedido) => (
              <CardPedido 
                key={pedido.id} 
                pedido={pedido}
                onAtualizarStatus={atualizarStatusPedido}
                loadingStatus={loadingStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LojistaPedidosPage;