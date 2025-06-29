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
    <div className="max-w-4xl mx-auto p-2 sm:p-4 min-h-screen pb-28 sm:pb-32">
      {restaurante && (
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 mb-6 sm:mb-8 relative overflow-hidden">
          {/* Banner com gradiente */}          <div className="absolute top-0 left-0 w-full h-28 sm:h-40">
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
          <div className="relative z-10 pt-2 sm:pt-4 flex flex-col items-center text-center">
            {/* Logo com dimensões fixas e espaçamento ajustado */}            
            <div className="w-24 h-24 sm:w-[160px] sm:h-[160px] rounded-xl shadow-lg bg-white p-1 sm:p-2 mb-4 sm:mb-6 border-4 border-white">
              <img
                src={restaurante.imagem || '/logo192.png'}
                alt={restaurante.nome}
                className="w-full h-full object-cover rounded-lg"
                onError={e => {e.currentTarget.src = '/logo192.png'}}
              />
            </div>

            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">{restaurante.nome}</h1>

            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4 ${
              restaurante.aberto 
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              <span className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                restaurante.aberto ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="font-semibold text-xs sm:text-base">
                {restaurante.aberto ? 'Aberto agora' : 'Fechado no momento'}
              </span>
              {!restaurante.aberto && (
                <span className="text-xs sm:text-sm ml-1">(não está aceitando pedidos)</span>
              )}
            </div>

            {/* Informações do restaurante */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
              {restaurante.endereco && (
                <span className="flex items-center gap-1">
                  <FaMapMarkerAlt size={14} color="#f97316" />
                  {restaurante.endereco} - {restaurante.cidade}
                </span>
              )}
              {restaurante.telefone && (
                <span className="flex items-center gap-1">
                  <FaPhone size={14} color="#f97316" />
                  {restaurante.telefone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <FaClock size={14} color="#f97316" />
                {restaurante.tempo_entrega} min
              </span>
              <span className="flex items-center gap-1">
                <FaMoneyBill size={14} color="#f97316" />
                Taxa de entrega: R$ {restaurante.taxa_entrega.toFixed(2)}
              </span>
            </div>

            {/* Horário de Funcionamento */}
            {restaurante.horario_funcionamento && (
              <div className="bg-white p-3 sm:p-5 rounded-2xl flex flex-col items-center gap-2 sm:gap-3 mt-4 sm:mt-6 w-full max-w-md sm:max-w-2xl mx-auto shadow border border-orange-100">
                <div className="flex items-center gap-2 mb-1 sm:mb-2">
                  <FaClock size={16} color="#f97316" />
                  <span className="text-sm sm:text-base font-bold text-orange-700">Horário de Funcionamento</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-1 w-full">
                  {/* Coluna 1: segunda, terça, quarta, quinta */}
                  <div className="flex flex-col gap-1">
                    {['segunda', 'terca', 'quarta', 'quinta'].map((dia) => {
                      const diasSemana = ['domingo','segunda','terca','quarta','quinta','sexta','sabado'];
                      const hoje = diasSemana[new Date().getDay()];
                      const isHoje = dia === hoje;
                      return (
                        <div key={dia} className={`grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] items-center w-full px-1 sm:px-2 py-1 rounded transition-all ${isHoje ? 'bg-orange-50 font-bold text-orange-700 border border-orange-100' : ''}`}>
                          <span className="capitalize text-gray-700 font-medium text-xs sm:text-base text-left">{dia.charAt(0).toUpperCase() + dia.slice(1)}:</span>
                          <span className={`text-gray-900 font-semibold tracking-wide flex items-center ${restaurante.horario_funcionamento?.[dia]?.toLowerCase() === 'fechado' ? 'text-red-500' : ''}`}>{restaurante.horario_funcionamento?.[dia] || 'Fechado'}
                            {isHoje && <span className="ml-2 px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-orange-100 text-orange-600 font-bold border border-orange-200 align-middle whitespace-nowrap">Hoje</span>}
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
                        <div key={dia} className={`grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] items-center w-full px-1 sm:px-2 py-1 rounded transition-all ${isHoje ? 'bg-orange-50 font-bold text-orange-700 border border-orange-100' : ''}`}>
                          <span className="capitalize text-gray-700 font-medium text-xs sm:text-base text-left">{dia.charAt(0).toUpperCase() + dia.slice(1)}:</span>
                          <span className={`text-gray-900 font-semibold tracking-wide flex items-center ${restaurante.horario_funcionamento?.[dia]?.toLowerCase() === 'fechado' ? 'text-red-500' : ''}`}>{restaurante.horario_funcionamento?.[dia] || 'Fechado'}
                            {isHoje && <span className="ml-2 px-2 py-0.5 text-[10px] sm:text-xs rounded-full bg-orange-100 text-orange-600 font-bold border border-orange-200 align-middle whitespace-nowrap">Hoje</span>}
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
        <div key={categoria.id} className="mb-6 sm:mb-8">
          <h2 className="text-base sm:text-xl font-bold text-orange-600 mb-2 sm:mb-4 pb-1 sm:pb-2 border-b border-orange-200">
            {categoria.nome}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            {categoria.produtos.map(produto => (
              <div 
                key={produto.id} 
                className={`bg-white rounded-2xl shadow-md p-2 sm:p-3 flex flex-col border border-orange-100 transition-all duration-150 ${
                  !restaurante?.aberto && 'opacity-50'
                } ${restaurante?.aberto && 'cursor-pointer hover:shadow-lg hover:-translate-y-1'}`}
                style={{ fontSize: '0.95em', maxWidth: 320, margin: '0 auto', minHeight: 340 }}
                onClick={() => restaurante?.aberto && setModalProduto(produto)}
              >
                {produto.imagem && (
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 flex items-center justify-center bg-orange-50 border border-orange-100">
                    <img 
                      src={produto.imagem} 
                      alt={produto.nome} 
                      className="object-cover w-full h-full transition-transform duration-200 hover:scale-105"
                      style={{minHeight: 0, minWidth: 0, maxHeight: '170px'}}
                    />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-base sm:text-lg text-orange-700 mb-0.5 truncate" title={produto.nome}>{produto.nome}</div>
                    <div className="text-gray-500 text-xs sm:text-sm mb-1 line-clamp-2 min-h-[32px]">{produto.descricao}</div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-green-600 text-base sm:text-lg">R$ {produto.preco.toFixed(2)}</span>
                    <button
                      className={`ml-2 px-3 py-1.5 rounded-lg font-bold transition text-xs sm:text-sm shadow-sm border ${
                        restaurante?.aberto
                          ? 'bg-orange-500 text-white hover:bg-orange-600 border-orange-400'
                          : 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed'
                      }`}
                      onClick={e => {
                        e.stopPropagation();
                        restaurante?.aberto && setModalProduto(produto);
                      }}
                      disabled={!restaurante?.aberto}
                    >
                      {restaurante?.aberto ? 'Ver Detalhes' : 'Fechado'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button 
        onClick={() => navigate('/restaurantes')} 
        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white text-orange-600 font-bold shadow hover:bg-orange-50 hover:text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all border border-orange-100 mt-6 sm:mt-8 text-sm sm:text-base"
      >
        <span className="text-lg sm:text-xl">←</span>
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
