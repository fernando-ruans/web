import React from 'react';
import theme from '../theme';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { FaStore, FaUserCog, FaPlus, FaUserTie } from 'react-icons/fa';
import { useMaintenanceStatus } from '../hooks/useMaintenanceStatus';
import { useState } from 'react';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { maintenance, loading: loadingMaintenance } = useMaintenanceStatus();
  const [toggleLoading, setToggleLoading] = useState(false);

  console.log('AdminPage - User:', user); // Para depuração

  if (!user) {
    console.log('AdminPage - No user found');
    return <Navigate to="/login" />;
  }

  if (user.tipo !== 'admin') {
    console.log('AdminPage - User is not admin:', user.tipo);
    return <div className="text-center mt-10 text-red-500 font-bold">Acesso negado - você não tem permissão de administrador</div>;
  }

  const handleToggleMaintenance = async () => {
    setToggleLoading(true);
    try {
      const endpoint = maintenance ? '/api/admin/maintenance/disable' : '/api/admin/maintenance/enable';
      await fetch(endpoint, { method: 'POST', credentials: 'include' });
      window.location.reload(); // Força atualização do status
    } catch {
      alert('Erro ao alternar modo manutenção');
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center min-h-screen pb-24 sm:pb-32'}>
      <div className="w-full max-w-5xl flex flex-col items-center gap-8 py-10">
        {/* Switch de manutenção */}
        <div className="flex items-center gap-4 mb-6 bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2">
          <span className="font-semibold text-yellow-700">Modo manutenção:</span>
          <button
            className={`px-4 py-2 rounded font-bold transition text-white ${maintenance ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-400 hover:bg-gray-500'}`}
            onClick={handleToggleMaintenance}
            disabled={toggleLoading || loadingMaintenance}
          >
            {maintenance ? 'Desativar' : 'Ativar'}
          </button>
          {toggleLoading && <span className="ml-2 text-xs text-gray-500">Salvando...</span>}
        </div>
        <h2 className="text-4xl font-extrabold text-orange-500 mb-2 flex items-center gap-3">
          <FaUserCog size={32} color="#fb923c" /> Painel do Administrador
        </h2>
        <div className="text-gray-600 mb-4 text-center text-lg">Bem-vindo, <span className="font-bold text-orange-500">{user.nome}</span>! Gerencie estabelecimentos, delegue lojistas e administre usuários.</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Card de Relatórios Gerais */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 border-t-4 border-orange-400 hover:shadow-2xl transition">
            <div className="mb-2"><FaUserCog size={40} color="#f97316" /></div>
            <h3 className="font-bold text-2xl text-orange-600 mb-1">Relatórios Gerais</h3>
            <p className="text-gray-500 text-center mb-2">Acompanhe vendas, faturamento, crescimento, restaurantes e clientes mais ativos. Visão global do app.</p>
            <div className="flex flex-col gap-2 w-full">
              <button
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded w-full flex items-center justify-center gap-2 transition"
                onClick={() => navigate('/admin/relatorios')}
              >Acessar Relatórios Gerais</button>
            </div>
          </div>
          {/* Card de Restaurantes */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 border-t-4 border-orange-400 hover:shadow-2xl transition">
            <div className="mb-2"><FaStore size={40} color="#f97316" /></div>
            <h3 className="font-bold text-2xl text-orange-600 mb-1">Estabelecimentos</h3>
            <p className="text-gray-500 text-center mb-2">Gerencie, adicione e delegue lojistas para restaurantes cadastrados.</p>
            <div className="flex flex-col gap-2 w-full">
              <button
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded w-full flex items-center justify-center gap-2 transition"
                onClick={() => navigate('/admin/restaurantes')}
              ><FaStore /> Gerenciar Restaurantes</button>
              {/* Futuras funcionalidades administrativas podem ser adicionadas aqui como novos cards ou botões */}
            </div>
          </div>
          {/* Card de Usuários */}
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 border-t-4 border-orange-400 hover:shadow-2xl transition">
            <div className="mb-2"><FaUserCog size={40} color="#f97316" /></div>
            <h3 className="font-bold text-2xl text-orange-600 mb-1">Usuários</h3>
            <p className="text-gray-500 text-center mb-2">Visualize, edite e gerencie todos os usuários do sistema.</p>
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded w-full flex items-center justify-center gap-2 transition"
              onClick={() => navigate('/admin/usuarios')}
            ><FaUserCog /> Gerenciar Usuários</button>
          </div>
        </div>
      </div>
    </div>
  );
}
