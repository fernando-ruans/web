import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

export default function RegisterPage() {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', tipo: 'cliente' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setSuccess('Cadastro realizado! Faça login.');
      setTimeout(() => navigate('/login'), 1500);
    } else {
      const data = await res.json();
      setError(data.error || 'Erro ao cadastrar');
    }
  };

  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center min-h-screen'}>
      <form onSubmit={handleSubmit} className={theme.card + ' w-full max-w-sm flex flex-col gap-4'}>
        <h2 className={theme.title + ' text-center'}>Cadastro</h2>
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
        </div>
        <select className={theme.input + ' w-full mb-2'} name="tipo" value={form.tipo} onChange={handleChange}>
          <option value="cliente">Cliente</option>
          <option value="lojista">Lojista</option>
        </select>
        {error && <div className="text-red-400 mb-2 text-center">{error}</div>}
        {success && <div className="text-green-400 mb-2 text-center">{success}</div>}
        <button type="submit" className={theme.primary + ' w-full font-bold py-2 rounded'}>Cadastrar</button>
      </form>
    </div>
  );
}
