'use client';
import { User } from '@supabase/supabase-js';
import { createContext, FC, useContext } from 'react';

interface AuthContextType {
  user: User | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
});

export const AuthProvider: FC<{ user: User | null; children: React.ReactNode }> = ({
  user,
  children,
}) => {

  return (
    <AuthContext.Provider
      value={{
        user,
      }}
    >
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
