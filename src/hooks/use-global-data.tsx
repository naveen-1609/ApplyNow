/**
 * Global Data Hook
 * Single hook that manages all application data with intelligent caching
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { getCachedUserData, invalidateUserCache, updateApplicationsCache, updateResumesCache } from '@/lib/services/cached-services';
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
      console.log('🔄 Fetching global data for user:', user.uid);
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

      console.log('✅ Global data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to fetch global data:', error);
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
    
    console.log('🔄 Refetching global data (bypassing cache)');
    invalidateUserCache(user.uid);
    await fetchData();
  }, [user, fetchData]);

  // Invalidate cache
  const invalidateCache = useCallback(() => {
    if (user) {
      invalidateUserCache(user.uid);
      console.log('🗑️ User cache invalidated');
    }
  }, [user]);

  // Update application in cache and state
  const updateApplication = useCallback((application: JobApplication) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      applications: prev.applications.map(app => 
        app.application_id === application.application_id ? application : app
      ),
    }));
    
    // Update cache
    const updatedApplications = state.applications.map(app => 
      app.application_id === application.application_id ? application : app
    );
    updateApplicationsCache(user.uid, updatedApplications);
  }, [user, state.applications]);

  // Add application to cache and state
  const addApplication = useCallback((application: JobApplication) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      applications: [...prev.applications, application],
    }));
    
    // Update cache
    const updatedApplications = [...state.applications, application];
    updateApplicationsCache(user.uid, updatedApplications);
  }, [user, state.applications]);

  // Remove application from cache and state
  const removeApplication = useCallback((applicationId: string) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      applications: prev.applications.filter(app => app.application_id !== applicationId),
    }));
    
    // Update cache
    const updatedApplications = state.applications.filter(app => app.application_id !== applicationId);
    updateApplicationsCache(user.uid, updatedApplications);
  }, [user, state.applications]);

  // Update resume in cache and state
  const updateResume = useCallback((resume: Resume) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      resumes: prev.resumes.map(r => 
        r.resume_id === resume.resume_id ? resume : r
      ),
    }));
    
    // Update cache
    const updatedResumes = state.resumes.map(r => 
      r.resume_id === resume.resume_id ? resume : r
    );
    updateResumesCache(user.uid, updatedResumes);
  }, [user, state.resumes]);

  // Add resume to cache and state
  const addResume = useCallback((resume: Resume) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      resumes: [...prev.resumes, resume],
    }));
    
    // Update cache
    const updatedResumes = [...state.resumes, resume];
    updateResumesCache(user.uid, updatedResumes);
  }, [user, state.resumes]);

  // Remove resume from cache and state
  const removeResume = useCallback((resumeId: string) => {
    if (!user) return;
    
    setState(prev => ({
      ...prev,
      resumes: prev.resumes.filter(r => r.resume_id !== resumeId),
    }));
    
    // Update cache
    const updatedResumes = state.resumes.filter(r => r.resume_id !== resumeId);
    updateResumesCache(user.uid, updatedResumes);
  }, [user, state.resumes]);

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
