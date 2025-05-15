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
import RegisterPage from './pages/RegisterPage';
import Navbar from './components/Navbar';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AdminRestaurantesPage from './pages/AdminRestaurantesPage';

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
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/restaurantes" element={<PrivateRoute><RestaurantesPage /></PrivateRoute>} />
        <Route path="/pedidos" element={<PrivateRoute><PedidosPage /></PrivateRoute>} />
        <Route path="/avaliacoes" element={<PrivateRoute><AvaliacoesPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
        <Route path="/admin/restaurantes" element={<PrivateRoute><AdminRestaurantesPage /></PrivateRoute>} />
        {/* Exemplo: <Route path="/admin/users" element={<PrivateRoute><AdminUsersPage /></PrivateRoute>} /> */}
      </Routes>
    </BrowserRouter>
  );
}
