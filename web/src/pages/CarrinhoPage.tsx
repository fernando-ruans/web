import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import theme from '../theme';
import { FaSpinner, FaMapMarkerAlt, FaPhoneAlt, FaBuilding, FaHashtag, FaHome, FaBarcode } from 'react-icons/fa';

interface Address {
  id: number;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  complemento?: string;
  cep: string;
}

export default function CarrinhoPage() {
  const { items, removeItem, clearCart, getTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number>();  const [observacao, setObservacao] = useState('');
  const [taxaEntrega, setTaxaEntrega] = useState(0);
  const [novoCep, setNovoCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingNovoEndereco, setLoadingNovoEndereco] = useState(false);
  const [novoEndereco, setNovoEndereco] = useState({
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    complemento: '',
    cep: ''
  });

  // Carrega endereços do usuário
  useEffect(() => {
    if (user) {
      fetch('/api/cliente/addresses', {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          setAddresses(data);
          if (data.length > 0) {
            setSelectedAddressId(data[0].id);
          }
        })
        .catch(() => setError('Erro ao carregar endereços'));
    }
  }, [user]);

  // Carrega taxa de entrega do restaurante quando tiver itens no carrinho
  useEffect(() => {
    if (items.length > 0) {
      fetch(`/api/cliente/restaurants/${items[0].restauranteId}`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          setTaxaEntrega(data.taxa_entrega || 0);
        })
        .catch(() => setError('Erro ao carregar taxa de entrega'));
    }
  }, [items]);

  const finalizarPedido = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!selectedAddressId) {
      setError('Selecione um endereço de entrega');
      return;
    }

    if (items.length === 0) {
      setError('Adicione itens ao carrinho');
      return;
    }

    setLoading(true);
    setError('');    try {      const pedido = {
        restaurantId: items[0].restauranteId,
        addressId: selectedAddressId,
        observacao: observacao || undefined,
        items: items.map(item => ({
            productId: item.id,
            quantidade: item.quantidade,
            preco_unitario: item.preco,
            adicionais: item.adicionais?.map(a => ({
              adicionalId: a.adicionalId, // Usando o campo correto adicionalId
              quantidade: a.quantidade,
              preco: a.preco // Corrigido: era preco_unitario, agora é preco
            }))
          }))
      };

      const res = await fetch('/api/cliente/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pedido)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao finalizar pedido');
      }

      clearCart();
      navigate('/pedidos');
    } catch (err: any) {
      setError(err.message || 'Erro ao finalizar pedido');
    } finally {
      setLoading(false);
    }
  };
  // Função para buscar CEP
  const handleCepBlur = async () => {
    if (novoCep.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${novoCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setNovoEndereco({
            ...novoEndereco,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            cep: novoCep
          });
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  // Função para salvar novo endereço
  const handleNovoEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingNovoEndereco(true);
    setError('');

    try {
      const res = await fetch('/api/cliente/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...novoEndereco,
          cep: novoCep
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao cadastrar endereço');
      }

      const novoEnd = await res.json();
      setAddresses([...addresses, novoEnd]);
      setSelectedAddressId(novoEnd.id);
      
      // Limpa o formulário
      setNovoCep('');
      setNovoEndereco({
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        complemento: '',
        cep: ''
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar endereço');
    } finally {
      setLoadingNovoEndereco(false);
    }
  };

  const subtotal = getTotal();
  const total = subtotal + taxaEntrega;

  return (
    <div className="min-h-screen pb-24 sm:pb-32 max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-orange-500 mb-6">Seu Carrinho</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-gray-500 text-center">Seu carrinho está vazio.</div>
      ) : (
        <>
          <ul className="divide-y divide-orange-100 mb-6">
            {items.map(item => (
              <li key={item.id} className="py-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    {item.imagem && (
                      <img
                        src={item.imagem}
                        alt={item.nome}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{item.nome}</h3>
                      <div className="text-orange-600">
                        Quantidade: {item.quantidade} × R$ {item.preco.toFixed(2)}
                      </div>
                      {item.adicionais && item.adicionais.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-semibold text-gray-600">Adicionais:</div>
                          <ul className="text-sm text-gray-500">
                            {item.adicionais.map((adicional, index) => (
                              <li key={index}>
                                {adicional.nome} ({adicional.quantidade}x) - R$ {(adicional.preco * adicional.quantidade).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 mb-2">
                      R$ {(
                        item.preco * item.quantidade + 
                        (item.adicionais?.reduce((total, a) => total + (a.preco * a.quantidade), 0) || 0)
                      ).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Endereço de Entrega</h2>
              {addresses.length === 0 ? (              <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                <h3 className="font-bold text-lg text-orange-600 mb-6 flex items-center gap-2">                  <div className="text-orange-500">
                    <FaMapMarkerAlt />
                  </div>
                  Cadastrar novo endereço
                </h3>
                <form onSubmit={handleNovoEndereco} className="space-y-4">
                  <div className="relative">
                    <div className="flex items-center mb-2">                        <div className="text-orange-400 mr-2">
                          <FaBarcode />
                        </div>
                      <label className="text-sm font-semibold text-gray-600">CEP</label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={novoCep}
                        onChange={(e) => setNovoCep(e.target.value.replace(/\D/g, ''))}
                        onBlur={handleCepBlur}
                        placeholder="00000-000"
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                        maxLength={8}
                        required
                      />
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <span className="text-gray-400">#</span>
                      </div>
                    </div>
                    {loadingCep && (
                      <div className="flex items-center gap-2 text-sm text-orange-500 mt-1">                        <div className="animate-spin">
                          <FaSpinner size={14} />
                        </div>
                        <span>Buscando endereço...</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center mb-2">                      <div className="text-orange-400 mr-2">
                        <FaHome />
                      </div>
                      <label className="text-sm font-semibold text-gray-600">Logradouro</label>
                    </div>
                    <input
                      type="text"
                      value={novoEndereco.rua}
                      onChange={(e) => setNovoEndereco({...novoEndereco, rua: e.target.value})}
                      placeholder="Nome da rua"
                      className="w-full px-4 py-2 border rounded-lg focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center mb-2">                        <div className="text-orange-400 mr-2">
                          <FaHashtag />
                        </div>
                        <label className="text-sm font-semibold text-gray-600">Número</label>
                      </div>
                      <input
                        type="text"
                        value={novoEndereco.numero}
                        onChange={(e) => setNovoEndereco({...novoEndereco, numero: e.target.value})}
                        placeholder="123"
                        className="w-full px-4 py-2 border rounded-lg focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center mb-2">                        <div className="text-orange-400 mr-2">
                          <FaHome />
                        </div>
                        <label className="text-sm font-semibold text-gray-600">Complemento</label>
                      </div>
                      <input
                        type="text"
                        value={novoEndereco.complemento}
                        onChange={(e) => setNovoEndereco({...novoEndereco, complemento: e.target.value})}
                        placeholder="Apto 101"
                        className="w-full px-4 py-2 border rounded-lg focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center mb-2">                        <div className="text-orange-400 mr-2">
                          <FaMapMarkerAlt />
                        </div>
                        <label className="text-sm font-semibold text-gray-600">Bairro</label>
                      </div>
                      <input
                        type="text"
                        value={novoEndereco.bairro}
                        onChange={(e) => setNovoEndereco({...novoEndereco, bairro: e.target.value})}
                        placeholder="Seu bairro"
                        className="w-full px-4 py-2 border rounded-lg focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center mb-2">                        <div className="text-orange-400 mr-2">
                          <FaBuilding />
                        </div>
                        <label className="text-sm font-semibold text-gray-600">Cidade</label>
                      </div>
                      <input
                        type="text"
                        value={novoEndereco.cidade}
                        onChange={(e) => setNovoEndereco({...novoEndereco, cidade: e.target.value})}
                        placeholder="Sua cidade"
                        className="w-full px-4 py-2 border rounded-lg focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className={`${theme.primary} w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors mt-6`}
                    disabled={loadingNovoEndereco}
                  >
                    {loadingNovoEndereco ? (
                      <>                        <div className="animate-spin">
                          <FaSpinner />
                        </div>
                        <span>Salvando endereço...</span>
                      </>
                    ) : (
                      <>                        <div>
                          <FaMapMarkerAlt />
                        </div>
                        <span>Salvar endereço</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (              <div className="space-y-3">
                {addresses.map(address => (
                  <div 
                    key={address.id}
                    className={`p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      selectedAddressId === address.id 
                        ? 'border-orange-400 bg-orange-50' 
                        : 'border-gray-200 hover:border-orange-200'
                    }`}
                    onClick={() => setSelectedAddressId(address.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${selectedAddressId === address.id ? 'text-orange-500' : 'text-gray-400'}`}>
                        <FaMapMarkerAlt size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{address.rua}, {address.numero}</p>
                        {address.complemento && (
                          <p className="text-sm text-gray-600">Complemento: {address.complemento}</p>
                        )}
                        <p className="text-sm text-gray-600">{address.bairro}</p>
                        <p className="text-sm text-gray-600">{address.cidade} - CEP: {address.cep}</p>
                      </div>
                      <div className="flex items-center justify-center w-6 h-6">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedAddressId === address.id 
                            ? 'border-orange-500 bg-orange-500' 
                            : 'border-gray-300'
                        }`}>
                          {selectedAddressId === address.id && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Observações</h2>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Alguma observação para o restaurante?"
              className="w-full p-2 border rounded focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              rows={3}
            />
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Taxa de entrega:</span>
              <span className="font-bold">R$ {taxaEntrega.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-green-600 text-xl">R$ {total.toFixed(2)}</span>
            </div>
            
            <button
              className={`${theme.primary} w-full font-bold py-3 rounded mt-4 flex items-center justify-center gap-2 disabled:opacity-50`}
              onClick={finalizarPedido}
              disabled={loading || addresses.length === 0}
            >                      {loading ? (
                <>
                  <div className="animate-spin">
                    <FaSpinner size={18} />
                  </div>
                  Processando...
                </>
              ) : (
                'Finalizar Pedido'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
