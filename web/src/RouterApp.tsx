import React, { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import { useAuth } from './context/AuthContext';
import RestaurantesPage from './pages/RestaurantesPage';
import PedidosPage from './pages/PedidosPage';
import DetalhePedidoPage from './pages/DetalhePedidoPage';
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

interface PrivateRouteProps {
  children: ReactNode;
  admin?: boolean;
  lojista?: boolean;
}

function PrivateRoute({ children, admin = false, lojista = false }: PrivateRouteProps) {
  const auth = useAuth();
  if (!auth || typeof auth !== 'object') return null;
  const { user, loading } = auth as any;
  
  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!loading) {
    if (admin && user?.tipo !== 'admin') {
      return <Navigate to="/" replace />;
    }

    if (lojista && user?.tipo !== 'lojista') {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
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
          <Route path="/pedidos/:id" element={<PrivateRoute><DetalhePedidoPage /></PrivateRoute>} />
          <Route path="/avaliacoes" element={<PrivateRoute><AvaliacoesPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          
          {/* Rotas de Admin */}
          <Route path="/admin" element={<PrivateRoute admin><AdminPage /></PrivateRoute>} />
          <Route path="/admin/restaurantes" element={<PrivateRoute admin><AdminRestaurantesPage /></PrivateRoute>} />
          <Route path="/admin/usuarios" element={<PrivateRoute admin><AdminUsuariosPage /></PrivateRoute>} />
          <Route path="/admin/relatorios" element={<PrivateRoute admin><AdminRelatoriosPage /></PrivateRoute>} />

          {/* Rotas de Lojista */}
          <Route path="/lojista" element={<PrivateRoute lojista><LojistaDashboardPage /></PrivateRoute>} />
          <Route path="/lojista/produtos" element={<PrivateRoute lojista><LojistaProdutosPage /></PrivateRoute>} />
          <Route path="/lojista/pedidos" element={<PrivateRoute lojista><LojistaPedidosPage /></PrivateRoute>} />
          <Route path="/lojista/perfil" element={<PrivateRoute lojista><LojistaPerfilPage /></PrivateRoute>} />
          <Route path="/lojista/relatorios" element={<PrivateRoute lojista><LojistaRelatoriosPage /></PrivateRoute>} />
        </Routes>
        <Footer />
      </MenuProvider>
    </BrowserRouter>
  );
}
