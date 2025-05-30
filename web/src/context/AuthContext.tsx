import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: any;
  login: (email: string, senha: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (email: string, senha: string, nome?: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      // Se existe token JWT salvo, busca perfil completo do backend
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.user) {
              setUser(data.user);
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
            localStorage.removeItem('token');
          }
        } catch (e) {
          setUser(null);
          localStorage.removeItem('token');
        } finally {
          setLoading(false);
        }
      } else {
        setUser(firebaseUser);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      // Envia token para backend
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        return true;
      } else {
        setError(data.error || 'Erro ao autenticar com Google');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar com Google');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, senha: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      // Verifica se o e-mail está verificado
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await signOut(auth);
        localStorage.removeItem('token');
        setError('É necessário confirmar seu e-mail antes de acessar. Verifique sua caixa de entrada.');
        return false;
      }
      // Se e-mail verificado, envia idToken para o backend
      const idToken = await userCredential.user.getIdToken();
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        return true;
      } else {
        setError(data.error || 'Erro ao autenticar');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Novo: recebe nome também
  const register = async (email: string, senha: string, nome?: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
      return true;
    } catch (err: any) {
      console.error('Erro detalhado no cadastro Firebase:', err);
      let msg = '';
      if (err.code) {
        switch (err.code) {
          case 'auth/email-already-in-use':
            msg = 'E-mail já cadastrado.';
            break;
          case 'auth/invalid-email':
            msg = 'E-mail inválido.';
            break;
          case 'auth/weak-password':
            msg = 'A senha deve ter pelo menos 6 caracteres.';
            break;
          default:
            msg = err.message || err.code;
        }
      } else if (err.message) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      } else {
        try {
          msg = JSON.stringify(err);
        } catch {
          msg = 'Erro desconhecido';
        }
      }
      setError(msg || 'Erro ao cadastrar');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer logout');
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, forgotPassword, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext) as AuthContextType;