import { useEffect, useState } from 'react';

interface LoadingMonitorProps {
  loading: boolean;
  pageName: string;
}

export function LoadingMonitor({ loading, pageName }: LoadingMonitorProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);

  useEffect(() => {
    if (loading && !startTime) {
      setStartTime(Date.now());
      setLoadTime(null);
    } else if (!loading && startTime) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      setLoadTime(duration);
      setStartTime(null);
      
      // Log performance metrics
      console.log(`🚀 ${pageName} loaded in ${duration}ms`);
      
      // Warn if loading takes too long
      if (duration > 3000) {
        console.warn(`⚠️ ${pageName} took ${duration}ms to load (slow)`);
      }
    }
  }, [loading, startTime, pageName]);

  // Don't render anything, just monitor
  return null;
}

// Hook to track loading performance
export function useLoadingPerformance(pageName: string) {
  const [metrics, setMetrics] = useState<{
    loadTime: number | null;
    isSlow: boolean;
  }>({
    loadTime: null,
    isSlow: false
  });

  const trackLoading = (loading: boolean) => {
    if (loading) {
      setMetrics({ loadTime: null, isSlow: false });
    }
  };

  const trackLoaded = (loadTime: number) => {
    setMetrics({
      loadTime,
      isSlow: loadTime > 3000
    });
  };

  return { metrics, trackLoading, trackLoaded };
}
