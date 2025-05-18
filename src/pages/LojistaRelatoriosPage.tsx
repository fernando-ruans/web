import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';
import { FaChartBar, FaMoneyBillWave, FaUtensils, FaReceipt, FaSpinner, FaTimesCircle, FaStar, FaUsers, FaShoppingBag, FaTrophy } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Registrando componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

interface RelatorioDados {
  faturamentoTotal: number;
  totalVendas: number;
  mediaAvaliacao: number;
  pedidosCancelados: number;
  ticketMedio: number;
  clientesNovos: number;
  pedidosUltimos7Dias: number[];
  faturamentoPorCategoria: {
    categoria: string;
    valor: number;
  }[];
  produtosMaisVendidos: {
    nome: string;
    quantidade: number;
  }[];
  diasMaisMovimentados: {
    dia: string;
    pedidos: number;
  }[];
}

// Dados de exemplo para quando a API falhar
const dadosExemplo: RelatorioDados = {
  faturamentoTotal: 8750.50,
  totalVendas: 120,
  mediaAvaliacao: 4.7,
  pedidosCancelados: 5,
  ticketMedio: 72.92,
  clientesNovos: 18,
  pedidosUltimos7Dias: [8, 12, 15, 10, 20, 22, 18],
  faturamentoPorCategoria: [
    { categoria: 'Hambúrgueres', valor: 3200.00 },
    { categoria: 'Pizzas', valor: 2500.00 },
    { categoria: 'Bebidas', valor: 1500.50 },
    { categoria: 'Sobremesas', valor: 950.00 },
    { categoria: 'Outros', valor: 600.00 }
  ],
  produtosMaisVendidos: [
    { nome: 'X-Tudo', quantidade: 48 },
    { nome: 'Pizza de Calabresa', quantidade: 32 },
    { nome: 'Coca-Cola 2L', quantidade: 45 },
    { nome: 'Batata Frita Grande', quantidade: 37 },
    { nome: 'Sorvete de Chocolate', quantidade: 25 }
  ],
  diasMaisMovimentados: [
    { dia: 'Sábado', pedidos: 35 },
    { dia: 'Sexta', pedidos: 28 },
    { dia: 'Domingo', pedidos: 25 },
    { dia: 'Quinta', pedidos: 15 },
    { dia: 'Quarta', pedidos: 12 },
    { dia: 'Terça', pedidos: 10 },
    { dia: 'Segunda', pedidos: 8 }
  ]
};

