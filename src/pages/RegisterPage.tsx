import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';

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
    <div className={theme.bg + ' flex flex-col items-center justify-center'}>
      <form onSubmit={handleSubmit} className={theme.card + ' w-full max-w-sm'}>
        <h2 className={theme.title + ' text-center'}>Cadastro</h2>
        <input className={theme.input + ' w-full mb-4'} name="nome" placeholder="Nome" value={form.nome} onChange={handleChange} required />
        <input className={theme.input + ' w-full mb-4'} name="email" type="email" placeholder="E-mail" value={form.email} onChange={handleChange} required />
        <input className={theme.input + ' w-full mb-4'} name="senha" type="password" placeholder="Senha" value={form.senha} onChange={handleChange} required />
        <select className={theme.input + ' w-full mb-4'} name="tipo" value={form.tipo} onChange={handleChange}>
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
