import React from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center min-h-screen'}>
      <div className={theme.card + ' w-full max-w-md flex flex-col items-center'}>
        <div className="w-20 h-20 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700 text-3xl mb-4">
          {user.nome?.[0]?.toUpperCase() || 'U'}
        </div>
        <h2 className={theme.title + ' text-center mb-1'}>{user.nome}</h2>
        <div className="text-gray-500 mb-4">{user.email}</div>
        {/* Adicione aqui mais informações e ações do perfil */}
      </div>
    </div>
  );
}
