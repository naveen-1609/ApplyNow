/**
 * Cache Monitor Component
 * Debug component to monitor cache performance and request patterns
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCacheStats } from '@/lib/services/cached-services';
import { globalCache } from '@/lib/cache/global-cache';

interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  pendingRequests: number;
  memoryUsage: number;
}

export function CacheMonitor() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateStats = () => {
    const cacheStats = getCacheStats();
    setStats(cacheStats);
  };

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  const clearCache = () => {
    globalCache.clear();
    updateStats();
  };

  const cleanupCache = () => {
    globalCache.cleanup();
    updateStats();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-background/80 backdrop-blur-sm"
        >
          Cache Stats
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="bg-background/95 backdrop-blur-sm border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Cache Monitor</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats && (
            <>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Total Entries</div>
                  <Badge variant="outline">{stats.totalEntries}</Badge>
                </div>
                <div>
                  <div className="text-muted-foreground">Valid Entries</div>
                  <Badge variant="default">{stats.validEntries}</Badge>
                </div>
                <div>
                  <div className="text-muted-foreground">Expired</div>
                  <Badge variant="destructive">{stats.expiredEntries}</Badge>
                </div>
                <div>
                  <div className="text-muted-foreground">Pending</div>
                  <Badge variant="secondary">{stats.pendingRequests}</Badge>
                </div>
              </div>
              
              <div className="text-xs">
                <div className="text-muted-foreground">Memory Usage</div>
                <div className="font-mono">{(stats.memoryUsage / 1024).toFixed(1)} KB</div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cleanupCache}
                  className="text-xs h-7"
                >
                  Cleanup
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearCache}
                  className="text-xs h-7"
                >
                  Clear All
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
