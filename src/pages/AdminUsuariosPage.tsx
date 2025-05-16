import React, { useEffect, useState } from 'react';
import { FaUserEdit, FaTrashAlt } from 'react-icons/fa';
import theme from '../theme';

export default function AdminUsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setUsuarios(data))
      .catch(() => setErro('Erro ao carregar usuários'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center min-h-screen'}>
      <div className={theme.card + ' w-full max-w-3xl flex flex-col items-center gap-4 shadow-xl'}>
        <h2 className={theme.title + ' text-center flex items-center gap-2'}>Gerenciar Usuários</h2>
        <div className="text-gray-500 mb-2 text-center">Visualize, edite e exclua usuários do sistema.</div>
        {loading ? (
          <div className="text-center text-gray-400">Carregando usuários...</div>
        ) : erro ? (
          <div className="text-center text-red-400">{erro}</div>
        ) : (
          <div className="w-full flex flex-col gap-2 mt-2">
            {usuarios.length === 0 && <div className="text-center text-gray-400">Nenhum usuário encontrado.</div>}
            {usuarios.map((u: any) => (
              <div key={u.id} className="flex flex-col md:flex-row items-center justify-between gap-2 bg-white rounded-lg shadow p-3 border border-orange-100 flex-wrap">
                <div className="flex flex-col md:flex-row items-center gap-3 flex-1 w-full md:w-auto">
                  <span className="font-bold text-orange-600 flex items-center gap-2"><FaUserEdit size={18} /> {u.nome}</span>
                  <span className="text-gray-500 flex items-center gap-1">{u.email}</span>
                  <span className="text-xs px-2 py-1 rounded-full font-bold " style={{ background: u.tipo === 'admin' ? '#fef3c7' : u.tipo === 'lojista' ? '#dbeafe' : '#dcfce7', color: u.tipo === 'admin' ? '#f59e42' : u.tipo === 'lojista' ? '#2563eb' : '#22c55e' }}>{u.tipo}</span>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
                  {/* Botões de editar/excluir podem ser implementados */}
                  <button className="px-3 py-1 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition flex items-center gap-1" title="Editar"><FaUserEdit size={14} /> Editar</button>
                  <button className="px-3 py-1 rounded bg-red-500 text-white font-bold hover:bg-red-600 transition flex items-center gap-1" title="Excluir"><FaTrashAlt size={14} /> Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
