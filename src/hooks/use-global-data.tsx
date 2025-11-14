/**
 * Global Data Hook
 * Single hook that manages all application data with intelligent caching
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { getCachedUserData, invalidateUserCache } from '@/lib/services/cached-services';
import { globalCache } from '@/lib/cache/global-cache';
import type { JobApplication, Resume, User, Target, Schedule } from '@/lib/types';

interface GlobalDataState {
  applications: JobApplication[];
  resumes: Resume[];
  userSettings: User | null;
  todayTarget: Target | null;
  schedule: Schedule | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface GlobalDataActions {
  refetch: () => Promise<void>;
  invalidateCache: () => void;
  updateApplication: (application: JobApplication) => void;
  addApplication: (application: JobApplication) => void;
  removeApplication: (applicationId: string) => void;
  updateResume: (resume: Resume) => void;
  addResume: (resume: Resume) => void;
  removeResume: (resumeId: string) => void;
}

export function useGlobalData(): GlobalDataState & GlobalDataActions {
  const { user } = useAuth();
  const [state, setState] = useState<GlobalDataState>({
    applications: [],
    resumes: [],
    userSettings: null,
    todayTarget: null,
    schedule: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  // Fetch all user data
  const fetchData = useCallback(async () => {
    if (!user) {
      setState(prev => ({
        ...prev,
        applications: [],
        resumes: [],
        userSettings: null,
        todayTarget: null,
        schedule: null,
        loading: false,
        error: null,
        lastUpdated: null,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await getCachedUserData(user.uid);
      
      setState(prev => ({
        ...prev,
        applications: data.applications,
        resumes: data.resumes,
        userSettings: data.userSettings,
        todayTarget: data.todayTarget,
        schedule: data.schedule,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to fetch global data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
      }));
    }
  }, [user]);

  // Refetch data (bypass cache)
  const refetch = useCallback(async () => {
    if (!user) return;
    
    globalCache.clear(); // Clear all caches before refetching
    await fetchData();
  }, [user, fetchData]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    if (user) {
      invalidateUserCache(user.uid);
    }
  }, [user]);

  // Update application in state
  const updateApplication = useCallback((application: JobApplication) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      applications: prev.applications.map(app => 
        app.application_id === application.application_id ? application : app
      ),
    }));
    
    // Invalidate cache to ensure fresh data on next fetch
    invalidateUserCache(user.uid);
  }, [user]);

  // Add application to state
  const addApplication = useCallback((application: JobApplication) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      applications: [...prev.applications, application],
    }));
    
    // Invalidate cache to ensure fresh data on next fetch
    invalidateUserCache(user.uid);
  }, [user]);

  // Remove application from state
  const removeApplication = useCallback((applicationId: string) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      applications: prev.applications.filter(app => app.application_id !== applicationId),
    }));
    
    // Invalidate cache to ensure fresh data on next fetch
    invalidateUserCache(user.uid);
  }, [user]);

  // Update resume in state
  const updateResume = useCallback((resume: Resume) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      resumes: prev.resumes.map(r => 
        r.resume_id === resume.resume_id ? resume : r
      ),
    }));
    
    // Invalidate cache to ensure fresh data on next fetch
    invalidateUserCache(user.uid);
  }, [user]);

  // Add resume to state
  const addResume = useCallback((resume: Resume) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      resumes: [...prev.resumes, resume],
    }));
    
    // Invalidate cache to ensure fresh data on next fetch
    invalidateUserCache(user.uid);
  }, [user]);

  // Remove resume from state
  const removeResume = useCallback((resumeId: string) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      resumes: prev.resumes.filter(r => r.resume_id !== resumeId),
    }));
    
    // Invalidate cache to ensure fresh data on next fetch
    invalidateUserCache(user.uid);
  }, [user]);

  // Fetch data when user changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed stats
  const stats = useMemo(() => {
    const applications = state.applications;
    return {
      totalApplications: applications.length,
      totalInterviews: applications.filter(app => 
        app.status === 'Interview' || app.status === 'Interview Scheduled'
      ).length,
      totalOffers: applications.filter(app => app.status === 'Offer').length,
      totalRejections: applications.filter(app => app.status === 'Rejected').length,
      pendingApplications: applications.filter(app => 
        app.status === 'Applied' || app.status === 'Under Review'
      ).length,
    };
  }, [state.applications]);

  return {
    ...state,
    stats,
    refetch,
    invalidateCache,
    updateApplication,
    addApplication,
    removeApplication,
    updateResume,
    addResume,
    removeResume,
  };
}
