import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { getApplications } from '@/lib/services/applications';
import type { JobApplication } from '@/lib/types';

// Enhanced in-memory cache with background refresh
const cache = new Map<string, { 
  data: JobApplication[]; 
  timestamp: number; 
  isRefreshing?: boolean;
  refreshPromise?: Promise<JobApplication[]>;
}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const BACKGROUND_REFRESH_THRESHOLD = 4 * 60 * 1000; // 4 minutes - refresh in background

export function useApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false); // Start with false
  const [error, setError] = useState<string | null>(null);
  const backgroundRefreshTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchApplications = useCallback(async (forceRefresh = false, backgroundRefresh = false) => {
    if (!user) return;

    const cacheKey = `applications_${user.uid}`;
    const cached = cache.get(cacheKey);
    
    // Return cached data if it's still valid and not forcing refresh
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setApplications(cached.data);
      if (!backgroundRefresh) {
        setLoading(false);
      }
      
      // Schedule background refresh if data is getting stale
      if (Date.now() - cached.timestamp > BACKGROUND_REFRESH_THRESHOLD && !cached.isRefreshing) {
        fetchApplications(false, true);
      }
      return cached.data;
    }

    // If there's already a refresh in progress, wait for it
    if (cached?.isRefreshing && cached.refreshPromise) {
      try {
        const result = await cached.refreshPromise;
        setApplications(result);
        if (!backgroundRefresh) {
          setLoading(false);
        }
        return result;
      } catch (err) {
        console.error("Background refresh failed", err);
        if (!backgroundRefresh) {
          setError(err instanceof Error ? err.message : 'Failed to fetch applications');
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
        const userApplications = await getApplications(user.uid);
        
        // Cache the results
        cache.set(cacheKey, {
          data: userApplications,
          timestamp: Date.now(),
          isRefreshing: false
        });
        
        setApplications(userApplications);
        return userApplications;
      } catch (err) {
        console.error("Failed to fetch applications", err);
        if (!backgroundRefresh) {
          setError(err instanceof Error ? err.message : 'Failed to fetch applications');
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
      cache.delete(`applications_${user.uid}`);
    }
  }, [user]);

  // Optimistic update function
  const optimisticUpdate = useCallback((newApplication: JobApplication) => {
    setApplications(prev => [newApplication, ...prev]);
    
    // Update cache optimistically
    if (user) {
      const cacheKey = `applications_${user.uid}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        cache.set(cacheKey, {
          ...cached,
          data: [newApplication, ...cached.data]
        });
      }
    }
  }, [user]);

  // Optimistic delete function
  const optimisticDelete = useCallback((jobId: string) => {
    setApplications(prev => prev.filter(app => app.job_id !== jobId));
    
    // Update cache optimistically
    if (user) {
      const cacheKey = `applications_${user.uid}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        cache.set(cacheKey, {
          ...cached,
          data: cached.data.filter(app => app.job_id !== jobId)
        });
      }
    }
  }, [user]);

  // Optimistic update function for existing applications
  const optimisticUpdateExisting = useCallback((updatedApplication: JobApplication) => {
    setApplications(prev => prev.map(app => 
      app.job_id === updatedApplication.job_id ? updatedApplication : app
    ));
    
    // Update cache optimistically
    if (user) {
      const cacheKey = `applications_${user.uid}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        cache.set(cacheKey, {
          ...cached,
          data: cached.data.map(app => 
            app.job_id === updatedApplication.job_id ? updatedApplication : app
          )
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Fetch immediately without delay
      fetchApplications();
      
      return () => {
        if (backgroundRefreshTimeoutRef.current) {
          clearTimeout(backgroundRefreshTimeoutRef.current);
        }
      };
    } else {
      // Reset state when user logs out
      setApplications([]);
      setLoading(false);
      setError(null);
    }
  }, [fetchApplications, user]);

  // Memoized computed values
  const stats = useMemo(() => {
    const totalApplications = applications.length;
    const totalInterviews = applications.filter(
      (app) => app.status === 'Interviewing' || app.status === 'Offer'
    ).length;
    const totalOffers = applications.filter(
      (app) => app.status === 'Offer'
    ).length;
    const totalRejections = applications.filter(
      (app) => app.status === 'Rejected'
    ).length;

    return {
      totalApplications,
      totalInterviews,
      totalOffers,
      totalRejections
    };
  }, [applications]);

  return {
    applications,
    loading,
    error,
    stats,
    refetch: () => fetchApplications(true),
    invalidateCache,
    optimisticUpdate,
    optimisticDelete,
    optimisticUpdateExisting
  };
}
