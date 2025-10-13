'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Users, Database, Zap } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
  cacheHitRate: number;
  activeUsers: number;
  databaseConnections: number;
  errorRate: number;
}

interface ScalingMetrics {
  currentUsers: number;
  maxCapacity: number;
  responseTime: number;
  throughput: number;
  costPerUser: number;
}

export function ScalingDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    cacheHitRate: 0,
    activeUsers: 0,
    databaseConnections: 0,
    errorRate: 0,
  });

  const [scalingMetrics, setScalingMetrics] = useState<ScalingMetrics>({
    currentUsers: 0,
    maxCapacity: 1000,
    responseTime: 0,
    throughput: 0,
    costPerUser: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    
    // Simulate API call to get real metrics
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update metrics with realistic data
    setMetrics(prev => ({
      ...prev,
      loadTime: Math.random() * 2000 + 500,
      renderTime: Math.random() * 100 + 50,
      memoryUsage: Math.random() * 50 + 20,
      networkRequests: Math.floor(Math.random() * 20) + 5,
      cacheHitRate: Math.random() * 20 + 80,
      activeUsers: Math.floor(Math.random() * 100) + 50,
      databaseConnections: Math.floor(Math.random() * 10) + 5,
      errorRate: Math.random() * 2,
    }));

    setScalingMetrics(prev => ({
      ...prev,
      currentUsers: Math.floor(Math.random() * 500) + 100,
      responseTime: Math.random() * 500 + 100,
      throughput: Math.random() * 1000 + 500,
      costPerUser: Math.random() * 0.5 + 0.1,
    }));

    setIsRefreshing(false);
  };

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getPerformanceStatus = (loadTime: number) => {
    if (loadTime < 1000) return { status: 'Excellent', color: 'bg-green-500', textColor: 'text-green-700' };
    if (loadTime < 2000) return { status: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-700' };
    if (loadTime < 3000) return { status: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-700' };
    return { status: 'Poor', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const getScalingStatus = (currentUsers: number, maxCapacity: number) => {
    const percentage = (currentUsers / maxCapacity) * 100;
    if (percentage < 50) return { status: 'Healthy', color: 'bg-green-500' };
    if (percentage < 80) return { status: 'Warning', color: 'bg-yellow-500' };
    return { status: 'Critical', color: 'bg-red-500' };
  };

  const performanceStatus = getPerformanceStatus(metrics.loadTime);
  const scalingStatus = getScalingStatus(scalingMetrics.currentUsers, scalingMetrics.maxCapacity);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scaling Dashboard</h2>
          <p className="text-muted-foreground">Real-time performance and scaling metrics</p>
        </div>
        <Button onClick={refreshMetrics} disabled={isRefreshing} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Load Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.loadTime.toFixed(0)}ms</div>
            <Badge className={`${performanceStatus.color} ${performanceStatus.textColor} mt-2`}>
              {performanceStatus.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <div className="text-xs text-muted-foreground">
              Capacity: {scalingMetrics.maxCapacity}
            </div>
            <Progress 
              value={(metrics.activeUsers / scalingMetrics.maxCapacity) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cacheHitRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              Target: 90%+
            </div>
            <Progress 
              value={metrics.cacheHitRate} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorRate.toFixed(2)}%</div>
            <div className="text-xs text-muted-foreground">
              Target: &lt;1%
            </div>
            <Progress 
              value={metrics.errorRate * 50} 
              className="mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Scaling Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scaling Status</CardTitle>
            <CardDescription>Current system capacity and performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">System Status</span>
              <Badge className={scalingStatus.color}>
                {scalingStatus.status}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Response Time</span>
                <span>{scalingMetrics.responseTime.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Throughput</span>
                <span>{scalingMetrics.throughput.toFixed(0)} req/s</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cost per User</span>
                <span>${scalingMetrics.costPerUser.toFixed(3)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Detailed performance breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memory Usage</span>
                <span>{metrics.memoryUsage.toFixed(1)}MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Network Requests</span>
                <span>{metrics.networkRequests}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>DB Connections</span>
                <span>{metrics.databaseConnections}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Render Time</span>
                <span>{metrics.renderTime.toFixed(0)}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scaling Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Scaling Recommendations</CardTitle>
          <CardDescription>Based on current performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.loadTime > 2000 && (
              <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-yellow-800">High Load Times Detected</p>
                  <p className="text-sm text-yellow-700">Consider implementing CDN and Redis caching</p>
                </div>
              </div>
            )}
            
            {metrics.cacheHitRate < 80 && (
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-blue-800">Low Cache Hit Rate</p>
                  <p className="text-sm text-blue-700">Optimize caching strategy and increase TTL</p>
                </div>
              </div>
            )}
            
            {scalingMetrics.currentUsers > scalingMetrics.maxCapacity * 0.8 && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-red-800">High User Load</p>
                  <p className="text-sm text-red-700">Consider scaling infrastructure or implementing rate limiting</p>
                </div>
              </div>
            )}
            
            {metrics.errorRate > 1 && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-red-800">High Error Rate</p>
                  <p className="text-sm text-red-700">Investigate error sources and implement better error handling</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
