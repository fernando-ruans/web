import React, { createContext, useState, useEffect, useContext } from 'react';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [tipo, setTipo] = useState<string | null>(localStorage.getItem('tipo'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && tipo) {
      const endpoint = tipo === 'lojista' ? '/api/lojista/profile' : '/api/cliente/profile';
      fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => setUser(data))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, tipo]);

  // Listener para atualização do usuário após edição do perfil
  React.useEffect(() => {
    function handleUserUpdated(e: any) {
      if (e.detail) setUser(e.detail);
    }
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => window.removeEventListener('userUpdated', handleUserUpdated);
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