import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';
import { FaStore, FaBoxOpen, FaClipboardList, FaUserEdit, FaChartBar } from 'react-icons/fa';

export default function LojistaDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurante, setRestaurante] = useState<any>(null);
  const [restLoading, setRestLoading] = useState(true);

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
        }
      } finally {
        setRestLoading(false);
      }
    }
    fetchRestaurante();
  }, [user, navigate]);

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center justify-center pb-24 sm:pb-32'}>
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-6 py-10">
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 border-t-4 border-orange-400 w-full flex flex-col items-center gap-6">
          <h2 className="text-3xl font-extrabold text-orange-500 mb-2 flex items-center gap-2">
            <FaStore size={28} color="#fb923c" /> Painel do Lojista
          </h2>
          {restLoading ? (
            <div className="text-gray-400 text-center">Carregando restaurante...</div>
          ) : restaurante ? (
            <div className="text-orange-600 font-bold text-lg text-center">Gerenciando: {restaurante.nome}</div>
          ) : (
            <div className="text-red-500 font-bold text-center">Nenhum restaurante cadastrado!</div>
          )}          <div className="text-gray-600 mb-2 text-center text-lg">Gerencie seus produtos, pedidos, relatórios e perfil de lojista.</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
            <button
              className="flex flex-col items-center gap-2 bg-orange-50 hover:bg-orange-100 rounded-xl p-6 shadow text-orange-700 font-bold transition border border-orange-100"
              onClick={() => navigate('/lojista/produtos')}
            >
              <FaBoxOpen size={32} />
              Produtos
            </button>
            <button
              className="flex flex-col items-center gap-2 bg-orange-50 hover:bg-orange-100 rounded-xl p-6 shadow text-orange-700 font-bold transition border border-orange-100"
              onClick={() => navigate('/lojista/pedidos')}
            >
              <FaClipboardList size={32} />
              Pedidos
            </button>
            <button
              className="flex flex-col items-center gap-2 bg-orange-50 hover:bg-orange-100 rounded-xl p-6 shadow text-orange-700 font-bold transition border border-orange-100"
              onClick={() => navigate('/lojista/relatorios')}
            >
              <FaChartBar size={32} />
              Relatórios
            </button>
            <button
              className="flex flex-col items-center gap-2 bg-orange-50 hover:bg-orange-100 rounded-xl p-6 shadow text-orange-700 font-bold transition border border-orange-100"
              onClick={() => navigate('/lojista/perfil')}
            >
              <FaUserEdit size={32} />
              Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
