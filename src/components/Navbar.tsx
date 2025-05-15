import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

const navItems = [
  { to: '/restaurantes', label: 'Restaurantes', icon: '🍔' },
  { to: '/pedidos', label: 'Pedidos', icon: '🛒' },
];

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="w-full bg-white/90 shadow-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-2">
        {/* Logo/Brand */}
        <Link to={user ? "/restaurantes" : "/"} className="flex items-center gap-2 select-none">
          <span className="text-2xl">🍽️</span>
          <span className="font-extrabold text-xl text-orange-500 tracking-tight">DeliveryX</span>
        </Link>
        {/* Navegação principal */}
        {user && (
          <div className="flex gap-2 md:gap-4">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={
                  'flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-150 ' +
                  (location.pathname.startsWith(item.to)
                    ? 'bg-orange-100 text-orange-600 shadow'
                    : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500')
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
        {/* Painel do usuário/login */}
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/login" className="px-4 py-2 rounded font-bold text-orange-500 border border-orange-300 hover:bg-orange-50 transition">Entrar</Link>
              <Link to="/register" className="px-4 py-2 rounded font-bold bg-orange-500 text-white hover:bg-orange-600 transition">Cadastrar</Link>
            </>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/profile')} title="Ver perfil">
              <div className="flex flex-col items-end mr-2 select-none">
                <span className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-orange-500 transition">{user.nome}</span>
                <span className="text-xs text-gray-400">{user.email}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700 text-lg group-hover:ring-2 group-hover:ring-orange-400 transition">
                {user.nome?.[0]?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={e => { e.stopPropagation(); logout(); navigate('/login'); }}
                className="ml-2 px-3 py-1 rounded bg-red-500 text-white font-bold hover:bg-red-600 transition"
                title="Sair"
              >Sair</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export {};
