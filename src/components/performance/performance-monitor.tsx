'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0,
  });

  useEffect(() => {
    // Monitor performance metrics with throttling
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const loadTime = (entry as any).loadEventEnd - (entry as any).loadEventStart;
          setMetrics(prev => {
            // Only update if the value actually changed to prevent unnecessary re-renders
            if (prev.loadTime !== loadTime) {
              return { ...prev, loadTime };
            }
            return prev;
          });
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'measure'] });

    // Monitor memory usage with throttling
    let memoryCheckInterval: NodeJS.Timeout;
    if ('memory' in performance) {
      memoryCheckInterval = setInterval(() => {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics(prev => {
          // Only update if the value changed significantly (more than 1MB difference)
          if (Math.abs(prev.memoryUsage - memoryUsage) > 1) {
            return { ...prev, memoryUsage };
          }
          return prev;
        });
      }, 5000); // Check every 5 seconds instead of on every render
    }

    // Monitor network requests with throttling
    const originalFetch = window.fetch;
    let requestCount = 0;
    let lastUpdateTime = 0;
    
    window.fetch = function(...args) {
      requestCount++;
      const now = Date.now();
      
      // Only update metrics every 2 seconds to prevent excessive re-renders
      if (now - lastUpdateTime > 2000) {
        setMetrics(prev => ({
          ...prev,
          networkRequests: requestCount,
        }));
        lastUpdateTime = now;
      }
      
      return originalFetch.apply(this, args);
    };

    return () => {
      observer.disconnect();
      if (memoryCheckInterval) {
        clearInterval(memoryCheckInterval);
      }
      window.fetch = originalFetch;
    };
  }, []);

  const getPerformanceStatus = (loadTime: number) => {
    if (loadTime < 1000) return { status: 'excellent', color: 'bg-green-500' };
    if (loadTime < 2000) return { status: 'good', color: 'bg-yellow-500' };
    if (loadTime < 3000) return { status: 'fair', color: 'bg-orange-500' };
    return { status: 'poor', color: 'bg-red-500' };
  };

  const performanceStatus = getPerformanceStatus(metrics.loadTime);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Performance Monitor
          <Badge className={performanceStatus.color}>
            {performanceStatus.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          Real-time performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">Load Time</div>
            <div className="text-muted-foreground">
              {metrics.loadTime.toFixed(0)}ms
            </div>
          </div>
          <div>
            <div className="font-medium">Memory Usage</div>
            <div className="text-muted-foreground">
              {metrics.memoryUsage.toFixed(1)}MB
            </div>
          </div>
          <div>
            <div className="font-medium">Network Requests</div>
            <div className="text-muted-foreground">
              {metrics.networkRequests}
            </div>
          </div>
          <div>
            <div className="font-medium">Cache Hit Rate</div>
            <div className="text-muted-foreground">
              {metrics.cacheHitRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
