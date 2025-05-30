import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import UploadImage from '../components/UploadImage';
import { FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaUserEdit, FaSpinner } from 'react-icons/fa';
import { buscarCEP, formatarEndereco } from '../utils/cepUtils';

export default function ProfilePage() {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [nome, setNome] = useState(user?.nome || '');
  const [email, setEmail] = useState(user?.email || '');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  
  // Função para inicializar campos de endereço
  const initializeAddressFields = (userData: any) => {
    console.log('Inicializando campos de endereço com os dados:', userData);
    
    // Verificação adicional para debug
    if (userData.addresses) {
      console.log('Array de endereços:', Array.isArray(userData.addresses) ? `Array com ${userData.addresses.length} item(s)` : 'Não é um array');
    } else {
      console.log('Nenhum endereço encontrado em userData.addresses');
    }
    
    if (userData.addresses?.length > 0) {
      const enderecoPrincipal = userData.addresses[0];
      console.log('Usando endereço do objeto addresses:', enderecoPrincipal);
      
      setRua(enderecoPrincipal.rua || '');
      setNumero(enderecoPrincipal.numero || '');
      setComplemento(enderecoPrincipal.complemento || '');
      setBairro(enderecoPrincipal.bairro || '');
      setCidade(enderecoPrincipal.cidade || '');
      setEstado(enderecoPrincipal.estado || '');
        // Garante que o CEP esteja formatado corretamente
      if (enderecoPrincipal.cep) {
        const cepFormatado = formatCep(enderecoPrincipal.cep);
        setCep(cepFormatado);
        console.log('CEP formatado:', cepFormatado);
      } else {
        setCep('');
        console.log('CEP não encontrado no endereço');
      }
    } else if (userData.endereco) {
      // Tenta extrair informações do endereço formatado no formato: "Rua, Número - Complemento, Bairro, Cidade/Estado - CEP: 00000-000"
      try {
        const enderecoRegex = /^(.+?),\s*(\d+)(?:\s*-\s*(.+?))?,\s*(.+?),\s*(.+?)\/(\w{2})\s*-\s*CEP:\s*(\d{5}-?\d{3})$/;
        const match = userData.endereco.match(enderecoRegex);
        
        if (match) {
          setRua(match[1].trim());
          setNumero(match[2].trim());
          setComplemento(match[3]?.trim() || '');
          setBairro(match[4].trim());
          setCidade(match[5].trim());
          setEstado(match[6].trim());
          setCep(match[7].trim());
        } else {
          // Se o regex não funcionar, limpa os campos
          setRua('');
          setNumero('');
          setComplemento('');
          setBairro('');
          setCidade('');
          setEstado('');
          setCep('');
        }
      } catch (error) {
        console.error('Erro ao processar endereço:', error);
        // Em caso de erro, limpa os campos
        setRua('');
        setNumero('');
        setComplemento('');
        setBairro('');
        setCidade('');
        setEstado('');
        setCep('');
      }
    }
  };

  // Efeito para inicializar campos quando o usuário é carregado
  useEffect(() => {
    if (user) {
      initializeAddressFields(user);
    }
  }, [user]);
  const formatCep = (value: string | null | undefined) => {
    if (!value) return '';
    
    // Garantir que value é uma string
    const strValue = String(value);
    const numbers = strValue.replace(/\D/g, '');
    
    // Pega apenas os primeiros 8 dígitos caso tenha mais
    const cepOito = numbers.substring(0, 8);
    
    // Garantir que só formatamos se tivermos 8 dígitos
    if (cepOito.length !== 8) return cepOito;
    
    return cepOito.replace(/(\d{5})(\d{3})/, '$1-$2');
  };
  
  // Função para debug de objetos circulares
  const safeStringify = (obj: any, indent = 2) => {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return '[Circular]';
        cache.add(value);
      }
      return value;
    }, indent);
  };
  
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    
    // Limita o CEP a 8 dígitos
    if (rawValue.length > 8) return;
    
    // Formata o CEP enquanto digita
    if (rawValue.length > 5) {
      setCep(`${rawValue.slice(0, 5)}-${rawValue.slice(5)}`);
    } else {
      setCep(rawValue);
    }

    // Se o CEP estiver completo, busca automaticamente
    if (rawValue.length === 8) {
      handleCepBlur({ target: { value: rawValue } } as React.FocusEvent<HTMLInputElement>);
    }
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cepValue = e.target.value.replace(/\D/g, '');
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
      if (!user?.tipo) {
        setError('Seu perfil ainda não está completo. Faça logout e entre novamente após o cadastro ser finalizado pelo administrador.');
        return;
      }
      const endpoint = `/api/${user.tipo}/profile`;

      // Validação dos campos obrigatórios
      if (!nome?.trim()) {
        setError('O nome é obrigatório');
        return;
      }

      // Validação do endereço
      const hasPartialAddress = [rua, numero, bairro, cidade, estado, cep].some(field => field?.trim());
      const hasAllAddressFields = [rua, numero, bairro, cidade, estado, cep].every(field => field?.trim());
      
      if (hasPartialAddress && !hasAllAddressFields) {
        setError('Todos os campos do endereço são obrigatórios');
        return;
      }

      // Prepara os dados do usuário
      const userData = {
        nome: nome.trim(),
        ...(email && email.trim() !== '' && { email }),
        ...(telefone && telefone.trim() !== '' && { telefone }),
        ...(avatarUrl && avatarUrl.trim() !== '' && { avatarUrl })
      };
      
      // Validação adicional do CEP
      const cepNumeros = cep ? cep.replace(/\D/g, '') : '';
      if (hasAllAddressFields && cepNumeros.length !== 8) {
        setError('CEP inválido. Use o formato: 00000-000');
        return;
      }
        // Prepara os dados do endereço se todos os campos obrigatórios estiverem preenchidos
      const addressData = hasAllAddressFields ? {
        rua: rua.trim(),
        numero: numero.trim(),
        complemento: complemento?.trim() || null, // Envia null quando vazio para evitar strings vazias
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        estado: estado.trim(),
        cep: cepNumeros // Envia apenas os números e deixa o backend formatar
      } : undefined;
      
      console.log('Dados de endereço preparados para envio:', addressData);

      // Combina os dados para enviar
      const data = {
        ...userData,
        address: addressData
      };
      
      // Log para depuração
      console.log('Enviando dados para atualização:', JSON.stringify(data));

      setMsg('Salvando alterações...');

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      const responseData = await res.json();
      if (res.ok) {
        if (responseData.user) {
          setMsg('Perfil atualizado com sucesso!');
          
          console.log('Resposta do servidor após atualização:', responseData);
          console.log('Endereços retornados pelo servidor:', responseData.user.addresses);
          
          // Dispara evento para atualizar o usuário no contexto de autenticação
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: responseData }));
          setEditMode(false);

          // Atualiza os campos de endereço com os dados recebidos
          initializeAddressFields(responseData.user);          // Verifica se o endereço foi retornado corretamente
          console.log('Verificando endereços na resposta:', safeStringify(responseData.user));
          
          // Se não temos endereços ou se a lista está vazia
          if (!responseData.user.addresses || responseData.user.addresses.length === 0) {
            console.warn('Endereço não retornado pelo servidor após atualização');
            
            // Se temos um endereço formatado como string, vamos usá-lo como fallback
            if (responseData.user.endereco) {
              console.log('Usando endereço string como fallback:', responseData.user.endereco);
              initializeAddressFields(responseData.user);
            }
            
            // Tentar recarregar o perfil após um breve delay para buscar os endereços
            setTimeout(() => {
              console.log('Recarregando perfil para buscar endereços...');
              
              fetch(`/api/${user?.tipo}/profile`, {
                credentials: 'include'
              })
              .then(res => res.json())
              .then(data => {
                console.log('Perfil recarregado:', safeStringify(data));
                
                // Tenta encontrar endereços na resposta
                if (data.addresses && data.addresses.length > 0) {
                  console.log('Endereços encontrados na resposta recarregada:', data.addresses);
                  initializeAddressFields(data);
                } else {
                  console.warn('Endereços não encontrados na resposta recarregada');
                  
                  // Tenta buscar endereços como último recurso
                  fetch(`/api/${user?.tipo}/addresses`, {
                    credentials: 'include'
                  })
                  .then(res => res.json())
                  .then(addresses => {
                    console.log('Busca específica de endereços:', addresses);
                    if (addresses && addresses.length > 0) {
                      console.log('Endereços encontrados em busca específica:', addresses);
                      // Combina os dados do usuário com os endereços
                      initializeAddressFields({...data, addresses});
                    } else {
                      console.warn('Nenhum endereço encontrado em nenhuma tentativa');
                    }
                  })
                  .catch(err => console.error('Erro ao buscar endereços:', err));
                }
              })
              .catch(err => console.error('Erro ao recarregar perfil:', err));
            }, 500);
          }
        } else {
          setError('Resposta inválida do servidor');
        }
      } else {
        if (responseData.fields) {
          setError(`Campos obrigatórios faltando: ${responseData.fields.join(', ')}`);
        } else {
          setError(responseData.error || 'Erro ao atualizar perfil');
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError('Erro ao atualizar perfil. Por favor, tente novamente.');
    }
  };

  if (!user) return null;

  let tipoLabel = 'Usuário';
  if (user.tipo === 'cliente') tipoLabel = 'Cliente';
  else if (user.tipo === 'lojista') tipoLabel = 'Lojista';
  else if (user.tipo === 'admin') tipoLabel = 'Administrador';

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
                      onChange={handleCepChange}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {loadingCep && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-orange-500 animate-spin">
                        <FaSpinner />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Logradouro</label>
                  <input
                    className={theme.input + ' w-full'}
                    value={rua}
                    onChange={e => setRua(e.target.value)}
                    placeholder="Rua, Avenida, etc."
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
                    placeholder="Apto, Sala, etc."
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

                <div>
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
                {user?.telefone && (
                  <div className="text-gray-500 text-sm flex items-start gap-2 p-4 bg-gray-50 rounded-xl">
                    <FaPhone size={16} color="#f97316" /> 
                    <div>
                      <div className="font-semibold text-gray-600 mb-0.5">Telefone</div>
                      <div>{telefone}</div>
                    </div>
                  </div>
                )}
                
                <div className="text-gray-500 text-sm flex items-start gap-2 p-4 bg-gray-50 rounded-xl md:col-span-2">
                  <FaMapMarkerAlt size={16} color="#f97316" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-600 mb-0.5">Endereço</div>
                    {rua && rua.trim() !== '' ? (
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">
                            {rua}, {numero}
                            {complemento && complemento.trim() !== '' && <span className="text-gray-600"> • {complemento}</span>}
                          </div>
                          <div className="text-gray-600">
                            {bairro} • {cidade}/{estado}
                          </div>
                          <div className="text-sm text-orange-600 font-medium mt-1">
                            CEP: {formatCep(cep)}
                          </div>
                        </div>
                    ) : (
                      <div className="text-gray-400 italic">Nenhum endereço cadastrado</div>
                    )}
                  </div>
                </div>
              </div>

              {msg && <div className="text-green-500 text-center mt-4">{msg}</div>}
              {error && <div className="text-red-400 text-center mt-4">{error}</div>}

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
