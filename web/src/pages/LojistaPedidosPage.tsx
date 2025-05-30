import React, { useEffect, useState, useCallback, useRef } from 'react';
import DetalhePedidoModal from '../components/DetalhePedidoModal';
import NotificationSettings, { NotificationSettingsConfig } from '../components/NotificationSettings';
import { ToastProvider, useToast } from '../components/ToastProvider';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import axios from 'axios';
import { formatCurrency } from '../utils/format';
import { useWebSocket } from '../context/WebSocketContext';
import { useNotificationSound } from '../hooks/useNotificationSound';
import { FaRegClock, FaUtensils, FaMotorcycle, FaCalendarDay, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';

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
  status: 'pendente' | 'preparando' | 'em_entrega' | 'entregue' | 'cancelado';
  createdAt: string;
  usuario: Usuario;
  items: ItemPedido[];
  taxa_entrega: number;
  observacao?: string;
  endereco: Endereco;
  formaPagamento?: string | null;
}

// Adiciona um tipo auxiliar para debug
interface PedidoDebug extends Pedido {
  original?: any;
}

const statusClasses: Record<Pedido['status'], string> = {
  'pendente': 'bg-yellow-100 text-yellow-800 transition-colors duration-200',
  'preparando': 'bg-blue-100 text-blue-800 transition-colors duration-200',
  'em_entrega': 'bg-orange-100 text-orange-800 transition-colors duration-200',
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
  'preparando': 'Em Preparo',
  'em_entrega': 'Em Entrega',
  'entregue': 'Entregue',
  'cancelado': 'Cancelado'
};

interface DetalhePedidoModalProps {
  pedido: Pedido;
  isOpen: boolean;
  onClose: () => void;
}

