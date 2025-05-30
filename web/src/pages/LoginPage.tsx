import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

// Adiciona opção de login/cadastro Google, email/senha, recuperação e verificação de e-mail
// Interface moderna, clara e com feedbacks

export default function LoginPage() {
  const { login, loginWithGoogle, register, forgotPassword, user } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  // Login states
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Register states
  const [form, setForm] = useState({ nome: '', email: '', senha: '' });
  const [regError, setRegError] = useState('');
  const [success, setSuccess] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'register') setTab('register');

    // Redireciona se o usuário já estiver logado
    if (user) {
      switch (user.tipo) {
        case 'admin':
          navigate('/admin');
          break;
        case 'lojista':
          navigate('/lojista');
          break;
        default:
          navigate('/');
          break;
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await login(email, senha);
      if (!ok) {
        setError('E-mail ou senha inválidos');
      } else if (auth.currentUser && !auth.currentUser.emailVerified) {
        setError('Confirme seu e-mail antes de acessar. Verifique sua caixa de entrada.');
        await auth.signOut();
      }
    } catch (err) {
      setError('Erro ao realizar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const ok = await loginWithGoogle();
      if (!ok) setError('Erro ao entrar com Google');
    } catch (err) {
      setError('Erro ao entrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setSuccess('');
    setLoading(true);
    try {
      const ok = await register(form.email, form.senha);
      if (ok) {
        setSuccess('Cadastro realizado! Verifique seu e-mail para ativar a conta.');
        setTimeout(() => {
          setTab('login');
          setEmail(form.email);
        }, 2000);
      } else {
        setRegError('Erro ao cadastrar');
      }
    } catch (err) {
      setRegError('Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setLoading(true);
    try {
      const ok = await forgotPassword(forgotEmail);
      if (ok) {
        setForgotSuccess('E-mail de recuperação enviado!');
      } else {
        setForgotError('Erro ao enviar e-mail de recuperação');
      }
    } catch (err) {
      setForgotError('Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 sm:pb-32 flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-100">
      {/* Info lateral */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 gap-6">
        <img src="/logo192.png" alt="Logo" className="w-40 h-40 mb-4" />
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
            <button 
              onClick={() => setTab('login')} 
              disabled={loading}
              className={`flex-1 py-2 font-bold rounded-l-xl transition ${tab === 'login' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Entrar
            </button>
            <button 
              onClick={() => setTab('register')} 
              disabled={loading}
              className={`flex-1 py-2 font-bold rounded-r-xl transition ${tab === 'register' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Cadastrar
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`${theme.button} w-full mt-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                <img src="/google.svg" alt="Google" className="w-5 h-5" /> Entrar com Google
              </button>

              <div className="text-center mt-4">
                <button type="button" className="text-orange-500 hover:text-orange-600 text-sm" onClick={() => setTab('forgot')}>Esqueceu sua senha?</button>
              </div>
            </form>
          ) : tab === 'register' ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {regError && (
                <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                  {regError}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-500 p-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
                  <FaUser size={18} color="#fb923c" />
                </span>
                <input
                  className={theme.input + ' w-full pl-10 mb-0'}
                  type="text"
                  name="nome"
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
                  <FaEnvelope size={18} color="#fb923c" />
                </span>
                <input
                  className={theme.input + ' w-full pl-10 mb-0'}
                  type="email"
                  name="email"
                  placeholder="E-mail"
                  value={form.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
                  <FaLock size={18} color="#fb923c" />
                </span>
                <input
                  className={theme.input + ' w-full pl-10 mb-0'}
                  type="password"
                  name="senha"
                  placeholder="Senha"
                  value={form.senha}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`${theme.button} w-full mt-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              {forgotError && (
                <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">{forgotError}</div>
              )}
              {forgotSuccess && (
                <div className="bg-green-50 text-green-500 p-3 rounded-lg text-sm">{forgotSuccess}</div>
              )}
              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
                  <FaEnvelope size={18} color="#fb923c" />
                </span>
                <input
                  className={theme.input + ' w-full pl-10 mb-0'}
                  type="email"
                  placeholder="E-mail para recuperação"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`${theme.button} w-full mt-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Enviando...' : 'Enviar e-mail de recuperação'}
              </button>
              <div className="text-center mt-4">
                <button type="button" className="text-orange-500 hover:text-orange-600 text-sm" onClick={() => setTab('login')}>Voltar ao login</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
