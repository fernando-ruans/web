import React from 'react';
import theme from '../theme';

export default function AdminRestaurantesPage() {
  // Aqui você pode buscar e exibir restaurantes, avaliações e ações administrativas
  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center min-h-screen'}>
      <div className={theme.card + ' w-full max-w-3xl flex flex-col items-center gap-2 shadow-xl'}>
        <h2 className={theme.title + ' text-center'}>Gerenciar Restaurantes</h2>
        <div className="text-gray-500 mb-4 text-center">Aqui você pode aprovar, editar, excluir restaurantes e ver avaliações.</div>
        {/* Implemente a listagem e ações aqui */}
        <div className="text-center text-gray-400">Funcionalidade administrativa em construção.</div>
      </div>
    </div>
  );
}
