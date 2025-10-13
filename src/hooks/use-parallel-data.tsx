import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useApplications } from '@/hooks/use-applications';
import { useResumes } from '@/hooks/use-resumes';
import type { JobApplication, Resume } from '@/lib/types';

interface ParallelDataState {
  applications: JobApplication[];
  resumes: Resume[];
  loading: boolean;
  error: string | null;
  applicationsLoading: boolean;
  resumesLoading: boolean;
}

export function useParallelData() {
  const { user } = useAuth();
  const applicationsHook = useApplications();
  const resumesHook = useResumes();
  
  const [state, setState] = useState<ParallelDataState>({
    applications: [],
    resumes: [],
    loading: false, // Start with false, will be set to true only when user exists
    error: null,
    applicationsLoading: false,
    resumesLoading: false
  });

  // Update state when individual hooks change
  useEffect(() => {
    // Only show loading if user exists and hooks are actually loading
    const shouldShowLoading = user && (applicationsHook.loading || resumesHook.loading);
    
    setState(prev => ({
      ...prev,
      applications: applicationsHook.applications,
      resumes: resumesHook.resumes,
      applicationsLoading: applicationsHook.loading,
      resumesLoading: resumesHook.loading,
      loading: shouldShowLoading || false,
      error: applicationsHook.error || resumesHook.error
    }));
  }, [
    user,
    applicationsHook.applications,
    applicationsHook.loading,
    applicationsHook.error,
    resumesHook.resumes,
    resumesHook.loading,
    resumesHook.error
  ]);

  // Parallel refresh function
  const refreshAll = useCallback(async () => {
    if (!user) return;
    
    try {
      // Refresh both data sources in parallel
      await Promise.all([
        applicationsHook.refetch(),
        resumesHook.refetch()
      ]);
    } catch (error) {
      console.error('Failed to refresh parallel data:', error);
    }
  }, [user, applicationsHook.refetch, resumesHook.refetch]);

  // Invalidate all caches
  const invalidateAllCaches = useCallback(() => {
    applicationsHook.invalidateCache();
    resumesHook.invalidateCache();
  }, [applicationsHook.invalidateCache, resumesHook.invalidateCache]);

  // Memoized computed values
  const stats = useMemo(() => {
    const totalApplications = state.applications.length;
    const totalResumes = state.resumes.length;
    const totalInterviews = state.applications.filter(
      (app) => app.status === 'Interviewing' || app.status === 'Offer'
    ).length;
    const totalOffers = state.applications.filter(
      (app) => app.status === 'Offer'
    ).length;
    const totalRejections = state.applications.filter(
      (app) => app.status === 'Rejected'
    ).length;

    return {
      totalApplications,
      totalResumes,
      totalInterviews,
      totalOffers,
      totalRejections
    };
  }, [state.applications, state.resumes]);

  return {
    // Data
    applications: state.applications,
    resumes: state.resumes,
    
    // Loading states
    loading: state.loading,
    applicationsLoading: state.applicationsLoading,
    resumesLoading: state.resumesLoading,
    
    // Error state
    error: state.error,
    
    // Computed values
    stats,
    
    // Actions
    refreshAll,
    invalidateAllCaches,
    
    // Individual hook access for optimistic updates
    applicationsHook,
    resumesHook
  };
}
