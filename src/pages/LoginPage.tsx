import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = await login(email, senha);
    if (!ok) setError('E-mail ou senha inválidos');
    else window.location.href = '/';
  };

  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center'}>
      <form onSubmit={handleSubmit} className={theme.card + ' w-full max-w-sm'}>
        <h2 className={theme.title + ' text-center'}>Login</h2>
        <input
          className={theme.input + ' w-full mb-4'}
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className={theme.input + ' w-full mb-4'}
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
        />
        {error && <div className="text-red-400 mb-2 text-center">{error}</div>}
        <button
          type="submit"
          className={theme.primary + ' w-full font-bold py-2 rounded'}
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <div className="flex justify-between mt-4 text-sm">
          <a href="/register" className="text-orange-500 hover:underline">Criar conta</a>
          <a href="/forgot-password" className="text-orange-500 hover:underline">Esqueci a senha</a>
        </div>
      </form>
    </div>
  );
}
