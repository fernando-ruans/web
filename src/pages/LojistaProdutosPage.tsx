import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import UploadImage from '../components/UploadImage';

export default function LojistaProdutosPage() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<any[]>([]); // Simulação inicial
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [editId, setEditId] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaId, setCategoriaId] = useState('');
  const [imagem, setImagem] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [sugestoesCategorias, setSugestoesCategorias] = useState<string[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string|null>(null);
  const [catEditId, setCatEditId] = useState<number|null>(null);
  const [catEditNome, setCatEditNome] = useState('');
  const [restaurante, setRestaurante] = useState<any>(null);
  const [restLoading, setRestLoading] = useState(true);

  // Busca real dos produtos do lojista
  useEffect(() => {
    async function fetchProdutos() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/lojista/products', { credentials: 'include' });
        if (!res.ok) throw new Error('Erro ao buscar produtos');
        const data = await res.json();
        setProdutos(data);
      } catch (err: any) {
        setError(err.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    fetchProdutos();
  }, []);

  // Busca categorias do lojista
  useEffect(() => {
    async function fetchCategorias() {
      try {
        const res = await fetch('/api/lojista/categories', { credentials: 'include' });
        if (!res.ok) throw new Error('Erro ao buscar categorias');
        const data = await res.json();
        setCategorias(data);
      } catch {}
    }
    fetchCategorias();
  }, []);

  // Buscar restaurante do lojista
  useEffect(() => {
    async function fetchRestaurante() {
      setRestLoading(true);
      try {
        const res = await fetch('/api/lojista/restaurants', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setRestaurante(data[0] || null);
        }
      } finally {
        setRestLoading(false);
      }
    }
    fetchRestaurante();
  }, []);

  // Adiciona/cria produto no backend
  async function handleAddOrEdit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editId) {
        // Editar produto
        const res = await fetch(`/api/lojista/products/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ nome, preco, descricao, categoriaId, imagem })
        });
        if (!res.ok) throw new Error('Erro ao editar produto');
        const updated = await res.json();
        setProdutos(produtos.map(p => p.id === editId ? updated : p));
      } else {
        // Criar produto
        const res = await fetch('/api/lojista/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ nome, preco, descricao, categoriaId, imagem })
        });
        if (!res.ok) throw new Error('Erro ao cadastrar produto');
        const novo = await res.json();
        setProdutos([...produtos, novo]);
      }
      setShowForm(false);
      setEditId(null);
      setNome(''); setPreco(''); setDescricao(''); setCategoriaId(''); setImagem('');
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    }
  }

  // Remove produto no backend
  async function handleDelete(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/lojista/products/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Erro ao excluir produto');
      setProdutos(produtos.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    }
  }

  // Preenche o formulário para edição
  function handleEdit(produto: any) {
    setEditId(produto.id);
    setNome(produto.nome);
    setPreco(produto.preco);
    setDescricao(produto.descricao);
    setCategoriaId(produto.category?.id || '');
    setImagem(produto.imagem || '');
    setShowForm(true);
  }

  async function handleAddCategoria(e: React.FormEvent) {
    e.preventDefault();
    setCatError(null);
    setCatLoading(true);
    try {
      // Busca o restaurante do lojista (assume 1 restaurante por lojista)
      const resRest = await fetch('/api/lojista/restaurants', { credentials: 'include' });
      const restaurantes = await resRest.json();
      if (!restaurantes[0]) throw new Error('Restaurante não encontrado');
      const restaurantId = restaurantes[0].id;
      // Cria categoria
      const res = await fetch('/api/lojista/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ restaurantId, nome: novaCategoria })
      });
      if (!res.ok) throw new Error('Erro ao criar categoria');
      const cat = await res.json();
      setCategorias([...categorias, cat]);
      setNovaCategoria('');
    } catch (err: any) {
      setCatError(err.message || 'Erro desconhecido');
    } finally {
      setCatLoading(false);
    }
  }

  async function handleEditCategoria(id: number, nome: string) {
    setCatError(null);
    setCatLoading(true);
    try {
      const res = await fetch(`/api/lojista/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nome })
      });
      if (!res.ok) throw new Error('Erro ao editar categoria');
      const updated = await res.json();
      setCategorias(categorias.map(c => c.id === id ? updated : c));
      setCatEditId(null);
    } catch (err: any) {
      setCatError(err.message || 'Erro desconhecido');
    } finally {
      setCatLoading(false);
    }
  }

  async function handleDeleteCategoria(id: number) {
    if (!window.confirm('Tem certeza que deseja remover esta categoria? Todos os produtos associados ficarão sem categoria.')) return;
    setCatError(null);
    setCatLoading(true);
    try {
      const res = await fetch(`/api/lojista/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Erro ao remover categoria');
      setCategorias(categorias.filter(c => c.id !== id));
      if (categoriaId === id.toString()) setCategoriaId('');
    } catch (err: any) {
      setCatError(err.message || 'Erro desconhecido');
    } finally {
      setCatLoading(false);
    }
  }

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center justify-center pb-24 sm:pb-32'}>
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-6 py-10">
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 border-t-4 border-orange-400 w-full flex flex-col items-center gap-6">
          <h2 className="text-2xl font-extrabold text-orange-500 mb-2 flex items-center gap-2">
            Produtos do Lojista
          </h2>
          {restLoading ? (
            <div className="text-gray-400 text-center">Carregando restaurante...</div>
          ) : restaurante ? (
            <div className="text-orange-600 font-bold text-lg text-center">Gerenciando: {restaurante.nome}</div>
          ) : (
            <div className="text-red-500 font-bold text-center">Nenhum restaurante cadastrado! Cadastre um restaurante para liberar o cadastro de produtos e categorias.</div>
          )}
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded flex items-center gap-2 mb-4" onClick={() => setShowForm(true)} disabled={!restaurante}><FaPlus /> Adicionar Produto</button>
          {showForm && (
            <form onSubmit={handleAddOrEdit} className="w-full flex flex-col gap-2 bg-orange-50 rounded-xl p-4 border border-orange-200 mb-2">
              <select className={theme.input + ' w-full'} value={categoriaId} onChange={e => setCategoriaId(e.target.value)} required disabled={!restaurante}>
                <option value="">Selecione a categoria</option>
                {categorias.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
              <input className={theme.input + ' w-full'} placeholder="Nome do produto" value={nome} onChange={e => setNome(e.target.value)} required disabled={!restaurante} />
              <input className={theme.input + ' w-full'} placeholder="Preço" type="number" min="0" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} required disabled={!restaurante} />
              <textarea className={theme.input + ' w-full'} placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} disabled={!restaurante} />
              <UploadImage onUpload={url => setImagem(url)} label="Imagem do produto" />
              {imagem && <div className="text-xs text-gray-500 break-all">URL: {imagem}</div>}
              <div className="flex gap-2">
                <button type="submit" className={theme.primary + ' w-full font-bold py-2 rounded'} disabled={!restaurante}>{editId ? 'Salvar' : 'Cadastrar'}</button>
                <button type="button" className={theme.secondary + ' w-full font-bold py-2 rounded'} onClick={() => { setShowForm(false); setEditId(null); setNome(''); setPreco(''); setDescricao(''); setCategoriaId(''); setImagem(''); }} disabled={!restaurante}>Cancelar</button>
              </div>
            </form>
          )}
          <div className="w-full flex flex-col gap-2 mb-4">
            <form onSubmit={handleAddCategoria} className="flex gap-2 items-center">
              <input
                className={theme.input + ' w-full'}
                placeholder="Nova categoria"
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
                list="sugestoes-categorias"
                required
                disabled={catLoading || !restaurante}
              />
              <datalist id="sugestoes-categorias">
                {sugestoesCategorias.map(s => <option key={s} value={s} />)}
              </datalist>
              <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2 rounded" disabled={catLoading || !restaurante}>
                {catLoading ? 'Adicionando...' : 'Adicionar'}
              </button>
            </form>
            {catError && <div className="text-red-500 text-sm">{catError}</div>}
            {/* Lista de categorias com editar/remover */}
            <div className="flex flex-wrap gap-2 mt-2">
              {categorias.map((cat: any) => (
                <div key={cat.id} className="flex items-center gap-1 bg-orange-100 border border-orange-300 rounded px-2 py-1">
                  {catEditId === cat.id ? (
                    <form onSubmit={e => {e.preventDefault(); handleEditCategoria(cat.id, catEditNome);}} className="flex gap-1 items-center">
                      <input className="text-sm px-1 rounded border border-orange-300" value={catEditNome} onChange={e => setCatEditNome(e.target.value)} required />
                      <button type="submit" className="text-green-600 font-bold">Salvar</button>
                      <button type="button" className="text-gray-500 font-bold" onClick={() => setCatEditId(null)}>Cancelar</button>
                    </form>
                  ) : (
                    <>
                      <span className="text-orange-700 font-semibold text-sm">{cat.nome}</span>
                      <button className="text-xs text-blue-600 hover:underline" onClick={() => {setCatEditId(cat.id); setCatEditNome(cat.nome);}}>Editar</button>
                      <button className="text-xs text-red-600 hover:underline" onClick={() => handleDeleteCategoria(cat.id)}>Remover</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full grid grid-cols-1 gap-4">
            {loading ? (
              <div className="text-gray-400 text-center">Carregando produtos...</div>
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : produtos.length === 0 ? (
              <div className="text-gray-400 text-center">Nenhum produto cadastrado.</div>
            ) : (
              produtos.map(produto => (
                <div key={produto.id} className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-orange-200 hover:shadow-lg transition">
                  <div className="flex items-center gap-4">
                    {produto.imagem && <img src={produto.imagem} alt={produto.nome} className="w-20 h-20 object-cover rounded-xl border border-orange-100" />}
                    <div>
                      <div className="font-bold text-orange-600 text-lg">{produto.nome}</div>
                      <div className="text-gray-600 font-bold text-xl">R$ {produto.preco}</div>
                      <div className="text-gray-500 text-sm mb-1">{produto.descricao}</div>
                      {produto.category && <div className="text-xs text-orange-400 font-semibold">Categoria: {produto.category.nome}</div>}
                      {produto.imagem && <div className="text-xs text-gray-400 break-all">{produto.imagem}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-3 py-2 rounded transition flex items-center gap-1" onClick={() => handleEdit(produto)}><FaEdit /> Editar</button>
                    <button className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-2 rounded transition flex items-center gap-1" onClick={() => handleDelete(produto.id)}><FaTrash /> Excluir</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
