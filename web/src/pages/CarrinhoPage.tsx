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
    <div className="min-h-screen pb-24 sm:pb-32 max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-orange-500 mb-6">Seu Carrinho</h1>
      {items.length === 0 ? (
        <div className="text-gray-500 text-center">Seu carrinho está vazio.</div>
      ) : (
        <>
          <ul className="divide-y divide-orange-100 mb-4">
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
