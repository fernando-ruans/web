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
        {/* Switch de manutenção mais discreto e moderno */}
        <div className="flex items-center gap-4 mb-8 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow w-full max-w-md">
          <span className="font-semibold text-gray-600 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
            Modo manutenção
          </span>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={maintenance}
              onChange={handleToggleMaintenance}
              disabled={toggleLoading || loadingMaintenance}
              className="sr-only peer"
            />
            <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-500 transition-all duration-300 shadow-inner"></div>
            <div className="absolute left-1 top-1 bg-white w-5 h-5 rounded-full shadow-md transition-all duration-300 peer-checked:translate-x-5 flex items-center justify-center">
              <span className={`transition-opacity duration-200 ${maintenance ? 'opacity-100 text-blue-500' : 'opacity-0'}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
            </div>
          </label>
          <span className={`ml-2 text-sm font-bold ${maintenance ? 'text-blue-600' : 'text-gray-400'}`}>{maintenance ? 'Ativado' : 'Desativado'}</span>
          {toggleLoading && <span className="ml-2 text-xs text-gray-400 animate-pulse">Salvando...</span>}
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
