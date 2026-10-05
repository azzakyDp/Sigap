import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, registerApi, getMeApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sigap_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('sigap_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('sigap_token');
      if (storedToken) {
        try {
          const meData = await getMeApi();
          setUser(meData);
          localStorage.setItem('sigap_user', JSON.stringify(meData));
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (identifier, password) => {
    const data = await loginApi(identifier, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('sigap_token', data.access_token);
    localStorage.setItem('sigap_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (payload) => {
    const data = await registerApi(payload);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('sigap_token');
    localStorage.removeItem('sigap_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
