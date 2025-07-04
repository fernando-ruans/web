import React, { useEffect, useState } from 'react';
import { FaUserEdit, FaTrashAlt, FaUser, FaUserShield, FaUserTie, FaUserPlus, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import theme from '../theme';
import { useAuth } from '../context/AuthContext';

export default function AdminUsuariosPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [promovendo, setPromovendo] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>('');
  const [filtroTipo, setFiltroTipo] = useState<string>('');
  const [pagina, setPagina] = useState(1);
  const USUARIOS_POR_PAGINA = 20;

  useEffect(() => { setPagina(1); }, [filtro, filtroTipo, usuarios]);

  useEffect(() => {
    setLoading(true);
    setErro('');
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setUsuarios(data))
      .catch(() => setErro('Erro ao carregar usuários'))
      .finally(() => setLoading(false));
  }, []);

  const promoverUsuario = async (id: string, novoTipo: string) => {
    setPromovendo(id + '-' + novoTipo);
    setErro('');
    setMsg('');
    try {
      const res = await fetch(`/api/admin/users/${id}/promote`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tipo: novoTipo })
      });
      if (res.ok) {
        setUsuarios(usuarios.map(u => u.id === id ? { ...u, tipo: novoTipo } : u));
        setMsg('Usuário promovido com sucesso!');
        // Se o usuário logado se rebaixou, recarrega a página para atualizar permissões
        if (user && user.id === id && user.tipo !== novoTipo) {
          setTimeout(() => window.location.reload(), 500);
        }
      } else {
        setErro('Erro ao promover usuário');
      }
    } catch {
      setErro('Erro ao promover usuário');
    } finally {
      setPromovendo(null);
      setTimeout(() => setMsg(''), 2000);
    }
  };

  const rebaixarUsuario = async (id: string, novoTipo: string) => {
    setPromovendo(id + '-' + novoTipo);
    setErro('');
    setMsg('');
    try {
      const res = await fetch(`/api/admin/users/${id}/promote`, { // Corrigido para usar promote
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tipo: novoTipo })
      });
      if (res.ok) {
        setUsuarios(usuarios.map(u => u.id === id ? { ...u, tipo: novoTipo } : u));
        setMsg('Usuário rebaixado com sucesso!');
        // Se o usuário logado se rebaixou, recarrega a página para atualizar permissões
        if (user && user.id === id && user.tipo !== novoTipo) {
          setTimeout(() => window.location.reload(), 500);
        }
      } else {
        setErro('Erro ao rebaixar usuário');
      }
    } catch {
      setErro('Erro ao rebaixar usuário');
    } finally {
      setPromovendo(null);
      setTimeout(() => setMsg(''), 2000);
    }
  };

  const tipoBadge = (tipo: string) => {
    if (tipo === 'admin') return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600"><FaUserShield /> admin</span>;
    if (tipo === 'lojista') return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><FaUserTie /> lojista</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"><FaUser /> cliente</span>;
  };

  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center min-h-screen pb-24 sm:pb-32'}>
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 py-10">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-orange-600 font-bold shadow hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all border border-orange-100 w-fit mb-2"
        >
          <FaArrowLeft size={18} /> Voltar
        </button>
        <div className="w-full flex flex-col items-center gap-4 shadow-xl bg-white rounded-2xl p-8 border-t-4 border-orange-100">
          <h2 className="text-3xl font-extrabold text-orange-500 mb-2 flex items-center gap-2"><FaUserShield size={28} color="#fb923c" /> Gerenciar Usuários</h2>
          <div className="text-gray-500 mb-4 text-center">Visualize e promova usuários do sistema.</div>
          {msg && <div className="w-full text-center text-green-600 font-bold bg-green-50 border border-green-200 rounded py-2 mb-2 animate-fade-in">{msg}</div>}
          {erro && <div className="w-full text-center text-red-500 font-bold bg-red-50 border border-red-200 rounded py-2 mb-2 animate-fade-in">{erro}</div>}
          <div className="w-full flex flex-col items-center mb-4">
            <div className="w-full max-w-2xl flex flex-col sm:flex-row items-center gap-2 bg-white/80 border border-orange-100 rounded-2xl shadow-md px-4 py-3">
              <div className="flex-1 flex items-center gap-2 w-full">
                <span className="text-orange-400 text-xl"><FaUser /></span>
                <input
                  type="text"
                  className={theme.input + ' w-full bg-white border-none focus:ring-0 text-gray-700'}
                  placeholder="Pesquisar por nome ou e-mail..."
                  value={filtro}
                  onChange={e => setFiltro(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-orange-400 text-xl"><FaUserShield /></span>
                <select
                  className="px-3 py-2 rounded-lg border border-orange-200 text-orange-600 font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
                  value={filtroTipo}
                  onChange={e => setFiltroTipo(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="admin">Admin</option>
                  <option value="lojista">Lojista</option>
                  <option value="cliente">Cliente</option>
                </select>
              </div>
              <button
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg shadow transition"
                onClick={() => { setFiltro(''); setFiltroTipo(''); }}
                type="button"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Limpar
              </button>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-400">Carregando usuários...</div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nenhum usuário encontrado.</div>
          ) : (
            <div className="w-full flex flex-col gap-4">
              {/* Paginação e filtro */}
              {(() => {
                // Aplica filtro de tipo e texto
                const filtrados = (usuarios as any[]).filter(u => {
                  if (filtroTipo && u.tipo !== filtroTipo) return false;
                  if (!filtro) return true;
                  const f = filtro.toLowerCase();
                  return (
                    (u.nome && u.nome.toLowerCase().includes(f)) ||
                    (u.email && u.email.toLowerCase().includes(f))
                  );
                });
                const totalPaginas = Math.ceil(filtrados.length / USUARIOS_POR_PAGINA) || 1;
                const inicio = (pagina - 1) * USUARIOS_POR_PAGINA;
                const fim = inicio + USUARIOS_POR_PAGINA;
                const usuariosPagina = filtrados.slice(inicio, fim);
                return <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {usuariosPagina.map((u: any) => (
                      // ...existing user card code...
                      <div key={u.id} className="bg-white rounded-2xl shadow p-6 flex flex-col items-center gap-3 border border-orange-100">
                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-500 shadow overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.nome} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            u.nome?.[0]?.toUpperCase() || <FaUser />
                          )}
                        </div>
                        <div className="text-lg font-bold text-orange-700 flex items-center gap-2">{u.nome}</div>
                        <div className="text-gray-600 text-sm break-all">{u.email}</div>
                        <div>{tipoBadge(u.tipo)}</div>
                        {/* Só mostra botões se for admin */}
                        {user?.tipo === 'admin' && (
                          <div className="flex flex-col gap-2 w-full mt-2">
                            {u.tipo === 'cliente' && (
                              <button
                                className={`px-3 py-2 rounded-lg bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-500 transition flex items-center gap-1 shadow disabled:opacity-60 disabled:cursor-not-allowed`}
                                title="Promover para Lojista"
                                disabled={promovendo === u.id + '-lojista'}
                                onClick={() => promoverUsuario(u.id, 'lojista')}
                              ><FaUserTie /> Promover para Lojista</button>
                            )}
                            {u.tipo === 'lojista' && (
                              <button
                                className={`px-3 py-2 rounded-lg bg-green-400 text-white font-bold hover:bg-green-500 transition flex items-center gap-1 shadow disabled:opacity-60 disabled:cursor-not-allowed`}
                                title="Rebaixar para Cliente"
                                disabled={promovendo === u.id + '-cliente'}
                                onClick={() => rebaixarUsuario(u.id, 'cliente')}
                              ><FaUser /> Rebaixar para Cliente</button>
                            )}
                            {u.tipo === 'admin' && (
                              <>
                                <button
                                  className={`px-3 py-2 rounded-lg bg-blue-400 text-white font-bold hover:bg-blue-500 transition flex items-center gap-1 shadow disabled:opacity-60 disabled:cursor-not-allowed`}
                                  title="Rebaixar para Lojista"
                                  disabled={promovendo === u.id + '-lojista'}
                                  onClick={() => rebaixarUsuario(u.id, 'lojista')}
                                ><FaUserTie /> Rebaixar para Lojista</button>
                                <button
                                  className={`px-3 py-2 rounded-lg bg-green-400 text-white font-bold hover:bg-green-500 transition flex items-center gap-1 shadow disabled:opacity-60 disabled:cursor-not-allowed`}
                                  title="Rebaixar para Cliente"
                                  disabled={promovendo === u.id + '-cliente'}
                                  onClick={() => rebaixarUsuario(u.id, 'cliente')}
                                ><FaUser /> Rebaixar para Cliente</button>
                              </>
                            )}
                            {u.tipo !== 'admin' && (
                              <button
                                className={`px-3 py-2 rounded-lg bg-orange-400 text-white font-bold hover:bg-orange-500 transition flex items-center gap-1 shadow disabled:opacity-60 disabled:cursor-not-allowed`}
                                title="Promover para Admin"
                                disabled={promovendo === u.id + '-admin'}
                                onClick={() => promoverUsuario(u.id, 'admin')}
                              ><FaUserShield /> Promover para Admin</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Paginação */}
                  {totalPaginas > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-6">
                      <button
                        className="px-3 py-2 rounded-lg bg-orange-100 text-orange-600 font-bold hover:bg-orange-200 disabled:opacity-50"
                        onClick={() => setPagina(p => Math.max(1, p - 1))}
                        disabled={pagina === 1}
                      >Anterior</button>
                      <span className="font-semibold text-orange-500">Página {pagina} de {totalPaginas}</span>
                      <button
                        className="px-3 py-2 rounded-lg bg-orange-100 text-orange-600 font-bold hover:bg-orange-200 disabled:opacity-50"
                        onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                        disabled={pagina === totalPaginas}
                      >Próxima</button>
                    </div>
                  )}
                </>;
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
