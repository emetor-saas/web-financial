import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ProfileType } from '@/types';
import type { AuthUser } from '@/services/auth';
import { fetchMe, login as apiLogin, logout as apiLogout } from '@/services/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  profileType: ProfileType | null;
  user: AuthUser | null;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Atualiza usuário/billing após checkout Stripe ou mudança de plano */
  refreshUser: () => Promise<void>;
  userName: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

function mapRoleToProfileType(role: string | undefined | null): ProfileType {
  if (role === 'MASTER') return 'ADMIN';
  return 'SINGLE';
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [profileType, setProfileType] = useState<ProfileType | null>(null);

  useEffect(() => {
    fetchMe()
      .then((me) => {
        if (me) {
          setUser(me);
          setIsAuthenticated(true);
          setProfileType(mapRoleToProfileType(me.role));
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = window.setInterval(() => {
      fetchMe()
        .then((me) => {
          if (me) {
            setUser(me);
            setIsAuthenticated(true);
            setProfileType(mapRoleToProfileType(me.role));
            return;
          }
          setUser(null);
          setIsAuthenticated(false);
          setProfileType(null);
        })
        .catch(() => {
          // silent: evita ruído de erro global em refresh periódico
        });
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, [isAuthenticated]);

  const loginWithCredentials = async (email: string, password: string) => {
    const loggedUser = await apiLogin(email, password);
    setUser(loggedUser);
    setIsAuthenticated(true);
    setProfileType(mapRoleToProfileType(loggedUser.role));
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setIsAuthenticated(false);
    setProfileType(null);
  };

  const refreshUser = async () => {
    const me = await fetchMe();
    if (me) {
      setUser(me);
      setIsAuthenticated(true);
      setProfileType(mapRoleToProfileType(me.role));
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setProfileType(null);
    }
  };

  const userName = user?.name?.trim() || '';

  if (!loaded) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        profileType,
        user,
        loginWithCredentials,
        logout,
        refreshUser,
        userName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
