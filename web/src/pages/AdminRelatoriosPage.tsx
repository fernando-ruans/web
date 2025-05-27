import React, { useEffect, useState } from 'react';
import theme from '../theme';
import { FaChartBar, FaStore, FaUser, FaMoneyBillWave, FaSpinner, FaReceipt, FaUserPlus, FaPercent, FaTrophy, FaTimesCircle, FaFilePdf, FaCalendar, FaBoxOpen, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface RelatorioResumo {
  totalVendas: number;
  totalPedidos: number;
  totalRestaurantes: number;
  totalClientes: number;
  faturamento: number;
  ticketMedio: number;
  pedidosCancelados: number;
  novosClientesMes: number;
  restauranteTop?: { id: number; nome: string; faturamento: number } | null;
}

interface PedidoAdmin {
  id: number;
  status: string;
  total: number;
  data_criacao: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
  } | null;
  restaurant: {
    id: number;
    nome: string;
    imagem: string;
  } | null;
  items: any[];
  taxa_entrega: number;
  observacao: string;
  endereco: any;
}

export default function AdminRelatoriosPage() {
  const [resumo, setResumo] = useState<RelatorioResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([]);
  const [pedidosLoading, setPedidosLoading] = useState(true);
  const [pedidosErro, setPedidosErro] = useState('');
  const [pedidosPage, setPedidosPage] = useState(1);
  const [pedidosTotalPages, setPedidosTotalPages] = useState(1);
  const [pedidosTotal, setPedidosTotal] = useState(0);

  // Função para carregar o relatório com logs de depuração
  const carregarRelatorio = (params = '') => {
    setLoading(true);
    setErro('');
    const url = `/api/admin/relatorios/resumo${params}`;
    const token = localStorage.getItem('token');
    console.log('[AdminRelatorios] Buscando resumo:', url);
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          console.error('[AdminRelatorios] Erro HTTP:', res.status, res.statusText);
          return Promise.reject(res);
        }
        return res.json();
      })
      .then(data => {
        console.log('[AdminRelatorios] Dados recebidos:', data);
        setResumo(data);
      })
      .catch(err => {
        setErro('Erro ao carregar dados do relatório.');
        console.error('[AdminRelatorios] Erro ao carregar dados:', err);
      })
      .finally(() => setLoading(false));
  };

  // Função para carregar pedidos (sem filtro de data, apenas paginação)
  const carregarPedidos = (page = 1) => {
    setPedidosLoading(true);
    setPedidosErro('');
    const url = `/api/admin/orders?page=${page}`;
    const token = localStorage.getItem('token');
    console.log('[AdminRelatorios] Buscando pedidos:', url);
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          console.error('[AdminRelatorios] Erro HTTP pedidos:', res.status, res.statusText);
          return Promise.reject(res);
        }
        return res.json();
      })
      .then(data => {
        console.log('[AdminRelatorios] Pedidos recebidos:', data);
        setPedidos(data.data);
        setPedidosPage(data.pagination.page);
        setPedidosTotalPages(data.pagination.totalPages);
        setPedidosTotal(data.pagination.total);
      })
      .catch(err => {
        setPedidosErro('Erro ao carregar pedidos.');
        console.error('[AdminRelatorios] Erro ao carregar pedidos:', err);
      })
      .finally(() => setPedidosLoading(false));
  };

  useEffect(() => {
    carregarRelatorio();
    carregarPedidos(1);
  }, []);

  // Função para filtrar por data
  const handleFiltrar = () => {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    console.log('[AdminRelatorios] Filtro aplicado:', { dataInicio, dataFim });
    carregarRelatorio(`?${params.toString()}`);
  };

  // Função para gerar PDF
  const handleGerarPDF = () => {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    const url = `/api/admin/relatorios/pdf?${params.toString()}`;
    const token = localStorage.getItem('token');
    console.log('[AdminRelatorios] Gerando PDF:', url);
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${dataInicio || 'geral'}-a-${dataFim || 'atual'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      })
      .catch(err => {
        setErro('Erro ao gerar PDF. Tente novamente.');
        console.error('[AdminRelatorios] Erro ao gerar PDF:', err);
      });
  };

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center justify-center pb-24 sm:pb-32'}>
      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6 border-t-4 border-orange-400 mt-8">
        <h2 className="text-3xl font-extrabold text-orange-600 flex items-center gap-2 mb-2"><FaChartBar size={28} /> Relatórios Gerais</h2>
        
        {/* Filtros e botão de PDF */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4 items-center flex-grow">          <div className="flex items-center gap-2">
              <FaCalendar color="#6b7280" size={16} />
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
                placeholder="Data Início"
              />
            </div>
            <div className="flex items-center gap-2">
              <FaCalendar color="#6b7280" size={16} />
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
                placeholder="Data Fim"
              />
            </div>
            <button
              onClick={handleFiltrar}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
            >
              Filtrar
            </button>
          </div>
          
          <button
            onClick={handleGerarPDF}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
          >
            <FaFilePdf /> Gerar PDF
          </button>
        </div>

        <div className="text-gray-500 mb-4 text-center">Visão geral do desempenho do app: vendas, pedidos, restaurantes, clientes e faturamento.</div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-blue-400"><FaSpinner size={32} color="#3b82f6" /> Carregando...</div>
        ) : erro ? (
          <div className="text-red-400 text-center font-bold">{erro}</div>
        ) : resumo && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
              <FaMoneyBillWave size={32} color="#3b82f6" />
              <div className="text-2xl font-bold text-blue-700">R$ {resumo.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-gray-600 text-sm">Faturamento Total</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
              <FaChartBar size={32} color="#fb923c" />
              <div className="text-2xl font-bold text-orange-600">{resumo.totalVendas}</div>
              <div className="text-gray-600 text-sm">Vendas Realizadas</div>
            </div>
            <div className="bg-green-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
              <FaStore size={32} color="#22c55e" />
              <div className="text-2xl font-bold text-green-700">{resumo.totalRestaurantes}</div>
              <div className="text-gray-600 text-sm">Restaurantes Ativos</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
              <FaUser size={32} color="#eab308" />
              <div className="text-2xl font-bold text-yellow-700">{resumo.totalClientes}</div>
              <div className="text-gray-600 text-sm">Clientes Cadastrados</div>
            </div>
            {/* Ambos os cards abaixo usam totalVendas para garantir igualdade */}
            <div className="bg-purple-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow col-span-1 sm:col-span-2">
              <FaReceipt size={32} color="#a21caf" />
              <div className="text-2xl font-bold text-purple-700">{resumo.totalVendas}</div>
              <div className="text-gray-600 text-sm">Pedidos Entregues</div>
            </div>
            <div className="bg-pink-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
              <FaPercent size={32} color="#db2777" />
              <div className="text-2xl font-bold text-pink-700">R$ {resumo.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <div className="text-gray-600 text-sm">Ticket Médio</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
              <FaTimesCircle size={32} color="#ef4444" />
              <div className="text-2xl font-bold text-red-700">{resumo.pedidosCancelados}</div>
              <div className="text-gray-600 text-sm">Pedidos Cancelados</div>
            </div>
            <div className="bg-lime-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
              <FaUserPlus size={32} color="#65a30d" />
              <div className="text-2xl font-bold text-lime-700">{resumo.novosClientesMes}</div>
              <div className="text-gray-600 text-sm">Novos Clientes no Mês</div>
            </div>
            {resumo.restauranteTop && (
              <div className="bg-indigo-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow col-span-1 sm:col-span-2">
                <FaTrophy size={32} color="#6366f1" />
                <div className="text-lg font-bold text-indigo-700">{resumo.restauranteTop.nome}</div>
                <div className="text-gray-600 text-sm">Restaurante com maior faturamento: R$ {resumo.restauranteTop.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            )}
          </div>
        )}

        {/* NOVO BLOCO: Listagem de pedidos do sistema */}
        <h3 className="text-2xl font-bold text-orange-600 flex items-center gap-2 mt-8 mb-2"><FaBoxOpen /> Pedidos do Sistema</h3>
        <div className="mb-2 text-gray-500 text-sm text-center">Pedidos recentes de todos os clientes e restaurantes. Paginação de 15 em 15.</div>
        {pedidosLoading ? (
          <div className="flex flex-col items-center justify-center py-6 text-blue-400"><FaSpinner size={28} /> Carregando pedidos...</div>
        ) : pedidosErro ? (
          <div className="text-red-400 text-center font-bold">{pedidosErro}</div>
        ) : pedidos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
            <FaBoxOpen size={40} />
            Nenhum pedido encontrado.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">#</th>
                    <th className="px-2 py-2 text-left">Data</th>
                    <th className="px-2 py-2 text-left">Cliente</th>
                    <th className="px-2 py-2 text-left">Restaurante</th>
                    <th className="px-2 py-2 text-left">Total</th>
                    <th className="px-2 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(pedido => (
                    <tr key={pedido.id} className="border-b hover:bg-gray-50">
                      <td className="px-2 py-2 font-mono">{pedido.id}</td>
                      <td className="px-2 py-2">{new Date(pedido.data_criacao).toLocaleString('pt-BR')}</td>
                      <td className="px-2 py-2">
                        {pedido.usuario ? (
                          <span>
                            <span className="font-bold">{pedido.usuario.nome}</span><br />
                            <span className="text-xs text-gray-500">{pedido.usuario.email}</span>
                          </span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-2 py-2">
                        {pedido.restaurant ? (
                          <span className="flex items-center gap-2">
                            {pedido.restaurant.imagem && <img src={pedido.restaurant.imagem} alt="" className="w-6 h-6 rounded-full object-cover" />}
                            {pedido.restaurant.nome}
                          </span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-2 py-2 font-mono">R$ {pedido.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-2 py-2">
                        <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700">{pedido.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Paginação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
              <div className="text-gray-500 text-sm text-center">
                Página {pedidosPage} de {pedidosTotalPages} • {pedidosTotal} pedidos
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
                  onClick={() => pedidosPage > 1 && carregarPedidos(pedidosPage - 1)}
                  disabled={pedidosPage === 1}
                >
                  <FaChevronLeft /> Anterior
                </button>
                <button
                  className="bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
                  onClick={() => pedidosPage < pedidosTotalPages && carregarPedidos(pedidosPage + 1)}
                  disabled={pedidosPage === pedidosTotalPages}
                >
                  Próxima <FaChevronRight />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
