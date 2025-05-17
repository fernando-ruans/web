import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import theme from '../theme';

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  imagem?: string;
  quantidade?: number;
}

interface Categoria {
  id: number;
  nome: string;
  produtos: Produto[];
}

interface Restaurante {
  id: number;
  nome: string;
  cidade: string;
  taxa_entrega: number;
  tempo_entrega: number;
}

export default function RestauranteMenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [cardapio, setCardapio] = useState<Categoria[]>([]);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);

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
    <div className="max-w-3xl mx-auto p-4 min-h-screen pb-24 sm:pb-32">
      {restaurante && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-orange-500">{restaurante.nome}</h1>
          <div className="text-gray-600 mt-2 flex items-center gap-4 text-sm">
            <span>🚚 Entrega: R$ {restaurante.taxa_entrega.toFixed(2)}</span>
            <span>⏱️ {restaurante.tempo_entrega} min</span>
            <span>📍 {restaurante.cidade}</span>
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
              <div key={produto.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-orange-100">
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
                  className={theme.primary + ' w-full font-bold py-2 rounded mt-2'}
                  onClick={() => addItem({ ...produto, quantidade: 1 })}
                >
                  Adicionar ao carrinho
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button 
        onClick={() => navigate('/restaurantes')} 
        className="mt-8 text-orange-500 hover:underline"
      >
        ← Voltar para restaurantes
      </button>
    </div>
  );
}
