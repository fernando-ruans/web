import React, { createContext, useContext, useEffect, useState } from 'react';

export interface MenuItem {
  id: number;
  nome: string;
  preco: number;
  descricao?: string;
  imagem?: string;
  restauranteId: number;
}

interface MenuContextType {
  items: MenuItem[];
  setMenu: (items: MenuItem[]) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const setMenu = (menu: MenuItem[]) => setItems(menu);
  return (
    <MenuContext.Provider value={{ items, setMenu }}>
      {children}
    </MenuContext.Provider>
  );
};

export function useMenu() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error('useMenu deve ser usado dentro de MenuProvider');
  return ctx;
}
