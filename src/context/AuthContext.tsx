/**
 * FocusFlow Authentication & Multi-User Context.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserPreferences } from '../types';
import { db } from '../services/db';

export interface AccountSummary {
  id: string;
  username: string;
  name: string;
  studyField: string;
}

interface AuthContextType {
  currentUser: User;
  users: User[];
  availableAccounts: AccountSummary[];
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    username: string,
    password: string,
    name?: string,
    studyField?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  createUser: (name: string, email: string, studyField: string) => User;
  logout: () => void;
  switchUser: (userId: string) => void;
  refreshAccounts: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  updateProfile: (name: string, studyField: string) => void;
  resetUserDemoData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => db.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [availableAccounts, setAvailableAccounts] = useState<AccountSummary[]>([
    { id: 'usr_alex_chen', username: 'alex', name: 'Alex Chen', studyField: 'Computer Science & Cognitive Psychology' },
    { id: 'usr_sarah_connor', username: 'sarah', name: 'Sarah Connor', studyField: 'Cybernetics & Robotics' },
  ]);

  const refreshAccounts = useCallback(async () => {
    const list = await db.fetchAvailableAccounts();
    if (list && list.length > 0) {
      setAvailableAccounts(list);
    }
    setUsers(db.getUsers());
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  // Apply dark mode class to html tag whenever theme changes
  useEffect(() => {
    const isDark = currentUser?.preferences?.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentUser?.preferences?.theme]);

  const login = async (username: string, password: string) => {
    const result = await db.login(username, password);
    if (result.ok && result.user) {
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      await refreshAccounts();
      return { ok: true };
    }
    return { ok: false, error: result.error || 'Authentication failed' };
  };

  const register = async (username: string, password: string, name?: string, studyField?: string) => {
    const result = await db.register(username, password, name, studyField);
    if (result.ok && result.user) {
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      setIsAuthModalOpen(false);
      await refreshAccounts();
      return { ok: true };
    }
    return { ok: false, error: result.error || 'Registration failed' };
  };

  const logout = () => {
    db.logout();
    setIsAuthenticated(false);
    setIsAuthModalOpen(true);
  };

  const switchUser = (userId: string) => {
    const user = db.setCurrentUser(userId);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setUsers(db.getUsers());
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    const updated = db.updatePreferences(currentUser.id, prefs);
    setCurrentUser(prev => ({
      ...prev,
      preferences: updated,
    }));
  };

  const updateProfile = (name: string, studyField: string) => {
    const updatedUser = {
      ...currentUser,
      name,
      studyField,
    };
    db.updateUser(updatedUser);
    setCurrentUser(updatedUser);
    setUsers(db.getUsers());
    refreshAccounts();
  };

  const resetUserDemoData = () => {
    db.resetDemoData(currentUser.id);
    setCurrentUser({ ...currentUser });
  };

  const createUser = (name: string, email: string, studyField: string): User => {
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_') || `user_${Date.now().toString(36)}`;
    const newUser: User = {
      id: `usr_${Date.now()}`,
      username,
      name,
      email,
      studyField,
      preferences: { ...currentUser.preferences },
      createdAt: new Date().toISOString(),
    };
    db.setCurrentUser(newUser.id, newUser);
    setCurrentUser(newUser);
    setUsers(db.getUsers());
    refreshAccounts();
    return newUser;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        availableAccounts,
        isAuthenticated,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        login,
        register,
        createUser,
        logout,
        switchUser,
        refreshAccounts,
        updatePreferences,
        updateProfile,
        resetUserDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
