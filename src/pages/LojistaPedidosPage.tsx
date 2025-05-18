import React, { useState, useEffect, useCallback } from 'react';
import { FaClipboardList, FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp, FaEye, FaPrint, FaClock, FaExclamation, FaTimes, FaBell } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Pedido {
  id: number;
  status: string;
  total: number;
  data_criacao: string;
  user: {
    nome: string;
    email: string;
    telefone?: string;
  };
  orderItems: Array<{
    id: number;
    quantidade: number;
    preco_unitario: number;
    product: {
      nome: string;
      descricao?: string;
      imagem?: string;
    };
  }>;
  address: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    cep?: string;
  };
  forma_pagamento?: string;
  observacao?: string;
  taxa_entrega?: number;
}

interface FiltrosPedido {
  status: string;
  busca: string;
  periodo: 'todos' | 'hoje' | 'ontem' | 'semana' | 'mes';
}

interface PedidoStats {
  hoje: number;
  pendentes: number;
  emPreparo: number;
  emEntrega: number;
  concluidos: number;
  cancelados: number;
  valorTotalHoje: number;
}

type OrdenacaoPedidos = {
  campo: 'data_criacao' | 'total' | 'id';
  ordem: 'asc' | 'desc';
}

interface ToastProps {
  mensagem: string;
  tipo: 'sucesso' | 'erro' | 'aviso';
  visivel: boolean;
}

