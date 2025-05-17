import React from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

export default function LojistaProdutosPage() {
  const { user } = useAuth();

  // Aqui futuramente: buscar produtos do lojista

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center justify-center pb-24 sm:pb-32'}>
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-6 py-10">
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 border-t-4 border-orange-400 w-full flex flex-col items-center gap-6">
          <h2 className="text-2xl font-extrabold text-orange-500 mb-2 flex items-center gap-2">
            Produtos do Lojista
          </h2>
          <div className="text-gray-600 mb-2 text-center text-lg">Aqui você poderá cadastrar, editar e remover seus produtos.</div>
          {/* Listagem e botões de ação virão aqui */}
          <div className="text-gray-400">Funcionalidade em construção.</div>
        </div>
      </div>
    </div>
  );
}