export default function LojistaRelatoriosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurante, setRestaurante] = useState<any>(null);
  const [restLoading, setRestLoading] = useState(true);
  const [dados, setDados] = useState<RelatorioDados | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.tipo !== 'lojista') {
      navigate('/');
    }
    
    // Buscar restaurante do lojista
    async function fetchRestaurante() {
      setRestLoading(true);
      try {
        const res = await fetch('/api/lojista/restaurants', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setRestaurante(data[0] || null);
          
          // Se encontrou o restaurante, busca os dados de relatórios
          if (data[0] && data[0].id) {
            fetchDadosRelatorio(data[0].id);
          } else {
            setCarregandoDados(false);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar restaurante:', error);
      } finally {
        setRestLoading(false);
      }
    }
      // Buscar dados do relatório
    async function fetchDadosRelatorio(restauranteId: number) {
      setCarregandoDados(true);
      setErro('');
      try {
        // Primeiro tenta usar a API regular
        const res = await fetch(`/api/lojista/relatorios/${restauranteId}`, { credentials: 'include' });
        
        if (res.ok) {
          const data = await res.json();
          setDados(data);
        } else {
          console.error("Erro na API regular:", res.status, res.statusText);
          
          // Se falhar, tenta usar a API de demonstração 
          try {
            const demoRes = await fetch(`/api/lojista/relatorios-demo/${restauranteId}`, { credentials: 'include' });
            if (demoRes.ok) {
              const demoData = await demoRes.json();
              setDados(demoData);
            } else {
              // Se ambas falharem, usa os dados de exemplo locais
              setDados(dadosExemplo);
            }
          } catch (demoError) {
            console.error("Erro na API de demonstração:", demoError);
            setDados(dadosExemplo);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados de relatório:', error);
        // Em caso de erro, tenta usar a API de demonstração
        try {
          const demoRes = await fetch(`/api/lojista/relatorios-demo/${restauranteId}`, { credentials: 'include' });
          if (demoRes.ok) {
            const demoData = await demoRes.json();
            setDados(demoData);
          } else {
            setDados(dadosExemplo);
          }
        } catch (demoError) {
          console.error("Erro na API de demonstração:", demoError);
          setDados(dadosExemplo);
        }
      } finally {
        setCarregandoDados(false);
      }
    }
    
    fetchRestaurante();
  }, [user, navigate]);

  // Configurações para os gráficos
  const produtosMaisVendidosChart = {
    labels: dados?.produtosMaisVendidos.map(p => p.nome) || [],
    datasets: [
      {
        label: 'Quantidade Vendida',
        data: dados?.produtosMaisVendidos.map(p => p.quantidade) || [],
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  };

  const faturamentoPorCategoriaChart = {
    labels: dados?.faturamentoPorCategoria.map(c => c.categoria) || [],
    datasets: [
      {
        label: 'Faturamento (R$)',
        data: dados?.faturamentoPorCategoria.map(c => c.valor) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pedidosUltimosSeteDiasChart = {
    labels: ['Há 7 dias', 'Há 6 dias', 'Há 5 dias', 'Há 4 dias', 'Há 3 dias', 'Há 2 dias', 'Ontem'],
    datasets: [
      {
        label: 'Número de Pedidos',
        data: dados?.pedidosUltimos7Dias || [],
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      },
    ],
  };

  const diasMaisMovimentadosChart = {
    labels: dados?.diasMaisMovimentados.map(d => d.dia) || [],
    datasets: [
      {
        label: 'Número de Pedidos',
        data: dados?.diasMaisMovimentados.map(d => d.pedidos) || [],
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center pb-24 sm:pb-32'}>
      <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6 border-t-4 border-orange-400 mt-8">
        <h2 className="text-3xl font-extrabold text-orange-600 flex items-center gap-2 mb-2">
          <FaChartBar size={28} /> Relatórios do Restaurante
        </h2>
          {restLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin text-4xl text-orange-500">
              <FaSpinner />
            </div>
          </div>
        ) : !restaurante ? (
          <div className="text-red-500 font-bold text-center py-8">
            Nenhum restaurante encontrado para este lojista!
          </div>
        ) : (
          <>
            <div className="text-orange-600 font-bold text-xl mb-6">
              Estatísticas para: {restaurante.nome}
            </div>
            
            {carregandoDados ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin text-4xl text-blue-500">
                  <FaSpinner />
                </div>
              </div>
            ) : erro ? (
              <div className="text-red-500 font-bold text-center py-4">
                {erro}
              </div>
            ) : dados ? (
              <>
                {/* Cards de métricas principais */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-blue-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow-md">
                    <FaMoneyBillWave size={32} color="#3b82f6" />
                    <div className="text-2xl font-bold text-blue-700">R$ {dados.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="text-gray-600 text-sm">Faturamento Total</div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow-md">
                    <FaReceipt size={32} color="#f97316" />
                    <div className="text-2xl font-bold text-orange-600">{dados.totalVendas}</div>
                    <div className="text-gray-600 text-sm">Pedidos Completados</div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow-md">
                    <FaStar size={32} color="#eab308" />
                    <div className="text-2xl font-bold text-yellow-600">{dados.mediaAvaliacao.toFixed(1)}</div>
                    <div className="text-gray-600 text-sm">Média de Avaliação</div>
                  </div>
                  
                  <div className="bg-red-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow-md">
                    <FaTimesCircle size={32} color="#ef4444" />
                    <div className="text-2xl font-bold text-red-600">{dados.pedidosCancelados}</div>
                    <div className="text-gray-600 text-sm">Pedidos Cancelados</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Gráfico de barras - Produtos mais vendidos */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Produtos Mais Vendidos</h3>
                    <div className="h-64">
                      <Bar 
                        data={produtosMaisVendidosChart} 
                        options={{ 
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: {
                            legend: { display: false }
                          }
                        }} 
                      />
                    </div>
                  </div>
                  
                  {/* Gráfico de pizza - Faturamento por categoria */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Faturamento por Categoria</h3>
                    <div className="h-64">
                      <Pie 
                        data={faturamentoPorCategoriaChart} 
                        options={{ 
                          maintainAspectRatio: false,
                          responsive: true 
                        }} 
                      />
                    </div>
                  </div>
                  
                  {/* Gráfico de linha - Pedidos últimos 7 dias */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Pedidos nos Últimos 7 Dias</h3>
                    <div className="h-64">
                      <Line 
                        data={pedidosUltimosSeteDiasChart} 
                        options={{ 
                          maintainAspectRatio: false,
                          responsive: true,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: { precision: 0 }
                            }
                          }
                        }} 
                      />
                    </div>
                  </div>
                  
                  {/* Gráfico de barras - Dias mais movimentados */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Dias Mais Movimentados</h3>
                    <div className="h-64">
                      <Bar 
                        data={diasMaisMovimentadosChart} 
                        options={{ 
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: {
                            legend: { display: false }
                          }
                        }} 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Cards adicionais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-purple-50 rounded-xl p-6 flex flex-col items-center gap-3 shadow-md">
                    <FaUsers size={32} color="#a855f7" />
                    <div className="text-2xl font-bold text-purple-700">{dados.clientesNovos}</div>
                    <div className="text-gray-600 text-sm">Novos Clientes no Mês</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-6 flex flex-col items-center gap-3 shadow-md">
                    <FaShoppingBag size={32} color="#22c55e" />
                    <div className="text-2xl font-bold text-green-700">R$ {dados.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div className="text-gray-600 text-sm">Ticket Médio</div>
                  </div>
                  
                  <div className="bg-indigo-50 rounded-xl p-6 flex flex-col items-center gap-3 shadow-md">
                    <FaTrophy size={32} color="#6366f1" />
                    <div className="text-xl font-bold text-indigo-700 text-center">
                      {dados.produtosMaisVendidos[0]?.nome || 'Nenhum'}
                    </div>
                    <div className="text-gray-600 text-sm">Produto Mais Vendido</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum dado disponível para este restaurante.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
