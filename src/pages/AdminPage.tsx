import React from 'react';
import theme from '../theme';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaUserCog, FaPlus, FaUserTie } from 'react-icons/fa';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.tipo !== 'admin') {
    return <div className="text-center mt-10 text-red-500 font-bold">Acesso negado</div>;
  }

  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center min-h-screen'}>
      <div className="w-full max-w-5xl flex flex-col items-center gap-8 py-10">
        <h2 className="text-4xl font-extrabold text-orange-500 mb-2 flex items-center gap-3">
          <FaUserCog size={32} color="#fb923c" /> Painel do Administrador
        </h2>
        <div className="text-gray-600 mb-4 text-center text-lg">Bem-vindo, <span className="font-bold text-orange-500">{user.nome}</span>! Gerencie estabelecimentos, delegue lojistas e administre usuários.</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
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
              <button
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded w-full flex items-center justify-center gap-2 transition"
                onClick={() => alert('Funcionalidade de adicionar restaurante em breve!')}
              ><FaPlus /> Adicionar Restaurante</button>
              <button
                className="bg-orange-200 hover:bg-orange-300 text-orange-700 font-bold py-2 px-4 rounded w-full flex items-center justify-center gap-2 transition"
                onClick={() => navigate('/admin/restaurantes?delegar=1')}
              ><FaUserTie /> Delegar Lojista</button>
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
