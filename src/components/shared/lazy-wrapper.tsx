import { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Generic lazy loading wrapper
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <Skeleton className="h-64 w-full" />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Pre-configured lazy components for common use cases
export const LazyChart = createLazyComponent(
  () => import('@/components/dashboard/applications-over-time-chart'),
  <Skeleton className="h-64 w-full" />
);

export const LazyStatusChart = createLazyComponent(
  () => import('@/components/dashboard/status-breakdown-chart'),
  <Skeleton className="h-64 w-full" />
);

export const LazyAtsChecker = createLazyComponent(
  () => import('@/components/ats-checker/ats-checker-tool'),
  <Skeleton className="h-96 w-full" />
);
