import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ProfileType, SingleProfile, CoupleProfile, AdminProfile } from '@/types';
import { SINGLE_PROFILE, COUPLE_PROFILE, ADMIN_PROFILE } from '@/data/mockData';
import type { AuthUser } from '@/services/auth';
import { fetchMe, login as apiLogin, logout as apiLogout } from '@/services/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  profileType: ProfileType | null;
  singleProfile: SingleProfile;
  coupleProfile: CoupleProfile;
  adminProfile: AdminProfile;
  user: AuthUser | null;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Atualiza usuário/billing após checkout Stripe ou mudança de plano */
  refreshUser: () => Promise<void>;
  switchProfileDemo: (type: ProfileType) => void;
  userName: string;
  updateSingleProfile: (updates: Partial<SingleProfile>) => void;
  updateCoupleProfile: (updates: Partial<CoupleProfile>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

function mapRoleToProfileType(role: string | undefined | null): ProfileType {
  if (role === 'MASTER') return 'ADMIN';
  // Por enquanto, todo usuário comum usa o perfil "SINGLE" no layout
  return 'SINGLE';
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [profileType, setProfileType] = useState<ProfileType | null>(null);
  const [singleProfile, setSingleProfile] = useState<SingleProfile>(SINGLE_PROFILE);
  const [coupleProfile, setCoupleProfile] = useState<CoupleProfile>(COUPLE_PROFILE);
  const adminProfile = ADMIN_PROFILE;

  useEffect(() => {
    // Tenta recuperar sessão pelo cookie httpOnly chamando /api/auth/me
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

  const switchProfileDemo = (type: ProfileType) => {
    setProfileType(type);
  };

  const userName =
    user?.name ||
    (profileType === 'SINGLE'
      ? singleProfile.name
      : profileType === 'COUPLE'
        ? coupleProfile.name
        : profileType === 'ADMIN'
          ? adminProfile.name
          : '');

  const updateSingleProfile = (updates: Partial<SingleProfile>) => {
    setSingleProfile((prev) => ({ ...prev, ...updates }));
  };

  const updateCoupleProfile = (updates: Partial<CoupleProfile>) => {
    setCoupleProfile((prev) => ({ ...prev, ...updates }));
  };

  if (!loaded) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        profileType,
        singleProfile,
        coupleProfile,
        adminProfile,
        user,
        loginWithCredentials,
        logout,
        refreshUser,
        switchProfileDemo,
        userName,
        updateSingleProfile,
        updateCoupleProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