const DetalhePedidoModalWrapper: React.FC<DetalhePedidoModalProps> = ({ pedido, isOpen, onClose }) => {
  // Garante que usuario sempre exista, inclusive para pedidos vindos do WebSocket
  let usuario = pedido.usuario;
  if (!usuario) {
    usuario = {
      id: 0,
      nome: (pedido as any).user?.nome || (pedido as any).clienteNome || 'Cliente',
      email: (pedido as any).user?.email || '',
      telefone: (pedido as any).user?.telefone || (pedido as any).telefone || (pedido as any).clienteTelefone || ''
    };
  }
  return (
    <DetalhePedidoModal
      open={isOpen}
      onClose={onClose}
      pedido={{
        id: pedido.id,
        status: pedido.status,
        createdAt: pedido.createdAt,
        usuario: {
          nome: usuario.nome || 'Nome não disponível',
          telefone: usuario.telefone || 'Telefone não disponível'
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
        formaPagamento: (pedido as any).formaPagamento || undefined,
        trocoPara: (pedido as any).trocoPara || null // <-- repassa trocoPara se existir
      }}
      statusNomes={statusNomes}
    />
  );
};

const BotoesAcao = ({ pedido, onAtualizarStatus }: { pedido: Pedido, onAtualizarStatus: (id: number, status: Pedido['status']) => Promise<void> }) => {
  const botoesPorStatus: Record<Pedido['status'], Array<{ status: Pedido['status'], texto: string, cor: string }>> = {
    'pendente': [
      { status: 'preparando', texto: 'Iniciar Preparo', cor: 'bg-blue-500 hover:bg-blue-600' },
      { status: 'cancelado', texto: 'Cancelar', cor: 'bg-red-500 hover:bg-red-600' }
    ],
    'preparando': [
      { status: 'em_entrega', texto: 'Enviar para Entrega', cor: 'bg-orange-500 hover:bg-orange-600' },
      { status: 'cancelado', texto: 'Cancelar', cor: 'bg-red-500 hover:bg-red-600' }
    ],
    'em_entrega': [
      { status: 'entregue', texto: 'Confirmar Entrega', cor: 'bg-green-500 hover:bg-green-600' },
      { status: 'cancelado', texto: 'Cancelar', cor: 'bg-red-500 hover:bg-red-600' }
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
    { value: 'preparando', label: 'Em Preparo' },
    { value: 'em_entrega', label: 'Em Entrega' },
    { value: 'entregue', label: 'Entregue' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  // Define quais transições são permitidas a partir do status atual
  const statusPermitidos: Record<Pedido['status'], Pedido['status'][]> = {
    pendente: ['pendente', 'preparando', 'cancelado'],
    preparando: ['preparando', 'em_entrega', 'cancelado'],
    em_entrega: ['em_entrega', 'entregue', 'cancelado'],
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
  };  // Função para gerar mensagem de status para o cliente
  function gerarMensagemStatusWhatsapp(pedido: Pedido, statusNomes: Record<string, string>) {
    const nome = pedido.usuario?.nome || 'Cliente';
    const status = statusNomes[pedido.status] || pedido.status;
    let msg = `*ATUALIZACAO DO SEU PEDIDO*\n\n`;
    msg += `Ola, ${nome}!\n\n`;
    msg += `Seu pedido #${pedido.id} foi atualizado:\n`;
    msg += `*Status atual: ${status}*\n\n`;
    
    switch (pedido.status) {
      case 'preparando':
        msg += '*SEU PEDIDO ESTA SENDO PREPARADO!*\n';
        msg += 'Nossa equipe esta cozinhando com muito carinho\n';
        msg += 'Em breve estara pronto para entrega!';
        break;
      case 'em_entrega':
        msg += '*SEU PEDIDO SAIU PARA ENTREGA!*\n';
        msg += 'Nosso entregador esta a caminho\n';
        msg += 'Mantenha o telefone por perto!';
        break;
      case 'entregue':
        msg += '*PEDIDO ENTREGUE COM SUCESSO!*\n';
        msg += 'Bom apetite!\n';
        msg += 'Que tal avaliar seu pedido?';
        break;
      case 'cancelado':
        msg += '*PEDIDO CANCELADO*\n';
        msg += 'Infelizmente seu pedido foi cancelado\n';
        msg += 'Entre em contato para mais informacoes';
        break;
      default:
        msg += '*SEU PEDIDO ESTA EM ANDAMENTO*\n';
        msg += 'Acompanhe as atualizacoes em tempo real';
    }
    
    msg += '\n\n*Acompanhe pelo DeliveryX*';
    msg += `\n${new Date().toLocaleString('pt-BR')}`;
    
    // Retornar mensagem sem codificação para evitar dupla codificação
    return msg;
  }
  function handleNotificarWhatsapp(pedido: Pedido, statusNomes: Record<string, string>) {
    const telefone = pedido.usuario?.telefone?.replace(/\D/g, '');
    if (!telefone) return;
    
    const mensagem = gerarMensagemStatusWhatsapp(pedido, statusNomes);
    
    // Usar encodeURIComponent para codificar a mensagem, igual ao padrão do DetalhePedidoPage
    const mensagemCodificada = encodeURIComponent(mensagem);
    
    // Log para debug
    console.log('Mensagem de status original:', mensagem);
    console.log('Mensagem de status codificada:', mensagemCodificada);
    console.log('Tamanho da mensagem:', mensagem.length);
    
    window.open(`https://wa.me/55${telefone}?text=${mensagemCodificada}`, '_blank');
  }

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-4 sm:p-6 mb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0">
        <div className="space-y-2 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Pedido #{pedido.id}</h3>
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${statusClasses[pedido.status]}`}>{statusNomes[pedido.status]}</span>
          </div>
          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{format(new Date(pedido.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{pedido.usuario.nome}</span>
          </div>
          <p className="text-base sm:text-lg font-bold text-orange-500">
            {formatCurrency(calcularTotal(pedido.items, pedido.taxa_entrega))}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            onClick={() => setShowDetalhes(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 hover:shadow-md flex items-center gap-2 w-full sm:w-auto"
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
              className="px-2 sm:px-3 py-2 rounded-lg border border-gray-300 shadow-sm text-xs sm:text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition w-full sm:w-auto"
              disabled={pedido.status === 'entregue' || pedido.status === 'cancelado'}
            >
              {opcoesFiltradas.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {pedido.usuario?.telefone && (
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-2 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 mt-2 sm:mt-0"
              title="Notificar cliente via WhatsApp"
              onClick={() => handleNotificarWhatsapp(pedido, statusNomes)}
              type="button"
            >
              <span role="img" aria-label="whatsapp">🟢</span> WhatsApp
            </button>
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

  // Faturamento do período também deve usar pedidosFiltrados, mas ignorar cancelados
  const calcularFaturamentoPeriodo = () => {
    if (!Array.isArray(pedidosParaContar)) return 0;
    return pedidosParaContar
      .filter(pedido => pedido.status !== 'cancelado')
      .reduce((total, pedido) => total + calcularTotal(pedido.items, pedido.taxa_entrega), 0);
  };

  const cards = [
    {
      titulo: 'Pendentes',
      valor: contarPorStatus('pendente'),
      cor: 'from-yellow-400 to-yellow-600',
      icone: (
        <FaRegClock className="w-8 h-8" />
      )
    },
    {
      titulo: 'Em Preparo',
      valor: contarPorStatus('preparando'),
      cor: 'from-blue-400 to-blue-600',
      icone: (
        <FaUtensils className="w-8 h-8" />
      )
    },
    {
      titulo: 'Em Entrega',
      valor: contarPorStatus('em_entrega'),
      cor: 'from-orange-400 to-orange-600',
      icone: (
        <FaMotorcycle className="w-8 h-8" />
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
        <FaCalendarDay className="w-8 h-8" />
      )
    },
    {
      titulo: 'Faturamento do Período',
      valor: formatCurrency(calcularFaturamentoPeriodo()),
      cor: 'from-green-400 to-green-600',
      icone: (
        <FaMoneyBillWave className="w-8 h-8" />
      )
    },
    {
      titulo: 'Concluídos',
      valor: contarPorStatus('entregue'),
      cor: 'from-purple-400 to-purple-600',
      icone: (
        <FaCheckCircle className="w-8 h-8" />
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8" style={{gridAutoRows: '1fr'}}>
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-200 hover:scale-105 min-h-[120px] md:min-h-[140px] flex flex-col justify-center">
          <div className={`p-5 md:p-6 bg-gradient-to-r ${card.cor} text-white h-full flex flex-col justify-center`}> 
            {/* Conteúdo do card */}
            <div className="flex flex-row items-center gap-4 w-full h-full">
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {card.titulo === 'Faturamento do Período' ? (
                  <div className="flex flex-col justify-center h-full">
                    <span className="text-white/80 text-base md:text-lg font-medium mb-2 inline-block">{card.titulo}</span>
                    <span className="font-bold text-2xl md:text-4xl break-all flex items-baseline gap-1 mt-1" style={{wordBreak: 'break-all', lineHeight: 1.1}} title={String(card.valor)}>
                      R$ {String(card.valor).replace('R$','').trim()}
                    </span>
                  </div>
                ) : (
                  <>
                    <p className="text-white/80 text-base md:text-lg font-medium mb-2 whitespace-nowrap overflow-hidden text-ellipsis">{card.titulo}</p>
                    <p
                      className={`font-bold text-3xl md:text-5xl max-w-full leading-tight break-words truncate ${String(card.valor).length > 10 ? 'text-2xl md:text-4xl' : ''} ${String(card.valor).length > 15 ? 'text-xl md:text-3xl' : ''}`}
                      style={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                        lineHeight: 1.1
                      }}
                      title={String(card.valor)}
                    >
                      {card.valor}
                    </p>
                  </>
                )}
              </div>
              {card.icone && card.titulo !== 'Faturamento do Período' && (
                <div className="flex-shrink-0 bg-white/20 p-4 md:p-6 rounded-lg ml-2 flex items-center justify-center" style={{minWidth: 56, minHeight: 56}}>
                  {React.cloneElement(card.icone, { className: 'w-10 h-10 md:w-14 md:h-14' })}
                </div>
              )}
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
  setTermoBusca,
  filtroPersonalizado,
  setFiltroPersonalizado,
  aplicarFiltroPersonalizado
}: { 
  filtroStatus: Pedido['status'] | 'todos',
  setFiltroStatus: (status: Pedido['status'] | 'todos') => void,
  filtroPeriodo: string,
  setFiltroPeriodo: (periodo: string) => void,
  termoBusca: string,
  setTermoBusca: (termo: string) => void,
  filtroPersonalizado: { inicio: string, fim: string },
  setFiltroPersonalizado: (f: { inicio: string, fim: string }) => void,
  aplicarFiltroPersonalizado: () => void
}) => {
  const refInicio = useRef<HTMLInputElement>(null);
  const refFim = useRef<HTMLInputElement>(null);
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
        <div className="flex flex-wrap gap-2 items-center">
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
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-2 ml-0 sm:ml-2 mt-2 sm:mt-0">
            <input
              ref={refInicio}
              type="date"
              className="px-2 py-2 rounded border border-gray-300 text-gray-700 text-sm w-full sm:w-auto"
              value={filtroPersonalizado.inicio}
              onChange={e => setFiltroPersonalizado({ ...filtroPersonalizado, inicio: e.target.value })}
            />
            <span className="text-gray-500 flex items-center justify-center">até</span>
            <input
              ref={refFim}
              type="date"
              className="px-2 py-2 rounded border border-gray-300 text-gray-700 text-sm w-full sm:w-auto"
              value={filtroPersonalizado.fim}
              onChange={e => setFiltroPersonalizado({ ...filtroPersonalizado, fim: e.target.value })}
            />
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded font-semibold text-sm w-full sm:w-auto"
              onClick={aplicarFiltroPersonalizado}
              type="button"
            >Aplicar</button>
          </div>
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
  return (
    <ToastProvider>
      <LojistaPedidosPageContent />
    </ToastProvider>
  );
}

function LojistaPedidosPageContent() {  
  const { pedidos: pedidosWS, connected } = useWebSocket();
  const { showSuccess } = useToast();
  const [pedidosLocal, setPedidosLocal] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<PeriodoFiltro>('hoje');
  const [filtroStatus, setFiltroStatus] = useState<Pedido['status'] | 'todos'>('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('hoje');
  const [termoBusca, setTermoBusca] = useState('');
  const [loadingStatus, setLoadingStatus] = useState<number | null>(null);
  const [filtroPersonalizado, setFiltroPersonalizado] = useState({ inicio: '', fim: '' });
    // Estados para sistema de notificação
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingsConfig>({
    soundEnabled: true,
    volume: 0.8
  });
  const [lastPedidoCount, setLastPedidoCount] = useState(0);
  
  // Hook para reprodução de som
  const { playSound } = useNotificationSound({
    enabled: notificationSettings.soundEnabled,
    volume: notificationSettings.volume
  });

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
      if (Array.isArray(data)) {
        pedidosData = data;
      } else if (data?.pedidos) {
        pedidosData = data.pedidos;
      } else if (data?.data) {
        pedidosData = data.data;
      }
      const statusValidos = ['pendente','preparando','em_entrega','entregue','cancelado'];
      pedidosData = pedidosData.map(pedido => {
        let status = (pedido.status || '').toLowerCase();
        if (!statusValidos.includes(status)) {
          status = 'pendente';
        }
        // Garante que usuario sempre exista corretamente, inclusive para pedidos vindos do WebSocket
        let usuario = pedido.usuario;
        if (!usuario) {
          usuario = {
            id: 0,
            nome: (pedido as any).user?.nome || (pedido as any).clienteNome || 'Cliente',
            email: (pedido as any).user?.email || '',
            telefone: (pedido as any).user?.telefone || (pedido as any).telefone || (pedido as any).clienteTelefone || ''
          };
        }
        return {
          ...pedido,
          usuario,
          status: status as Pedido['status'],
          taxa_entrega: pedido.taxa_entrega || 0,
          observacao: pedido.observacao || '',
          items: pedido.items?.map(item => ({
            ...item,
            adicionais: item.adicionais || []
          })) || []
        };
      });
      setPedidosLocal(pedidosData);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError('Erro ao carregar pedidos. Por favor, tente novamente.');
      setPedidosLocal([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling periódico igual ao painel do cliente
  useEffect(() => {
    buscarPedidos();
    const interval = setInterval(() => {
      buscarPedidos();
    }, 30000);
    return () => clearInterval(interval);
  }, [buscarPedidos]);

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

  function normalizarStatus(status: string): Pedido['status'] {
    const s = (status || '').toLowerCase().replace(/\s|_/g, '');
    if (s === 'pendente' || s === 'pending') return 'pendente';
    if (s === 'preparando' || s === 'empreparo' || s === 'empreparo') return 'preparando';
    if (s === 'ementrega' || s === 'emrota' || s === 'outfordelivery' || s === 'entregando') return 'em_entrega';
    if (s === 'entregue' || s === 'delivered' || s === 'completed') return 'entregue';
    if (s === 'cancelado' || s === 'canceled' || s === 'cancelled') return 'cancelado';
    return 'pendente'; // fallback seguro
  }

  // Função utilitária para normalizar pedidos vindos do WebSocket ou API
  function normalizarPedido(p: any): Pedido & { trocoPara?: number | null } {
    // Prioriza telefone vindo de p.usuario.telefone, depois outros campos
    let usuario = p.usuario || { nome: p.clienteNome || 'Cliente', telefone: p.clienteTelefone || '' };
    if (usuario && (usuario.telefone === undefined || usuario.telefone === null)) {
      usuario.telefone = '';
    }
    // NOVO: prioriza telefone do p.usuario.telefone se existir
    if (p.usuario && p.usuario.telefone) {
      usuario.telefone = p.usuario.telefone;
    } else if (!usuario.telefone || usuario.telefone.trim() === '' || usuario.telefone === 'Telefone não disponível') {
      usuario.telefone = p.telefone || p.clienteTelefone || '';
    }
    return {
      id: p.id,
      status: normalizarStatus(p.status),
      createdAt: p.createdAt || p.data_criacao || '',
      usuario,
      items: (p.items || p.orderItems || []).map((item: any) => ({
        id: item.id,
        quantidade: item.quantidade,
        produto: item.produto || item.product || { id: 0, nome: '', preco: 0 },
        adicionais: (item.adicionais || []).map((a: any) => ({
          id: a.id || a.adicionalId || (a.adicional && a.adicional.id) || 0,
          nome: a.nome || (a.adicional && a.adicional.nome) || '',
          preco: Number(a.preco || (a.adicional && a.adicional.preco) || 0),
          quantidade: a.quantidade || 1
        }))
      })),
      taxa_entrega: Number(p.taxa_entrega || (p.restaurant && p.restaurant.taxa_entrega) || 0),
      observacao: p.observacao || '',
      endereco: p.endereco || p.address || {
        rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: ''
      },
      formaPagamento: p.formaPagamento || p.forma_pagamento || null,
      trocoPara: p.trocoPara !== undefined ? p.trocoPara : (p.troco_para !== undefined ? p.troco_para : null)
    };
  }

  // Corrige para garantir que pedidos sempre seja array, normalizado e ordenado por data de criação (mais recente primeiro)
  const pedidos = ((connected && Array.isArray(pedidosWS))
    ? pedidosWS.map(p => { const n: PedidoDebug = normalizarPedido(p); n.original = p; return n; })
    : (Array.isArray(pedidosLocal) ? pedidosLocal.map(p => { const n: PedidoDebug = normalizarPedido(p); n.original = p; return n; }) : []))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  // Detectar novos pedidos e tocar som
  useEffect(() => {
    if (pedidos.length > 0) {
      // Se não é o primeiro carregamento e há mais pedidos que antes
      if (lastPedidoCount > 0 && pedidos.length > lastPedidoCount) {
        console.log('Novo pedido detectado! Tocando som de notificação...');
        playSound();
          // Mostrar notificação toast interna
        showSuccess(
          '🛒 Novo Pedido Recebido!', 
          'Você tem um novo pedido aguardando confirmação. Clique para visualizar os detalhes.',
          8000
        );
      }
      setLastPedidoCount(pedidos.length);
    }
  }, [pedidos.length, lastPedidoCount, playSound, showSuccess]);

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
    if (filtroPeriodo === 'personalizado' && filtroPersonalizado.inicio && filtroPersonalizado.fim) {
      // Corrige para garantir que o filtro de um único dia funcione corretamente
      const inicio = new Date(filtroPersonalizado.inicio + 'T00:00:00');
      const fim = new Date(filtroPersonalizado.fim + 'T23:59:59.999');
      return dataPedido >= inicio && dataPedido <= fim;
    }
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

  const aplicarFiltroPersonalizado = () => {
    setFiltroPeriodo('personalizado');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel de Pedidos</h1>
            <p className="mt-1 text-gray-500">Gerencie os pedidos dos seus clientes</p>
          </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Sistema atualizado em tempo real
            </div>
            
            {/* Componente de configurações de notificação */}
            <NotificationSettings onSettingsChange={setNotificationSettings} />
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
          filtroPersonalizado={filtroPersonalizado}
          setFiltroPersonalizado={setFiltroPersonalizado}
          aplicarFiltroPersonalizado={aplicarFiltroPersonalizado}
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