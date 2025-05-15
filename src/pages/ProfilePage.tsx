import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import UploadImage from '../components/UploadImage';

export default function ProfilePage() {
  const { user, token, loading, login, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [telefone, setTelefone] = useState(user.telefone || '');
  const [cpf, setCpf] = useState(user.cpf || '');
  const [endereco, setEndereco] = useState(user.endereco || '');

  if (!user) return null;

  // Exemplo de label para tipo de usuário
  let tipoLabel = 'Usuário';
  if (user.tipo === 'cliente') tipoLabel = 'Cliente';
  else if (user.tipo === 'lojista') tipoLabel = 'Lojista';
  else if (user.tipo === 'admin') tipoLabel = 'Administrador';

  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center min-h-screen'}>
      <div className={theme.card + ' w-full max-w-md flex flex-col items-center gap-2 shadow-xl'}>
        <h2 className={theme.title + ' text-center mb-1'}>Meu Perfil</h2>
        <div className="text-gray-500 mb-4 text-center">Gerencie suas informações pessoais e segurança</div>
        <div className="w-20 h-20 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700 text-3xl mb-2 shadow overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            user.nome?.[0]?.toUpperCase() || 'U'
          )}
        </div>
        {editMode ? (
          <form className="w-full flex flex-col items-center" onSubmit={async e => {
            e.preventDefault();
            setMsg('');
            setError('');
            try {
              const res = await fetch('/api/cliente/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ nome, email, avatarUrl, telefone, cpf, endereco })
              });
              if (res.ok) {
                const data = await res.json();
                setMsg('Dados atualizados com sucesso!');
                setEditMode(false);
                // Atualiza o usuário no AuthContext sem reload
                if (data.user) {
                  // Atualiza o localStorage se necessário
                  // Atualiza o contexto global
                  if (typeof window !== 'undefined') {
                    // Atualiza o user no contexto
                    const event = new CustomEvent('userUpdated', { detail: data.user });
                    window.dispatchEvent(event);
                  }
                }
              } else {
                const err = await res.json();
                setError(err.error || 'Erro ao atualizar dados.');
              }
            } catch (err) {
              setError('Erro ao atualizar dados.');
            }
          }}>
            <div className="w-full flex flex-col items-center mb-2">
              <UploadImage onUpload={setAvatarUrl} label=" " buttonClassName="mt-0 mb-2 px-3 py-1 text-sm rounded-full bg-orange-400 hover:bg-orange-500 text-white shadow-sm transition" />
            </div>
            <input
              className={theme.input + ' w-full mb-2'}
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Nome"
              required
            />
            <input
              className={theme.input + ' w-full mb-2'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="E-mail"
              type="email"
              required
              disabled
            />
            <input
              className={theme.input + ' w-full mb-2'}
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="Telefone"
              type="tel"
              required
            />
            <input
              className={theme.input + ' w-full mb-2'}
              value={cpf}
              onChange={e => setCpf(e.target.value)}
              placeholder="CPF"
              required
            />
            <input
              className={theme.input + ' w-full mb-2'}
              value={endereco}
              onChange={e => setEndereco(e.target.value)}
              placeholder="Endereço"
              required
            />
            {msg && <div className="text-green-500 mb-2 text-center">{msg}</div>}
            {error && <div className="text-red-400 mb-2 text-center">{error}</div>}
            <div className="flex gap-2 w-full">
              <button type="submit" className={theme.primary + ' w-full py-2 rounded font-bold'}>Salvar</button>
              <button type="button" className={theme.secondary + ' w-full py-2 rounded font-bold'} onClick={() => setEditMode(false)}>Cancelar</button>
            </div>
          </form>
        ) : (
          <>
            <div className="font-extrabold text-xl text-orange-500 mb-1">{user.nome}</div>
            <div className="text-gray-600 mb-2">{user.email}</div>
            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold mb-2">{tipoLabel}</span>
            {/* Exibe dados adicionais */}
            <div className="w-full flex flex-col gap-1 mb-2">
              {user.telefone && <div className="text-gray-500 text-sm"><b>Telefone:</b> {user.telefone}</div>}
              {user.cpf && <div className="text-gray-500 text-sm"><b>CPF:</b> {user.cpf}</div>}
              {user.endereco && <div className="text-gray-500 text-sm"><b>Endereço:</b> {user.endereco}</div>}
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              <button className={theme.secondary + ' w-full py-2 rounded font-bold transition'} onClick={() => setEditMode(true)}>Editar dados</button>
              <a href="/reset-password/" className={theme.primary + ' w-full py-2 rounded font-bold text-center'}>Alterar senha</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Atualiza o contexto global do usuário ao receber o evento
// (Removido daqui, pois agora está no AuthContext)