// Componente de Toast para notificações
const Toast: React.FC<ToastProps> = ({ mensagem, tipo, visivel }) => {
  if (!visivel) return null;
  
  const cores = {
    sucesso: 'bg-green-100 text-green-700 border-green-200',
    erro: 'bg-red-100 text-red-700 border-red-200',
    aviso: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };
    const icones = {
    sucesso: <FaClipboardList color="#10b981" size={18} />,
    erro: <FaExclamation color="#ef4444" size={18} />,
    aviso: <FaBell color="#f59e0b" size={18} />
  };
  
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 ${cores[tipo]} px-4 py-3 rounded-lg border shadow-lg animate-fadeIn`}>
      {icones[tipo]}
      <span>{mensagem}</span>
    </div>
  );
};

interface ModalPedidoProps {
  pedido: Pedido | null;
  visivel: boolean;
  onFechar: () => void;
  onAtualizarStatus: (id: number, status: string) => Promise<void>;
}

// Componente de Modal para detalhes do pedido
const ModalPedido: React.FC<ModalPedidoProps> = ({ pedido, visivel, onFechar, onAtualizarStatus }) => {
  if (!visivel || !pedido) return null;
  
  const statusClasses = {
    'Pendente': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Em Preparo': 'bg-blue-100 text-blue-700 border-blue-200',
    'Saiu para Entrega': 'bg-orange-100 text-orange-700 border-orange-200',
    'Entregue': 'bg-green-100 text-green-700 border-green-200',
    'Cancelado': 'bg-red-100 text-red-700 border-red-200'
  };
  
  const imprimirPedido = () => {
    const conteudo = document.getElementById('conteudo-impressao');
    if (conteudo) {
      const janela = window.open('', '', 'height=600,width=800');
      if (janela) {
        janela.document.write('<html><head><title>Impressão de Pedido</title>');
        janela.document.write('<style>body { font-family: Arial, sans-serif; padding: 20px; } h2 { color: #f97316; } .item { padding: 8px 0; border-bottom: 1px solid #eee; } .total { font-weight: bold; margin-top: 20px; font-size: 18px; } .endereco { margin: 15px 0; padding: 10px; background: #f9fafb; border-radius: 5px; }</style>');
        janela.document.write('</head><body>');
        janela.document.write(conteudo.innerHTML);
        janela.document.write('</body></html>');
        janela.document.close();
        janela.focus();
        setTimeout(() => {
          janela.print();
          janela.close();
        }, 250);
      }
    }
  };
  
  const dataPedido = new Date(pedido.data_criacao);
  const tempoDecorrido = formatDistanceToNow(dataPedido, { locale: ptBR, addSuffix: true });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
          <h3 className="text-xl font-bold text-orange-500">Detalhes do Pedido #{pedido.id}</h3>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-600 rounded-full p-1"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className={`px-4 py-2 rounded-lg font-semibold ${statusClasses[pedido.status as keyof typeof statusClasses] || 'bg-gray-100'}`}>
                  {pedido.status}
                </div>
                <div className="text-gray-500 flex items-center gap-1">
                  <FaClock size={14} />
                  <span className="text-sm">{tempoDecorrido}</span>
                </div>
              </div>
              <div className="mt-2 text-gray-600">
                {dataPedido.toLocaleDateString()} às {dataPedido.toLocaleTimeString()} 
              </div>
            </div>
            
            <div className="text-xl font-bold text-green-500">
              R$ {pedido.total.toFixed(2)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-orange-500 mb-2">Informações do Cliente</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="font-semibold">{pedido.user.nome}</div>
                <div>{pedido.user.email}</div>
                {pedido.user.telefone && <div>{pedido.user.telefone}</div>}
              </div>

              <h4 className="font-bold text-orange-500 mt-4 mb-2">Endereço de Entrega</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div>
                  {pedido.address.rua}, {pedido.address.numero}
                  {pedido.address.complemento && `, ${pedido.address.complemento}`}
                </div>
                <div>{pedido.address.bairro} - {pedido.address.cidade}</div>
                {pedido.address.cep && <div>CEP: {pedido.address.cep}</div>}
              </div>
              
              {pedido.forma_pagamento && (
                <div className="mt-4">
                  <h4 className="font-bold text-orange-500 mb-2">Forma de Pagamento</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {pedido.forma_pagamento}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h4 className="font-bold text-orange-500 mb-2">Itens do Pedido</h4>
              <ul className="bg-gray-50 p-3 rounded-lg divide-y divide-gray-200">
                {pedido.orderItems.map(item => (
                  <li key={item.id} className="py-2 first:pt-0 last:pb-0">
                    <div className="font-semibold">
                      {item.quantidade}x {item.product.nome}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {item.product.descricao && `${item.product.descricao.substring(0, 40)}${item.product.descricao.length > 40 ? '...' : ''}`}
                    </div>
                    <div className="text-green-600">
                      R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                    </div>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {(pedido.total - (pedido.taxa_entrega || 0)).toFixed(2)}</span>
                </div>
                {pedido.taxa_entrega && (
                  <div className="flex justify-between">
                    <span>Taxa de entrega:</span>
                    <span>R$ {pedido.taxa_entrega.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-green-600 mt-2 pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span>R$ {pedido.total.toFixed(2)}</span>
                </div>
              </div>
              
              {pedido.observacao && (
                <div className="mt-4">
                  <h4 className="font-bold text-orange-500 mb-2">Observações</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    {pedido.observacao}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="hidden" id="conteudo-impressao">
            <h2>Pedido #{pedido.id}</h2>
            <p><strong>Data:</strong> {dataPedido.toLocaleDateString()} às {dataPedido.toLocaleTimeString()}</p>
            <p><strong>Cliente:</strong> {pedido.user.nome}</p>
            <p><strong>Status:</strong> {pedido.status}</p>
            
            <div className="endereco">
              <h3>Endereço de Entrega</h3>
              <p>
                {pedido.address.rua}, {pedido.address.numero}
                {pedido.address.complemento && `, ${pedido.address.complemento}`}<br />
                {pedido.address.bairro} - {pedido.address.cidade}<br />
                {pedido.address.cep && `CEP: ${pedido.address.cep}`}
              </p>
            </div>
            
            <h3>Itens do Pedido</h3>
            {pedido.orderItems.map((item, index) => (
              <div key={index} className="item">
                <p><strong>{item.quantidade}x {item.product.nome}</strong> - R$ {(item.quantidade * item.preco_unitario).toFixed(2)}</p>
              </div>
            ))}
            
            <div className="total">
              <p>Subtotal: R$ {(pedido.total - (pedido.taxa_entrega || 0)).toFixed(2)}</p>
              {pedido.taxa_entrega && <p>Taxa de entrega: R$ {pedido.taxa_entrega.toFixed(2)}</p>}
              <p>Total: R$ {pedido.total.toFixed(2)}</p>
            </div>
            
            {pedido.observacao && (
              <div>
                <h3>Observações</h3>
                <p>{pedido.observacao}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="font-semibold text-orange-600 mb-2">Alterar Status:</div>
            <div className="flex flex-wrap gap-2">
              <button 
                className={`px-3 py-2 rounded-lg font-bold transition ${
                  pedido.status === 'Pendente' 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'
                }`}
                onClick={() => onAtualizarStatus(pedido.id, 'Pendente')}
              >
                Pendente
              </button>
              <button 
                className={`px-3 py-2 rounded-lg font-bold transition ${
                  pedido.status === 'Em Preparo' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500'
                }`}
                onClick={() => onAtualizarStatus(pedido.id, 'Em Preparo')}
              >
                Em Preparo
              </button>
              <button 
                className={`px-3 py-2 rounded-lg font-bold transition ${
                  pedido.status === 'Saiu para Entrega' 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-gray-100 text-gray-400 hover:bg-orange-50 hover:text-orange-500'
                }`}
                onClick={() => onAtualizarStatus(pedido.id, 'Saiu para Entrega')}
              >
                Saiu para Entrega
              </button>
              <button 
                className={`px-3 py-2 rounded-lg font-bold transition ${
                  pedido.status === 'Entregue' 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
                }`}
                onClick={() => onAtualizarStatus(pedido.id, 'Entregue')}
              >
                Entregue
              </button>
              <button 
                className={`px-3 py-2 rounded-lg font-bold transition ${
                  pedido.status === 'Cancelado' 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                }`}
                onClick={() => onAtualizarStatus(pedido.id, 'Cancelado')}
              >
                Cancelado
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={imprimirPedido}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-500 hover:bg-orange-100 rounded-lg transition"
            >
              <FaPrint /> Imprimir Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de estatísticas para visão geral dos pedidos
const PedidosStats: React.FC<{ stats: PedidoStats }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 w-full">
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 p-4 rounded-lg shadow-sm">
        <div className="text-sm text-yellow-600 mb-1">Pendentes</div>
        <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-4 rounded-lg shadow-sm">
        <div className="text-sm text-blue-600 mb-1">Em Preparo</div>
        <div className="text-2xl font-bold text-blue-600">{stats.emPreparo}</div>
      </div>
      
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 p-4 rounded-lg shadow-sm">
        <div className="text-sm text-orange-600 mb-1">Em Entrega</div>
        <div className="text-2xl font-bold text-orange-600">{stats.emEntrega}</div>
      </div>
      
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 p-4 rounded-lg shadow-sm">
        <div className="text-sm text-green-600 mb-1">Hoje</div>
        <div className="text-2xl font-bold text-green-600">{stats.hoje}</div>
      </div>
      
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-4 rounded-lg shadow-sm">
        <div className="text-sm text-emerald-600 mb-1">Faturamento Hoje</div>
        <div className="text-2xl font-bold text-emerald-600">R$ {stats.valorTotalHoje.toFixed(2)}</div>
      </div>
      
      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 p-4 rounded-lg shadow-sm">
        <div className="text-sm text-green-600 mb-1">Concluídos</div>
        <div className="text-2xl font-bold text-green-600">{stats.concluidos}</div>
      </div>
    </div>
  );
};

export default function LojistaPedidosPage() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizando, setAtualizando] = useState<number | null>(null);
  // Estados para novas funcionalidades
  const [filtros, setFiltros] = useState<FiltrosPedido>({ status: 'todos', busca: '', periodo: 'hoje' });
  const [ordenacao, setOrdenacao] = useState<OrdenacaoPedidos>({ campo: 'data_criacao', ordem: 'desc' });
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' | 'aviso'; visivel: boolean }>({
    mensagem: '',
    tipo: 'sucesso',
    visivel: false
  });
  const [stats, setStats] = useState<PedidoStats>({
    hoje: 0,
    pendentes: 0,
    emPreparo: 0,
    emEntrega: 0,
    concluidos: 0,
    cancelados: 0,
    valorTotalHoje: 0
  });

  // Buscar pedidos
  useEffect(() => {
    fetchPedidos();
  }, []);

  // Aplicar filtros e ordenação sempre que os pedidos, filtros ou ordenação mudarem
  useEffect(() => {
    aplicarFiltrosEOrdenacao();
  }, [pedidos, filtros, ordenacao]);

  // Calcular estatísticas quando os pedidos mudarem
  useEffect(() => {
    calcularEstatisticas();
  }, [pedidos]);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lojista/orders', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Erro ao carregar pedidos');
      const data = await res.json();
      setPedidos(data.data || []);
    } catch (err) {
      setErro('Erro ao carregar pedidos');
      exibirToast('Erro ao carregar pedidos', 'erro');
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (pedidoId: number, novoStatus: string) => {
    setAtualizando(pedidoId);
    try {
      const res = await fetch(`/api/lojista/orders/${pedidoId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: novoStatus })
      });
      if (!res.ok) throw new Error('Erro ao atualizar status');
      await fetchPedidos(); // Recarrega os pedidos para mostrar o status atualizado
      exibirToast(`Status atualizado para ${novoStatus}`, 'sucesso');
    } catch (err) {
      setErro('Erro ao atualizar status do pedido');
      exibirToast('Erro ao atualizar status do pedido', 'erro');
    } finally {
      setAtualizando(null);
    }
  };

  const exibirToast = (mensagem: string, tipo: 'sucesso' | 'erro' | 'aviso') => {
    setToast({
      mensagem,
      tipo,
      visivel: true
    });
    
    // Esconde o toast após 3 segundos
    setTimeout(() => {
      setToast(prev => ({ ...prev, visivel: false }));
    }, 3000);
  };
  const aplicarFiltrosEOrdenacao = () => {
    let pedidosFiltrados = [...pedidos];
    
    // Aplicar filtro por status
    if (filtros.status !== 'todos') {
      pedidosFiltrados = pedidosFiltrados.filter(pedido => pedido.status === filtros.status);
    }
    
    // Aplicar filtro por período
    if (filtros.periodo !== 'todos') {
      const dataLimiteInferior = getDataLimiteInferior(filtros.periodo);
      const dataLimiteSuperior = getDataLimiteSuperior(filtros.periodo);
      
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        const dataPedido = new Date(pedido.data_criacao);
        return dataPedido >= dataLimiteInferior && dataPedido <= dataLimiteSuperior;
      });
    }
    
    // Aplicar busca por cliente ou ID do pedido
    if (filtros.busca) {
      const termoBusca = filtros.busca.toLowerCase();
      pedidosFiltrados = pedidosFiltrados.filter(pedido => 
        pedido.id.toString().includes(termoBusca) || 
        pedido.user.nome.toLowerCase().includes(termoBusca) ||
        pedido.user.email.toLowerCase().includes(termoBusca)
      );
    }
    
    // Aplicar ordenação
    pedidosFiltrados.sort((a, b) => {
      if (ordenacao.campo === 'data_criacao') {
        const dataA = new Date(a.data_criacao).getTime();
        const dataB = new Date(b.data_criacao).getTime();
        return ordenacao.ordem === 'asc' ? dataA - dataB : dataB - dataA;
      } else if (ordenacao.campo === 'total') {
        return ordenacao.ordem === 'asc' ? a.total - b.total : b.total - a.total;
      } else {
        return ordenacao.ordem === 'asc' ? a.id - b.id : b.id - a.id;
      }
    });
    
    setPedidosFiltrados(pedidosFiltrados);
  };

  const calcularEstatisticas = () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const stats: PedidoStats = {
      hoje: 0,
      pendentes: 0,
      emPreparo: 0,
      emEntrega: 0,
      concluidos: 0,
      cancelados: 0,
      valorTotalHoje: 0
    };
    
    pedidos.forEach(pedido => {
      const dataPedido = new Date(pedido.data_criacao);
      dataPedido.setHours(0, 0, 0, 0);
      
      // Pedidos de hoje
      if (dataPedido.getTime() === hoje.getTime()) {
        stats.hoje++;
        stats.valorTotalHoje += pedido.total;
      }
      
      // Contar por status
      switch (pedido.status) {
        case 'Pendente':
          stats.pendentes++;
          break;
        case 'Em Preparo':
          stats.emPreparo++;
          break;
        case 'Saiu para Entrega':
          stats.emEntrega++;
          break;
        case 'Entregue':
          stats.concluidos++;
          break;
        case 'Cancelado':
          stats.cancelados++;
          break;
      }
    });
    
    setStats(stats);
  };

  const handleChangeFiltroStatus = (status: string) => {
    setFiltros(prev => ({ ...prev, status }));
  };

  const handleChangeBusca = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltros(prev => ({ ...prev, busca: e.target.value }));
  };

  const handleChangeOrdenacao = (campo: 'data_criacao' | 'total' | 'id') => {
    setOrdenacao(prev => ({
      campo,
      ordem: prev.campo === campo && prev.ordem === 'desc' ? 'asc' : 'desc'
    }));
  };

  const abrirModalPedido = (pedido: Pedido) => {
    setPedidoSelecionado(pedido);
    setModalVisivel(true);
  };

  const fecharModalPedido = () => {
    setModalVisivel(false);
    setPedidoSelecionado(null);
  };

  const getTempoDecorridoTexto = (dataPedido: string) => {
    try {
      const data = new Date(dataPedido);
      return formatDistanceToNow(data, { locale: ptBR, addSuffix: true });
    } catch (err) {
      return '';
    }
  };

  const getDataLimiteInferior = (periodo: string): Date => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    switch (periodo) {
      case 'hoje':
        return hoje;
      case 'ontem':
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        return ontem;
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
        return inicioSemana;
      case 'mes':
        const inicioMes = new Date(hoje);
        inicioMes.setDate(1);
        return inicioMes;
      default:
        return new Date(0); // Data mínima para 'todos'
    }
  };
  
  const getDataLimiteSuperior = (periodo: string): Date => {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    
    switch (periodo) {
      case 'hoje':
        return hoje;
      case 'ontem':
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        return ontem;
      case 'semana':
        const fimSemana = new Date(hoje);
        const diasAteProximoDomingo = 7 - hoje.getDay();
        fimSemana.setDate(fimSemana.getDate() + diasAteProximoDomingo);
        return fimSemana;
      case 'mes':
        const fimMes = new Date(hoje);
        fimMes.setMonth(fimMes.getMonth() + 1);
        fimMes.setDate(0);
        return fimMes;
      default:
        return new Date(8640000000000000); // Data máxima para 'todos'
    }
  };

  const handleChangePeriodo = (periodo: 'todos' | 'hoje' | 'ontem' | 'semana' | 'mes') => {
    setFiltros(prev => ({ ...prev, periodo }));
  };

  if (loading) return <div className="text-center text-gray-700 mt-10">Carregando...</div>;
  if (erro) return <div className="text-center text-red-400 mt-10">{erro}</div>;

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center justify-center pb-24 sm:pb-32'}>
      <Toast
        mensagem={toast.mensagem}
        tipo={toast.tipo}
        visivel={toast.visivel}
      />
      
      <ModalPedido
        pedido={pedidoSelecionado}
        visivel={modalVisivel}
        onFechar={fecharModalPedido}
        onAtualizarStatus={atualizarStatus}
      />
      
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 py-10 px-4 sm:px-6">
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 border-t-4 border-orange-400 w-full flex flex-col items-center gap-6">
          <h2 className="text-2xl font-extrabold text-orange-500 mb-2 flex items-center gap-2">
            <FaClipboardList size={24} /> Painel de Pedidos
          </h2>
          
          <div className="text-gray-600 mb-2 text-center text-lg">Gerencie os pedidos dos seus clientes</div>
          
          <PedidosStats stats={stats} />
          
          <div className="w-full mb-4 flex flex-col md:flex-row gap-3 items-center">
            <div className="w-full md:w-auto flex-grow">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nome ou número do pedido..."
                  value={filtros.busca}
                  onChange={handleChangeBusca}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <FaSearch />
                </div>
              </div>
            </div>            <div className="w-full md:w-auto flex flex-col md:flex-row gap-2">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    filtros.periodo === 'todos' 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => handleChangePeriodo('todos')}
                >
                  Todos
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    filtros.periodo === 'hoje' 
                      ? 'bg-green-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => handleChangePeriodo('hoje')}
                >
                  Hoje
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    filtros.periodo === 'ontem' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => handleChangePeriodo('ontem')}
                >
                  Ontem
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    filtros.periodo === 'semana' 
                      ? 'bg-purple-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => handleChangePeriodo('semana')}
                >
                  Semana
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    filtros.periodo === 'mes' 
                      ? 'bg-indigo-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => handleChangePeriodo('mes')}
                >
                  Mês
                </button>
              </div>
              
              <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                <button
                  title="Ordenar por data"
                  onClick={() => handleChangeOrdenacao('data_criacao')}
                  className={`p-1 rounded transition ${ordenacao.campo === 'data_criacao' ? 'bg-orange-100 text-orange-500' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                  {ordenacao.campo === 'data_criacao' && ordenacao.ordem === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
                </button>
                <button
                  title="Ordenar por valor"
                  onClick={() => handleChangeOrdenacao('total')}
                  className={`p-1 rounded transition ${ordenacao.campo === 'total' ? 'bg-orange-100 text-orange-500' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                  {ordenacao.campo === 'total' && ordenacao.ordem === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
                </button>
                <button
                  title="Ordenar por número do pedido"
                  onClick={() => handleChangeOrdenacao('id')}
                  className={`p-1 rounded transition ${ordenacao.campo === 'id' ? 'bg-orange-100 text-orange-500' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                  {ordenacao.campo === 'id' && ordenacao.ordem === 'desc' ? <FaSortAmountDown /> : <FaSortAmountUp />}
                </button>
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 gap-4">
            {pedidosFiltrados.length === 0 ? (
              <div className="text-gray-400 text-center bg-gray-50 rounded-lg p-8">
                {filtros.status !== 'todos' || filtros.busca 
                  ? 'Nenhum pedido encontrado com os filtros aplicados.'
                  : 'Nenhum pedido recebido ainda.'}
              </div>
            ) : (
              pedidosFiltrados.map(pedido => (
                <div key={pedido.id} className="bg-white rounded-xl shadow p-6 flex flex-col gap-4 border border-orange-100 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-orange-600 text-lg">Pedido #{pedido.id}</div>
                      <div className="text-gray-600">Cliente: {pedido.user.nome}</div>
                      <div className="text-gray-500 text-sm">Email: {pedido.user.email}</div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`
                          px-2 py-1 rounded text-xs font-medium
                          ${pedido.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700' : ''}
                          ${pedido.status === 'Em Preparo' ? 'bg-blue-100 text-blue-700' : ''}
                          ${pedido.status === 'Saiu para Entrega' ? 'bg-orange-100 text-orange-700' : ''}
                          ${pedido.status === 'Entregue' ? 'bg-green-100 text-green-700' : ''}
                          ${pedido.status === 'Cancelado' ? 'bg-red-100 text-red-700' : ''}
                        `}>
                          {pedido.status}
                        </div>
                        
                        <div className="text-gray-500 text-xs flex items-center gap-1">
                          <FaClock size={10} />
                          <span>{getTempoDecorridoTexto(pedido.data_criacao)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-lg font-bold text-green-500">
                        R$ {pedido.total.toFixed(2)}
                      </div>
                      <button
                        onClick={() => abrirModalPedido(pedido)}
                        className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 transition"
                      >
                        <FaEye size={12} /> Ver Detalhes
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-orange-100 pt-4">
                    <div className="font-semibold text-orange-600 mb-2">Itens do Pedido:</div>
                    <ul className="space-y-1">
                      {pedido.orderItems.slice(0, 3).map(item => (
                        <li key={item.id} className="text-gray-600">
                          {item.quantidade}x {item.product.nome} - R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                        </li>
                      ))}
                      {pedido.orderItems.length > 3 && (
                        <li className="text-gray-500 text-sm italic">
                          ...e mais {pedido.orderItems.length - 3} item(ns)
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="border-t border-orange-100 pt-4">
                    <div className="font-semibold text-orange-600 mb-2">Endereço de Entrega:</div>
                    <p className="text-gray-600">
                      {pedido.address.rua}, {pedido.address.numero}
                      {pedido.address.complemento && `, ${pedido.address.complemento}`}<br />
                      {pedido.address.bairro} - {pedido.address.cidade}
                    </p>
                  </div>

                  <div className="border-t border-orange-100 pt-4">
                    <div className="font-semibold text-orange-600 mb-2">Status do Pedido:</div>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                          pedido.status === 'Pendente' 
                            ? 'bg-yellow-100 text-yellow-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500'
                        }`}
                        onClick={() => atualizarStatus(pedido.id, 'Pendente')}
                        disabled={atualizando === pedido.id}
                      >
                        Pendente
                      </button>
                      <button 
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                          pedido.status === 'Em Preparo' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500'
                        }`}
                        onClick={() => atualizarStatus(pedido.id, 'Em Preparo')}
                        disabled={atualizando === pedido.id}
                      >
                        Em Preparo
                      </button>
                      <button 
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                          pedido.status === 'Saiu para Entrega' 
                            ? 'bg-orange-100 text-orange-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-orange-50 hover:text-orange-500'
                        }`}
                        onClick={() => atualizarStatus(pedido.id, 'Saiu para Entrega')}
                        disabled={atualizando === pedido.id}
                      >
                        Saiu para Entrega
                      </button>
                      <button 
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                          pedido.status === 'Entregue' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
                        }`}
                        onClick={() => atualizarStatus(pedido.id, 'Entregue')}
                        disabled={atualizando === pedido.id}
                      >
                        Entregue
                      </button>
                      <button 
                        className={`px-4 py-2 rounded-lg font-bold transition ${
                          pedido.status === 'Cancelado' 
                            ? 'bg-red-100 text-red-600' 
                            : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                        }`}
                        onClick={() => atualizarStatus(pedido.id, 'Cancelado')}
                        disabled={atualizando === pedido.id}
                      >
                        Cancelado
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 mt-2">
                    Pedido feito em: {new Date(pedido.data_criacao).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
