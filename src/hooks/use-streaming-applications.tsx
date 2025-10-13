import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { streamingDataService } from '@/lib/services/streaming-data';
import type { JobApplication } from '@/lib/types';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

interface StreamingApplicationsState {
  applications: JobApplication[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  lastDoc: QueryDocumentSnapshot | null;
}

export function useStreamingApplications(pageSize: number = 20) {
  const { user } = useAuth();
  const [state, setState] = useState<StreamingApplicationsState>({
    applications: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    error: null,
    lastDoc: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load initial data
  const loadInitial = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await streamingDataService.getInitialApplications(user.uid, pageSize);
      
      setState(prev => ({
        ...prev,
        applications: result.applications,
        hasMore: result.hasMore,
        lastDoc: result.lastDoc,
        loading: false
      }));
    } catch (error) {
      console.error('Error loading initial applications:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load applications',
        loading: false
      }));
    }
  }, [user, pageSize]);

  // Load more data
  const loadMore = useCallback(async () => {
    if (!user || !state.hasMore || state.loadingMore || !state.lastDoc) return;

    setState(prev => ({ ...prev, loadingMore: true, error: null }));

    try {
      const result = await streamingDataService.loadMoreApplications(
        user.uid, 
        state.lastDoc, 
        pageSize
      );

      setState(prev => ({
        ...prev,
        applications: [...prev.applications, ...result.applications],
        hasMore: result.hasMore,
        lastDoc: result.lastDoc,
        loadingMore: false
      }));
    } catch (error) {
      console.error('Error loading more applications:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load more applications',
        loadingMore: false
      }));
    }
  }, [user, state.hasMore, state.loadingMore, state.lastDoc, pageSize]);

  // Stream all data progressively
  const streamAll = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, loading: true, error: null, applications: [] }));

    // Cancel any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const allApplications: JobApplication[] = [];
      
      for await (const batch of streamingDataService.streamApplications(user.uid, pageSize)) {
        // Check if stream was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        allApplications.push(...batch);
        
        // Update state progressively
        setState(prev => ({
          ...prev,
          applications: [...allApplications],
          loading: false
        }));

        // Small delay to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error streaming applications:', error);
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false
        }));
      }
    }
  }, [user, pageSize]);

  // Refresh data
  const refresh = useCallback(async () => {
    if (!user) return;
    
    // Invalidate cache
    streamingDataService.invalidateCache(user.uid);
    
    // Reload initial data
    await loadInitial();
  }, [user, loadInitial]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    ...state,
    loadMore,
    streamAll,
    refresh
  };
}
