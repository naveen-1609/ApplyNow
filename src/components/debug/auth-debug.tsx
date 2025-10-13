'use client';

import { useAuth } from '@/hooks/use-optimized-auth';
import { useEffect, useState } from 'react';

export function AuthDebug() {
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div>Auth Debug:</div>
      <div>User: {user ? '✅' : '❌'}</div>
      <div>Loading: {loading ? '⏳' : '✅'}</div>
      <div>Path: {window.location.pathname}</div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
    </div>
  );
}
