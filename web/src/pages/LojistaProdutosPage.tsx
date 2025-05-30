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

  // Estados para adicionais
  const [adicionais, setAdicionais] = useState<any[]>([]);
  const [adicionalNome, setAdicionalNome] = useState('');
  const [adicionalPreco, setAdicionalPreco] = useState('');
  const [adicionalQuantidadeMax, setAdicionalQuantidadeMax] = useState('');
  const [adicionalEditId, setAdicionalEditId] = useState<number|null>(null);
  const [adicionalError, setAdicionalError] = useState<string|null>(null);

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
          console.log('Restaurantes retornados para o lojista:', data); // DEPURAÇÃO
          setRestaurante(data[0] || null);
        }
      } finally {
        setRestLoading(false);
      }
    }
    fetchRestaurante();
  }, []);

  // Efeito para carregar adicionais quando abre o formulário em modo de edição
  useEffect(() => {
    if (editId && showForm) {
      fetch(`/api/lojista/adicionais?productId=${editId}`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setAdicionais(Array.isArray(data) ? data : []))
        .catch(() => {
          setAdicionais([]);
          setAdicionalError('Erro ao carregar adicionais');
        });
    } else if (!editId && showForm) {
      // Em modo de criação, limpa os adicionais
      setAdicionais([]);
    }
  }, [editId, showForm]);

  // Adiciona/cria produto no backend
  async function handleAddOrEdit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      // Validação local
      if (!categoriaId || !nome || !descricao || !preco) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }

      const produtoData = {
        categoryId: Number(categoriaId),
        nome,
        descricao,
        preco: Number(preco),
        imagem,
        adicionais: adicionais.map(a => ({
          nome: a.nome,
          preco: Number(a.preco),
          quantidadeMax: Number(a.quantidadeMax)
        }))
      };

      if (editId) {
        // Editar produto
        const res = await fetch(`/api/lojista/products/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(produtoData)
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao editar produto');
        }
        const updated = await res.json();
        setProdutos(produtos.map(p => p.id === editId ? updated : p));
      } else {
        // Criar produto
        const res = await fetch('/api/lojista/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(produtoData)
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao cadastrar produto');
        }
        const novo = await res.json();
        setProdutos([...produtos, novo]);
      }

      // Limpa o formulário e fecha
      setShowForm(false);
      setEditId(null);
      setNome(''); 
      setPreco(''); 
      setDescricao(''); 
      setCategoriaId(''); 
      setImagem('');
      setAdicionais([]);
      setAdicionalNome('');
      setAdicionalPreco('');
      setAdicionalQuantidadeMax('');
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
    // Os adicionais serão carregados pelo useEffect que monitora editId e showForm
  }

  // Ao fechar/cancelar o formulário, limpa os adicionais
  function handleCloseForm() {
    setShowForm(false);
    setEditId(null);
    setNome('');
    setPreco('');
    setDescricao('');
    setCategoriaId('');
    setImagem('');
    setAdicionais([]);
    setAdicionalNome('');
    setAdicionalPreco('');
    setAdicionalQuantidadeMax('');
    setAdicionalEditId(null);
    setAdicionalError(null);
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

  // Funções CRUD adicionais
  async function handleAddAdicional(e: React.MouseEvent) {
    e.preventDefault();
    setAdicionalError(null);
    
    if (!adicionalNome || adicionalPreco === '' || adicionalQuantidadeMax === '') {
      setAdicionalError('Preencha todos os campos do adicional');
      return;
    }

    try {
      const novoAdicional = {
        nome: adicionalNome,
        preco: Number(adicionalPreco),
        quantidadeMax: Number(adicionalQuantidadeMax)
      };

      if (editId) {
        // Se já tem ID do produto, salva no backend
        const res = await fetch('/api/lojista/adicionais', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...novoAdicional,
            productId: editId
          })
        });
        if (!res.ok) throw new Error('Erro ao adicionar adicional');
        const novo = await res.json();
        setAdicionais([...adicionais, novo]);
      } else {
        // Se não tem ID (produto novo), adiciona apenas no estado local
        setAdicionais([
          ...adicionais,
          {
            ...novoAdicional,
            id: `temp_${Date.now()}` // ID temporário
          }
        ]);
      }

      setAdicionalNome('');
      setAdicionalPreco('');
      setAdicionalQuantidadeMax('');
    } catch (err: any) {
      setAdicionalError(err.message || 'Erro desconhecido');
    }
  }

  async function handleDeleteAdicional(id: number) {
    if (!window.confirm('Remover este adicional?')) return;
    try {
      await fetch(`/api/lojista/adicionais/${id}`, { method: 'DELETE', credentials: 'include' });
      setAdicionais(adicionais.filter(a => a.id !== id));
    } catch {}
  }

  async function handleEditAdicional(e: React.FormEvent) {
    e.preventDefault();
    setAdicionalError(null);
    try {
      const res = await fetch(`/api/lojista/adicionais/${adicionalEditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nome: adicionalNome,
          preco: Number(adicionalPreco),
          quantidadeMax: Number(adicionalQuantidadeMax)
        })
      });
      if (!res.ok) throw new Error('Erro ao editar adicional');
      const atualizado = await res.json();
      setAdicionais(adicionais.map(a => a.id === adicionalEditId ? atualizado : a));
      setAdicionalEditId(null);
      setAdicionalNome('');
      setAdicionalPreco('');
      setAdicionalQuantidadeMax('');
    } catch (err: any) {
      setAdicionalError(err.message || 'Erro desconhecido');
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
                <button type="button" className={theme.secondary + ' w-full font-bold py-2 rounded'} onClick={handleCloseForm} disabled={!restaurante}>Cancelar</button>
              </div>              <div className="bg-white rounded-xl border border-orange-200 p-4 mt-2">
                <h4 className="font-bold text-orange-500 mb-2">Adicionais</h4>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end mb-2">
                  <div className="w-full sm:w-auto">
                    <input
                      className="border rounded px-2 py-1 text-sm w-full"
                      placeholder="Nome do adicional"
                      value={adicionalNome}
                      onChange={e => setAdicionalNome(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <input
                      className="border rounded px-2 py-1 text-sm w-full"
                      placeholder="Preço"
                      type="number"
                      min="0"
                      step="0.01" 
                      value={adicionalPreco}
                      onChange={e => setAdicionalPreco(e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-auto">
                    <input
                      className="border rounded px-2 py-1 text-sm w-full"
                      placeholder="Qtd. máxima"
                      type="number"
                      min="1"
                      value={adicionalQuantidadeMax}
                      onChange={e => setAdicionalQuantidadeMax(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      type="button"
                      onClick={e => {
                        e.preventDefault();
                        handleAddAdicional(e);
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2 rounded flex-1 sm:flex-none"
                      disabled={!showForm}
                    >
                      {adicionalEditId ? 'Salvar' : 'Adicionar'}                    </button>
                    {adicionalEditId && (
                      <button 
                        type="button"
                        onClick={() => {
                          setAdicionalEditId(null);
                          setAdicionalNome('');
                          setAdicionalPreco('');
                          setAdicionalQuantidadeMax('');
                        }}
                        className="bg-gray-500 hover:bg-gray-600 text-white text-sm px-3 py-2 rounded flex-1 sm:flex-none"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
                {adicionalError && (
                  <div className="text-red-500 text-sm mt-2">{adicionalError}</div>
                )}
                
                <div className="mt-4">
                  {adicionais.map((adicional: any) => (
                    <div key={adicional.id} className="flex justify-between items-center p-2 bg-orange-50 rounded mb-2">
                      <div>
                        <span className="font-bold">{adicional.nome}</span>
                        <span className="mx-2">-</span>
                        <span>R$ {adicional.preco.toFixed(2)}</span>
                        <span className="mx-2">-</span>
                        <span>Máx: {adicional.quantidadeMax}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAdicionalEditId(adicional.id);
                            setAdicionalNome(adicional.nome);
                            setAdicionalPreco(adicional.preco.toString());
                            setAdicionalQuantidadeMax(adicional.quantidadeMax.toString());
                          }}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAdicional(adicional.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                      <div className="text-gray-500 text-sm mb-1 break-words whitespace-pre-line">{produto.descricao}</div>
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
