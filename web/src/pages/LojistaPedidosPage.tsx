import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useAuth } from '../context/AuthContext';
import useSound from 'use-sound';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  'pendente': 'bg-yellow-100 text-yellow-800',
  'aceito': 'bg-blue-100 text-blue-800',
  'preparando': 'bg-orange-100 text-orange-800',
  'pronto': 'bg-green-100 text-green-800',
  'entregue': 'bg-purple-100 text-purple-800',
  'cancelado': 'bg-red-100 text-red-800'
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

const CardPedido = ({ pedido, onAtualizarStatus }: { pedido: Pedido, onAtualizarStatus: (id: number, status: Pedido['status']) => Promise<void> }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Pedido #{pedido.id}</h3>
          <p className="text-gray-600">{formatarData(pedido.createdAt)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[pedido.status] || 'bg-gray-100 text-gray-800'}`}>
          {pedido.status?.charAt(0).toUpperCase() + pedido.status?.slice(1)}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Cliente</h4>
          <p>{pedido.usuario?.nome || 'Cliente não identificado'}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Itens do Pedido</h4>
          <ul className="space-y-2">
            {pedido.items?.map((item, index) => (
              <li key={index} className="flex justify-between">
                <span>{item.quantidade}x {item.produto?.nome}</span>
                <span className="text-gray-600">
                  R$ {((item.produto?.preco || 0) * (item.quantidade || 0)).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>R$ {calcularTotal(pedido.items).toFixed(2)}</span>
          </div>
        </div>

        <BotoesAcao 
          pedido={pedido} 
          onAtualizarStatus={onAtualizarStatus} 
        />
      </div>
    </div>
  );
};

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-sm text-gray-600">Pendentes</p>
        <p className="text-2xl font-bold text-yellow-600">{contarPorStatus('pendente')}</p>
      </div>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-sm text-gray-600">Em Preparo</p>
        <p className="text-2xl font-bold text-blue-600">{contarPorStatus('preparando')}</p>
      </div>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-sm text-gray-600">Em Entrega</p>
        <p className="text-2xl font-bold text-orange-600">{contarPorStatus('pronto')}</p>
      </div>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-sm text-gray-600">Hoje</p>
        <p className="text-2xl font-bold text-green-600">{pedidos.filter(p => {
          const hoje = new Date();
          const dataPedido = new Date(p.createdAt);
          return dataPedido.toDateString() === hoje.toDateString();
        }).length}</p>
      </div>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-sm text-gray-600">Faturamento Hoje</p>
        <p className="text-2xl font-bold text-green-600">R$ {calcularFaturamentoHoje().toFixed(2)}</p>
      </div>
      <div className="bg-white rounded-lg p-4 shadow">
        <p className="text-sm text-gray-600">Concluídos</p>
        <p className="text-2xl font-bold text-purple-600">{contarPorStatus('entregue')}</p>
      </div>
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
    <div className="bg-white rounded-lg shadow p-4 mb-8">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar pedido..."
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg ${filtroStatus === 'todos' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
            onClick={() => setFiltroStatus('todos')}
          >
            Todos
          </button>
        </div>

        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg ${filtroPeriodo === 'hoje' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
            onClick={() => setFiltroPeriodo('hoje')}
          >
            Hoje
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${filtroPeriodo === 'ontem' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
            onClick={() => setFiltroPeriodo('ontem')}
          >
            Ontem
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${filtroPeriodo === 'semana' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
            onClick={() => setFiltroPeriodo('semana')}
          >
            Semana
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${filtroPeriodo === 'mes' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
            onClick={() => setFiltroPeriodo('mes')}
          >
            Mês
          </button>
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
    setAtualizandoStatus(pedidoId);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Não autorizado');

      const response = await fetch(`/api/lojista/orders/${pedidoId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: novoStatus })
      });

      if (!response.ok) throw new Error('Erro ao atualizar status');

      // Atualiza o estado local
      setPedidos(prev => prev.map(p => 
        p.id === pedidoId ? { ...p, status: novoStatus } : p
      ));

      // Notifica via WebSocket
      if (socket && connected) {
        sendMessage('order-status-update', {
          orderId: pedidoId,
          status: novoStatus
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      setError('Erro ao atualizar status do pedido');
    } finally {
      setAtualizandoStatus(null);
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <h1 className="text-3xl font-bold">Painel de Pedidos</h1>
        <p className="ml-4 text-gray-600">Gerencie os pedidos dos seus clientes</p>
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando pedidos...</p>
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidosFiltrados.map((pedido) => (
            <CardPedido 
              key={pedido.id} 
              pedido={pedido}
              onAtualizarStatus={atualizarStatusPedido}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default LojistaPedidosPage;