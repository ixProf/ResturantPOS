import React, { createContext, useContext, useState } from 'react';
import type { AuthResponseDto, EmployeeRole } from '../types/api';

interface AuthUser {
  token: string;
  employeeId: number;
  fullName: string;
  email: string;
  role: EmployeeRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (authData: AuthResponseDto) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem('alaris_token');
    const userStr = localStorage.getItem('alaris_user');
    if (token && userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = (authData: AuthResponseDto) => {
    const authUser: AuthUser = {
      token: authData.token,
      employeeId: authData.employeeId,
      fullName: authData.fullName,
      email: authData.email,
      role: authData.role,
    };
    setUser(authUser);
    localStorage.setItem('alaris_token', authData.token);
    localStorage.setItem('alaris_user', JSON.stringify(authUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('alaris_token');
    localStorage.removeItem('alaris_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
