import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import theme from '../theme';
import { FaMapMarkerAlt, FaPhone, FaClock, FaMoneyBill } from 'react-icons/fa';
import ProductDetailsModal from '../components/ProductDetailsModal';

interface Adicional {
  id: number;
  nome: string;
  preco: number;
  quantidadeMax: number;
}

interface Produto {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  ativo: boolean;
  adicionais?: Adicional[]; // Novo campo para adicionais
}

interface Categoria {
  id: number;
  nome: string;
  produtos: Produto[];
}

interface Restaurante {
  id: number;
  nome: string;
  endereco?: string;
  cidade?: string;
  telefone?: string;
  banner?: string;
  imagem?: string;
  taxa_entrega: number;
  tempo_entrega: number;
  aberto: boolean;
  horario_funcionamento?: Record<string, string>;
}

export default function RestauranteMenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [cardapio, setCardapio] = useState<Categoria[]>([]);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [modalProduto, setModalProduto] = useState<Produto | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cliente/restaurants/${id}/menu`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        setCardapio(data.data || []);
        setRestaurante(data.restaurant);
      })
      .catch(() => setErro('Erro ao carregar cardápio'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center text-gray-700 mt-10">Carregando...</div>;
  if (erro) return <div className="text-center text-red-400 mt-10">{erro}</div>;
  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen pb-24 sm:pb-32">
      {restaurante && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 relative overflow-hidden">
          {/* Banner com gradiente */}          <div className="absolute top-0 left-0 w-full h-40">
            <div className="w-full h-full relative">
              <img
                src={restaurante.banner || '/banner-default.png'}
                alt={restaurante.nome}
                className="w-full h-full object-cover"
                onError={e => {e.currentTarget.src = '/banner-default.png'}}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/20 to-white"></div>
            </div>
          </div>

          {/* Container com logo e informações */}
          <div className="relative z-10 pt-4 flex flex-col items-center text-center">
            {/* Logo com dimensões fixas e espaçamento ajustado */}            
            <div className="w-[160px] h-[160px] rounded-xl shadow-lg bg-white p-2 mb-6 border-4 border-white">
              <img
                src={restaurante.imagem || '/logo192.png'}
                alt={restaurante.nome}
                className="w-full h-full object-cover rounded-lg"
                onError={e => {e.currentTarget.src = '/logo192.png'}}
              />
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">{restaurante.nome}</h1>

            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
              restaurante.aberto 
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              <span className={`w-2.5 h-2.5 rounded-full ${
                restaurante.aberto ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="font-semibold">
                {restaurante.aberto ? 'Aberto agora' : 'Fechado no momento'}
              </span>
              {!restaurante.aberto && (
                <span className="text-sm ml-1">(não está aceitando pedidos)</span>
              )}
            </div>

            {/* Informações do restaurante */}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              {restaurante.endereco && (
                <span className="flex items-center gap-1">
                  <FaMapMarkerAlt size={16} color="#f97316" />
                  {restaurante.endereco} - {restaurante.cidade}
                </span>
              )}
              {restaurante.telefone && (
                <span className="flex items-center gap-1">
                  <FaPhone size={16} color="#f97316" />
                  {restaurante.telefone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FaClock size={16} color="#f97316" />
                {restaurante.tempo_entrega} min
              </span>
              <span className="flex items-center gap-1">
                <FaMoneyBill size={16} color="#f97316" />
                Taxa de entrega: R$ {restaurante.taxa_entrega.toFixed(2)}
              </span>
            </div>

            {/* Horário de Funcionamento */}
            {restaurante.horario_funcionamento && (
              <div className="bg-white p-5 rounded-2xl flex flex-col items-center gap-3 mt-6 w-full max-w-2xl mx-auto shadow border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <FaClock size={18} color="#f97316" />
                  <span className="text-base font-bold text-orange-700">Horário de Funcionamento</span>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-1 w-full">
                  {/* Coluna 1: segunda, terça, quarta, quinta */}
                  <div className="flex flex-col gap-1">
                    {['segunda', 'terca', 'quarta', 'quinta'].map((dia) => {
                      const diasSemana = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
                      const hoje = diasSemana[new Date().getDay()];
                      const isHoje = dia === hoje;
                      return (
                        <div key={dia} className={`grid grid-cols-[110px_1fr] items-center w-full px-2 py-1 rounded transition-all ${isHoje ? 'bg-orange-50 font-bold text-orange-700 border border-orange-100' : ''}`}>
                          <span className="capitalize text-gray-700 font-medium text-base text-left">{dia.charAt(0).toUpperCase() + dia.slice(1)}:</span>
                          <span className={`text-gray-900 font-semibold tracking-wide flex items-center ${restaurante.horario_funcionamento?.[dia]?.toLowerCase() === 'fechado' ? 'text-red-500' : ''}`}>{restaurante.horario_funcionamento?.[dia] || 'Fechado'}
                            {isHoje && <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-600 font-bold border border-orange-200 align-middle whitespace-nowrap">Hoje</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Coluna 2: sexta, sábado, domingo */}
                  <div className="flex flex-col gap-1">
                    {['sexta', 'sabado', 'domingo'].map((dia) => {
                      const diasSemana = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
                      const hoje = diasSemana[new Date().getDay()];
                      const isHoje = dia === hoje;
                      return (
                        <div key={dia} className={`grid grid-cols-[110px_1fr] items-center w-full px-2 py-1 rounded transition-all ${isHoje ? 'bg-orange-50 font-bold text-orange-700 border border-orange-100' : ''}`}>
                          <span className="capitalize text-gray-700 font-medium text-base text-left">{dia.charAt(0).toUpperCase() + dia.slice(1)}:</span>
                          <span className={`text-gray-900 font-semibold tracking-wide flex items-center ${restaurante.horario_funcionamento?.[dia]?.toLowerCase() === 'fechado' ? 'text-red-500' : ''}`}>{restaurante.horario_funcionamento?.[dia] || 'Fechado'}
                            {isHoje && <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-600 font-bold border border-orange-200 align-middle whitespace-nowrap">Hoje</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {cardapio.map(categoria => (
        <div key={categoria.id} className="mb-8">
          <h2 className="text-xl font-bold text-orange-600 mb-4 pb-2 border-b border-orange-200">
            {categoria.nome}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoria.produtos.map(produto => (
              <div 
                key={produto.id} 
                className={`bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-orange-100 ${
                  !restaurante?.aberto && 'opacity-50'
                } ${restaurante?.aberto && 'cursor-pointer hover:shadow-lg transition'}`}
                onClick={() => restaurante?.aberto && setModalProduto(produto)}
              >
                {produto.imagem && (
                  <img 
                    src={produto.imagem} 
                    alt={produto.nome} 
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <div className="font-bold text-lg text-orange-600">{produto.nome}</div>
                <div className="text-gray-600 text-sm flex-1">{produto.descricao}</div>
                <div className="font-bold text-green-600 text-lg">R$ {produto.preco.toFixed(2)}</div>
                <button
                  className={`w-full mt-2 py-2 rounded font-bold transition ${
                    restaurante?.aberto
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    restaurante?.aberto && setModalProduto(produto);
                  }}
                  disabled={!restaurante?.aberto}
                >
                  {restaurante?.aberto ? 'Ver Detalhes' : 'Restaurante Fechado'}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button 
        onClick={() => navigate('/restaurantes')} 
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-orange-600 font-bold shadow hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all border border-orange-100 mt-8"
      >
        <span className="text-xl">←</span>
        Voltar para restaurantes
      </button>

      {modalProduto && (
        <ProductDetailsModal
          product={modalProduto}
          isOpen={modalProduto !== null}
          onClose={() => setModalProduto(null)}
          onAddToCart={(quantidade, adicionaisSelecionados) => {
            addItem({
              ...modalProduto,
              quantidade,
              adicionais: adicionaisSelecionados,
              restauranteId: restaurante?.id
            });
            navigate('/carrinho'); // Redireciona para o carrinho
          }}
        />
      )}
    </div>
  );
}
