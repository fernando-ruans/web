import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  // Login states
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  // Register states
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [regError, setRegError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'register') setTab('register');
  }, []);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = await login(email, senha);
    if (!ok) {
      setError('E-mail ou senha inválidos');
    } else {
      const tipo = localStorage.getItem('tipo');
      if (tipo === 'admin') {
        window.location.href = '/admin';
      } else if (tipo === 'lojista') {
        window.location.href = '/lojista';
      } else {
        window.location.href = '/';
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setSuccess('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tipo: 'cliente' }) // Sempre registra como cliente
    });
    if (res.ok) {
      setSuccess('Cadastro realizado! Faça login.');
      setTimeout(() => setTab('login'), 1500);
    } else {
      const data = await res.json();
      setRegError(data.error || 'Erro ao cadastrar');
    }
  };

  return (
    <div className="min-h-screen pb-24 sm:pb-32 flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-100">
      {/* Info lateral */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 gap-6">
        <img src="/logo192.png" alt="Logo" className="w-40 h-40 mb-4" />
        {/* <h1 className="text-3xl md:text-4xl font-extrabold text-orange-500 mb-2 text-center">DeliveryX</h1> Removido conforme solicitado */}
        <p className="text-gray-700 text-lg text-center max-w-md">O DeliveryX conecta você aos melhores restaurantes da sua cidade, com entrega rápida, fácil e segura. Faça seu pedido em poucos cliques!</p>
        <ul className="text-gray-600 text-sm mt-4 space-y-2 max-w-md">
          <li>🍔 Diversidade de restaurantes e culinárias</li>
          <li>⏱️ Entrega rápida e acompanhamento em tempo real</li>
          <li>🔒 Segurança nos pagamentos</li>
          <li>⭐ Avaliações reais de clientes</li>
        </ul>
        <div className="hidden md:block mt-8 text-xs text-gray-400">&copy; {new Date().getFullYear()} DeliveryX. Todos os direitos reservados.</div>
      </div>
      {/* Card de login/cadastro */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="bg-white/90 rounded-xl shadow-lg w-full max-w-md p-8">
          <div className="flex mb-6">
            <button onClick={() => setTab('login')} className={`flex-1 py-2 font-bold rounded-l-xl transition ${tab === 'login' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'}`}>Entrar</button>
            <button onClick={() => setTab('register')} className={`flex-1 py-2 font-bold rounded-r-xl transition ${tab === 'register' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'}`}>Cadastrar</button>
          </div>
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
                  <FaEnvelope size={18} color="#fb923c" />
                </span>
                <input
                  className={theme.input + ' w-full pl-10 mb-0'}
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
                  <FaLock size={18} color="#fb923c" />
                </span>
                <input
                  className={theme.input + ' w-full pl-10 mb-0'}
                  type="password"
                  placeholder="Senha"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
              </div>
              {error && <div className="text-red-400 mb-2 text-center">{error}</div>}
              <button
                type="submit"
                className={theme.primary + ' w-full font-bold py-2 rounded'}
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <div className="flex justify-between mt-2 text-sm">
                <button type="button" onClick={() => setTab('register')} className="text-orange-500 hover:underline">Criar conta</button>
                <a href="/forgot-password" className="text-orange-500 hover:underline">Esqueci a senha</a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
                  <FaUser size={18} color="#fb923c" />
                </span>
                <input
                  className={theme.input + ' w-full pl-10 mb-0'}
                  name="nome"
                  placeholder="Nome"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
                  <FaEnvelope size={18} color="#fb923c" />
                </span>
                <input
                  className={theme.input + ' w-full pl-10 mb-0'}
                  name="email"
                  type="email"
                  placeholder="E-mail"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
                  <FaLock size={18} color="#fb923c" />
                </span>
                <input
                  className={theme.input + ' w-full pl-10 mb-0'}
                  name="senha"
                  type="password"
                  placeholder="Senha"
                  value={form.senha}
                  onChange={handleChange}
                  required
                />
              </div>              {/* Tipo removido - todos usuários são registrados como clientes */}
              {regError && <div className="text-red-400 mb-2 text-center">{regError}</div>}
              {success && <div className="text-green-400 mb-2 text-center">{success}</div>}
              <button type="submit" className={theme.primary + ' w-full font-bold py-2 rounded'}>Cadastrar</button>
              <div className="flex justify-center mt-2 text-sm">
                <button type="button" onClick={() => setTab('login')} className="text-orange-500 hover:underline">Já tenho conta</button>
              </div>
            </form>
          )}
        </div>
        <div className="md:hidden mt-8 text-xs text-gray-400 text-center">&copy; {new Date().getFullYear()} DeliveryX. Todos os direitos reservados.</div>
      </div>
    </div>
  );
}
