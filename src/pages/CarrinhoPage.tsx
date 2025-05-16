import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import theme from '../theme';

export default function CarrinhoPage() {
  const { items, removeItem, clearCart, getTotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const finalizarPedido = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Aqui você pode implementar a lógica de envio do pedido para a API
    alert('Pedido finalizado!');
    clearCart();
    navigate('/pedidos');
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-orange-500 mb-6">Seu Carrinho</h1>
      {items.length === 0 ? (
        <div className="text-gray-500 text-center">Seu carrinho está vazio.</div>
      ) : (
        <>
          <ul className="divide-y divide-orange-100 mb-4">
            {items.map(item => (
              <li key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-bold text-orange-600">{item.nome}</div>
                  <div className="text-gray-500 text-sm">Qtd: {item.quantidade}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-bold text-green-600">R$ {(item.preco * item.quantidade).toFixed(2)}</div>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:underline text-xs">Remover</button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-lg">Total:</span>
            <span className="font-bold text-green-600 text-xl">R$ {getTotal().toFixed(2)}</span>
          </div>
          <button
            className={theme.primary + ' w-full font-bold py-2 rounded'}
            onClick={finalizarPedido}
          >
            Finalizar Pedido
          </button>
        </>
      )}
    </div>
  );
}
