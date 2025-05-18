import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import theme from '../theme';
import UploadImage from '../components/UploadImage';
import { FaStore, FaPhone, FaMapMarkerAlt, FaClock, FaMoneyBill, FaIdCard } from 'react-icons/fa';
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

  if (!user) return null;

  return (
    <div className={theme.bg + ' min-h-screen flex flex-col items-center justify-center pb-24 sm:pb-32'}>
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6 py-10">
        <div className="bg-white/90 rounded-2xl shadow-lg p-8 border-t-4 border-orange-400 w-full flex flex-col items-center gap-6">          <h2 className="text-2xl font-extrabold text-orange-500 mb-2 flex items-center gap-2">
            <FaStore size={24} color="#f97316" /> Perfil do Restaurante
          </h2>
          
          {/* Imagem do Restaurante */}
          <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center text-4xl font-bold text-orange-400 relative overflow-hidden border-4 border-orange-200">
            {imagem ? (
              <img src={imagem} alt={nome} className="w-full h-full object-cover" />
            ) : (
              <FaStore size={48} />
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <input className={theme.input} placeholder="Nome do Restaurante" value={nome} onChange={e => setNome(e.target.value)} required />
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <input 
                    className={theme.input + ' w-full'} 
                    placeholder="CEP (apenas números)" 
                    value={cep} 
                    onChange={e => setCep(e.target.value.replace(/\D/g, ''))} 
                    onBlur={handleCepBlur}
                    maxLength={8}
                    required 
                  />
                  {loadingCep && <div className="text-sm text-gray-500 mt-1">Buscando CEP...</div>}
                </div>
                <input className={theme.input + ' w-full flex-1'} placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
              </div>
              <input className={theme.input} placeholder="CNPJ (opcional)" value={cnpj} onChange={e => setCnpj(e.target.value)} />
              <input 
                className={theme.input} 
                placeholder="Endereço completo" 
                value={endereco} 
                onChange={e => setEndereco(e.target.value)} 
                required 
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <input className={theme.input} type="number" min="0" step="0.01" placeholder="Taxa de entrega" value={taxaEntrega} onChange={e => setTaxaEntrega(e.target.value)} required />
                <input className={theme.input} type="number" min="1" placeholder="Tempo de entrega (min)" value={tempoEntrega} onChange={e => setTempoEntrega(e.target.value)} required />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1"><UploadImage label="Banner do restaurante" onUpload={setBanner} /></div>
                <div className="flex-1"><UploadImage label="Logo do restaurante" onUpload={setImagem} /></div>
              </div>
              {msg && <div className="text-green-500 text-center">{msg}</div>}
              {error && <div className="text-red-500 text-center">{error}</div>}
              
              <div className="flex gap-2">
                <button type="submit" className={theme.primary + ' flex-1'}>Salvar</button>
                <button type="button" className={theme.secondary + ' flex-1'} onClick={() => setEditMode(false)}>Cancelar</button>
              </div>
            </form>
          ) : (
            <div className="w-full max-w-md">
              {restaurant ? (
                <div className="grid gap-4">                  <div className="flex items-center gap-2">
                    <FaStore size={20} color="#f97316" />
                    <div>
                      <div className="text-sm text-gray-500">Nome do Restaurante</div>
                      <div className="text-lg text-gray-700">{nome}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FaIdCard size={20} color="#f97316" />
                    <div>
                      <div className="text-sm text-gray-500">CNPJ</div>
                      <div className="text-lg text-gray-700">{cnpj}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt size={20} color="#f97316" />
                    <div>
                      <div className="text-sm text-gray-500">CEP</div>
                      <div className="text-lg text-gray-700">{cep}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FaPhone size={20} color="#f97316" />
                    <div>
                      <div className="text-sm text-gray-500">Telefone</div>
                      <div className="text-lg text-gray-700">{telefone || '-'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt size={20} color="#f97316" />
                    <div>
                      <div className="text-sm text-gray-500">Endereço</div>
                      <div className="text-lg text-gray-700">{endereco || '-'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FaMoneyBill size={20} color="#f97316" />
                    <div>
                      <div className="text-sm text-gray-500">Taxa de Entrega</div>
                      <div className="text-lg text-gray-700">R$ {Number(taxaEntrega).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FaClock size={20} color="#f97316" />
                    <div>
                      <div className="text-sm text-gray-500">Tempo de Entrega</div>
                      <div className="text-lg text-gray-700">{tempoEntrega} minutos</div>
                    </div>
                  </div>

                  {banner && (
                    <div className="mt-4">
                      <div className="text-sm text-gray-500 mb-2">Banner do Restaurante</div>
                      <img src={banner} alt="Banner" className="w-full h-48 object-cover rounded-lg" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  Você ainda não cadastrou seu restaurante
                </div>
              )}

              <button 
                onClick={() => setEditMode(true)}
                className={theme.primary + ' w-full mt-6'}
              >
                {restaurant ? 'Editar Dados do Restaurante' : 'Cadastrar Restaurante'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
