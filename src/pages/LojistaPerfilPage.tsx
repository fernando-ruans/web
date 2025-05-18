import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import UploadImage from '../components/UploadImage';
import { FaStore, FaPhone, FaMapMarkerAlt, FaClock, FaMoneyBill, FaIdCard, FaEdit } from 'react-icons/fa';
import { buscarCEP, formatarEndereco } from '../utils/cepUtils';

interface Restaurant {
  id: number;
  nome: string;
  cnpj: string;
  cep: string;
  telefone: string;
  endereco: string;
  taxa_entrega: number;
  tempo_entrega: number;
  imagem: string;
  banner: string;
  aberto: boolean;
}

export default function LojistaPerfilPage() {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cep, setCep] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [taxaEntrega, setTaxaEntrega] = useState('');
  const [tempoEntrega, setTempoEntrega] = useState('');
  const [imagem, setImagem] = useState('');
  const [banner, setBanner] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  const fetchRestaurantData = async () => {
    try {
      const res = await fetch('/api/lojista/restaurants', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const rest = data[0]; // Pega o primeiro restaurante
          setRestaurant(rest);
          setNome(rest.nome);
          setCnpj(rest.cnpj);
          setCep(rest.cep || '');
          setTelefone(rest.telefone || '');
          setEndereco(rest.endereco || '');
          setTaxaEntrega(rest.taxa_entrega?.toString() || '');
          setTempoEntrega(rest.tempo_entrega?.toString() || '');
          setImagem(rest.imagem || '');
          setBanner(rest.banner || '');
        }
      }
    } catch (err) {
      setError('Erro ao carregar dados do restaurante');
    }
  };

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cepValue = e.target.value;
    if (cepValue.length === 8 || cepValue.length === 9) {
      setLoadingCep(true);
      try {
        const enderecoCep = await buscarCEP(cepValue);
        if (enderecoCep) {
          setEndereco(formatarEndereco(enderecoCep));
        }
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      const payload = {
        nome,
        cnpj,
        cep,
        telefone,
        endereco,
        taxa_entrega: Number(taxaEntrega),
        tempo_entrega: Number(tempoEntrega),
        imagem,
        banner
      };

      const endpoint = restaurant 
        ? `/api/lojista/restaurants/${restaurant.id}`
        : '/api/lojista/restaurants';

      const res = await fetch(endpoint, {
        method: restaurant ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const data = await res.json();
        setMsg('Dados do restaurante atualizados com sucesso!');
        setEditMode(false);
        await fetchRestaurantData(); // Recarregar os dados
      } else {
        const err = await res.json();
        setError(err.error || 'Erro ao atualizar dados do restaurante.');
      }
    } catch (err) {
      setError('Erro ao atualizar dados do restaurante.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`/api/lojista/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ nome, telefone, endereco })
      });
        if (res.ok) {
        const data = await res.json();
        if (data.msg && data.user) {
          setMsg(data.msg);
          // Dispara evento para atualizar o usuário no contexto de autenticação
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: data }));
          setEditMode(false);
        } else {
          setError('Resposta inválida do servidor');
        }
      } else {
        setError('Erro ao atualizar perfil');
      }
    } catch {
      setError('Erro ao atualizar perfil');
    }
  };

  const handleToggleOpen = async () => {
    try {
      if (!restaurant) return;
      const res = await fetch(`/api/lojista/restaurants/${restaurant.id}/toggle-open`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const updatedRestaurant = await res.json();
        setRestaurant(updatedRestaurant);
        setMsg(`Restaurante ${updatedRestaurant.aberto ? 'aberto' : 'fechado'} com sucesso!`);
      } else {
        setError('Erro ao alterar status do restaurante');
      }
    } catch (err) {
      setError('Erro ao alterar status do restaurante');
    }
  };

  if (!user) return null;

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center justify-center pb-24 sm:pb-32'}>
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 py-10">
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 border-t-4 border-orange-400 w-full">
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-2xl font-extrabold text-orange-500 mb-2 flex items-center gap-2">
              <FaStore size={24} /> Perfil do Restaurante
            </h2>

            {restaurant && (
              <>
                {editMode ? (
                  <form onSubmit={handleSave} className="w-full max-w-3xl">
                    <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden bg-gray-100">
                      {/* Banner com botão igual ao modo de exibição */}
                      <div className="relative w-full h-full">
                        <img
                          src={banner || '/banner-default.png'}
                          alt="Banner do restaurante"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <UploadImage 
                            label="Alterar banner" 
                            onUpload={setBanner} 
                            buttonClassName="bg-white/90 backdrop-blur-sm text-orange-300 px-4 py-2 rounded-lg font-semibold shadow-lg"
                          />
                        </div>
                      </div>
                      {/* Container da logo centralizada */}
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-[120px] h-[120px] bg-white shadow-lg rounded-xl border-4 border-white flex items-center justify-center">
                          {imagem ? (
                            <div className="relative w-full h-full group">
                              <img
                                src={imagem}
                                alt="Logo do restaurante"
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-lg">
                                <UploadImage 
                                  label="Alterar logo" 
                                  onUpload={setImagem} 
                                  buttonClassName="bg-white/90 backdrop-blur-sm text-orange-300 px-4 py-2 rounded-lg font-semibold shadow-lg"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <UploadImage 
                                label="Alterar logo" 
                                onUpload={setImagem} 
                                buttonClassName="bg-white/90 backdrop-blur-sm text-orange-300 px-4 py-2 rounded-lg font-semibold shadow-lg"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaStore size={20} color="#f97316" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Nome do Restaurante</p>
                          <input
                            className="w-full bg-transparent text-lg font-semibold text-gray-900 focus:outline-none"
                            placeholder="Nome do restaurante"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaIdCard size={20} color="#f97316" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">CNPJ</p>
                          <input
                            className="w-full bg-transparent text-lg font-semibold text-gray-900 focus:outline-none"
                            placeholder="CNPJ"
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaMapMarkerAlt size={20} color="#f97316" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">CEP</p>
                          <input
                            className="w-full bg-transparent text-lg font-semibold text-gray-900 focus:outline-none"
                            placeholder="CEP"
                            value={cep}
                            onChange={(e) => setCep(e.target.value)}
                            onBlur={handleCepBlur}
                          />
                          {loadingCep && <div className="text-sm text-orange-500">Buscando CEP...</div>}
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaPhone size={20} color="#f97316" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Telefone</p>
                          <input
                            className="w-full bg-transparent text-lg font-semibold text-gray-900 focus:outline-none"
                            placeholder="Telefone"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3 md:col-span-2">
                        <FaMapMarkerAlt size={20} color="#f97316" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Endereço</p>
                          <input
                            className="w-full bg-transparent text-lg font-semibold text-gray-900 focus:outline-none"
                            placeholder="Endereço completo"
                            value={endereco}
                            onChange={(e) => setEndereco(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaMoneyBill size={20} color="#f97316" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Taxa de Entrega</p>
                          <input
                            className="w-full bg-transparent text-lg font-semibold text-gray-900 focus:outline-none"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Taxa de entrega"
                            value={taxaEntrega}
                            onChange={(e) => setTaxaEntrega(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaClock size={20} color="#f97316" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">Tempo de Entrega</p>
                          <input
                            className="w-full bg-transparent text-lg font-semibold text-gray-900 focus:outline-none"
                            type="number"
                            min="1"
                            placeholder="Tempo em minutos"
                            value={tempoEntrega}
                            onChange={(e) => setTempoEntrega(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {msg && <div className="text-green-500 text-center mt-4">{msg}</div>}
                    {error && <div className="text-red-400 text-center mt-4">{error}</div>}

                    <div className="flex gap-4 justify-end mt-8">
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold"
                      >
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="w-full max-w-3xl">
                    {/* Header com Banner e Logo */}
                    <div className="relative w-full h-48 mb-8 rounded-xl overflow-hidden bg-gray-100">
                      {/* Banner apenas imagem, sem botão */}
                      <div className="relative w-full h-full">
                        <img
                          src={banner || '/banner-default.png'}
                          alt="Banner do restaurante"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Container da logo centralizada */}
                      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-[120px] h-[120px] bg-white shadow-lg rounded-xl border-4 border-white flex items-center justify-center">
                          {imagem ? (
                            <img
                              src={imagem}
                              alt="Logo do restaurante"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Informações do Restaurante em Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaStore size={20} color="#f97316" />
                        <div>
                          <p className="text-sm text-gray-600">Nome do Restaurante</p>
                          <p className="text-lg font-semibold text-gray-900">{nome}</p>
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaIdCard size={20} color="#f97316" />
                        <div>
                          <p className="text-sm text-gray-600">CNPJ</p>
                          <p className="text-lg font-semibold text-gray-900">{cnpj}</p>
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaMapMarkerAlt size={20} color="#f97316" />
                        <div>
                          <p className="text-sm text-gray-600">CEP</p>
                          <p className="text-lg font-semibold text-gray-900">{cep}</p>
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaPhone size={20} color="#f97316" />
                        <div>
                          <p className="text-sm text-gray-600">Telefone</p>
                          <p className="text-lg font-semibold text-gray-900">{telefone || '-'}</p>
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3 md:col-span-2">
                        <FaMapMarkerAlt size={20} color="#f97316" />
                        <div>
                          <p className="text-sm text-gray-600">Endereço</p>
                          <p className="text-lg font-semibold text-gray-900">{endereco || '-'}</p>
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaMoneyBill size={20} color="#f97316" />
                        <div>
                          <p className="text-sm text-gray-600">Taxa de Entrega</p>
                          <p className="text-lg font-semibold text-gray-900">R$ {Number(taxaEntrega).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                        <FaClock size={20} color="#f97316" />
                        <div>
                          <p className="text-sm text-gray-600">Tempo de Entrega</p>
                          <p className="text-lg font-semibold text-gray-900">{tempoEntrega} minutos</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={() => setEditMode(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
                      >
                        <FaEdit /> Editar Dados
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {!restaurant && (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg mb-4">Você ainda não cadastrou seu restaurante</p>
                <button
                  onClick={() => setEditMode(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Cadastrar Restaurante
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
