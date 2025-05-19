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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;  // Flag para evitar atualizações após desmontagem

    const fetchProfile = async () => {
      if (!token || !tipo) {
        setLoading(false);
        return;
      }

      try {
        const endpoint = tipo === 'lojista' 
          ? '/api/lojista/profile'
          : tipo === 'admin'
            ? '/api/admin/profile'
            : '/api/cliente/profile';

        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!isMounted) return;  // Previne atualização se o componente foi desmontado

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setUser(null);
            setToken(null);
            setTipo(null);
            localStorage.removeItem('token');
            localStorage.removeItem('tipo');
          }
          throw new Error('Erro na requisição');
        }

        const data = await res.json();
        if (isMounted && data) {
          setUser(data);
          if (data.tipo !== tipo) {
            setTipo(data.tipo);
            localStorage.setItem('tipo', data.tipo);
          }
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

    fetchProfile();    return () => {
      isMounted = false;  // Cleanup quando o componente é desmontado
    };
  }, [token, tipo]);  useEffect(() => {
    const handleUserUpdated = (e: CustomEvent<any>) => {
      if (e.detail?.user) {
        // Verificar se os dados realmente mudaram para evitar atualizações desnecessárias
        if (JSON.stringify(e.detail.user) !== JSON.stringify(user)) {
          setUser(e.detail.user);
          // Atualizar tipo se necessário
          if (e.detail.user.tipo !== tipo) {
            setTipo(e.detail.user.tipo);
            localStorage.setItem('tipo', e.detail.user.tipo);
          }
        }
      }
    };

    window.addEventListener('userUpdated', handleUserUpdated as EventListener);
    return () => window.removeEventListener('userUpdated', handleUserUpdated as EventListener);
  }, [user, tipo]);  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      // Limpar qualquer estado anterior
      setUser(null);
      setToken(null);
      setTipo(null);
      localStorage.removeItem('token');
      localStorage.removeItem('tipo');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });
      
      if (!res.ok) {
        throw new Error('Falha na autenticação');
      }

      const data = await res.json();
      
      // Validar resposta
      if (!data.token || !data.user || !data.user.tipo) {
        throw new Error('Resposta inválida do servidor');
      }
      
      // Atualizar estado e localStorage de forma atômica      // Atualizar localStorage e estado
      localStorage.setItem('token', data.token);
      localStorage.setItem('tipo', data.user.tipo);
      setToken(data.token);
      setTipo(data.user.tipo);
      setUser(data.user);
      return true;
      
    } catch (error) {
      console.error('Erro durante login:', error);
      // Garantir que o estado está limpo em caso de erro
      setUser(null);
      setToken(null);
      setTipo(null);
      localStorage.removeItem('token');
      localStorage.removeItem('tipo');
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