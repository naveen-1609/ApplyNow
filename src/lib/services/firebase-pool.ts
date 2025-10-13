// Firebase Connection Pool and Advanced Caching
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Query,
} from 'firebase/firestore';

// Advanced caching with TTL and LRU eviction
class FirebasePool {
  private queryCache = new Map<string, { data: any; timestamp: number; hits: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;
  private readonly MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes max age

  // Connection pooling simulation
  private activeConnections = 0;
  private readonly MAX_CONNECTIONS = 10;
  private connectionQueue: Array<() => void> = [];

  // Execute query with connection pooling and caching
  async executeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: {
      useCache?: boolean;
      cacheTTL?: number;
      priority?: 'high' | 'normal' | 'low';
    } = {}
  ): Promise<T> {
    const { useCache = true, cacheTTL = this.CACHE_DURATION, priority = 'normal' } = options;

    // Check cache first
    if (useCache && this.queryCache.has(queryKey)) {
      const cached = this.queryCache.get(queryKey)!;
      if (Date.now() - cached.timestamp < cacheTTL) {
        cached.hits++;
        return cached.data;
      } else {
        this.queryCache.delete(queryKey);
      }
    }

    // Wait for available connection
    await this.waitForConnection();

    try {
      const result = await queryFn();
      
      // Cache result
      if (useCache) {
        this.cacheResult(queryKey, result);
      }
      
      return result;
    } finally {
      this.releaseConnection();
    }
  }

  private async waitForConnection(): Promise<void> {
    if (this.activeConnections < this.MAX_CONNECTIONS) {
      this.activeConnections++;
      return;
    }

    return new Promise((resolve) => {
      this.connectionQueue.push(resolve);
    });
  }

  private releaseConnection(): void {
    this.activeConnections--;
    if (this.connectionQueue.length > 0) {
      const next = this.connectionQueue.shift()!;
      this.activeConnections++;
      next();
    }
  }

  private cacheResult(key: string, data: any) {
    // Implement LRU cache eviction
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      // Remove least recently used item
      let oldestKey = '';
      let oldestTime = Date.now();
      let leastHits = Infinity;

      for (const [cacheKey, value] of this.queryCache.entries()) {
        if (value.hits < leastHits || 
            (value.hits === leastHits && value.timestamp < oldestTime)) {
          oldestKey = cacheKey;
          oldestTime = value.timestamp;
          leastHits = value.hits;
        }
      }

      if (oldestKey) {
        this.queryCache.delete(oldestKey);
      }
    }

    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 1
    });
  }

  // Batch operations for better performance
  async batchExecute<T>(
    operations: Array<{
      key: string;
      operation: () => Promise<T>;
      cache?: boolean;
    }>
  ): Promise<T[]> {
    const results: T[] = [];
    
    // Execute high priority operations first
    const sortedOps = operations.sort((a, b) => {
      const aPriority = a.key.includes('critical') ? 1 : 0;
      const bPriority = b.key.includes('critical') ? 1 : 0;
      return bPriority - aPriority;
    });

    // Execute in parallel with connection pooling
    const promises = sortedOps.map(async (op) => {
      return this.executeQuery(op.key, op.operation, { useCache: op.cache });
    });

    const batchResults = await Promise.allSettled(promises);
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('Batch operation failed:', result.reason);
      }
    });

    return results;
  }

  // Clear cache for specific user or pattern
  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  // Get cache statistics
  getCacheStats() {
    const totalHits = Array.from(this.queryCache.values())
      .reduce((sum, item) => sum + item.hits, 0);
    
    return {
      size: this.queryCache.size,
      totalHits,
      hitRate: totalHits / (totalHits + this.queryCache.size),
      activeConnections: this.activeConnections,
      queuedConnections: this.connectionQueue.length
    };
  }

  // Cleanup old cache entries
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > this.MAX_CACHE_AGE) {
        this.queryCache.delete(key);
      }
    }
  }
}

export const firebasePool = new FirebasePool();

// Cleanup cache every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    firebasePool.cleanup();
  }, 10 * 60 * 1000);
}

// Optimized query functions
export const getApplicationsOptimized = async (userId: string): Promise<any[]> => {
  const queryKey = `applications_${userId}`;
  
  return firebasePool.executeQuery(queryKey, async () => {
    if (!db) throw new Error("Firestore is not initialized.");
    
    const applicationsCol = collection(db, 'job_applications');
    const q = query(
      applicationsCol,
      where('user_id', '==', userId),
      orderBy('last_updated', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      job_id: doc.id,
      user_id: doc.data().user_id,
      company_name: doc.data().company_name,
      job_title: doc.data().job_title,
      job_link: doc.data().job_link,
      job_description: doc.data().job_description,
      resume_id: doc.data().resume_id,
      status: doc.data().status,
      applied_date: doc.data().applied_date.toDate(),
      last_updated: doc.data().last_updated.toDate(),
    }));
  }, { priority: 'high' });
};

export const getResumesOptimized = async (userId: string): Promise<any[]> => {
  const queryKey = `resumes_${userId}`;
  
  return firebasePool.executeQuery(queryKey, async () => {
    if (!db) return [];
    
    const resumesCol = collection(db, 'resumes');
    const q = query(
      resumesCol,
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      resume_id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at.toDate(),
    }));
  }, { priority: 'high' });
};

// Batch operations for dashboard
export const getDashboardDataOptimized = async (userId: string) => {
  const operations = [
    {
      key: `applications_${userId}`,
      operation: () => getApplicationsOptimized(userId),
      cache: true
    },
    {
      key: `resumes_${userId}`,
      operation: () => getResumesOptimized(userId),
      cache: true
    }
  ];

  return firebasePool.batchExecute(operations);
};
