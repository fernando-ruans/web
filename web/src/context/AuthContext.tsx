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
    if (token && tipo) {
      let endpoint = '/api/cliente/profile';
      if (tipo === 'lojista') endpoint = '/api/lojista/profile';
      if (tipo === 'admin') endpoint = '/api/admin/profile';
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
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      setTipo(data.user.tipo);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('tipo', data.user.tipo);
      return true;
    }
    return false;
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