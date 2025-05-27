import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

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
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/admin/restaurantes" className="text-orange-600 hover:underline">← Voltar para Restaurantes</Link>
      <h1 className="text-2xl font-bold mt-4 mb-6 text-gray-800">
        Relatório do Restaurante: {relatorio.restaurante?.nome || 'N/A'}
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Faturamento</div>
          <div className="text-2xl font-bold text-green-600">R$ {relatorio.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Vendas Realizadas</div>
          <div className="text-2xl font-bold">{relatorio.totalVendas}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Ticket Médio</div>
          <div className="text-2xl font-bold">R$ {relatorio.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Pedidos Cancelados</div>
          <div className="text-2xl font-bold text-red-600">{relatorio.pedidosCancelados}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Total de Pedidos</div>
          <div className="text-2xl font-bold">{relatorio.totalPedidos}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">Avaliações</div>
          <div className="text-2xl font-bold text-yellow-500">
            {typeof relatorio.mediaAvaliacao === 'number' && relatorio.mediaAvaliacao > 0
              ? relatorio.mediaAvaliacao.toFixed(1) + ' ★'
              : 'Sem avaliações'}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <div className="text-gray-500 text-sm mb-2">Produtos Mais Vendidos</div>
        {relatorio.produtosMaisVendidos.length === 0 ? (
          <div className="text-gray-400">Nenhum produto vendido.</div>
        ) : (
          <ul className="list-disc pl-5">
            {relatorio.produtosMaisVendidos.map((p, i) => (
              <li key={i} className="mb-1">{p.nome} <span className="text-gray-500">({p.quantidade})</span></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
