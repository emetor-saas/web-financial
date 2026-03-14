import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { ProfileType, SingleProfile, CoupleProfile, AdminProfile } from '@/types';
import { SINGLE_PROFILE, COUPLE_PROFILE, ADMIN_PROFILE } from '@/data/mockData';

interface AuthContextType {
  isAuthenticated: boolean;
  profileType: ProfileType | null;
  singleProfile: SingleProfile;
  coupleProfile: CoupleProfile;
  adminProfile: AdminProfile;
  login: (type: ProfileType) => void;
  logout: () => void;
  switchProfile: (type: ProfileType) => void;
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('aura_auth') === 'true';
  });
  const [profileType, setProfileType] = useState<ProfileType | null>(() => {
    return (localStorage.getItem('aura_profile') as ProfileType) || null;
  });
  const [singleProfile, setSingleProfile] = useState<SingleProfile>(() => {
    const stored = localStorage.getItem('aura_single_data');
    return stored ? JSON.parse(stored) : SINGLE_PROFILE;
  });
  const [coupleProfile, setCoupleProfile] = useState<CoupleProfile>(() => {
    const stored = localStorage.getItem('aura_couple_data');
    return stored ? JSON.parse(stored) : COUPLE_PROFILE;
  });
  const adminProfile = ADMIN_PROFILE;

  useEffect(() => {
    localStorage.setItem('aura_auth', String(isAuthenticated));
    localStorage.setItem('aura_profile', profileType || '');
  }, [isAuthenticated, profileType]);

  useEffect(() => {
    localStorage.setItem('aura_single_data', JSON.stringify(singleProfile));
  }, [singleProfile]);

  useEffect(() => {
    localStorage.setItem('aura_couple_data', JSON.stringify(coupleProfile));
  }, [coupleProfile]);

  const login = (type: ProfileType) => {
    setProfileType(type);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setProfileType(null);
  };

  const switchProfile = (type: ProfileType) => {
    setProfileType(type);
  };

  const userName = profileType === 'SINGLE' ? singleProfile.name
    : profileType === 'COUPLE' ? coupleProfile.name
    : profileType === 'ADMIN' ? adminProfile.name : '';

  const updateSingleProfile = (updates: Partial<SingleProfile>) => {
    setSingleProfile(prev => ({ ...prev, ...updates }));
  };

  const updateCoupleProfile = (updates: Partial<CoupleProfile>) => {
    setCoupleProfile(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, profileType, singleProfile, coupleProfile, adminProfile,
      login, logout, switchProfile, userName, updateSingleProfile, updateCoupleProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
