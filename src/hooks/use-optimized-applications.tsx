import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { optimizedDataService } from '@/lib/services/optimized-data';
import type { JobApplication } from '@/lib/types';

export function useOptimizedApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    if (forceRefresh) {
      optimizedDataService.clearCache(`applications_${user.uid}`);
    }

    setLoading(true);
    setError(null);

    try {
      const userApplications = await optimizedDataService.getApplications(user.uid);
      setApplications(userApplications);
    } catch (err) {
      console.error("Failed to fetch applications", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Optimistic update function
  const optimisticUpdate = useCallback((newApplication: JobApplication) => {
    setApplications(prev => [newApplication, ...prev]);
  }, []);

  // Optimistic delete function
  const optimisticDelete = useCallback((jobId: string) => {
    setApplications(prev => prev.filter(app => app.job_id !== jobId));
  }, []);

  // Optimistic update function for existing applications
  const optimisticUpdateExisting = useCallback((updatedApplication: JobApplication) => {
    setApplications(prev => prev.map(app => 
      app.job_id === updatedApplication.job_id ? updatedApplication : app
    ));
  }, []);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    if (user) {
      optimizedDataService.clearCache(`applications_${user.uid}`);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Add a small delay to allow auth state to fully propagate
      const timer = setTimeout(() => {
        fetchApplications();
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
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
