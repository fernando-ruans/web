import React, { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { useAuth } from './context/AuthContext';
import RestaurantesPage from './pages/RestaurantesPage';
import PedidosPage from './pages/PedidosPage';
import AvaliacoesPage from './pages/AvaliacoesPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Navbar from './components/Navbar';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AdminRestaurantesPage from './pages/AdminRestaurantesPage';
import Footer from './components/Footer';
import { MenuProvider } from './context/MenuContext';
import RestauranteMenuPage from './pages/RestauranteMenuPage';
import CarrinhoPage from './pages/CarrinhoPage';
import AdminUsuariosPage from './pages/AdminUsuariosPage';
import AdminRelatoriosPage from './pages/AdminRelatoriosPage';
import LojistaDashboardPage from './pages/LojistaDashboardPage';
import LojistaProdutosPage from './pages/LojistaProdutosPage';
import LojistaPedidosPage from './pages/LojistaPedidosPage';
import LojistaPerfilPage from './pages/LojistaPerfilPage';
import LojistaRelatoriosPage from './pages/LojistaRelatoriosPage';

function PrivateRoute({ children }: { children: ReactNode }) {
  const auth = useAuth();
  if (!auth || typeof auth !== 'object') return null;
  const { user, loading } = auth as any;
  if (loading) return <div className="text-center mt-10 text-white">Carregando...</div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function RouterApp() {
  return (
    <BrowserRouter>
      <MenuProvider>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurantes" element={<RestaurantesPage />} />
          <Route path="/restaurantes/:id" element={<RestauranteMenuPage />} />
          <Route path="/carrinho" element={<CarrinhoPage />} />
          <Route path="/pedidos" element={<PrivateRoute><PedidosPage /></PrivateRoute>} />
          <Route path="/avaliacoes" element={<PrivateRoute><AvaliacoesPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
          <Route path="/admin/restaurantes" element={<PrivateRoute><AdminRestaurantesPage /></PrivateRoute>} />
          <Route path="/admin/usuarios" element={<PrivateRoute><AdminUsuariosPage /></PrivateRoute>} />
          <Route path="/admin/relatorios" element={<PrivateRoute><AdminRelatoriosPage /></PrivateRoute>} />          <Route path="/lojista" element={<LojistaDashboardPage />} />
          <Route path="/lojista/produtos" element={<LojistaProdutosPage />} />
          <Route path="/lojista/pedidos" element={<LojistaPedidosPage />} />
          <Route path="/lojista/perfil" element={<LojistaPerfilPage />} />
          <Route path="/lojista/relatorios" element={<LojistaRelatoriosPage />} />
          {/* Exemplo: <Route path="/admin/users" element={<PrivateRoute><AdminUsersPage /></PrivateRoute>} /> */}
        </Routes>
        <Footer />
      </MenuProvider>
    </BrowserRouter>
  );
}
