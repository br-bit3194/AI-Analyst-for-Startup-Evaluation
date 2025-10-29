'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Sidebar } from "@/components/ui/sidebar";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { SidebarContent } from "./sidebar-content";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const checkAuth = useCallback(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <BackgroundPaths className="absolute inset-0 -z-10" />
      <Sidebar>
        <SidebarContent />
      </Sidebar>

      <main className="flex-1 overflow-y-auto p-6 relative z-10 h-full">
        {children}
      </main>
    </div>
  );
}
