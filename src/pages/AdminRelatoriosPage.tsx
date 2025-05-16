import React, { useEffect, useState } from 'react';
import theme from '../theme';
import { FaChartBar, FaStore, FaUser, FaMoneyBillWave, FaSpinner } from 'react-icons/fa';

interface RelatorioResumo {
  totalVendas: number;
  totalPedidos: number;
  totalRestaurantes: number;
  totalClientes: number;
  faturamento: number;
}

export default function AdminRelatoriosPage() {
  const [resumo, setResumo] = useState<RelatorioResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/relatorios/resumo', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setResumo(data))
      .catch(() => setErro('Erro ao carregar dados do relatório.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center justify-center'}>
      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6 border-t-4 border-blue-400 mt-8">
        <h2 className="text-3xl font-extrabold text-blue-700 flex items-center gap-2 mb-2"><FaChartBar size={28} /> Relatórios Gerais</h2>
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
              <FaChartBar size={32} color="#f59e42" />
              <div className="text-2xl font-bold text-orange-700">{resumo.totalVendas}</div>
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
            <div className="bg-purple-50 rounded-xl p-6 flex flex-col items-center gap-2 shadow col-span-1 sm:col-span-2">
              <FaChartBar size={32} color="#a21caf" />
              <div className="text-2xl font-bold text-purple-700">{resumo.totalPedidos}</div>
              <div className="text-gray-600 text-sm">Pedidos Realizados</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
