import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const TOKEN_KEY = 'billing_admin_token';
const TEMP_TOKEN_KEY = 'billing_admin_temp_token';

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [tempToken, setTempTokenState] = useState(() => localStorage.getItem(TEMP_TOKEN_KEY) || null);

  const setToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    setTokenState(newToken);
  }, []);

  const setTempToken = useCallback((newTempToken) => {
    if (newTempToken) {
      localStorage.setItem(TEMP_TOKEN_KEY, newTempToken);
    } else {
      localStorage.removeItem(TEMP_TOKEN_KEY);
    }
    setTempTokenState(newTempToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TEMP_TOKEN_KEY);
    setTokenState(null);
    setTempTokenState(null);
  }, []);

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ token, setToken, tempToken, setTempToken, isAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
