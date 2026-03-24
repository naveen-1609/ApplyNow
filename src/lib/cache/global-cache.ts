/**
 * Global Application Cache
 * Centralized caching system to reduce API calls and improve performance
 */

import { getCacheTtl, runtimeTuning } from '@/lib/config/runtime-tuning';
import { logger } from '@/lib/utils/logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
}

class GlobalCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();
  
  readonly TTL = {
    APPLICATIONS: getCacheTtl('applicationsTtlMs'),
    RESUMES: getCacheTtl('resumesTtlMs'),
    USER_SETTINGS: getCacheTtl('userSettingsTtlMs'),
    TARGETS: getCacheTtl('todayTargetTtlMs'),
    SCHEDULES: getCacheTtl('schedulesTtlMs'),
    DEFAULT: getCacheTtl('defaultTtlMs'),
  };

  /**
   * Get data from cache or fetch if not available/expired
   */
  async get<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl: number = this.TTL.DEFAULT
  ): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      logger.debug(`Cache hit for ${key}`);
      return cached.data;
    }

    logger.debug(`Cache miss for ${key}`);
    
    // Create pending request
    const request = fetchFn().then(data => {
      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
        key
      });
      
      // Remove from pending
      this.pendingRequests.delete(key);
      
      logger.debug(`Cached ${key}`);
      return data;
    }).catch(error => {
      // Remove from pending on error
      this.pendingRequests.delete(key);
      throw error;
    });

    this.pendingRequests.set(key, request);
    return request;
  }

  /**
   * Set data in cache manually
   */
  set<T>(key: string, data: T, ttl: number = this.TTL.DEFAULT): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    });
    logger.debug(`Manually cached ${key}`);
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    logger.debug(`Invalidated ${key}`);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        logger.debug(`Invalidated pattern match ${key}`);
      }
    }
  }

  /**
   * Invalidate all cache entries for a user
   */
  invalidateUser(userId: string): void {
    this.invalidatePattern(`^user_${userId}_`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    logger.info('Cleared global cache');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const entry of this.cache.values()) {
      if (now - entry.timestamp < entry.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      pendingRequests: this.pendingRequests.size,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned ${cleaned} expired cache entries`);
    }
  }

  // Predefined cache keys
  static KEYS = {
    applications: (userId: string) => `user_${userId}_applications`,
    resumes: (userId: string) => `user_${userId}_resumes`,
    userSettings: (userId: string) => `user_${userId}_settings`,
    targets: (userId: string) => `user_${userId}_targets`,
    schedules: (userId: string) => `user_${userId}_schedules`,
    todayTarget: (userId: string) => `user_${userId}_today_target`,
  };
}

// Global cache instance
export const globalCache = new GlobalCache();

// Auto-cleanup every 5 minutes
setInterval(() => {
  globalCache.cleanup();
}, runtimeTuning.performance.caching.cleanupIntervalMs);

// Export cache instance and TTL constants
export { GlobalCache };
export const CACHE_TTL = globalCache['TTL'];
