import React, { useState, useEffect } from 'react';
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
  const [cep, setCep] = useState(user.cep || '');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  // Função para inicializar campos de endereço
  const initializeAddressFields = (userData: any) => {
    if (userData.addresses?.length > 0) {
      const enderecoPrincipal = userData.addresses[0];
      setRua(enderecoPrincipal.rua || '');
      setNumero(enderecoPrincipal.numero || '');
      setComplemento(enderecoPrincipal.complemento || '');
      setBairro(enderecoPrincipal.bairro || '');
      setCidade(enderecoPrincipal.cidade || '');
      setEstado(enderecoPrincipal.estado || '');
      setCep(enderecoPrincipal.cep || '');
    } else if (userData.endereco) {
      // Tenta extrair informações do endereço formatado
      const parts = userData.endereco.split(',').map((part: string) => part.trim());
      if (parts.length >= 3) {
        const ruaNumero = parts[0].split(' - ');
        setRua(ruaNumero[0] || '');
        setNumero(ruaNumero[1] || '');
        setBairro(parts[1] || '');
        const cidadeEstado = parts[2].split('/');
        setCidade(cidadeEstado[0] || '');
        const estadoCep = cidadeEstado[1]?.split('-');
        setEstado(estadoCep?.[0]?.trim() || '');
        setCep(estadoCep?.[1]?.replace('CEP:', '').trim() || '');
      }
    }
  };

  // Efeito para inicializar campos quando o usuário é carregado
  useEffect(() => {
    if (user) {
      initializeAddressFields(user);
    }
  }, [user]);

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
      const endpoint = `/api/${user.tipo}/profile`;

      // Cria o objeto de dados apenas com campos válidos
      const data = {
        ...(nome && nome.trim() !== '' && { nome }),
        ...(email && email.trim() !== '' && { email }),
        ...(telefone && telefone.trim() !== '' && { telefone }),
        ...(avatarUrl && avatarUrl.trim() !== '' && { avatarUrl })
      };

      // Adiciona os campos de endereço individuais
      if (rua || numero || bairro || cidade || estado) {
        data.rua = rua;
        data.numero = numero;
        data.complemento = complemento;
        data.bairro = bairro;
        data.cidade = cidade;
        data.estado = estado;
        data.cep = cep;
      }

      // Verifica se há dados para atualizar
      if (Object.keys(data).length === 0) {
        setError('Nenhum dado válido para atualizar');
        return;
      }

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        const responseData = await res.json();
        if (responseData.user) {
          setMsg('Perfil atualizado com sucesso!');
          // Dispara evento para atualizar o usuário no contexto de autenticação
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: responseData }));
          setEditMode(false);

          // Atualiza os campos de endereço a partir do endereço principal do usuário
          if (responseData.user.addresses?.length > 0) {
            const enderecoPrincipal = responseData.user.addresses[0];
            setRua(enderecoPrincipal.rua || '');
            setNumero(enderecoPrincipal.numero || '');
            setComplemento(enderecoPrincipal.complemento || '');
            setBairro(enderecoPrincipal.bairro || '');
            setCidade(enderecoPrincipal.cidade || '');
            setEstado(enderecoPrincipal.estado || '');
            setCep(enderecoPrincipal.cep || '');
          }
        } else {
          setError('Resposta inválida do servidor');
        }
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao atualizar perfil');
      }
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
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

              {!editMode && (
                <div className="mt-4">
                  <div className="flex flex-col gap-1">
                    {user.addresses?.length > 0 ? (
                      <div>
                        <div className="font-semibold text-gray-600 mb-0.5">Endereço</div>
                        <div>{user.addresses[0].rua}, {user.addresses[0].numero}
                          {user.addresses[0].complemento && ` - ${user.addresses[0].complemento}`}</div>
                        <div>{user.addresses[0].bairro} - {user.addresses[0].cidade}/{user.addresses[0].estado}</div>
                        <div>CEP: {user.addresses[0].cep}</div>
                      </div>
                    ) : user.endereco ? (
                      <div>
                        <div className="font-semibold text-gray-600 mb-0.5">Endereço</div>
                        <div>{user.endereco}</div>
                      </div>
                    ) : (
                      <div className="text-gray-500">Nenhum endereço cadastrado</div>
                    )}
                  </div>
                </div>
              )}

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
