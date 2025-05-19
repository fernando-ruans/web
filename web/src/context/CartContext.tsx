import React, { createContext, useContext, useEffect, useState } from 'react';

interface ItemAdicional {
  adicionalId: number;
  nome: string;
  preco: number;
  quantidade: number;
}

export interface CartItem {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
  imagem?: string;
  restauranteId?: number;
  adicionais?: ItemAdicional[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  updateQuantity: (id: number, quantidade: number) => void;
  getTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const found = prev.find(i => i.id === item.id);
      if (found) {
        return prev.map(i => i.id === item.id ? { ...i, quantidade: i.quantidade + item.quantidade } : i);
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: number) => setItems(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setItems([]);
  const updateQuantity = (id: number, quantidade: number) => setItems(prev => prev.map(i => i.id === id ? { ...i, quantidade } : i));
  const getTotal = () => items.reduce((sum, i) => {
    const precoBase = i.preco * i.quantidade;
    const precoAdicionais = i.adicionais?.reduce((total, a) => total + (a.preco * a.quantidade), 0) || 0;
    return sum + precoBase + precoAdicionais;
  }, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart, updateQuantity, getTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
