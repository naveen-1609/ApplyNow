import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { getApplications } from '@/lib/services/applications';
import { getResumes } from '@/lib/services/resumes';
import type { JobApplication, Resume } from '@/lib/types';

// Global preload cache
const preloadCache = new Map<string, { data: any; timestamp: number }>();
const PRELOAD_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Preload data when user is authenticated
export function usePreloadedData() {
  const { user } = useAuth();
  const [preloaded, setPreloaded] = useState(false);

  const preloadUserData = useCallback(async () => {
    if (!user || preloaded) return;

    try {
      // Preload applications and resumes in parallel
      const [applications, resumes] = await Promise.all([
        getApplications(user.uid),
        getResumes(user.uid)
      ]);

      // Cache the data
      preloadCache.set(`applications_${user.uid}`, {
        data: applications,
        timestamp: Date.now()
      });

      preloadCache.set(`resumes_${user.uid}`, {
        data: resumes,
        timestamp: Date.now()
      });

      setPreloaded(true);
      console.log('User data preloaded successfully');
    } catch (error) {
      console.error('Failed to preload user data:', error);
    }
  }, [user, preloaded]);

  useEffect(() => {
    if (user) {
      preloadUserData();
    }
  }, [user, preloadUserData]);

  return { preloaded, preloadUserData };
}

// Hook to get preloaded data
export function usePreloadedApplications(): JobApplication[] | null {
  const { user } = useAuth();
  const [data, setData] = useState<JobApplication[] | null>(null);

  useEffect(() => {
    if (!user) return;

    const cacheKey = `applications_${user.uid}`;
    const cached = preloadCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < PRELOAD_CACHE_DURATION) {
      setData(cached.data);
    }
  }, [user]);

  return data;
}

export function usePreloadedResumes(): Resume[] | null {
  const { user } = useAuth();
  const [data, setData] = useState<Resume[] | null>(null);

  useEffect(() => {
    if (!user) return;

    const cacheKey = `resumes_${user.uid}`;
    const cached = preloadCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < PRELOAD_CACHE_DURATION) {
      setData(cached.data);
    }
  }, [user]);

  return data;
}

// Clear preload cache
export function clearPreloadCache(userId?: string) {
  if (userId) {
    preloadCache.delete(`applications_${userId}`);
    preloadCache.delete(`resumes_${userId}`);
  } else {
    preloadCache.clear();
  }
}
