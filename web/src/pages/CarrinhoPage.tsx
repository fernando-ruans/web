import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import theme from '../theme';
import { FaSpinner, FaMapMarkerAlt, FaPhoneAlt, FaBuilding, FaHashtag, FaHome, FaBarcode, FaShoppingCart } from 'react-icons/fa';
import { FaMoneyBillWave, FaCreditCard, FaPix, FaRegCreditCard } from 'react-icons/fa6';

interface Address {
  id: number;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string; // <-- Adicionado campo estado
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
  const [selectedAddressId, setSelectedAddressId] = useState<number>();  
  const [observacao, setObservacao] = useState('');
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
  const [formaPagamento, setFormaPagamento] = useState<string>('');
  const [trocoPara, setTrocoPara] = useState<string>('');
  const [editandoEnderecoId, setEditandoEnderecoId] = useState<number|null>(null);
  const [enderecoEdicao, setEnderecoEdicao] = useState<Partial<Address>>({});
  const [loadingEdicaoEndereco, setLoadingEdicaoEndereco] = useState(false);

  // Número do WhatsApp do estabelecimento (ajuste conforme necessário)
  const WHATSAPP_NUMBER = '5599999999999'; // Exemplo: 55 + DDD + número

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

    if (!formaPagamento) {
      setError('Selecione a forma de pagamento');
      return;
    }

    if (formaPagamento === 'dinheiro' && (!trocoPara || isNaN(Number(trocoPara)) || Number(trocoPara) < total)) {
      setError('Informe um valor válido para troco (maior ou igual ao total)');
      return;
    }

