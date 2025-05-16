import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMenu } from '../context/MenuContext';
import { useCart } from '../context/CartContext';
import theme from '../theme';

export default function RestauranteMenuPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, setMenu } = useMenu();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/cliente/restaurants/${id}/menu`)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => setMenu(data.data || []))
      .catch(() => setErro('Erro ao carregar cardápio'))
      .finally(() => setLoading(false));
  }, [id, setMenu]);

  if (loading) return <div className="text-center text-gray-700 mt-10">Carregando...</div>;
  if (erro) return <div className="text-center text-red-400 mt-10">{erro}</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-orange-500 mb-6">Cardápio</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-orange-100">
            {item.imagem && <img src={item.imagem} alt={item.nome} className="w-full h-32 object-cover rounded mb-2" />}
            <div className="font-bold text-lg text-orange-600">{item.nome}</div>
            <div className="text-gray-600 text-sm flex-1">{item.descricao}</div>
            <div className="font-bold text-green-600 text-lg">R$ {item.preco.toFixed(2)}</div>
            <button
              className={theme.primary + ' w-full font-bold py-2 rounded mt-2'}
              onClick={() => addItem({ ...item, quantidade: 1 })}
            >
              Adicionar ao carrinho
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/restaurantes')} className="mt-8 text-orange-500 hover:underline">Voltar para restaurantes</button>
    </div>
  );
}
