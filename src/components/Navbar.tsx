import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import { FaUserCircle, FaSignOutAlt, FaUserShield } from 'react-icons/fa';

const navItems = [
  { to: '/restaurantes', label: 'Restaurantes', icon: '🍔' },
  { to: '/pedidos', label: 'Pedidos', icon: '🛒' },
];

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="w-full bg-white/95 shadow-md sticky top-0 z-40 border-b border-orange-100">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between px-4 py-2 gap-y-2">
        {/* Logo/Brand */}
        <Link to={user ? "/restaurantes" : "/"} className="flex items-center gap-2 select-none group min-w-[140px]">
          <span className="text-3xl">🍽️</span>
          <span className="font-extrabold text-2xl text-orange-500 tracking-tight group-hover:text-orange-600 transition">DeliveryX</span>
        </Link>
        {/* Menus principais - mais profissional, com destaque e dropdown para usuário */}
        <div className="flex-1 flex justify-center">
          <ul className="flex gap-2 md:gap-6 items-center">
            <li>
              <Link to="/restaurantes" className={
                'px-4 py-2 rounded-lg font-semibold transition-all duration-150 ' +
                (location.pathname.startsWith('/restaurantes') ? 'bg-orange-100 text-orange-600 shadow' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500')
              }>Restaurantes</Link>
            </li>
            <li>
              <Link to="/pedidos" className={
                'px-4 py-2 rounded-lg font-semibold transition-all duration-150 ' +
                (location.pathname.startsWith('/pedidos') ? 'bg-orange-100 text-orange-600 shadow' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500')
              }>Pedidos</Link>
            </li>
            {user && user.tipo === 'admin' && (
              <li>
                <Link to="/admin" className={
                  'px-4 py-2 rounded-lg font-semibold transition-all duration-150 flex items-center gap-2 ' +
                  (location.pathname.startsWith('/admin') ? 'bg-orange-100 text-orange-600 shadow' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500')
                }>
                  <FaUserShield size={16} /> Admin
                </Link>
              </li>
            )}
          </ul>
        </div>
        {/* Usuário/Autenticação - dropdown profissional */}
        <div className="flex items-center gap-2 min-w-[180px] justify-end">
          {!user ? (
            <>
              <Link to="/login" className="px-4 py-2 rounded font-bold text-orange-500 border border-orange-300 hover:bg-orange-50 transition">Entrar</Link>
              <Link to="/register" className="px-4 py-2 rounded font-bold bg-orange-500 text-white hover:bg-orange-600 transition">Cadastrar</Link>
            </>
          ) : (
            <div className="relative group" tabIndex={0}>
              <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-orange-50 transition focus:outline-none" title="Perfil">
                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700 text-lg overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <FaUserCircle size={28} color="#fb923c" />
                  )}
                </div>
                <div className="flex flex-col items-start select-none max-w-[120px]">
                  <span className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-orange-500 transition truncate">{user.nome}</span>
                  <span className="text-xs text-gray-400 truncate">{user.email}</span>
                </div>
                <svg className="w-4 h-4 ml-1 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {/* Dropdown - agora permanece aberto ao focar ou passar o mouse */}
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-orange-100 py-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-all z-50">
                <button onClick={() => navigate('/profile')} className="w-full text-left px-4 py-2 hover:bg-orange-50 text-gray-700">Meu Perfil</button>
                <button onClick={() => navigate('/pedidos')} className="w-full text-left px-4 py-2 hover:bg-orange-50 text-gray-700">Meus Pedidos</button>
                <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 flex items-center gap-2"><FaSignOutAlt size={16} /> Sair</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export {};
