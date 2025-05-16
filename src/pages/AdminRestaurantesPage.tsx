import React, { useState, useEffect } from 'react';
import theme from '../theme';
import { FaPlus, FaStore, FaCheckCircle, FaTrashAlt, FaTimesCircle, FaUserTie, FaEdit } from 'react-icons/fa';
import UploadImage from '../components/UploadImage';
import { useLocation } from 'react-router-dom';

export default function AdminRestaurantesPage() {
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cidade, setCidade] = useState('');
  const [taxa_entrega, setTaxaEntrega] = useState('');
  const [tempo_entrega, setTempoEntrega] = useState('');
  const [banner, setBanner] = useState('');
  const [imagem, setImagem] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [restaurantes, setRestaurantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDelegate, setShowDelegate] = useState(false);
  const [selectedRestaurante, setSelectedRestaurante] = useState<any>(null);
  const [lojistas, setLojistas] = useState<any[]>([]);
  const [selectedLojista, setSelectedLojista] = useState('');
  const [delegateMsg, setDelegateMsg] = useState('');
  const [delegateError, setDelegateError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const location = useLocation();

  async function fetchRestaurantes() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/restaurants', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRestaurantes(data);
      } else {
        setError('Erro ao buscar restaurantes');
      }
    } catch {
      setError('Erro ao buscar restaurantes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRestaurantes();
    // Se vier da tela de admin com ?delegar=1, abre o modal de delegação no primeiro restaurante
    const params = new URLSearchParams(location.search);
    if (params.get('delegar') && restaurantes.length > 0) {
      setSelectedRestaurante(restaurantes[0]);
      setShowDelegate(true);
      fetchLojistas();
    }
    // eslint-disable-next-line
  }, [location.search, restaurantes.length]);

  // Novo useEffect para abrir o formulário de cadastro se vier de ?add=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add')) {
      setShowForm(true);
    }
  }, [location.search]);

  async function handleAprovar(id: number) {
    setError('');
    const res = await fetch(`/api/admin/restaurants/${id}/approve`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) fetchRestaurantes();
    else setError('Erro ao aprovar restaurante');
  }

  async function handleExcluir(id: number) {
    setError('');
    const res = await fetch(`/api/admin/restaurants/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (res.ok) fetchRestaurantes();
    else setError('Erro ao excluir restaurante');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    const res = await fetch('/api/admin/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ nome, cnpj, cidade, taxa_entrega, tempo_entrega, banner, imagem })
    });
    if (res.ok) {
      setMsg('Restaurante cadastrado com sucesso!');
      setNome(''); setCnpj(''); setCidade(''); setTaxaEntrega(''); setTempoEntrega(''); setBanner(''); setImagem('');
      setShowForm(false);
      fetchRestaurantes();
    } else {
      const data = await res.json();
      setError(data.error || 'Erro ao cadastrar restaurante');
    }
  };

  async function fetchLojistas() {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLojistas(data.filter((u: any) => u.tipo === 'lojista'));
      }
    } catch {}
  }

  function openDelegateModal(restaurante: any) {
    setSelectedRestaurante(restaurante);
    setShowDelegate(true);
    setDelegateMsg('');
    setDelegateError('');
    setSelectedLojista('');
    fetchLojistas();
  }

  async function handleDelegate(e: React.FormEvent) {
    e.preventDefault();
    setDelegateMsg('');
    setDelegateError('');
    if (!selectedLojista) {
      setDelegateError('Selecione um lojista');
      return;
    }
    const res = await fetch('/api/admin/restaurants/delegate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ restauranteId: selectedRestaurante.id, lojistaId: selectedLojista })
    });
    if (res.ok) {
      setDelegateMsg('Lojista delegado com sucesso!');
      setTimeout(() => { setShowDelegate(false); fetchRestaurantes(); }, 1200);
    } else {
      const data = await res.json();
      setDelegateError(data.error || 'Erro ao delegar lojista');
    }
  }

  function openEditForm(restaurante: any) {
    setEditId(restaurante.id);
    setNome(restaurante.nome);
    setCnpj(restaurante.cnpj);
    setCidade(restaurante.cidade);
    setTaxaEntrega(restaurante.taxa_entrega);
    setTempoEntrega(restaurante.tempo_entrega);
    setBanner(restaurante.banner || '');
    setImagem(restaurante.imagem || '');
    setEditMode(true);
    setShowForm(true);
    setMsg('');
    setError('');
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    if (!editId) return;
    const res = await fetch(`/api/admin/restaurants/${editId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ nome, cnpj, cidade, taxa_entrega, tempo_entrega, banner, imagem })
    });
    if (res.ok) {
      setMsg('Restaurante atualizado com sucesso!');
      setNome(''); setCnpj(''); setCidade(''); setTaxaEntrega(''); setTempoEntrega(''); setBanner(''); setImagem('');
      setEditId(null); setEditMode(false); setShowForm(false);
      fetchRestaurantes();
    } else {
      const data = await res.json();
      setError(data.error || 'Erro ao atualizar restaurante');
    }
  };

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center justify-center pb-24 sm:pb-32'}>
      <div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-6 border-t-4 border-orange-400 mt-8">
        <h2 className={theme.title + ' text-center flex items-center gap-2'}><FaStore size={28} color="#fb923c" /> Gerenciar Restaurantes</h2>
        <div className="text-gray-500 mb-2 text-center">Aqui você pode aprovar, editar, excluir restaurantes, delegar lojista e ver avaliações.</div>
        <button
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded flex items-center gap-2 mb-2 w-full sm:w-auto justify-center"
          onClick={() => setShowForm(v => !v)}
        >
          <FaPlus /> {showForm ? 'Cancelar' : 'Adicionar Restaurante'}
        </button>
        {showForm && (
          <form onSubmit={editMode ? handleEdit : handleSubmit} className="w-full flex flex-col gap-2 bg-orange-50 rounded-xl p-4 border border-orange-200 mb-2">
            <input className={theme.input + ' w-full'} placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} required />
            <input className={theme.input + ' w-full'} placeholder="CNPJ" value={cnpj} onChange={e => setCnpj(e.target.value)} required />
            <input className={theme.input + ' w-full'} placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} required />
            <div className="flex flex-col sm:flex-row gap-2">
              <input className={theme.input + ' w-full'} placeholder="Taxa de entrega" type="number" min="0" step="0.01" value={taxa_entrega} onChange={e => setTaxaEntrega(e.target.value)} required />
              <input className={theme.input + ' w-full'} placeholder="Tempo de entrega (min)" type="number" min="1" value={tempo_entrega} onChange={e => setTempoEntrega(e.target.value)} required />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1"><UploadImage label="Banner do restaurante" onUpload={setBanner} /></div>
              <div className="flex-1"><UploadImage label="Logo do restaurante" onUpload={setImagem} /></div>
            </div>
            <div className="flex flex-row gap-2 items-center justify-center">
              {banner && <img src={banner} alt="Banner" className="w-32 h-20 object-cover rounded" />}
              {imagem && <img src={imagem} alt="Logo" className="w-16 h-16 object-cover rounded" />}
            </div>
            {msg && <div className="text-green-500 text-center">{msg}</div>}
            {error && <div className="text-red-400 text-center">{error}</div>}
            <div className="flex flex-col sm:flex-row gap-2">
              <button type="submit" className={theme.primary + ' w-full font-bold py-2 rounded'}>{editMode ? 'Salvar Alterações' : 'Cadastrar'}</button>
              {editMode && <button type="button" className={theme.secondary + ' w-full font-bold py-2 rounded'} onClick={() => { setEditMode(false); setShowForm(false); setEditId(null); }}>Cancelar</button>}
            </div>
          </form>
        )}
        {loading ? (
          <div className="text-center text-gray-400">Carregando restaurantes...</div>
        ) : (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
            {restaurantes.length === 0 && <div className="text-center text-gray-400 col-span-3">Nenhum restaurante cadastrado.</div>}
            {restaurantes.map((r: any) => (
              <div key={r.id} className="bg-white rounded-2xl shadow p-0 flex flex-col items-center border border-orange-100 overflow-hidden relative">
                {/* Banner do restaurante */}
                <div className="w-full h-24 sm:h-28 bg-orange-50 relative">
                  <img
                    src={r.banner || '/banner-default.png'}
                    alt={r.nome + ' banner'}
                    className="w-full h-full object-cover object-center border-none shadow-none"
                    onError={e => (e.currentTarget.src = '/banner-default.png')}
                  />
                  {/* Logo sobreposta */}
                  <div className="absolute left-1/2 -bottom-8 transform -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full shadow-lg bg-white flex items-center justify-center border-4 border-white overflow-hidden">
                    {r.imagem ? (
                      <img src={r.imagem} alt={r.nome} className="w-full h-full object-cover rounded-full" onError={e => (e.currentTarget.src = '/logo192.png')} />
                    ) : (
                      <FaStore size={32} color="#fb923c" />
                    )}
                  </div>
                </div>
                {/* Conteúdo do card */}
                <div className="flex flex-col items-center gap-1 pt-12 pb-4 px-4 w-full">
                  <div className="text-lg font-bold text-orange-700 flex items-center gap-2 mb-1 mt-2"><FaStore size={18} /> {r.nome}</div>
                  <div className="text-gray-600 text-sm mb-1 flex items-center gap-1"><FaTimesCircle size={14} color="#fb923c" /> {r.cidade}</div>
                  <span className="text-xs px-2 py-1 rounded-full font-bold mb-2" style={{ background: r.status === 'aprovado' ? '#dcfce7' : '#fef3c7', color: r.status === 'aprovado' ? '#22c55e' : '#f59e42' }}>
                    {r.status === 'aprovado' ? <FaCheckCircle size={12} color="#22c55e" /> : <FaTimesCircle size={12} color="#f59e42" />} {r.status}
                  </span>
                  <div className="flex flex-wrap gap-2 w-full justify-center text-xs text-gray-500 mb-2">
                    <span>Entrega: R$ {Number(r.taxa_entrega).toFixed(2)}</span>
                    <span>|</span>
                    <span>Tempo: {r.tempo_entrega} min</span>
                    <span>|</span>
                    <span>CNPJ: {r.cnpj}</span>
                  </div>
                  {/* Botões de ação */}
                  <div className="flex flex-col gap-2 w-full mt-2">
                    <button onClick={() => openEditForm(r)} className="w-full px-3 py-2 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 transition flex items-center justify-center gap-1 shadow" title="Editar"><FaEdit size={14} /> Editar</button>
                    {r.status !== 'aprovado' && (
                      <button onClick={() => handleAprovar(r.id)} className="w-full px-3 py-2 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 transition flex items-center justify-center gap-1 shadow" title="Aprovar"><FaCheckCircle size={14} /> Aprovar</button>
                    )}
                    <button onClick={() => handleExcluir(r.id)} className="w-full px-3 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition flex items-center justify-center gap-1 shadow" title="Excluir"><FaTrashAlt size={14} /> Excluir</button>
                    <button onClick={() => openDelegateModal(r)} className="w-full px-3 py-2 rounded-lg bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-500 transition flex items-center justify-center gap-1 shadow" title="Delegar Lojista"><FaUserTie size={14} /> Delegar Lojista</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Modal de delegação */}
        {showDelegate && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md flex flex-col gap-4 border border-orange-200">
              <h3 className="text-xl font-bold text-orange-600 flex items-center gap-2"><FaUserTie size={20} /> Delegar Lojista</h3>
              {/* Novo select para escolher o restaurante */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-orange-500">Restaurante:</label>
                <select
                  className={theme.input}
                  value={selectedRestaurante?.id || ''}
                  onChange={e => {
                    const rest = restaurantes.find((r: any) => r.id === Number(e.target.value));
                    setSelectedRestaurante(rest);
                    setDelegateMsg('');
                    setDelegateError('');
                  }}
                  required
                >
                  <option value="">Selecione o restaurante</option>
                  {restaurantes.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.nome} ({r.cidade})</option>
                  ))}
                </select>
              </div>
              <form onSubmit={handleDelegate} className="flex flex-col gap-3 mt-2">
                <select className={theme.input} value={selectedLojista} onChange={e => setSelectedLojista(e.target.value)} required>
                  <option value="">Selecione um lojista</option>
                  {lojistas.map(l => (
                    <option key={l.id} value={l.id}>{l.nome} ({l.email})</option>
                  ))}
                </select>
                {delegateMsg && <div className="text-green-500 text-center">{delegateMsg}</div>}
                {delegateError && <div className="text-red-400 text-center">{delegateError}</div>}
                <div className="flex gap-2">
                  <button type="submit" className={theme.primary + ' w-full font-bold py-2 rounded'}>Delegar</button>
                  <button type="button" className={theme.secondary + ' w-full font-bold py-2 rounded'} onClick={() => setShowDelegate(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          </div>
        )}
        <div className="text-center text-gray-400">Funcionalidade administrativa em construção.</div>
      </div>
    </div>
  );
}
