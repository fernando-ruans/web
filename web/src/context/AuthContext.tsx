import React, { createContext, useState, useEffect, useContext } from 'react';

interface AuthContextType {
  user: any;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para fazer requisições autenticadas
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const res = await fetch(url, {
      ...options,
      credentials: 'include', // Sempre inclui cookies
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      }
    });
    return res;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        // Tenta buscar o perfil do usuário
        const res = await fetchWithAuth('/api/auth/me');

        if (!isMounted) return;

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setUser(null);
          }
          throw new Error('Erro na requisição');
        }

        const data = await res.json();
        if (isMounted && data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        if (isMounted) {
          setUser(null);
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
      // Limpar qualquer estado anterior
      setUser(null);

      const res = await fetchWithAuth('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });
      
      if (!res.ok) {
        throw new Error('Falha na autenticação');
      }

      const data = await res.json();
      
      // Validar resposta
      if (!data.user || !data.user.tipo) {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Atualizar estado com dados do usuário
      setUser(data.user);
      return true;
      
    } catch (error) {
      console.error('Erro durante login:', error);
      setUser(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetchWithAuth('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Erro durante logout:', error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext) as AuthContextType;