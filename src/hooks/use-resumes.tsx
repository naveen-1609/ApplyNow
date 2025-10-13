import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { getResumes } from '@/lib/services/resumes';
import type { Resume } from '@/lib/types';

// Enhanced in-memory cache with background refresh
const cache = new Map<string, { 
  data: Resume[]; 
  timestamp: number; 
  isRefreshing?: boolean;
  refreshPromise?: Promise<Resume[]>;
}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BACKGROUND_REFRESH_THRESHOLD = 4 * 60 * 1000; // 4 minutes - refresh in background

export function useResumes() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false); // Start with false
  const [error, setError] = useState<string | null>(null);
  const backgroundRefreshTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchResumes = useCallback(async (forceRefresh = false, backgroundRefresh = false) => {
    if (!user) return;

    const cacheKey = `resumes_${user.uid}`;
    const cached = cache.get(cacheKey);
    
    // Return cached data if it's still valid and not forcing refresh
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setResumes(cached.data);
      if (!backgroundRefresh) {
        setLoading(false);
      }
      
      // Schedule background refresh if data is getting stale
      if (Date.now() - cached.timestamp > BACKGROUND_REFRESH_THRESHOLD && !cached.isRefreshing) {
        fetchResumes(false, true);
      }
      return cached.data;
    }

    // If there's already a refresh in progress, wait for it
    if (cached?.isRefreshing && cached.refreshPromise) {
      try {
        const result = await cached.refreshPromise;
        setResumes(result);
        if (!backgroundRefresh) {
          setLoading(false);
        }
        return result;
      } catch (err) {
        console.error("Background refresh failed", err);
        if (!backgroundRefresh) {
          setError(err instanceof Error ? err.message : 'Failed to fetch resumes');
          setLoading(false);
        }
        return cached.data || [];
      }
    }

    if (!backgroundRefresh) {
      setLoading(true);
      setError(null);
    }
    
    // Create refresh promise to prevent duplicate requests
    const refreshPromise = (async () => {
      try {
        const userResumes = await getResumes(user.uid);
        
        // Cache the results
        cache.set(cacheKey, {
          data: userResumes,
          timestamp: Date.now(),
          isRefreshing: false
        });
        
        setResumes(userResumes);
        return userResumes;
      } catch (err) {
        console.error("Failed to fetch resumes", err);
        if (!backgroundRefresh) {
          setError(err instanceof Error ? err.message : 'Failed to fetch resumes');
        }
        throw err;
      } finally {
        if (!backgroundRefresh) {
          setLoading(false);
        }
      }
    })();

    // Mark as refreshing
    cache.set(cacheKey, {
      data: cached?.data || [],
      timestamp: cached?.timestamp || Date.now(),
      isRefreshing: true,
      refreshPromise
    });

    return refreshPromise;
  }, [user]);

  const invalidateCache = useCallback(() => {
    if (user) {
      cache.delete(`resumes_${user.uid}`);
    }
  }, [user]);

  // Optimistic update function
  const optimisticUpdate = useCallback((newResume: Resume) => {
    setResumes(prev => [newResume, ...prev]);
    
    // Update cache optimistically
    if (user) {
      const cacheKey = `resumes_${user.uid}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        cache.set(cacheKey, {
          ...cached,
          data: [newResume, ...cached.data]
        });
      }
    }
  }, [user]);

  // Optimistic delete function
  const optimisticDelete = useCallback((resumeId: string) => {
    setResumes(prev => prev.filter(resume => resume.resume_id !== resumeId));
    
    // Update cache optimistically
    if (user) {
      const cacheKey = `resumes_${user.uid}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        cache.set(cacheKey, {
          ...cached,
          data: cached.data.filter(resume => resume.resume_id !== resumeId)
        });
      }
    }
  }, [user]);

  // Optimistic update function for existing resumes
  const optimisticUpdateExisting = useCallback((updatedResume: Resume) => {
    setResumes(prev => prev.map(resume => 
      resume.resume_id === updatedResume.resume_id ? updatedResume : resume
    ));
    
    // Update cache optimistically
    if (user) {
      const cacheKey = `resumes_${user.uid}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        cache.set(cacheKey, {
          ...cached,
          data: cached.data.map(resume => 
            resume.resume_id === updatedResume.resume_id ? updatedResume : resume
          )
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Fetch immediately without delay
      fetchResumes();
      
      return () => {
        if (backgroundRefreshTimeoutRef.current) {
          clearTimeout(backgroundRefreshTimeoutRef.current);
        }
      };
    } else {
      // Reset state when user logs out
      setResumes([]);
      setLoading(false);
      setError(null);
    }
  }, [fetchResumes, user]);

  // Memoized computed values
  const resumeCount = useMemo(() => resumes.length, [resumes]);

  return {
    resumes,
    loading,
    error,
    resumeCount,
    refetch: () => fetchResumes(true),
    invalidateCache,
    optimisticUpdate,
    optimisticDelete,
    optimisticUpdateExisting
  };
}
