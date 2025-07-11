import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import theme from '../theme';
import { FaUserCircle, FaSignOutAlt, FaUserShield } from 'react-icons/fa';

const navItems = [
  { to: '/restaurantes', label: 'Restaurantes', icon: '🍔' },
  { to: '/pedidos', label: 'Pedidos', icon: '🧾' },
];

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { items: cartItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-white/95 shadow-md sticky top-0 z-40 border-b border-orange-100">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between px-4 py-2 gap-y-2 relative">
        {/* Logo/Brand */}
        <Link to={user ? "/restaurantes" : "/"} className="flex items-center gap-2 select-none group min-w-[140px]">
          <img src="/logo192.png" alt="Logo" className="h-20 w-20 object-contain" />
        </Link>
        {/* Menu Hamburguer Mobile */}
        <div className="block md:hidden">
          <button onClick={() => setMenuOpen(v => !v)} className="p-2 rounded hover:bg-orange-50 focus:outline-none">
            <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
        {/* Menus principais - desktop */}
        <div className="hidden md:flex flex-1 justify-center">
          <ul className="flex gap-2 md:gap-6 items-center">
            <li>
              <Link to="/restaurantes" className={
                'px-4 py-2 rounded-lg font-semibold transition-all duration-150 flex items-center gap-2 ' +
                (location.pathname.startsWith('/restaurantes')
                  ? 'bg-orange-50 text-orange-600 shadow'
                  : 'text-orange-600 hover:bg-orange-50')
              }>
                🍔 Restaurantes
              </Link>
            </li>
            {(user?.tipo !== 'lojista' && user?.tipo !== 'admin') && (
              <>
                <li>
                  <Link to="/pedidos" className={
                    'px-4 py-2 rounded-lg font-semibold transition-all duration-150 flex items-center gap-2 ' +
                    (location.pathname.startsWith('/pedidos')
                      ? 'bg-orange-50 text-orange-600 shadow'
                      : 'text-orange-600 hover:bg-orange-50')
                  }>
                    🧾 Meus Pedidos
                  </Link>
                </li>
                <li>
                  <Link to="/carrinho" className={
                    'px-4 py-2 rounded-lg font-semibold transition-all duration-150 flex items-center gap-2 ' +
                    (location.pathname.startsWith('/carrinho') ? 'bg-orange-50 text-orange-600 shadow' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-500')
                  }>
                    🛒 Carrinho
                    {cartItems.length > 0 && (
                      <span className="ml-1 bg-orange-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{cartItems.length}</span>
                    )}
                  </Link>
                </li>
              </>
            )}
            {user && user.tipo === 'admin' && (
              <li>                <Link to="/admin" className={
                  'px-4 py-2 rounded-lg font-semibold transition-all duration-150 flex items-center gap-2 ' +
                  (location.pathname.startsWith('/admin') ? 'bg-orange-50 text-orange-600 shadow' : 'text-orange-600 hover:bg-orange-50')
                }>
                  <FaUserShield className="w-4 h-4" /> Admin
                </Link>
              </li>
            )}
            {user && user.tipo === 'lojista' && (
              <li>
                <Link to="/lojista" className={
                  'px-4 py-2 rounded-lg font-semibold transition-all duration-150 flex items-center gap-2 ' +
                  (location.pathname.startsWith('/lojista') ? 'bg-orange-50 text-orange-600 shadow' : 'text-orange-600 hover:bg-orange-50')
                }>
                  <span role="img" aria-label="Lojista">🏪</span> Painel Lojista
                </Link>
              </li>
            )}
          </ul>
        </div>
        {/* Usuário/Autenticação - desktop */}
        <div className="hidden md:flex items-center gap-2 min-w-[180px] justify-end">
          {!user ? (
            <>
              <Link to="/login" className="px-4 py-2 rounded font-bold text-orange-500 border border-orange-300 hover:bg-orange-50 transition">Entrar</Link>
              <button
                className="px-4 py-2 rounded font-bold bg-orange-500 text-white hover:bg-orange-600 transition"
                onClick={() => navigate('/login?tab=register')}
              >Cadastrar</button>
            </>
          ) : (
            <div className="relative group" tabIndex={0}>
              <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-orange-50 transition focus:outline-none" title="Perfil">
                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700 text-lg overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <FaUserCircle className="w-7 h-7" color="#fb923c" />
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
                <button onClick={() => navigate('/profile')} className="w-full text-left px-4 py-2 hover:bg-orange-50 text-orange-600 font-semibold">Meu Perfil</button>
                {user?.tipo === 'cliente' && (
                  <button onClick={() => navigate('/pedidos')} className="w-full text-left px-4 py-2 hover:bg-orange-50 text-orange-600 font-semibold">Meus Pedidos</button>
                )}
                <button onClick={() => { logout(); navigate('/login'); }} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-500 flex items-center gap-2"><FaSignOutAlt className="w-4 h-4" /> Sair</button>
              </div>
            </div>
          )}
        </div>
        {/* Menu Mobile Drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex md:hidden">
            <div className="w-72 max-w-[90vw] bg-white h-full shadow-2xl flex flex-col p-0 animate-slideInLeft rounded-r-2xl overflow-hidden border-r-2 border-orange-100">
              <div className="flex items-center justify-between px-4 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
                <img src="/logo192.png" alt="Logo" className="h-10 w-10 object-contain mr-2" />
                <button onClick={() => setMenuOpen(false)} className="p-2 rounded hover:bg-orange-50 focus:outline-none">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <ul className="flex flex-col gap-1 py-4 px-2">
                <li><Link to="/restaurantes" className={
                  `flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-base transition ${location.pathname.startsWith('/restaurantes') ? 'bg-orange-50 text-orange-600 shadow' : 'text-orange-600 hover:bg-orange-50'}`
                } onClick={() => setMenuOpen(false)}>🍔 Restaurantes</Link></li>
                {user?.tipo === 'lojista' && (
                  <li><Link to="/lojista" className={
                    `flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-base transition ${location.pathname.startsWith('/lojista') ? 'bg-orange-50 text-orange-600 shadow' : 'text-orange-600 hover:bg-orange-50'}`
                  } onClick={() => setMenuOpen(false)}>🏪 Painel Lojista</Link></li>
                )}
                {user?.tipo === 'admin' && (
                  <li><Link to="/admin" className={
                    `flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-base transition ${location.pathname.startsWith('/admin') ? 'bg-orange-50 text-orange-600 shadow' : 'text-orange-600 hover:bg-orange-50'}`
                  } onClick={() => setMenuOpen(false)}><FaUserShield className="w-4 h-4" /> Admin</Link></li>
                )}
                {(user?.tipo !== 'lojista' && user?.tipo !== 'admin') && (
                  <>
                    <li><Link to="/pedidos" className={
                      `flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-base transition ${location.pathname.startsWith('/pedidos') ? 'bg-orange-50 text-orange-600 shadow' : 'text-orange-600 hover:bg-orange-50'}`
                    } onClick={() => setMenuOpen(false)}>🧾 Meus Pedidos</Link></li>
                    <li><Link to="/carrinho" className={
                      `flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-base transition ${location.pathname.startsWith('/carrinho') ? 'bg-orange-50 text-orange-600 shadow' : 'text-orange-600 hover:bg-orange-50'}`
                    } onClick={() => setMenuOpen(false)}>🛒 Carrinho {cartItems.length > 0 && (<span className="ml-1 bg-orange-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">{cartItems.length}</span>)}</Link></li>
                  </>
                )}
              </ul>
              <div className="flex flex-col gap-1 py-4 px-2 border-t border-orange-100">
                {!user ? (
                  <>
                    <Link to="/login" className="px-4 py-3 rounded-lg font-bold text-orange-500 border border-orange-300 hover:bg-orange-50 transition text-base mb-1 flex justify-center items-center" onClick={() => setMenuOpen(false)}>Entrar</Link>
                    <button
                      className="px-4 py-3 rounded-lg font-bold bg-orange-500 text-white hover:bg-orange-600 transition text-base"
                      onClick={() => { setMenuOpen(false); navigate('/login?tab=register'); }}
                    >Cadastrar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setMenuOpen(false); navigate('/profile'); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-orange-50 text-orange-600 font-semibold text-base flex items-center gap-2"><FaUserCircle className="w-4.5 h-4.5" color="#fb923c" /> Meu Perfil</button>
                    {user.tipo === 'cliente' && (
                      <button onClick={() => { setMenuOpen(false); navigate('/pedidos'); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-orange-50 text-orange-600 font-semibold text-base flex items-center gap-2"><span className="text-lg">🧾</span> Meus Pedidos</button>
                    )}
                    <button onClick={() => { setMenuOpen(false); logout(); navigate('/login'); }} className="w-full text-left px-4 py-3 rounded-lg hover:bg-red-50 text-red-500 flex items-center gap-2 text-base"><FaSignOutAlt className="w-4 h-4" /> Sair</button>
                  </>
                )}
              </div>
              <div className="mt-auto py-4 px-4 text-xs text-gray-400 border-t border-orange-100 bg-gradient-to-r from-orange-50 to-white">© {new Date().getFullYear()} DeliveryX</div>
            </div>
            <div className="flex-1" onClick={() => setMenuOpen(false)} />
          </div>
        )}
      </div>
    </nav>
  );
}

export {};
