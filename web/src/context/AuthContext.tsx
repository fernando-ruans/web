import React, { createContext, useState, useEffect, useContext } from 'react';

interface AuthContextType {
  user: any;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função auxiliar para fazer requisições autenticadas
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    try {
      const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        }
      });

      // Se a resposta não for ok, tenta ler o erro
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro na requisição');
      }

      return res;
    } catch (err) {
      console.error('Erro na requisição:', err);
      throw err;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setError(null);
        const res = await fetchWithAuth('/api/auth/me');
        const data = await res.json();
        
        if (isMounted && data.user) {
          setUser(data.user);
        }
      } catch (err: any) {
        console.error('Erro ao buscar perfil:', err);
        if (isMounted) {
          setUser(null);
          setError(err.message || 'Erro ao buscar perfil');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleUserUpdated = (e: CustomEvent<any>) => {
      if (e.detail?.user) {
        // Verificar se os dados realmente mudaram para evitar atualizações desnecessárias
        if (JSON.stringify(e.detail.user) !== JSON.stringify(user)) {
          setUser(e.detail.user);
        }
      }
    };

    window.addEventListener('userUpdated', handleUserUpdated as EventListener);
    return () => window.removeEventListener('userUpdated', handleUserUpdated as EventListener);
  }, [user]);

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      setError(null);
      setUser(null);
      
      const res = await fetchWithAuth('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });
      
      const data = await res.json();
      
      if (!data.user || !data.user.tipo) {
        throw new Error('Resposta inválida do servidor');
      }
      
      setUser(data.user);
      return true;
      
    } catch (err: any) {
      console.error('Erro durante login:', err);
      setUser(null);
      setError(err.message || 'Erro ao fazer login');
      return false;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    } catch (err: any) {
      console.error('Erro durante logout:', err);
      setError(err.message || 'Erro ao fazer logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext) as AuthContextType;