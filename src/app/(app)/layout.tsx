'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-optimized-auth';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { FullScreenInstantLoader } from '@/components/ui/instant-loader';
import { CacheMonitor } from '@/components/debug/cache-monitor';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('AppLayout - Auth state:', { user: !!user, loading, pathname: window.location.pathname });
    if (!loading && !user) {
      console.log('AppLayout - Redirecting to home page');
      router.push('/');
    }
  }, [user, loading, router]);

  // Debug loading state
  useEffect(() => {
    if (loading) {
      console.log('AppLayout - Loading state active, showing loader');
    } else if (user) {
      console.log('AppLayout - User authenticated, rendering content');
    }
  }, [loading, user]);

  if (loading || !user) {
    console.log('AppLayout - Showing loading screen');
    return <FullScreenInstantLoader />;
  }

  console.log('AppLayout - Rendering app content');
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </SidebarInset>
      <CacheMonitor />
    </SidebarProvider>
  );
}
