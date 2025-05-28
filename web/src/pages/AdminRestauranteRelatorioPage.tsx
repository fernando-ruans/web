import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaStar } from 'react-icons/fa';
import theme from '../theme';

interface ProdutoMaisVendido {
  nome: string;
  quantidade: number;
}

interface RelatorioRestaurante {
  restaurante: { id: number; nome: string } | null;
  faturamento: number;
  totalVendas: number;
  ticketMedio: number;
  pedidosCancelados: number;
  produtosMaisVendidos: ProdutoMaisVendido[];
  totalPedidos: number;
  mediaAvaliacao?: number | null; // novo campo
}

export default function AdminRestauranteRelatorioPage() {
  const { id } = useParams<{ id: string }>();
  const [relatorio, setRelatorio] = useState<RelatorioRestaurante | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRelatorio() {
      setLoading(true);
      setErro(null);
      try {
        const res = await fetch(`/api/admin/relatorios/restaurante/${id}`);
        if (!res.ok) throw new Error('Erro ao buscar relatório');
        const data = await res.json();
        setRelatorio(data);
      } catch (err: any) {
        setErro(err.message || 'Erro ao buscar relatório');
      } finally {
        setLoading(false);
      }
    }
    fetchRelatorio();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-lg">Carregando...</div>;
  if (erro) return <div className="p-8 text-center text-red-600">{erro}</div>;
  if (!relatorio) return <div className="p-8 text-center">Nenhum dado encontrado.</div>;

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center pb-24 sm:pb-32'}>
      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6 border-t-4 border-orange-400 mt-8">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-orange-600 font-bold shadow hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all border border-orange-100 w-fit mb-2"
        >
          <FaArrowLeft size={18} /> Voltar para Restaurantes
        </button>
        <h1 className={theme.title + ' text-center flex items-center gap-2'}>
          Relatório do Restaurante: <span className="text-orange-600">{relatorio.restaurante?.nome || 'N/A'}</span>
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-green-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
            <div className="text-gray-500 text-sm">Faturamento</div>
            <div className="text-2xl font-bold text-green-700">R$ {relatorio.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
            <div className="text-gray-500 text-sm">Vendas Realizadas</div>
            <div className="text-2xl font-bold text-blue-700">{relatorio.totalVendas}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
            <div className="text-gray-500 text-sm">Ticket Médio</div>
            <div className="text-2xl font-bold text-yellow-700">R$ {relatorio.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="bg-red-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
            <div className="text-gray-500 text-sm">Pedidos Cancelados</div>
            <div className="text-2xl font-bold text-red-600">{relatorio.pedidosCancelados}</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
            <div className="text-gray-500 text-sm">Total de Pedidos</div>
            <div className="text-2xl font-bold text-purple-700">{relatorio.totalPedidos}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow">
            <div className="text-gray-500 text-sm">Avaliações</div>
            <div className="text-2xl font-bold text-yellow-500 flex items-center gap-1">
              {typeof relatorio.mediaAvaliacao === 'number' && relatorio.mediaAvaliacao > 0
                ? <><span>{relatorio.mediaAvaliacao.toFixed(1)}</span> <span style={{ marginBottom: 2, display: 'inline-block' }}><FaStar size={20} color="#fbbf24" /></span></>
                : 'Sem avaliações'}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 mb-8 border border-orange-100">
          <div className="text-gray-500 text-base font-semibold mb-3">Produtos Mais Vendidos</div>
          {relatorio.produtosMaisVendidos.length === 0 ? (
            <div className="text-gray-400">Nenhum produto vendido.</div>
          ) : (
            <ul className="list-disc pl-5">
              {relatorio.produtosMaisVendidos.map((p, i) => (
                <li key={i} className="mb-1 text-gray-700 font-medium">{p.nome} <span className="text-gray-500 font-normal">({p.quantidade})</span></li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
