import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import theme from '../theme';
import { FaLock } from 'react-icons/fa';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    const res = await fetch(`/api/auth/reset-password/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha })
    });
    if (res.ok) {
      setMsg('Senha redefinida! Faça login.');
      setTimeout(() => navigate('/login'), 1500);
    } else {
      setError('Token inválido ou senha fraca.');
    }
  };

  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center min-h-screen pb-24 sm:pb-32'}>
      <form onSubmit={handleSubmit} className={theme.card + ' w-full max-w-sm flex flex-col gap-4'}>
        <h2 className={theme.title + ' text-center'}>Redefinir Senha</h2>
        <div className="relative mb-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400">
            <FaLock size={18} color="#fb923c" />
          </span>
          <input
            className={theme.input + ' w-full pl-10 mb-0'}
            type="password"
            placeholder="Nova senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            autoFocus
          />
        </div>
        {msg && <div className="text-green-500 mb-2 text-center">{msg}</div>}
        {error && <div className="text-red-400 mb-2 text-center">{error}</div>}
        <button type="submit" className={theme.primary + ' w-full font-bold py-2 rounded'}>Redefinir</button>
      </form>
    </div>
  );
}
