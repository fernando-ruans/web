import React, { useEffect, useState, useCallback } from 'react';
import DetalhePedidoModal from '../components/DetalhePedidoModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';
import { formatCurrency } from '../utils/format';

type PeriodoFiltro = 'hoje' | 'ontem' | 'semana' | 'mes';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
}

interface Produto {
  id: number;
  nome: string;
  preco: number;
}

interface Adicional {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
}

interface ItemPedido {
  id: number;
  quantidade: number;
  produto: Produto;
  adicionais?: Adicional[];
}

interface Endereco {
  id: number;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface Pedido {
  id: number;
  status: 'pendente' | 'aceito' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
  createdAt: string;
  usuario: Usuario;
  items: ItemPedido[];
  taxa_entrega: number;
  observacao?: string;
  endereco: Endereco;
  formaPagamento?: string | null; // <-- Adicionado explicitamente
}

const statusClasses: Record<Pedido['status'], string> = {
  'pendente': 'bg-yellow-100 text-yellow-800 transition-colors duration-200',
  'aceito': 'bg-blue-100 text-blue-800 transition-colors duration-200',
  'preparando': 'bg-purple-100 text-purple-800 transition-colors duration-200',
  'pronto': 'bg-green-100 text-green-800 transition-colors duration-200',
  'entregue': 'bg-gray-100 text-gray-800 transition-colors duration-200',
  'cancelado': 'bg-red-100 text-red-800 transition-colors duration-200',
};

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

const calcularTotal = (items: ItemPedido[], taxa_entrega: number = 0) => {
  if (!items || !Array.isArray(items)) return 0;

  // Calcula o subtotal dos produtos e seus adicionais
  const subtotal = items.reduce((acc, item) => {
    let itemTotal = 0;
    
    // Valor do produto
    if (item?.produto?.preco && item?.quantidade) {
      itemTotal += item.produto.preco * item.quantidade;
    }

    // Valor dos adicionais
    if (item?.adicionais && Array.isArray(item.adicionais)) {
      const adicionaisTotal = item.adicionais.reduce((addAcc, adicional) => {
        return addAcc + (adicional.preco * adicional.quantidade);
      }, 0);
      itemTotal += adicionaisTotal;
    }

    return acc + itemTotal;
  }, 0);

  // Retorna o subtotal + taxa de entrega
  return subtotal + taxa_entrega;
};

const statusNomes: Record<Pedido['status'], string> = {
  'pendente': 'Pendente',
  'aceito': 'Aceito',
  'preparando': 'Em Preparo',
  'pronto': 'Pronto para Entrega',
  'entregue': 'Entregue',
  'cancelado': 'Cancelado'
};

interface DetalhePedidoModalProps {
  pedido: Pedido;
  isOpen: boolean;
  onClose: () => void;
}

const DetalhePedidoModalWrapper: React.FC<DetalhePedidoModalProps> = ({ pedido, isOpen, onClose }) => {
  return (
    <DetalhePedidoModal
      open={isOpen}
      onClose={onClose}
      pedido={{
        id: pedido.id,
        status: pedido.status,
        createdAt: pedido.createdAt,
        usuario: {
          nome: pedido.usuario?.nome || 'Nome não disponível',
          telefone: pedido.usuario?.telefone || 'Telefone não disponível'
        },
        items: pedido.items?.map(item => ({
          id: item.id,
          quantidade: item.quantidade,
          nome: item.produto?.nome || 'Produto não disponível',
          preco: item.produto?.preco || 0,
          adicionais: item.adicionais || []
        })) || [],
        taxa_entrega: pedido.taxa_entrega || 0,
        observacao: pedido.observacao,
        endereco: pedido.endereco || undefined,
        formaPagamento: (pedido as any).formaPagamento || undefined // <-- Adicionado repasse do campo
      }}
      statusNomes={statusNomes}
    />
  );
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
  onAtualizarStatus: (pedidoId: number, novoStatus: Pedido['status']) => Promise<void>;
  loadingStatus: number | null;
}

function CardPedido({ pedido, onAtualizarStatus, loadingStatus }: CardPedidoProps) {
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [novoStatus, setNovoStatus] = useState<Pedido['status']>(pedido.status);

  // Define as opções de status possíveis a partir do status atual
  const opcoesStatus: { value: Pedido['status']; label: string }[] = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'aceito', label: 'Aceito' },
    { value: 'preparando', label: 'Em Preparo' },
    { value: 'pronto', label: 'Pronto para Entrega' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  // Define quais transições são permitidas a partir do status atual
  const statusPermitidos: Record<Pedido['status'], Pedido['status'][]> = {
    pendente: ['pendente', 'aceito', 'cancelado'],
    aceito: ['aceito', 'preparando', 'cancelado'],
    preparando: ['preparando', 'pronto', 'cancelado'],
    pronto: ['pronto', 'entregue', 'cancelado'],
    entregue: ['entregue'],
    cancelado: ['cancelado'],
  };

  const opcoesFiltradas = statusPermitidos[pedido.status]?.length
    ? opcoesStatus.filter(opt => statusPermitidos[pedido.status].includes(opt.value))
    : opcoesStatus;

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const novo = e.target.value as Pedido['status'];
    setNovoStatus(novo);
    if (novo !== pedido.status) {
      await onAtualizarStatus(pedido.id, novo);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 mb-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">Pedido #{pedido.id}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusClasses[pedido.status]}`}>
              {statusNomes[pedido.status]}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{format(new Date(pedido.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
          </div>

          <div className="flex items-center gap-1 text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{pedido.usuario.nome}</span>
          </div>

          <p className="text-lg font-bold text-orange-500">
            {formatCurrency(calcularTotal(pedido.items, pedido.taxa_entrega))}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <button
            onClick={() => setShowDetalhes(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md flex items-center gap-2"
          >
            <span>Ver Detalhes</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          {loadingStatus === pedido.id ? (
            <div className="flex items-center justify-center p-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <select
              value={novoStatus}
              onChange={handleStatusChange}
              className="px-3 py-2 rounded-lg border border-gray-300 shadow-sm text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
              disabled={pedido.status === 'entregue' || pedido.status === 'cancelado'}
            >
              {opcoesFiltradas.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <DetalhePedidoModalWrapper
        pedido={pedido}
        isOpen={showDetalhes}
        onClose={() => setShowDetalhes(false)}
      />
    </div>
  );
}

const ResumoCards = ({ pedidos = [], filtroPeriodo, pedidosFiltrados }: { pedidos: Pedido[], filtroPeriodo: string, pedidosFiltrados?: Pedido[] }) => {
  // Sempre usa pedidosFiltrados para contagem, garantindo consistência com a lista
  const pedidosParaContar = pedidosFiltrados ?? pedidos;
  const contarPorStatus = (status: Pedido['status']) => 
    Array.isArray(pedidosParaContar) ? pedidosParaContar.filter(p => (p.status || '').toLowerCase() === status.toLowerCase()).length : 0;

  // Faturamento do período também deve usar pedidosFiltrados
  const calcularFaturamentoPeriodo = () => {
    if (!Array.isArray(pedidosParaContar)) return 0;
    return pedidosParaContar.reduce((total, pedido) => 
      total + calcularTotal(pedido.items, pedido.taxa_entrega), 0);
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
      valor: pedidosParaContar.filter(p => {
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
      titulo: 'Faturamento do Período',
      valor: formatCurrency(calcularFaturamentoPeriodo()),
      cor: 'from-green-400 to-green-600'
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
              {card.icone && <div className="bg-white/20 p-3 rounded-lg">{card.icone}</div>}
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

interface ApiResponse {
  pedidos?: Pedido[];
  data?: Pedido[];
}

export function LojistaPedidosPage() {  
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<PeriodoFiltro>('hoje');
  const [filtroStatus, setFiltroStatus] = useState<Pedido['status'] | 'todos'>('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('hoje');
  const [termoBusca, setTermoBusca] = useState('');
  const [loadingStatus, setLoadingStatus] = useState<number | null>(null);

  const buscarPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/lojista/orders', {
        credentials: 'include'
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError('Sessão expirada. Por favor, faça login novamente.');
          return;
        }
        throw new Error('Erro ao carregar pedidos');
      }

      const data = await res.json();
      let pedidosData: Pedido[] = [];
      
      // Normalizar a estrutura da resposta
      if (Array.isArray(data)) {
        pedidosData = data;
      } else if (data?.pedidos) {
        pedidosData = data.pedidos;
      } else if (data?.data) {
        pedidosData = data.data;
      }

      // Garantir que todos os pedidos tenham os campos necessários
      pedidosData = pedidosData.map(pedido => ({
        ...pedido,
        status: (['pendente','aceito','preparando','pronto','entregue','cancelado'].includes((pedido.status || '').toLowerCase())
          ? (pedido.status || '').toLowerCase()
          : 'pendente') as Pedido['status'],
        taxa_entrega: pedido.taxa_entrega || 0,
        items: pedido.items?.map(item => ({
          ...item,
          adicionais: item.adicionais || []
        })) || []
      }));
      
      setPedidos(pedidosData);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError('Erro ao carregar pedidos. Por favor, tente novamente.');
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const atualizarStatusPedido = async (pedidoId: number, novoStatus: Pedido['status']) => {
    try {
      const res = await fetch('/api/lojista/orders/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          orderId: pedidoId,
          status: novoStatus 
        })
      });

      if (!res.ok) {
        throw new Error('Erro ao atualizar status');
      }

      await buscarPedidos();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar o status do pedido. Por favor, tente novamente.');
    }
  };

  useEffect(() => {
    buscarPedidos();
  }, [buscarPedidos]);

  const pedidosFiltrados = pedidos.filter(pedido => {
    // Filtro por status
    if (filtroStatus !== 'todos' && pedido.status !== filtroStatus) {
      return false;
    }

    // Filtro por termo de busca
    if (termoBusca) {
      const termoLower = termoBusca.toLowerCase();
      const pedidoTexto = `#${pedido.id} ${pedido.usuario?.nome || ''}`.toLowerCase();
      if (!pedidoTexto.includes(termoLower)) return false;
    }

    // Filtro por período
    const dataPedido = new Date(pedido.createdAt);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    switch (filtroPeriodo) {
      case 'hoje':
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);
        const fimDia = new Date();
        fimDia.setHours(23, 59, 59, 999);
        return dataPedido >= inicioDia && dataPedido <= fimDia;
      
      case 'ontem':
        const inicioOntem = new Date();
        inicioOntem.setDate(hoje.getDate() - 1);
        inicioOntem.setHours(0, 0, 0, 0);
        const fimOntem = new Date();
        fimOntem.setDate(hoje.getDate() - 1);
        fimOntem.setHours(23, 59, 59, 999);
        return dataPedido >= inicioOntem && dataPedido <= fimOntem;
      
      case 'semana':
        const inicioSemana = new Date();
        inicioSemana.setDate(hoje.getDate() - 7);
        inicioSemana.setHours(0, 0, 0, 0);
        return dataPedido >= inicioSemana;
      
      case 'mes':
        const inicioMes = new Date();
        inicioMes.setMonth(hoje.getMonth() - 1);
        inicioMes.setHours(0, 0, 0, 0);
        return dataPedido >= inicioMes;
      
      default:
        return true;
    }
  });

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
    buscarPedidos();
  }, [buscarPedidos]);

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

        <ResumoCards pedidos={pedidos} filtroPeriodo={filtroPeriodo} pedidosFiltrados={pedidosFiltrados} />

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                onAtualizarStatus={onAtualizarStatus}
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