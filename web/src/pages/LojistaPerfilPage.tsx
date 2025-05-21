import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';
import { FaMapMarkerAlt, FaPhoneAlt, FaClock, FaMoneyBill, FaCamera } from 'react-icons/fa';
import UploadImage from '../components/UploadImage';
import { formatarEndereco } from '../utils/cepUtils';

interface Restaurant {
  id: number;
  nome: string;
  cep?: string;
  telefone?: string;
  endereco?: string;
  taxa_entrega?: number;
  tempo_entrega?: number;
  imagem?: string;
  banner?: string;
  aberto: boolean;
}

export default function LojistaPerfilPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [editMode, setEditMode] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [nome, setNome] = useState('');
  const [cep, setCep] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [taxa_entrega, setTaxaEntrega] = useState('');
  const [tempo_entrega, setTempoEntrega] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchRestaurantData = async () => {
    try {
      const res = await fetch('/api/lojista/restaurants', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setRestaurant(data[0]);
          // Preenche os campos do formulário
          setNome(data[0].nome || '');
          setCep(data[0].cep || '');
          setTelefone(data[0].telefone || '');
          setEndereco(data[0].endereco || '');
          setTaxaEntrega(data[0].taxa_entrega?.toString() || '');
          setTempoEntrega(data[0].tempo_entrega?.toString() || '');
        }
      }
    } catch (err) {
      setError('Erro ao carregar dados do restaurante');
    } finally {
      setLoadingRestaurant(false);
    }
  };

  useEffect(() => {
    async function init() {
      if (!loading) {
        if (!user) {
          navigate('/login');
          return;
        }
        if (user.tipo !== 'lojista') {
          navigate('/');
          return;
        }
        await fetchRestaurantData();
      }
    }
    init();
  }, [user, navigate, loading]);

  const handleUpdateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!restaurant) return;

      const res = await fetch(`/api/lojista/restaurants/${restaurant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          nome,
          cep,
          telefone,
          endereco,
          taxa_entrega: parseFloat(taxa_entrega),
          tempo_entrega: parseInt(tempo_entrega)
        })
      });

      if (res.ok) {
        const updatedRestaurant = await res.json();
        setRestaurant(updatedRestaurant);
        setMsg('Dados do restaurante atualizados com sucesso!');
        setEditMode(false);
      } else {
        setError('Erro ao atualizar dados do restaurante');
      }
    } catch (err) {
      setError('Erro ao atualizar dados do restaurante');
    }
  };

  const handleToggleOpen = async () => {
    try {
      if (!restaurant) return;
      
      const res = await fetch(`/api/lojista/restaurants/${restaurant.id}/toggle-open`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
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
      <div className="w-full max-w-7xl px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {loadingRestaurant ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando...</p>
            </div>
          ) : restaurant ? (
            <>
              {msg && <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">{msg}</div>}
              {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

              <div className="flex justify-between items-start mb-8">
                <h1 className="text-3xl font-bold text-gray-800">{restaurant.nome}</h1>
                <button
                  onClick={handleToggleOpen}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    restaurant.aberto
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {restaurant.aberto ? 'Fechar Restaurante' : 'Abrir Restaurante'}
                </button>
              </div>

              {editMode ? (
                <form onSubmit={handleUpdateRestaurant} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome</label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Telefone</label>
                      <input
                        type="text"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Taxa de Entrega</label>
                      <input
                        type="number"
                        step="0.01"
                        value={taxa_entrega}
                        onChange={(e) => setTaxaEntrega(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tempo de Entrega (min)</label>
                      <input
                        type="number"
                        value={tempo_entrega}
                        onChange={(e) => setTempoEntrega(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">CEP</label>
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Endereço</label>
                      <input
                        type="text"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                      <FaPhoneAlt size={20} color="#f97316" />
                      <div>
                        <p className="text-sm text-gray-600">Telefone</p>
                        <p className="font-semibold">{restaurant.telefone || 'Não informado'}</p>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                      <FaMapMarkerAlt size={20} color="#f97316" />
                      <div>
                        <p className="text-sm text-gray-600">Endereço</p>
                        <p className="font-semibold">{restaurant.endereco || 'Não informado'}</p>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                      <FaMoneyBill size={20} color="#f97316" />
                      <div>
                        <p className="text-sm text-gray-600">Taxa de Entrega</p>
                        <p className="font-semibold">
                          R$ {restaurant.taxa_entrega?.toFixed(2) || '0,00'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-xl flex items-start gap-3">
                      <FaClock size={20} color="#f97316" />
                      <div>
                        <p className="text-sm text-gray-600">Tempo de Entrega</p>
                        <p className="font-semibold">
                          {restaurant.tempo_entrega || '0'} minutos
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setEditMode(true)}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                    >
                      Editar Dados
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
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
  );
}
