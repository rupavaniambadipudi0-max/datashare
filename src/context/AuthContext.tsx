import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserPlan, DataWallet, CoinWallet } from '../types';
import { api, TOKEN_KEY } from '../api/client';

export interface UserProfile extends User {
  wallet?: DataWallet;
  plan?: UserPlan;
  coinWallet?: CoinWallet;
  unreadNotifications?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  wallet: DataWallet | null;
  plan: UserPlan | null;
  coinWallet: CoinWallet | null;
  unreadCount: number;
  isLoading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  quickLogin: (phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<DataWallet | null>(null);
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [coinWallet, setCoinWallet] = useState<CoinWallet | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applyUserData = useCallback((profile: any) => {
    if (!profile) {
      setUser(null);
      setWallet(null);
      setPlan(null);
      setCoinWallet(null);
      setUnreadCount(0);
      return;
    }
    setUser({
      id: profile.id,
      fullName: profile.fullName,
      phone: profile.phone,
      email: profile.email,
      role: profile.role,
      status: profile.status
    });
    if (profile.wallet) setWallet(profile.wallet);
    if (profile.plan) setPlan(profile.plan);
    if (profile.coinWallet) setCoinWallet(profile.coinWallet);
    if (typeof profile.unreadNotifications === 'number') {
      setUnreadCount(profile.unreadNotifications);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        applyUserData(res.data);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        applyUserData(null);
      }
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
      // If token expired or invalid, clear token
      localStorage.removeItem(TOKEN_KEY);
      applyUserData(null);
    } finally {
      setIsLoading(false);
    }
  }, [applyUserData]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (token: string, userData: any) => {
    localStorage.setItem(TOKEN_KEY, token);
    applyUserData(userData);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setWallet(null);
    setPlan(null);
    setCoinWallet(null);
    setUnreadCount(0);
  };

  const quickLogin = async (phone: string) => {
    setIsLoading(true);
    try {
      const res = await api.verifyOtp(phone, '123456');
      if (res.success && res.data && res.data.token) {
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      alert(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        plan,
        coinWallet,
        unreadCount,
        isLoading,
        login,
        logout,
        refreshUser,
        quickLogin
      }}
    >
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
