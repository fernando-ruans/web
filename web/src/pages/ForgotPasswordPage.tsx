import React, { useState } from 'react';
import theme from '../theme';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (res.ok) {
      setMsg('Se o e-mail existir, enviaremos instruções.');
    } else {
      setError('Erro ao solicitar recuperação.');
    }
  };

  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center min-h-screen pb-24 sm:pb-32'}>
      <form onSubmit={handleSubmit} className={theme.card + ' w-full max-w-sm'}>
        <h2 className={theme.title + ' text-center'}>Recuperar Senha</h2>
        <input
          className={theme.input + ' w-full mb-4'}
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        {msg && <div className="text-green-500 mb-2 text-center">{msg}</div>}
        {error && <div className="text-red-400 mb-2 text-center">{error}</div>}
        <button type="submit" className={theme.primary + ' w-full font-bold py-2 rounded'}>Enviar</button>
        <div className="flex justify-between mt-4 text-sm">
          <a href="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-orange-600 font-bold shadow hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all border border-orange-100">
            <span className="text-xl">←</span>
            Voltar ao login
          </a>
          <a href="/register" className="text-orange-500 hover:underline">Criar conta</a>
        </div>
      </form>
    </div>
  );
}
