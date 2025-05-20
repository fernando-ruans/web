import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import UploadImage from '../components/UploadImage';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaUserEdit } from 'react-icons/fa';
import { buscarCEP, formatarEndereco } from '../utils/cepUtils';

export default function ProfilePage() {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState(user.nome);
  const [email, setEmail] = useState(user.email);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [telefone, setTelefone] = useState(user.telefone || '');
  const [cpf, setCpf] = useState(user.cpf || '');
  const [cep, setCep] = useState(user.cep || '');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  if (!user) return null;

  let tipoLabel = 'Usuário';
  if (user.tipo === 'cliente') tipoLabel = 'Cliente';
  else if (user.tipo === 'lojista') tipoLabel = 'Lojista';
  else if (user.tipo === 'admin') tipoLabel = 'Administrador';

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cepValue = e.target.value;
    if (cepValue.length === 8) {
      setLoadingCep(true);
      try {
        const enderecoCep = await buscarCEP(cepValue);
        if (enderecoCep) {
          setRua(enderecoCep.logradouro || '');
          setBairro(enderecoCep.bairro || '');
          setCidade(enderecoCep.localidade || '');
          setEstado(enderecoCep.uf || '');
        }
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      let endpoint = '/api/cliente/profile';
      if (user.tipo === 'lojista') endpoint = '/api/lojista/profile';
      if (user.tipo === 'admin') endpoint = '/api/admin/profile';
      
      const enderecoCompleto = {
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep
      };

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ 
          nome, 
          email, 
          avatarUrl, 
          telefone, 
          cpf,
          ...enderecoCompleto
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.msg && data.user) {
          setMsg(data.msg);
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: data }));
          setEditMode(false);
        } else {
          setError('Resposta inválida do servidor');
        }
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao atualizar perfil');
      }
    } catch {
      setError('Erro ao atualizar perfil');
    }
  };

  return (
    <div className={theme.bg + ' flex flex-col items-center justify-center min-h-screen pb-24 sm:pb-32'}>
      <div className="w-full max-w-xl flex flex-col items-center gap-8 py-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4 border-t-4 border-orange-400 w-full max-w-lg">
          <h2 className="text-3xl font-extrabold text-orange-500 mb-2 flex items-center gap-2">
            <FaUserEdit size={28} color="#fb923c" /> Meu Perfil
          </h2>
          <div className="text-gray-500 mb-2 text-center">Gerencie suas informações pessoais e segurança</div>

          <div className="w-24 h-24 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700 text-4xl mb-2 shadow overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              user.nome?.[0]?.toUpperCase() || 'U'
            )}
          </div>

          {editMode ? (
            <form className="w-full space-y-4" onSubmit={handleSubmit}>
              <div className="flex flex-col items-center mb-4">
                <UploadImage onUpload={setAvatarUrl} label="Alterar foto" buttonClassName="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-full shadow transition" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Nome Completo</label>
                  <input
                    className={theme.input + ' w-full'}
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">E-mail</label>
                  <input
                    className={theme.input + ' w-full bg-gray-50'}
                    value={email}
                    placeholder="E-mail"
                    type="email"
                    required
                    disabled
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Telefone</label>
                  <input
                    className={theme.input + ' w-full'}
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    placeholder="Telefone"
                    type="tel"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">CPF</label>
                  <input
                    className={theme.input + ' w-full'}
                    value={cpf}
                    onChange={e => setCpf(e.target.value)}
                    placeholder="CPF"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">CEP</label>
                  <div className="relative">
                    <input
                      className={theme.input + ' w-full'}
                      value={cep}
                      onChange={e => setCep(e.target.value.replace(/\D/g, ''))}
                      onBlur={handleCepBlur}
                      placeholder="CEP (apenas números)"
                      maxLength={8}
                    />
                    {loadingCep && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Rua</label>
                  <input
                    className={theme.input + ' w-full'}
                    value={rua}
                    onChange={e => setRua(e.target.value)}
                    placeholder="Rua"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Número</label>
                  <input
                    className={theme.input + ' w-full'}
                    value={numero}
                    onChange={e => setNumero(e.target.value)}
                    placeholder="Número"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Complemento</label>
                  <input
                    className={theme.input + ' w-full'}
                    value={complemento}
                    onChange={e => setComplemento(e.target.value)}
                    placeholder="Complemento (opcional)"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Bairro</label>
                  <input
                    className={theme.input + ' w-full'}
                    value={bairro}
                    onChange={e => setBairro(e.target.value)}
                    placeholder="Bairro"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Cidade</label>
                  <input
                    className={theme.input + ' w-full'}
                    value={cidade}
                    onChange={e => setCidade(e.target.value)}
                    placeholder="Cidade"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Estado</label>
                  <input
                    className={theme.input + ' w-full'}
                    value={estado}
                    onChange={e => setEstado(e.target.value)}
                    placeholder="Estado"
                  />
                </div>
              </div>

              {msg && <div className="text-green-500 text-center mt-4">{msg}</div>}
              {error && <div className="text-red-400 text-center mt-4">{error}</div>}
              
              <div className="flex gap-2 w-full mt-6">
                <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow transition">
                  Salvar Alterações
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditMode(false)} 
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="font-extrabold text-2xl text-orange-500 mb-1 text-center">{user.nome}</div>
              <div className="text-gray-600 mb-2 flex items-center gap-2 text-center">
                <FaEnvelope size={16} />{user.email}
              </div>
              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold mb-2">{tipoLabel}</span>
              
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                {user.telefone && (
                  <div className="text-gray-500 text-sm flex items-start gap-2 p-4 bg-gray-50 rounded-xl">
                    <FaPhone size={16} color="#f97316" /> 
                    <div>
                      <div className="font-semibold text-gray-600 mb-0.5">Telefone</div>
                      <div>{user.telefone}</div>
                    </div>
                  </div>
                )}
                
                {user.cpf && (
                  <div className="text-gray-500 text-sm flex items-start gap-2 p-4 bg-gray-50 rounded-xl">
                    <FaIdCard size={16} color="#f97316" />
                    <div>
                      <div className="font-semibold text-gray-600 mb-0.5">CPF</div>
                      <div>{user.cpf}</div>
                    </div>
                  </div>
                )}

                {cep && (
                  <div className="text-gray-500 text-sm flex items-start gap-2 p-4 bg-gray-50 rounded-xl md:col-span-2">
                    <FaMapMarkerAlt size={16} color="#f97316" />
                    <div>
                      <div className="font-semibold text-gray-600 mb-0.5">Endereço</div>
                      <div>{rua}, {numero}{complemento ? ` - ${complemento}` : ''}</div>
                      <div>{bairro} - {cidade}/{estado}</div>
                      <div>CEP: {cep}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 w-full mt-6">
                <button 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow transition flex items-center justify-center gap-2"
                  onClick={() => setEditMode(true)}
                >
                  <FaUserEdit size={20} /> Editar Perfil
                </button>
                <a 
                  href="/reset-password/" 
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl text-center transition"
                >
                  Alterar Senha
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
