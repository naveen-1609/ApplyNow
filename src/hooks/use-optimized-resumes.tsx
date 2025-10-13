import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { optimizedDataService } from '@/lib/services/optimized-data';
import type { Resume } from '@/lib/types';

export function useOptimizedResumes() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResumes = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    if (forceRefresh) {
      optimizedDataService.clearCache(`resumes_${user.uid}`);
    }

    setLoading(true);
    setError(null);

    try {
      const userResumes = await optimizedDataService.getResumes(user.uid);
      setResumes(userResumes);
    } catch (err) {
      console.error("Failed to fetch resumes", err);
      setError(err instanceof Error ? err.message : 'Failed to fetch resumes');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Optimistic update function
  const optimisticUpdate = useCallback((newResume: Resume) => {
    setResumes(prev => [newResume, ...prev]);
  }, []);

  // Optimistic delete function
  const optimisticDelete = useCallback((resumeId: string) => {
    setResumes(prev => prev.filter(resume => resume.resume_id !== resumeId));
  }, []);

  // Optimistic update function for existing resumes
  const optimisticUpdateExisting = useCallback((updatedResume: Resume) => {
    setResumes(prev => prev.map(resume => 
      resume.resume_id === updatedResume.resume_id ? updatedResume : resume
    ));
  }, []);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    if (user) {
      optimizedDataService.clearCache(`resumes_${user.uid}`);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Add a small delay to allow auth state to fully propagate
      const timer = setTimeout(() => {
        fetchResumes();
      }, 50);
      
      return () => clearTimeout(timer);
    } else {
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
