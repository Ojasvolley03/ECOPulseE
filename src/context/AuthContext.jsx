import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const openGuestAccess = async (role) => {
    const res = await api.getGuestAccess(role);
    if (res.success && res.token && res.user) {
      setAuthToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Guest access unavailable.');
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            setAuthToken(null);
          }
        } catch (err) {
          console.warn('Session expired or invalid:', err.message);
          setAuthToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      setAuthToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const setupAdmin = async (email, password) => {
    const res = await api.setupAdmin({ email, password });
    if (res.success && res.token) {
      setAuthToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Admin setup failed.');
  };

  const changeAdminCredentials = async (credentials) => {
    const res = await api.changeAdminCredentials(credentials);
    if (res.success && res.token) {
      setAuthToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Credential update failed.');
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success && res.token) {
      setAuthToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Registration failed.');
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, setupAdmin, openGuestAccess, changeAdminCredentials, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
