import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';
import { FaChartBar, FaMoneyBillWave, FaUtensils, FaReceipt, FaSpinner, FaTimesCircle, FaStar, FaUsers, FaShoppingBag, FaTrophy, FaCalendarAlt, FaFilePdf, FaDownload, FaCheckCircle, FaCommentDots } from 'react-icons/fa';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  adicionaisMaisVendidos: {
    nome: string;
    quantidade: number;
  }[];
  faturamentoAdicionais: number;
  totalTaxasEntrega?: number; // NOVO CAMPO
}

interface FiltroData {
  inicio: Date;
  fim: Date;
  label: string;
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
  ],
  adicionaisMaisVendidos: [
    { nome: 'Queijo Extra', quantidade: 30 },
    { nome: 'Bacon', quantidade: 25 },
    { nome: 'Molho Especial', quantidade: 20 }
  ],
  faturamentoAdicionais: 500.00
};

export default function LojistaRelatoriosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurante, setRestaurante] = useState<any>(null);
  const [restLoading, setRestLoading] = useState(true);
  const [dados, setDados] = useState<RelatorioDados | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erro, setErro] = useState('');
  const relatorioRef = useRef<HTMLDivElement>(null);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  
  // Estados para feedback ao usuário
  const [mostrarToast, setMostrarToast] = useState(false);
  const [mensagemToast, setMensagemToast] = useState('');
  
  // Filtros de período para relatórios
  const hoje = new Date();  
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>('7dias');
  const [filtroCustomizado, setFiltroCustomizado] = useState<FiltroData>({
    inicio: subDays(hoje, 7),
    fim: hoje,
    label: 'Últimos 7 dias'
  });
  const [mostrarDatePicker, setMostrarDatePicker] = useState<boolean>(false);
  const [dataInicio, setDataInicio] = useState<string>(format(subDays(hoje, 7), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState<string>(format(hoje, 'yyyy-MM-dd'));
  const [erroDataInicio, setErroDataInicio] = useState<string>('');
  const [erroDataFim, setErroDataFim] = useState<string>('');
  const [ultimoPeriodoSalvo, setUltimoPeriodoSalvo] = useState<string | null>(null);
  const [ultimasAvaliacoes, setUltimasAvaliacoes] = useState<any[]>([]);

  // Carregar preferência de período salva ao iniciar
  useEffect(() => {
    const periodoSalvo = localStorage.getItem('relatorioLojistaPeriodo');
    if (periodoSalvo) {
      try {
        const periodoConfig = JSON.parse(periodoSalvo);
        setPeriodoSelecionado(periodoConfig.tipo);
        if (periodoConfig.tipo === 'personalizado' && periodoConfig.dataInicio && periodoConfig.dataFim) {
          setDataInicio(periodoConfig.dataInicio);
          setDataFim(periodoConfig.dataFim);
          
          const inicio = parse(periodoConfig.dataInicio, 'yyyy-MM-dd', new Date());
          const fim = parse(periodoConfig.dataFim, 'yyyy-MM-dd', new Date());
          
          if (!isNaN(inicio.getTime()) && !isNaN(fim.getTime())) {
            setFiltroCustomizado({
              inicio,
              fim,
              label: `${format(inicio, 'dd/MM/yyyy', { locale: ptBR })} até ${format(fim, 'dd/MM/yyyy', { locale: ptBR })}`
            });
          }
        }
        setUltimoPeriodoSalvo(periodoConfig.tipo);
      } catch (e) {
        console.error("Erro ao recuperar preferência de período:", e);
      }
    }
  }, []);

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
          
          // Se encontrou o restaurante, busca os dados de relatórios com o período já selecionado
          if (data[0] && data[0].id) {
            fetchDadosRelatorio(data[0].id, filtroCustomizado.inicio, filtroCustomizado.fim);
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
    
    fetchRestaurante();
  }, [user, navigate]);
  // Função para exibir toast de feedback
  const exibirToast = (mensagem: string) => {
    setMensagemToast(mensagem);
    setMostrarToast(true);
    
    setTimeout(() => {
      setMostrarToast(false);
    }, 3000); // Oculta após 3 segundos
  };

  // Função para rolar para a visualização do relatório
  const scrollToRelatorio = () => {
    if (relatorioRef.current) {
      relatorioRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Função para buscar dados do relatório com filtros de período
  const fetchDadosRelatorio = async (restauranteId: number, inicio?: Date, fim?: Date) => {
    setCarregandoDados(true);
    setErro('');
    
    // Montando os parâmetros da URL para filtrar por data, se fornecidos
    let url = `/api/lojista/relatorios/${restauranteId}`;
    if (inicio && fim) {
      url += `?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`;
    }
    
    try {
      // Primeiro tenta usar a API regular
      const res = await fetch(url, { credentials: 'include' });
      
      if (res.ok) {
        const data = await res.json();
        setDados(data);
        // Rolar para a visualização do relatório após carregar os dados
        setTimeout(scrollToRelatorio, 500);
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
  };
  // Função para mudar o período selecionado
  const mudarPeriodo = (periodo: string) => {
    setPeriodoSelecionado(periodo);
    
    // Se selecionar personalizado, apenas mostra o seletor de data
    if (periodo === 'personalizado') {
      setMostrarDatePicker(true);
      return;
    }
    
    let novoFiltro: FiltroData;
    const hoje = new Date();
    
    // Limpar mensagens de erro
    setErroDataInicio('');
    setErroDataFim('');
    
    switch (periodo) {
      case '7dias':
        novoFiltro = {
          inicio: subDays(hoje, 7),
          fim: hoje,
          label: 'Últimos 7 dias'
        };
        // Atualiza os inputs de data para refletir o período selecionado
        setDataInicio(format(subDays(hoje, 7), 'yyyy-MM-dd'));
        setDataFim(format(hoje, 'yyyy-MM-dd'));
        break;
      case '30dias':
        novoFiltro = {
          inicio: subDays(hoje, 30),
          fim: hoje,
          label: 'Últimos 30 dias'
        };
        setDataInicio(format(subDays(hoje, 30), 'yyyy-MM-dd'));
        setDataFim(format(hoje, 'yyyy-MM-dd'));
        break;
      case 'mes':
        novoFiltro = {
          inicio: startOfMonth(hoje),
          fim: endOfMonth(hoje),
          label: `Mês atual (${format(hoje, 'MMMM yyyy', { locale: ptBR })})`
        };
        setDataInicio(format(startOfMonth(hoje), 'yyyy-MM-dd'));
        setDataFim(format(endOfMonth(hoje), 'yyyy-MM-dd'));
        break;
      case 'trimestre':
        const trimestreAtual = Math.floor(hoje.getMonth() / 3);
        const inicioTrimestre = new Date(hoje.getFullYear(), trimestreAtual * 3, 1);
        const fimTrimestre = new Date(hoje.getFullYear(), trimestreAtual * 3 + 3, 0);
        
        novoFiltro = {
          inicio: inicioTrimestre,
          fim: fimTrimestre,
          label: `Trimestre atual (${format(inicioTrimestre, 'dd/MM/yyyy', { locale: ptBR })} - ${format(fimTrimestre, 'dd/MM/yyyy', { locale: ptBR })})`
        };
        setDataInicio(format(inicioTrimestre, 'yyyy-MM-dd'));
        setDataFim(format(fimTrimestre, 'yyyy-MM-dd'));
        break;
      case 'semestre':
        const semestreAtual = Math.floor(hoje.getMonth() / 6);
        const inicioSemestre = new Date(hoje.getFullYear(), semestreAtual * 6, 1);
        const fimSemestre = new Date(hoje.getFullYear(), semestreAtual * 6 + 6, 0);
        
        novoFiltro = {
          inicio: inicioSemestre,
          fim: fimSemestre,
          label: `Semestre atual (${format(inicioSemestre, 'dd/MM/yyyy', { locale: ptBR })} - ${format(fimSemestre, 'dd/MM/yyyy', { locale: ptBR })})`
        };
        setDataInicio(format(inicioSemestre, 'yyyy-MM-dd'));
        setDataFim(format(fimSemestre, 'yyyy-MM-dd'));
        break;
      case 'ano':
        const inicioAno = new Date(hoje.getFullYear(), 0, 1);
        const fimAno = new Date(hoje.getFullYear(), 11, 31);
        
        novoFiltro = {
          inicio: inicioAno,
          fim: fimAno,
          label: `Ano atual (${format(inicioAno, 'dd/MM/yyyy', { locale: ptBR })} - ${format(fimAno, 'dd/MM/yyyy', { locale: ptBR })})`
        };
        setDataInicio(format(inicioAno, 'yyyy-MM-dd'));
        setDataFim(format(fimAno, 'yyyy-MM-dd'));
        break;
      case 'semana':
        novoFiltro = {
          inicio: startOfWeek(hoje, { weekStartsOn: 0 }),
          fim: endOfWeek(hoje, { weekStartsOn: 0 }),
          label: `Semana atual (${format(startOfWeek(hoje, { weekStartsOn: 0 }), 'dd/MM', { locale: ptBR })} - ${format(endOfWeek(hoje, { weekStartsOn: 0 }), 'dd/MM', { locale: ptBR })})`
        };
        setDataInicio(format(startOfWeek(hoje, { weekStartsOn: 0 }), 'yyyy-MM-dd'));
        setDataFim(format(endOfWeek(hoje, { weekStartsOn: 0 }), 'yyyy-MM-dd'));
        break;
      case 'personalizado':
        // Mantém o filtro personalizado atual
        novoFiltro = filtroCustomizado;
        break;
      default:
        novoFiltro = {
          inicio: subDays(hoje, 7),
          fim: hoje,
          label: 'Últimos 7 dias'
        };
        setDataInicio(format(subDays(hoje, 7), 'yyyy-MM-dd'));
        setDataFim(format(hoje, 'yyyy-MM-dd'));
    }
    
    setFiltroCustomizado(novoFiltro);
    
    // Salvar preferência do usuário
    if (periodo !== ultimoPeriodoSalvo) {
      const periodoParaSalvar = {
        tipo: periodo,
        dataInicio: periodo === 'personalizado' ? dataInicio : undefined,
        dataFim: periodo === 'personalizado' ? dataFim : undefined,
      };
      localStorage.setItem('relatorioLojistaPeriodo', JSON.stringify(periodoParaSalvar));
      setUltimoPeriodoSalvo(periodo);
      
      // Exibir feedback
      exibirToast(`Período alterado para: ${novoFiltro.label}`);
    }
    
    if (restaurante && restaurante.id) {
      fetchDadosRelatorio(restaurante.id, novoFiltro.inicio, novoFiltro.fim);
    }
  };
  // Função para aplicar filtro de data personalizado
  const aplicarFiltroDatasPersonalizado = () => {
    try {
      // Limpar mensagens de erro anteriores
      setErroDataInicio('');
      setErroDataFim('');
      
      const dataInicioObj = parse(dataInicio, 'yyyy-MM-dd', new Date());
      const dataFimObj = parse(dataFim, 'yyyy-MM-dd', new Date());
      
      let temErro = false;
      
      if (isNaN(dataInicioObj.getTime())) {
        setErroDataInicio('Data inicial inválida');
        temErro = true;
      }
      
      if (isNaN(dataFimObj.getTime())) {
        setErroDataFim('Data final inválida');
        temErro = true;
      }
      
      if (temErro) return;
      
      if (dataInicioObj > dataFimObj) {
        setErroDataInicio('Data inicial não pode ser maior que a data final');
        temErro = true;
      }
      
      if (temErro) return;
      
      // Limitar o período a 1 ano para evitar sobrecarga na API
      const umAnoEmMilissegundos = 365 * 24 * 60 * 60 * 1000;
      if (dataFimObj.getTime() - dataInicioObj.getTime() > umAnoEmMilissegundos) {
        if (!window.confirm('O período selecionado é maior que 1 ano, o que pode tornar o relatório muito extenso. Deseja continuar?')) {
          return;
        }
      }
      
      const novoFiltro: FiltroData = {
        inicio: dataInicioObj,
        fim: dataFimObj,
        label: `${format(dataInicioObj, 'dd/MM/yyyy', { locale: ptBR })} até ${format(dataFimObj, 'dd/MM/yyyy', { locale: ptBR })}`
      };
      
      setFiltroCustomizado(novoFiltro);
      setPeriodoSelecionado('personalizado');
      setMostrarDatePicker(false);
      
      // Salvar preferência do usuário
      const periodoParaSalvar = {
        tipo: 'personalizado',
        dataInicio,
        dataFim,
      };
      localStorage.setItem('relatorioLojistaPeriodo', JSON.stringify(periodoParaSalvar));
      setUltimoPeriodoSalvo('personalizado');
      
      // Exibir feedback
      exibirToast(`Período personalizado aplicado: ${novoFiltro.label}`);
      
      if (restaurante && restaurante.id) {
        fetchDadosRelatorio(restaurante.id, novoFiltro.inicio, novoFiltro.fim);
      }
    } catch (error) {
      console.error('Erro ao aplicar filtro personalizado:', error);
      alert('Erro ao processar as datas selecionadas.');
    }
  };
  // Função para exportar o relatório como PDF
  const exportarPDF = async () => {
    if (!dados || !restaurante) return;
    
    setExportandoPDF(true);
    try {
      // Criar um novo documento PDF no formato A4 em retrato
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      
      // Cores
      const corPrimaria = '#f97316'; // Laranja
      const corSecundaria = '#1e40af'; // Azul escuro
      const corTexto = '#333333';
      const corDestaques = '#059669'; // Verde
      
      // Adicionar logo do restaurante
      try {
        // Tentar carregar o logo
        const logoUrl = restaurante.imagem || '/logo-default.png';
        const logoImg = new Image();
        logoImg.src = logoUrl.startsWith('http') ? logoUrl : `${window.location.origin}${logoUrl}`;
        
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
        
        // Calcular dimensões do logo para manter proporção e limitar altura
        const logoMaxHeight = 25;
        const logoAspectRatio = logoImg.width / logoImg.height;
        const logoHeight = Math.min(logoMaxHeight, 30);
        const logoWidth = logoHeight * logoAspectRatio;
        
        // Adicionar logo centralizado no topo
        pdf.addImage(
          logoImg,
          'PNG',
          (pageWidth - logoWidth) / 2,
          margin,
          logoWidth,
          logoHeight
        );
      } catch (logoError) {
        console.error('Erro ao carregar logo:', logoError);
        // Prosseguir sem o logo
      }
      
      // Adicionar cabeçalho
      pdf.setFontSize(18);
      pdf.setTextColor(corSecundaria);
      pdf.setFont('helvetica', 'bold');
      
      const tituloRelatorio = 'Relatório de Vendas';
      pdf.text(tituloRelatorio, pageWidth / 2, margin + 35, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text(restaurante.nome, pageWidth / 2, margin + 42, { align: 'center' });
      
      // Adicionar informações do período
      pdf.setFontSize(11);
      pdf.setTextColor(corSecundaria);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Período do relatório:', pageWidth / 2, margin + 48, { align: 'center' });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(corDestaques);
      pdf.text(filtroCustomizado.label, pageWidth / 2, margin + 53, { align: 'center' });
      
      pdf.setTextColor(corTexto);
      const dataEmissao = `Emitido em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`;
      pdf.text(dataEmissao, pageWidth / 2, margin + 58, { align: 'center' });
      
      // Linha divisória
      pdf.setDrawColor(corPrimaria);
      pdf.setLineWidth(0.5);
      pdf.line(margin, margin + 63, pageWidth - margin, margin + 63);
      
      // Informações resumidas
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(corSecundaria);
      pdf.text('Resumo de Desempenho', margin, margin + 68);
      
      // Quadro com informações principais
      const infoY = margin + 73;
      const infoHeight = 40;
      
      // Fundo do quadro de informações
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, infoY, contentWidth, infoHeight, 'F');
      pdf.setDrawColor(corPrimaria);
      pdf.rect(margin, infoY, contentWidth, infoHeight, 'S');
      
      // Divisores internos
      pdf.line(margin + contentWidth/2, infoY, margin + contentWidth/2, infoY + infoHeight); // Vertical
      pdf.line(margin, infoY + infoHeight/2, margin + contentWidth, infoY + infoHeight/2); // Horizontal
      
      // Informações dentro do quadro
      pdf.setFontSize(11);
      pdf.setTextColor(corTexto);
      
      // Faturamento
      pdf.setFont('helvetica', 'bold');
      pdf.text('Faturamento Total:', margin + 5, infoY + 10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(corDestaques);
      pdf.text(`R$ ${dados.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 5, infoY + 17);
      
      // Total de Vendas
      pdf.setTextColor(corTexto);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total de Pedidos:', margin + contentWidth/2 + 5, infoY + 10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(corDestaques);
      pdf.text(`${dados.totalVendas}`, margin + contentWidth/2 + 5, infoY + 17);
      
      // Ticket Médio
      pdf.setTextColor(corTexto);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ticket Médio:', margin + 5, infoY + infoHeight/2 + 10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(corDestaques);
      pdf.text(`R$ ${dados.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 5, infoY + infoHeight/2 + 17);
      
      // Avaliação
      pdf.setTextColor(corTexto);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Média de Avaliação:', margin + contentWidth/2 + 5, infoY + infoHeight/2 + 10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(corDestaques);
      pdf.text(`${dados.mediaAvaliacao.toFixed(1)} de 5.0`, margin + contentWidth/2 + 5, infoY + infoHeight/2 + 17);
      
      // Espaço após o quadro de resumo
      let yTaxas = infoY + infoHeight + 15;
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yTaxas, pageWidth - margin, yTaxas); // linha separadora
      yTaxas += 5;

      // Taxa de entrega individual (fixa do restaurante)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(corSecundaria);
      pdf.text('Taxa de Entrega por Pedido:', margin, yTaxas);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(corDestaques);
      pdf.text(
        restaurante.taxa_entrega !== undefined
          ? `R$ ${Number(restaurante.taxa_entrega).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : 'Não informado',
        margin + 65,
        yTaxas
      );
      yTaxas += 8;

      // Faturamento das taxas de entrega (soma do período)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(corSecundaria);
      pdf.text('Faturamento das Taxas de Entrega:', margin, yTaxas);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(corDestaques);
      pdf.text(
        dados.totalTaxasEntrega !== undefined
          ? `R$ ${Number(dados.totalTaxasEntrega).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : 'Não disponível',
        margin + 85,
        yTaxas
      );
      yTaxas += 12;

      // Espaço extra antes da próxima seção
      yTaxas += 2;
      // currentY agora começa após o bloco de taxas
      let currentY = yTaxas;

      // Produtos mais vendidos
      const alturaNecessariaProdutos = 15 + 20 + 10 + (dados.produtosMaisVendidos.length * 8) + 20; // título + espaço + cabeçalho + linhas + margem extra
      if (currentY + alturaNecessariaProdutos > pageHeight - 30) {
        pdf.addPage();
        currentY = margin + 10;
        // Cabeçalho da página nova
        pdf.setFontSize(14);
        pdf.setTextColor(corSecundaria);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${restaurante.nome} - Relatório de Vendas (continuação)`, pageWidth / 2, margin, { align: 'center' });
        pdf.setDrawColor(corPrimaria);
        pdf.line(margin, margin + 5, pageWidth - margin, margin + 5);
        currentY += 15;
      }
      pdf.setTextColor(corSecundaria);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Produtos Mais Vendidos', margin, currentY + 15);
      
      // Tabela de produtos
      const startTableY = currentY + 20;
      const cellPadding = 5;
      const colWidths = [100, 30, 40];
      
      // Cabeçalho da tabela
      pdf.setFillColor(corPrimaria);
      pdf.setTextColor(255, 255, 255);
      pdf.rect(margin, startTableY, colWidths[0] + colWidths[1] + colWidths[2], 10, 'F');
      pdf.text('Produto', margin + cellPadding, startTableY + 6.5);
      pdf.text('Qtde', margin + colWidths[0] + cellPadding, startTableY + 6.5);
      pdf.text('% Vendas', margin + colWidths[0] + colWidths[1] + cellPadding, startTableY + 6.5);
      
      // Linhas da tabela - produtos
      pdf.setTextColor(corTexto);
      pdf.setFillColor(255, 255, 255);
      
      currentY = startTableY + 10;
      const totalProdutosVendidos = dados.produtosMaisVendidos.reduce((acc, p) => acc + p.quantidade, 0);
      
      dados.produtosMaisVendidos.forEach((produto, index) => {
        const altRow = index % 2 === 0;
        if (altRow) {
          pdf.setFillColor(245, 245, 245);
        } else {
          pdf.setFillColor(255, 255, 255);
        }
        
        pdf.rect(margin, currentY, colWidths[0] + colWidths[1] + colWidths[2], 8, 'F');
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(produto.nome, margin + cellPadding, currentY + 5.5);
        pdf.text(produto.quantidade.toString(), margin + colWidths[0] + cellPadding, currentY + 5.5);
        
        const percentual = ((produto.quantidade / totalProdutosVendidos) * 100).toFixed(1);
        pdf.text(`${percentual}%`, margin + colWidths[0] + colWidths[1] + cellPadding, currentY + 5.5);
        
        currentY += 8;
      });
      
      // Adicionais mais vendidos
      const alturaNecessariaAdicionais = 15 + 20 + 10 + (dados.adicionaisMaisVendidos.length * 8) + 20; // título + espaço + cabeçalho + linhas + margem extra
      if (currentY + alturaNecessariaAdicionais > pageHeight - 30) {
        pdf.addPage();
        currentY = margin + 10;
        // Cabeçalho da página nova
        pdf.setFontSize(14);
        pdf.setTextColor(corSecundaria);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${restaurante.nome} - Relatório de Vendas (continuação)`, pageWidth / 2, margin, { align: 'center' });
        pdf.setDrawColor(corPrimaria);
        pdf.line(margin, margin + 5, pageWidth - margin, margin + 5);
        currentY += 15;
      }
      pdf.setTextColor(corSecundaria);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Adicionais Mais Vendidos', margin, currentY + 15);
      currentY += 20;
      pdf.setFillColor(corPrimaria);
      pdf.setTextColor(255, 255, 255);
      pdf.rect(margin, currentY, colWidths[0] + colWidths[1], 10, 'F');
      pdf.text('Adicional', margin + cellPadding, currentY + 6.5);
      pdf.text('Qtde', margin + colWidths[0] + cellPadding, currentY + 6.5);
      pdf.setTextColor(corTexto);
      currentY += 10;
      dados.adicionaisMaisVendidos.forEach((adicional, index) => {
        const altRow = index % 2 === 0;
        if (altRow) {
          pdf.setFillColor(245, 245, 245);
        } else {
          pdf.setFillColor(255, 255, 255);
        }
        pdf.rect(margin, currentY, colWidths[0] + colWidths[1], 8, 'F');
        pdf.setFont('helvetica', 'normal');
        pdf.text(adicional.nome, margin + cellPadding, currentY + 5.5);
        pdf.text(adicional.quantidade.toString(), margin + colWidths[0] + cellPadding, currentY + 5.5);
        currentY += 8;
      });
      // Faturamento de adicionais estilizado igual aos outros campos
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(corSecundaria);
      pdf.text('Faturamento em Adicionais:', margin, currentY + 12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(corDestaques);
      pdf.text(`R$ ${dados.faturamentoAdicionais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, margin + 60, currentY + 12);
      currentY += 20;

      // --- Faturamento por categoria (gráfico de pizza) ---
      // Antes de desenhar, verifica se há espaço suficiente na página
      const alturaNecessariaCategoria = 15 + 20 + 10 + (dados.faturamentoPorCategoria.length * 8) + 20; // título + espaço + cabeçalho + linhas + margem extra
      if (currentY + alturaNecessariaCategoria > pageHeight - 30) {
        pdf.addPage();
        currentY = margin + 10;
        // Cabeçalho da página nova
        pdf.setFontSize(14);
        pdf.setTextColor(corSecundaria);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${restaurante.nome} - Relatório de Vendas (continuação)`, pageWidth / 2, margin, { align: 'center' });
        pdf.setDrawColor(corPrimaria);
        pdf.line(margin, margin + 5, pageWidth - margin, margin + 5);
        currentY += 15;
      }
      // Agora desenha normalmente o bloco de categoria
      pdf.setTextColor(corSecundaria);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Faturamento por Categoria', margin, currentY + 15);
      currentY += 20;
      pdf.setFillColor(corPrimaria);
      pdf.setTextColor(255, 255, 255);
      pdf.rect(margin, currentY, colWidths[0] + colWidths[1] + colWidths[2], 10, 'F');
      pdf.text('Categoria', margin + cellPadding, currentY + 6.5);
      pdf.text('Valor (R$)', margin + colWidths[0] + cellPadding, currentY + 6.5);
      pdf.text('% Total', margin + colWidths[0] + colWidths[1] + cellPadding, currentY + 6.5);
      pdf.setTextColor(corTexto);
      currentY += 10;
      dados.faturamentoPorCategoria.forEach((categoria, index) => {
        const altRow = index % 2 === 0;
        if (altRow) {
          pdf.setFillColor(245, 245, 245);
        } else {
          pdf.setFillColor(255, 255, 255);
        }
        pdf.rect(margin, currentY, colWidths[0] + colWidths[1] + colWidths[2], 8, 'F');
        pdf.setFont('helvetica', 'normal');
        pdf.text(categoria.categoria, margin + cellPadding, currentY + 5.5);
        pdf.text(categoria.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), margin + colWidths[0] + cellPadding, currentY + 5.5);
        const percentual = ((categoria.valor / dados.faturamentoTotal) * 100).toFixed(1);
        pdf.text(`${percentual}%`, margin + colWidths[0] + colWidths[1] + cellPadding, currentY + 5.5);
        currentY += 8;
      });
      
      // Adicionar nova página se necessário
      if (currentY > pageHeight - 50) {
        pdf.addPage();
        currentY = margin + 20;
        
        // Cabeçalho da página 2
        pdf.setFontSize(14);
        pdf.setTextColor(corSecundaria);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${restaurante.nome} - Relatório de Vendas (continuação)`, pageWidth / 2, margin, { align: 'center' });
        pdf.setDrawColor(corPrimaria);
        pdf.line(margin, margin + 5, pageWidth - margin, margin + 5);
      }
      
      // Informações sobre dias de vendas
      const alturaNecessariaDias = 15 + 20 + 10 + (dados.diasMaisMovimentados.length * 8) + 20; // título + espaço + cabeçalho + linhas + margem extra
      if (currentY + alturaNecessariaDias > pageHeight - 30) {
        pdf.addPage();
        currentY = margin + 10;
        // Cabeçalho da página nova
        pdf.setFontSize(14);
        pdf.setTextColor(corSecundaria);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${restaurante.nome} - Relatório de Vendas (continuação)`, pageWidth / 2, margin, { align: 'center' });
        pdf.setDrawColor(corPrimaria);
        pdf.line(margin, margin + 5, pageWidth - margin, margin + 5);
        currentY += 15;
      }
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(corSecundaria);
      pdf.text('Análise de Dias de Vendas', margin, currentY + 15);
      
      currentY += 20;
      
      // Tabela de dias mais movimentados
      pdf.setFillColor(corPrimaria);
      pdf.setTextColor(255, 255, 255);
      pdf.rect(margin, currentY, colWidths[0] + colWidths[1], 10, 'F');
      pdf.text('Dia', margin + cellPadding, currentY + 6.5);
      pdf.text('Pedidos', margin + colWidths[0] + cellPadding, currentY + 6.5);
      
      // Linhas da tabela - dias
      pdf.setTextColor(corTexto);
      
      currentY += 10;
      
      // Ordem fixa dos dias da semana
      const ordemDiasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

      // Reordena os diasMaisMovimentados para a ordem correta
      const diasMaisMovimentadosOrdenados = ordemDiasSemana.map(dia =>
        dados?.diasMaisMovimentados?.find(d => d.dia === dia) || { dia, pedidos: 0 }
      );

      dados.diasMaisMovimentados.forEach((dia, index) => {
        const altRow = index % 2 === 0;
        if (altRow) {
          pdf.setFillColor(245, 245, 245);
        } else {
          pdf.setFillColor(255, 255, 255);
        }
        
        pdf.rect(margin, currentY, colWidths[0] + colWidths[1], 8, 'F');
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(dia.dia, margin + cellPadding, currentY + 5.5);
        pdf.text(dia.pedidos.toString(), margin + colWidths[0] + cellPadding, currentY + 5.5);
        
        currentY += 8;
      });
      
      // Rodapé
      const footerY = pageHeight - 15;
      pdf.setFontSize(9);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Gerado pelo sistema DeliveryX em ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth / 2, footerY, { align: 'center' });
      
      // Título do documento
      const titulo = `relatório-${restaurante.nome}-${filtroCustomizado.label}-${format(new Date(), 'dd-MM-yyyy')}`;
      
      // Salvar arquivo
      pdf.save(
        titulo.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remover acentos
          .replace(/[^\w\s]/g, '')         // Remover símbolos
          .replace(/\s+/g, '-')            // Substituir espaços por hifens
          + '.pdf'
      );
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    } finally {
      setExportandoPDF(false);
    }
  };

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

  // Ordem fixa dos dias da semana para o gráfico Dias Mais Movimentados
  const ordemDiasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const diasMaisMovimentadosOrdenados = ordemDiasSemana.map(dia =>
    dados?.diasMaisMovimentados?.find(d => d.dia === dia) || { dia, pedidos: 0 }
  );
  const diasMaisMovimentadosChart = {
    labels: diasMaisMovimentadosOrdenados.map(d => d.dia),
    datasets: [
      {
        label: 'Número de Pedidos',
        data: diasMaisMovimentadosOrdenados.map(d => d.pedidos),
        backgroundColor: 'rgba(153, 102, 255, 0.7)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Buscar últimas avaliações ao carregar dados do restaurante ou trocar período
  useEffect(() => {
    if (!restaurante?.id) return;
    fetch(`/api/lojista/reviews?limit=5&orderBy=createdAt&order=desc&restauranteId=${restaurante.id}`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setUltimasAvaliacoes(data.data || []))
      .catch(() => setUltimasAvaliacoes([]));
  }, [restaurante, filtroCustomizado]);

  return (
    <div className={theme.bg + ' flex flex-col items-center pb-8 sm:pb-12'}>      {/* Toast de feedback */}
      {mostrarToast && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-3 rounded-md shadow-lg z-50 flex items-center gap-2 animate-slide-in">
          <FaCheckCircle />
          {mensagemToast}
        </div>
      )}
      
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
                {/* Controles de período e exportação */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
                  <div className="w-full">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FaCalendarAlt /> Período do relatório: 
                      <span className="text-orange-600 ml-2">{filtroCustomizado.label}</span>
                    </h3>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button 
                        className={`px-3 py-1 rounded-full text-sm ${periodoSelecionado === '7dias' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => mudarPeriodo('7dias')}
                      >
                        Últimos 7 dias
                      </button>
                      <button 
                        className={`px-3 py-1 rounded-full text-sm ${periodoSelecionado === '30dias' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => mudarPeriodo('30dias')}
                      >
                        Últimos 30 dias
                      </button>
                      <button 
                        className={`px-3 py-1 rounded-full text-sm ${periodoSelecionado === 'semana' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => mudarPeriodo('semana')}
                      >
                        Semana atual
                      </button>
                      <button 
                        className={`px-3 py-1 rounded-full text-sm ${periodoSelecionado === 'mes' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => mudarPeriodo('mes')}
                      >
                        Mês atual
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button 
                        className={`px-3 py-1 rounded-full text-sm ${periodoSelecionado === 'trimestre' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => mudarPeriodo('trimestre')}
                      >
                        Trimestre atual
                      </button>
                      <button 
                        className={`px-3 py-1 rounded-full text-sm ${periodoSelecionado === 'semestre' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => mudarPeriodo('semestre')}
                      >
                        Semestre atual
                      </button>
                      <button 
                        className={`px-3 py-1 rounded-full text-sm ${periodoSelecionado === 'ano' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => mudarPeriodo('ano')}
                      >
                        Ano atual
                      </button>
                      <button 
                        className={`px-3 py-1 rounded-full text-sm ${periodoSelecionado === 'personalizado' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setMostrarDatePicker(!mostrarDatePicker)}
                      >
                        Personalizado
                      </button>
                    </div>
                    
                    {/* Seletor de datas personalizado */}
                    {mostrarDatePicker && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Selecione o período desejado:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
                            <input
                              type="date"
                              className={`w-full rounded-md border ${erroDataInicio ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} p-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
                              value={dataInicio}
                              onChange={(e) => {
                                setDataInicio(e.target.value);
                                setErroDataInicio('');
                              }}
                              max={dataFim}
                            />
                            {erroDataInicio && (
                              <p className="mt-1 text-xs text-red-500">{erroDataInicio}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
                            <input
                              type="date"
                              className={`w-full rounded-md border ${erroDataFim ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} p-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
                              value={dataFim}
                              onChange={(e) => {
                                setDataFim(e.target.value);
                                setErroDataFim('');
                              }}
                              min={dataInicio}
                            />
                            {erroDataFim && (
                              <p className="mt-1 text-xs text-red-500">{erroDataFim}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                            onClick={() => setMostrarDatePicker(false)}
                          >
                            Cancelar
                          </button>
                          <button
                            className="px-3 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                            onClick={aplicarFiltroDatasPersonalizado}
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={exportarPDF}
                    disabled={exportandoPDF}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 w-full md:w-auto justify-center"
                  >
                    {exportandoPDF ? (
                      <>
                        <div className="animate-spin">
                          <FaSpinner />
                        </div>
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <FaFilePdf />
                        Exportar Relatório (PDF)
                      </>
                    )}
                  </button>
                </div>
                
                {/* Conteúdo do relatório para exportação */}
                <div ref={relatorioRef}>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{restaurante.nome} - Relatório</h2>
                    <p className="text-gray-600">Período: {filtroCustomizado.label}</p>
                  </div>
                
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
                </div>

                {/* Gráfico de barras - Adicionais Mais Vendidos (abaixo do Faturamento por Categoria) */}
                {dados.adicionaisMaisVendidos && dados.adicionaisMaisVendidos.length > 0 && dados.adicionaisMaisVendidos[0].nome !== 'Sem dados' && (
                  <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 mb-8">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Adicionais Mais Vendidos</h3>
                    <div className="h-64">
                      <Bar
                        data={{
                          labels: dados.adicionaisMaisVendidos.map(a => a.nome),
                          datasets: [
                            {
                              label: 'Quantidade Vendida',
                              data: dados.adicionaisMaisVendidos.map(a => a.quantidade),
                              backgroundColor: 'rgba(255, 99, 132, 0.7)',
                              borderColor: 'rgba(255, 99, 132, 1)',
                              borderWidth: 1,
                              barPercentage: 0.5,
                              categoryPercentage: 0.5
                            },
                          ],
                        }}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Gráficos de linha e barras - Pedidos últimos 7 dias e Dias mais movimentados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 mt-8">
                  <div className="bg-purple-50 rounded-xl p-6 flex flex-col items-center gap-3 shadow-md">
                    <FaUsers size={32} color="#a855f7" />
                    <div className="text-2xl font-bold text-purple-700">{dados.clientesNovos}</div>
                    <div className="text-gray-600 text-sm">Novos Clientes no Mês</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-xl p-6 flex flex-col items-center gap-3 shadow-md">
                    <FaShoppingBag size={32} color="#22c55e" />
                    <div className="text-2xl font-bold text-green-700">R$ {dados.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-gray-600 text-sm">Ticket Médio</div>
                  </div>
                  
                  <div className="bg-indigo-50 rounded-xl p-6 flex flex-col items-center gap-3 shadow-md">
                    <FaTrophy size={32} color="#6366f1" />
                    <div className="text-xl font-bold text-indigo-700 text-center">
                      {dados.produtosMaisVendidos[0]?.nome || 'Nenhum'}
                    </div>                    <div className="text-gray-600 text-sm">Produto Mais Vendido</div>
                  </div>
                </div>

                {/* Cards principais (após os cards de produtos) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  <div className="bg-pink-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow-md">
                    <span className="text-2xl font-bold text-pink-700">R$ {dados.faturamentoAdicionais?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-gray-600 text-sm">Faturamento em Adicionais</span>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow-md">
                    <span className="text-xl font-bold text-orange-700">{dados.adicionaisMaisVendidos?.[0]?.nome || 'Nenhum'}</span>
                    <span className="text-gray-600 text-sm">Adicional Mais Vendido</span>
                  </div>
                  <div className="bg-cyan-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow-md">
                    <span className="text-2xl font-bold text-cyan-700">{dados.totalTaxasEntrega !== undefined ? `R$ ${dados.totalTaxasEntrega.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}</span>
                    <span className="text-gray-600 text-sm">Faturamento em Taxas de Entrega</span>
                  </div>
                </div>

                {/* Bloco de últimas avaliações dos clientes */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}><FaCommentDots color="#fb923c" /></span>
                    <span className="-mb-[2px]">Últimas Avaliações dos Clientes</span>
                  </h3>
                  {ultimasAvaliacoes.length === 0 ? (
                    <div className="text-gray-400 text-sm">Nenhuma avaliação recente encontrada.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {ultimasAvaliacoes.map((review, idx) => (
                        <div key={review.id || idx} className="bg-gray-50 rounded-xl p-4 shadow border border-orange-100 flex flex-col gap-2">
                          <div className="flex items-center gap-2 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} size={18} color={i < review.nota ? '#fbbf24' : '#e5e7eb'} />
                            ))}
                            <span className="ml-2 text-sm text-gray-600 font-semibold">{review.nota} / 5</span>
                          </div>
                          <div className="text-gray-700 text-sm mb-1">{review.comentario || <span className='italic text-gray-400'>Sem comentário</span>}</div>
                          <div className="text-xs text-gray-400">Pedido #{review.order?.id}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                </div> {/* Fechando a div ref={relatorioRef} */}
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