    setLoading(true);
    setError('');    
    try {      
      // Monta o objeto pedido apenas com os campos aceitos pelo backend
      const pedido = {
        restaurantId: items[0].restauranteId,
        addressId: selectedAddressId,
        observacao: observacao || undefined,
        formaPagamento, // <-- já enviado
        trocoPara: formaPagamento === 'dinheiro' ? Number(trocoPara) : null, // <-- Envia trocoPara se for dinheiro
        items: items.map(item => ({
            productId: item.id,
            quantidade: item.quantidade,
            preco_unitario: item.preco,
            adicionais: item.adicionais?.map(a => ({
              adicionalId: a.adicionalId, // Usando o campo correto adicionalId
              quantidade: a.quantidade,
              preco: a.preco // Corrigido: era preco_unitario, agora é preco
            }))
          })),
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

  // Função para iniciar edição
  const iniciarEdicaoEndereco = (address: Address) => {
    setEditandoEnderecoId(address.id);
    setEnderecoEdicao({ ...address });
  };

  // Função para salvar edição
  const salvarEdicaoEndereco = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editandoEnderecoId) return;
    setLoadingEdicaoEndereco(true);
    setError('');
    try {
      // Remove os campos id e userId (se existirem) antes de enviar para o backend
      const enderecoSemIdUserId = { ...enderecoEdicao };
      delete (enderecoSemIdUserId as any).id;
      delete (enderecoSemIdUserId as any).userId;
      const res = await fetch(`/api/cliente/addresses/${editandoEnderecoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(enderecoSemIdUserId)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao editar endereço');
      }
      // Atualiza lista de endereços
      const atualizado = await res.json();
      setAddresses(addresses.map(a => a.id === atualizado.id ? atualizado : a));
      setEditandoEnderecoId(null);
      setEnderecoEdicao({});
    } catch (err: any) {
      setError(err.message || 'Erro ao editar endereço');
    } finally {
      setLoadingEdicaoEndereco(false);
    }
  };  // Função para gerar mensagem do pedido para o WhatsApp
  function gerarMensagemWhatsapp() {
    const endereco = addresses.find(a => a.id === selectedAddressId);
    let msg = `*NOVO PEDIDO DELIVERYX*\n\n`;
    msg += `*Cliente:* ${user?.nome || ''}\n`;
    if (endereco) {
      msg += `*ENDERECO DE ENTREGA:*\n`;
      msg += `${endereco.rua}, ${endereco.numero}${endereco.complemento ? ' - ' + endereco.complemento : ''}\n`;
      msg += `${endereco.bairro}, ${endereco.cidade} - ${endereco.estado}\n`;
      msg += `CEP: ${endereco.cep}\n`;
    }
    msg += `\n*ITENS DO PEDIDO:*\n`;
    items.forEach((item, idx) => {
      msg += `• ${item.quantidade}x ${item.nome}`;
      if (item.adicionais && item.adicionais.length > 0) {
        msg += `\n  + Adicionais: ${item.adicionais.map(a => a.nome).join(', ')}`;
      }
      msg += `\n`;
    });
    
    msg += `\n*RESUMO FINANCEIRO:*\n`;
    msg += `Subtotal: R$ ${getTotal().toFixed(2)}\n`;
    msg += `Taxa de entrega: R$ ${taxaEntrega.toFixed(2)}\n`;
    msg += `*TOTAL: R$ ${(getTotal() + taxaEntrega).toFixed(2)}*\n\n`;
    
    msg += `*Forma de Pagamento:* ${formaPagamento === 'dinheiro' ? 'Dinheiro' : formaPagamento === 'debito' ? 'Cartao de Debito' : formaPagamento === 'credito' ? 'Cartao de Credito' : formaPagamento === 'pix' ? 'PIX' : 'Nao informado'}`;
    
    if (formaPagamento === 'dinheiro' && trocoPara) {
      msg += `\nTroco para: R$ ${trocoPara}`;
    }
    if (observacao) {
      msg += `\n\n*OBSERVACOES:*\n"${observacao}"`;    }
    msg += `\n\n*Via DeliveryX*\n${new Date().toLocaleString('pt-BR')}`;
    
    // Retornar mensagem sem codificação para evitar dupla codificação
    return msg;
  }

  // Função para enviar pedido via WhatsApp
  function handleEnviarWhatsapp() {
    const msg = gerarMensagemWhatsapp();
    // Usar encodeURIComponent para codificar a mensagem
    const msgCodificada = encodeURIComponent(msg);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msgCodificada}`, '_blank');
  }

  const subtotal = getTotal();
  const total = subtotal + taxaEntrega;

  return (
    <div className={`${theme.bg} pb-24 sm:pb-32 min-h-screen flex flex-col items-center justify-start`}>  
      <div className="w-full max-w-2xl mx-auto p-4">
        <h1 className={`${theme.title} text-center mb-8`}>Seu Carrinho</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div style={{ marginBottom: 24, opacity: 0.8 }}>
              <FaShoppingCart size={96} color="#f97316" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-500 mb-6">Adicione produtos deliciosos e faça seu pedido!</p>
            <button
              className={`${theme.primary} px-6 py-3 rounded-lg font-bold text-lg shadow-md`}
              onClick={() => navigate('/restaurantes')}
            >Explorar Restaurantes</button>
          </div>
        ) : (
          <>            <ul className="divide-y divide-orange-100 mb-8">
              {items.map(item => (
                <li key={item.id} className="py-4">
                  <div className="flex flex-col gap-4 bg-white/90 rounded-xl shadow-lg p-4">
                    <div className="flex gap-3 sm:gap-4 items-start w-full">
                      {item.imagem && (
                        <img
                          src={item.imagem}
                          alt={item.nome}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shadow flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1">{item.nome}</h3>
                        <div className="text-orange-600 font-semibold mb-1 text-sm sm:text-base">
                          Quantidade: {item.quantidade} × R$ {item.preco.toFixed(2)}
                        </div>
                        {item.adicionais && item.adicionais.length > 0 && (
                          <div className="mt-1">
                            <div className="text-xs font-semibold text-gray-600">Adicionais:</div>
                            <ul className="text-xs text-gray-500">
                              {item.adicionais.map((adicional, index) => (
                                <li key={index}>
                                  {adicional.nome} ({adicional.quantidade}x) - R$ {(adicional.preco * adicional.quantidade).toFixed(2)}
                                </li>
                              ))}
                            </ul>
                          </div>                        )}
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                      <div className="font-bold text-green-600 text-base sm:text-lg">
                        R$ {(
                          item.preco * item.quantidade +
                          (item.adicionais?.reduce((total, a) => total + (a.preco * a.quantidade), 0) || 0)
                        ).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-white hover:bg-red-500 border border-red-200 px-3 py-2 sm:py-1 rounded-lg font-semibold transition-colors text-sm"
                      >Remover</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="bg-white/90 rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <FaMapMarkerAlt color="#f97316" /> Endereço de Entrega
              </h2>
              {addresses.length === 0 ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
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
                    </div>                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              ) : (
                <div className="space-y-3">
                  {addresses.map(address => (
                    <div 
                      key={address.id}
                      className={`p-4 rounded-lg border-2 transition-colors cursor-pointer flex items-center gap-3 ${
                        selectedAddressId === address.id 
                          ? 'border-orange-400 bg-orange-50' 
                          : 'border-gray-200 hover:border-orange-200'
                      }`}
                      onClick={() => setSelectedAddressId(address.id)}
                    >
                      <FaMapMarkerAlt size={20} color={selectedAddressId === address.id ? '#f97316' : '#9ca3af'} />
                      <div className="flex-1">                        {editandoEnderecoId === address.id ? (
                          <form onClick={e => e.stopPropagation()} onSubmit={salvarEdicaoEndereco} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input className="border rounded px-2 py-1 text-sm" value={enderecoEdicao.rua||''} onChange={e=>setEnderecoEdicao({...enderecoEdicao,rua:e.target.value})} placeholder="Rua" required />
                              <input className="border rounded px-2 py-1 text-sm" value={enderecoEdicao.numero||''} onChange={e=>setEnderecoEdicao({...enderecoEdicao,numero:e.target.value})} placeholder="Número" required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input className="border rounded px-2 py-1 text-sm" value={enderecoEdicao.bairro||''} onChange={e=>setEnderecoEdicao({...enderecoEdicao,bairro:e.target.value})} placeholder="Bairro" required />
                              <input className="border rounded px-2 py-1 text-sm" value={enderecoEdicao.cidade||''} onChange={e=>setEnderecoEdicao({...enderecoEdicao,cidade:e.target.value})} placeholder="Cidade" required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input className="border rounded px-2 py-1 text-sm" value={enderecoEdicao.estado||''} onChange={e=>setEnderecoEdicao({...enderecoEdicao,estado:e.target.value})} placeholder="Estado" required />
                              <input className="border rounded px-2 py-1 text-sm" value={enderecoEdicao.cep||''} onChange={e=>setEnderecoEdicao({...enderecoEdicao,cep:e.target.value})} placeholder="CEP" required />
                            </div>
                            <input className="border rounded px-2 py-1 w-full text-sm" value={enderecoEdicao.complemento||''} onChange={e=>setEnderecoEdicao({...enderecoEdicao,complemento:e.target.value})} placeholder="Complemento" />
                            <div className="flex flex-col sm:flex-row gap-2 mt-2">
                              <button type="submit" className="bg-green-500 text-white px-3 py-2 rounded text-sm font-medium" disabled={loadingEdicaoEndereco}>{loadingEdicaoEndereco?'Salvando...':'Salvar'}</button>
                              <button type="button" className="bg-gray-200 px-3 py-2 rounded text-sm font-medium" onClick={e=>{e.stopPropagation();setEditandoEnderecoId(null);}}>Cancelar</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-800">{address.rua}, {address.numero}</p>
                            {address.complemento && (
                              <p className="text-sm text-gray-600">Complemento: {address.complemento}</p>
                            )}
                            <p className="text-sm text-gray-600">{address.bairro}</p>
                            <p className="text-sm text-gray-600">{address.cidade} - CEP: {address.cep}</p>
                          </>
                        )}
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
                      {editandoEnderecoId !== address.id && (
                        <button type="button" className="ml-2 text-xs text-blue-600 underline hover:text-blue-800" onClick={e=>{e.stopPropagation();iniciarEdicaoEndereco(address);}}>Editar</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/90 rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-700 mb-4">Observações</h2>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Alguma observação para o restaurante?"
                className="w-full p-3 border rounded-lg focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                rows={3}
              />
            </div>            <div className="bg-white/90 rounded-xl shadow-lg p-4 sm:p-6 mb-8">
              <h2 className="text-base sm:text-lg font-bold text-gray-700 mb-4">Forma de Pagamento</h2>
              <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 mb-4">
                <label className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg border-2 font-semibold text-sm sm:text-base cursor-pointer transition-all duration-200 shadow-sm select-none text-center justify-center
                  ${formaPagamento === 'dinheiro' ? 'bg-orange-100 border-orange-500 text-orange-700 ring-2 ring-orange-200' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'}`}
                >
                  <input type="radio" className="hidden" name="pagamento" value="dinheiro" checked={formaPagamento === 'dinheiro'} onChange={() => setFormaPagamento('dinheiro')} />
                  <FaMoneyBillWave size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Dinheiro</span><span className="sm:hidden">💵</span>
                </label>
                <label className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg border-2 font-semibold text-sm sm:text-base cursor-pointer transition-all duration-200 shadow-sm select-none text-center justify-center
                  ${formaPagamento === 'debito' ? 'bg-orange-100 border-orange-500 text-orange-700 ring-2 ring-orange-200' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'}`}
                >
                  <input type="radio" className="hidden" name="pagamento" value="debito" checked={formaPagamento === 'debito'} onChange={() => setFormaPagamento('debito')} />
                  <FaRegCreditCard size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Débito</span><span className="sm:hidden">💳</span>
                </label>
                <label className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg border-2 font-semibold text-sm sm:text-base cursor-pointer transition-all duration-200 shadow-sm select-none text-center justify-center
                  ${formaPagamento === 'credito' ? 'bg-orange-100 border-orange-500 text-orange-700 ring-2 ring-orange-200' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'}`}
                >
                  <input type="radio" className="hidden" name="pagamento" value="credito" checked={formaPagamento === 'credito'} onChange={() => setFormaPagamento('credito')} />
                  <FaCreditCard size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Crédito</span><span className="sm:hidden">💴</span>
                </label>
                <label className={`flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg border-2 font-semibold text-sm sm:text-base cursor-pointer transition-all duration-200 shadow-sm select-none text-center justify-center
                  ${formaPagamento === 'pix' ? 'bg-orange-100 border-orange-500 text-orange-700 ring-2 ring-orange-200' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50'}`}
                >
                  <input type="radio" className="hidden" name="pagamento" value="pix" checked={formaPagamento === 'pix'} onChange={() => setFormaPagamento('pix')} />
                  <FaPix size={16} className="sm:w-[18px] sm:h-[18px]" /> <span className="hidden sm:inline">Pix</span><span className="sm:hidden">📱</span>
                </label>
              </div>
              {formaPagamento === 'dinheiro' && (
                <div className="mt-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Troco para quanto?</label>
                  <input
                    type="number"
                    min={total}
                    step="0.01"
                    className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:border-orange-500 focus:ring focus:ring-orange-200 focus:ring-opacity-50 text-lg font-semibold"
                    placeholder={`Ex: ${(total+5).toFixed(2)}`}
                    value={trocoPara}
                    onChange={e => setTrocoPara(e.target.value)}
                  />
                  <span className="text-xs text-gray-500">O entregador levará troco para o valor informado.</span>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-orange-100 via-yellow-50 to-orange-100 rounded-xl shadow-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-bold">R$ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Taxa de entrega:</span>
                <span className="font-bold">R$ {taxaEntrega.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-bold text-lg">Total:</span>
                <span className="font-bold text-green-600 text-2xl">R$ {total.toFixed(2)}</span>
              </div>
              <button
                className={`${theme.primary} w-full font-bold py-4 rounded-lg mt-6 flex items-center justify-center gap-2 text-lg shadow-md disabled:opacity-50`}
                onClick={finalizarPedido}
                disabled={loading || addresses.length === 0}
              >
                {loading ? (
                  <>
                    <div className="animate-spin">
                      <FaSpinner size={20} />
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
    </div>
  );
}
