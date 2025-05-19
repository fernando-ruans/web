import React, { createContext, useState, useEffect, useContext } from 'react';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [tipo, setTipo] = useState<string | null>(localStorage.getItem('tipo'));
  const [loading, setLoading] = useState(true);  useEffect(() => {
    if (token && tipo) {
      // Define o endpoint baseado no tipo de usuário salvo no localStorage
      const endpoint = tipo === 'lojista' 
        ? '/api/lojista/profile'
        : tipo === 'admin'
          ? '/api/admin/profile'
          : '/api/cliente/profile';

      fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(async res => {
          if (!res.ok) {
            // Se houver erro de autenticação, fazer logout
            if (res.status === 401 || res.status === 403) {
              setUser(null);
              setToken(null);
              setTipo(null);
              localStorage.removeItem('token');
              localStorage.removeItem('tipo');
              return null;
            }
          }
          return res.ok ? res.json() : null;
        })
        .then(data => {
          if (data) {
            setUser(data);
            // Garante que o tipo no localStorage corresponde ao tipo do usuário
            if (data.tipo !== tipo) {
              setTipo(data.tipo);
              localStorage.setItem('tipo', data.tipo);
            }
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, tipo]);

  useEffect(() => {
    const handleUserUpdated = (e: CustomEvent<any>) => {
      if (e.detail?.user) {
        setUser(e.detail.user);
      }
    };

    window.addEventListener('userUpdated', handleUserUpdated as EventListener);
    return () => window.removeEventListener('userUpdated', handleUserUpdated as EventListener);
  }, []);
  const login = async (email: string, senha: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Validar se recebemos todos os dados necessários
        if (!data.token || !data.user || !data.user.tipo) {
          console.error('Dados de login incompletos');
          return false;
        }
        
        // Limpar dados antigos
        localStorage.removeItem('token');
        localStorage.removeItem('tipo');
        
        // Definir novos dados
        setToken(data.token);
        setTipo(data.user.tipo);
        setUser(data.user);
        
        // Salvar no localStorage após validação
        localStorage.setItem('token', data.token);
        localStorage.setItem('tipo', data.user.tipo);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro durante login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setTipo(null);
    localStorage.removeItem('token');
    localStorage.removeItem('tipo');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext) as AuthContextType;