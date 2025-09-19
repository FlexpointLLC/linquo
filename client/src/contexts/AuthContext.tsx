import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Agent } from '../types';

interface AuthContextType {
  agent: Agent | null;
  token: string | null;
  login: (token: string, agent: Agent) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored token on app load
    const storedToken = localStorage.getItem('authToken');
    const storedAgent = localStorage.getItem('agent');
    
    if (storedToken && storedAgent) {
      setToken(storedToken);
      setAgent(JSON.parse(storedAgent));
    }
  }, []);

  const login = (newToken: string, newAgent: Agent) => {
    setToken(newToken);
    setAgent(newAgent);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('agent', JSON.stringify(newAgent));
  };

  const logout = () => {
    setToken(null);
    setAgent(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('agent');
  };

  const isAuthenticated = Boolean(token && agent);

  return (
    <AuthContext.Provider value={{
      agent,
      token,
      login,
      logout,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};