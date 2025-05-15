import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded shadow w-full max-w-sm">
        <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">Redefinir Senha</h2>
        <input
          className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
          type="password"
          placeholder="Nova senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
        />
        {msg && <div className="text-green-400 mb-2 text-center">{msg}</div>}
        {error && <div className="text-red-400 mb-2 text-center">{error}</div>}
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded">Redefinir</button>
      </form>
    </div>
  );
}
