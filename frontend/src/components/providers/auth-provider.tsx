'use client';

import { AuthProvider as FirebaseAuthProvider } from '@/contexts/AuthContext';
import { ClientWrapper } from './client-wrapper';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClientWrapper>
      <FirebaseAuthProvider>{children}</FirebaseAuthProvider>
    </ClientWrapper>
  );
}
