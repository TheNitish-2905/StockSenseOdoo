import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { storageRepository } from '../services/storageRepository';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storageRepository.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('stocksense_session_active'));
  });

  const login = (email, password) => {
    const res = authService.login(email, password);
    setUser(res.user);
    setIsAuthenticated(true);
    localStorage.setItem('stocksense_session_active', 'true');
    return res.user;
  };

  const signup = (data) => {
    const res = authService.signup(data);
    setUser(res.user);
    setIsAuthenticated(true);
    localStorage.setItem('stocksense_session_active', 'true');
    return res.user;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('stocksense_session_active');
  };

  const updateProfile = (profileData) => {
    const updated = authService.updateProfile(profileData);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
