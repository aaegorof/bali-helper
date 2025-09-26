'use client';
import { User } from '@supabase/supabase-js';
import { createContext, FC, useContext } from 'react';

export const AuthContext = createContext<{ user: User | null }>({
  user: null,
});

export const AuthProvider: FC<{ user: User | null; children: React.ReactNode }> = ({ user, ...props }) => {
  return (
    <AuthContext.Provider
      value={{
        user,
      }}
      {...props}
    />
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
