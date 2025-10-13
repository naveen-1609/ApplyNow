// Redis Caching Layer for High-Performance Scaling
// This will be used when you implement Redis in Phase 2+

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  serialize?: boolean;
}

class RedisCache {
  private client: any = null;
  private isConnected = false;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      // Dynamic import to avoid build issues if Redis is not installed
      const Redis = await import('redis');
      this.client = Redis.createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
        },
        password: this.config.password,
        database: this.config.db || 0,
      });

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('Redis not available, falling back to memory cache:', error);
      this.isConnected = false;
    }
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const fullKey = this.getFullKey(key, options.prefix);
      const value = await this.client.get(fullKey);
      
      if (value) {
        return options.serialize !== false ? JSON.parse(value) : value;
      }
      return null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key, options.prefix);
      const serializedValue = options.serialize !== false ? JSON.stringify(value) : value;
      
      if (options.ttl) {
        await this.client.setEx(fullKey, options.ttl, serializedValue);
      } else {
        await this.client.set(fullKey, serializedValue);
      }
      
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key, options.prefix);
      await this.client.del(fullKey);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.getFullKey(key, options.prefix);
      const result = await this.client.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async mget<T>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    if (!this.isConnected || !this.client) {
      return keys.map(() => null);
    }

    try {
      const fullKeys = keys.map(key => this.getFullKey(key, options.prefix));
      const values = await this.client.mGet(fullKeys);
      
      return values.map((value: string | null) => {
        if (value) {
          return options.serialize !== false ? JSON.parse(value) : value;
        }
        return null;
      });
    } catch (error) {
      console.error('Redis MGET error:', error);
      return keys.map(() => null);
    }
  }

  async mset<T>(keyValuePairs: Array<{ key: string; value: T }>, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const pairs: string[] = [];
      keyValuePairs.forEach(({ key, value }) => {
        const fullKey = this.getFullKey(key, options.prefix);
        const serializedValue = options.serialize !== false ? JSON.stringify(value) : value;
        pairs.push(fullKey, serializedValue);
      });

      await this.client.mSet(pairs);
      
      // Set TTL for all keys if specified
      if (options.ttl) {
        const ttlPromises = keyValuePairs.map(({ key }) => {
          const fullKey = this.getFullKey(key, options.prefix);
          return this.client.expire(fullKey, options.ttl!);
        });
        await Promise.all(ttlPromises);
      }
      
      return true;
    } catch (error) {
      console.error('Redis MSET error:', error);
      return false;
    }
  }

  async flushPattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const fullPattern = this.getFullKey(pattern, options.prefix);
      const keys = await this.client.keys(fullPattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      
      return keys.length;
    } catch (error) {
      console.error('Redis FLUSH PATTERN error:', error);
      return 0;
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    memory: any;
    info: any;
  }> {
    if (!this.isConnected || !this.client) {
      return {
        connected: false,
        memory: null,
        info: null,
      };
    }

    try {
      const [memory, info] = await Promise.all([
        this.client.memory('usage'),
        this.client.info('memory'),
      ]);

      return {
        connected: true,
        memory,
        info,
      };
    } catch (error) {
      console.error('Redis STATS error:', error);
      return {
        connected: false,
        memory: null,
        info: null,
      };
    }
  }

  private getFullKey(key: string, prefix?: string): string {
    const basePrefix = 'applynow';
    const fullPrefix = prefix ? `${basePrefix}:${prefix}` : basePrefix;
    return `${fullPrefix}:${key}`;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Cache configuration
const cacheConfig: CacheConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
};

// Global Redis cache instance
export const redisCache = new RedisCache(cacheConfig);

// Cache decorators for easy use
export function Cacheable(ttl: number = 300, prefix?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyName}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      const cached = await redisCache.get(cacheKey, { ttl, prefix });
      if (cached) {
        return cached;
      }

      // Execute method and cache result
      const result = await method.apply(this, args);
      await redisCache.set(cacheKey, result, { ttl, prefix });
      
      return result;
    };
  };
}

// Utility functions for common caching patterns
export const cacheUtils = {
  // User-specific caching
  async getUserData<T>(userId: string, dataType: string, fetcher: () => Promise<T>, ttl: number = 300): Promise<T> {
    const cacheKey = `user:${userId}:${dataType}`;
    
    const cached = await redisCache.get<T>(cacheKey, { ttl });
    if (cached) {
      return cached;
    }

    const data = await fetcher();
    await redisCache.set(cacheKey, data, { ttl });
    
    return data;
  },

  // Invalidate user cache
  async invalidateUserCache(userId: string): Promise<void> {
    await redisCache.flushPattern(`user:${userId}:*`);
  },

  // Application data caching
  async getApplications(userId: string, fetcher: () => Promise<any[]>): Promise<any[]> {
    return cacheUtils.getUserData(userId, 'applications', fetcher, 300);
  },

  // Resume data caching
  async getResumes(userId: string, fetcher: () => Promise<any[]>): Promise<any[]> {
    return cacheUtils.getUserData(userId, 'resumes', fetcher, 300);
  },

  // Dashboard data caching
  async getDashboardData(userId: string, fetcher: () => Promise<any>): Promise<any> {
    return cacheUtils.getUserData(userId, 'dashboard', fetcher, 180); // 3 minutes
  },
};

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await redisCache.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await redisCache.disconnect();
    process.exit(0);
  });
}
