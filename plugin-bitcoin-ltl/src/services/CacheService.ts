import { IAgentRuntime, elizaLogger } from '@elizaos/core';
import { BaseDataService } from './BaseDataService';
import { LoggerWithContext, generateCorrelationId } from '../utils/helpers';
import { handleError, ErrorCategory } from '../utils/comprehensive-error-handling';

/**
 * Cache entry interface
 */
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  metadata?: Record<string, any>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  memoryUsage: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  defaultTtl: number;
  maxSize: number;
  cleanupInterval: number;
  enableRedis: boolean;
  redisUrl?: string;
  redisPassword?: string;
  redisDb?: number;
  compressionEnabled: boolean;
  compressionThreshold: number;
}

/**
 * High-Performance Cache Service
 * Provides memory and Redis caching with TTL management and cache invalidation
 */
export class CacheService extends BaseDataService {
  static serviceType = 'cache-service';
  
  private contextLogger: LoggerWithContext;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private redisClient: any = null;
  private config: CacheConfig;
  private stats: {
    hitCount: number;
    missCount: number;
    evictionCount: number;
    totalSize: number;
  } = {
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    totalSize: 0
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(runtime: IAgentRuntime) {
    super(runtime, 'cacheService');
    this.contextLogger = new LoggerWithContext(generateCorrelationId(), 'CacheService');
    this.config = this.getDefaultConfig();
  }

  public get capabilityDescription(): string {
    return 'Provides high-performance caching with memory and Redis support, TTL management, and cache invalidation strategies';
  }

  static async start(runtime: IAgentRuntime) {
    elizaLogger.info('Starting CacheService...');
    return new CacheService(runtime);
  }

  static async stop(runtime: IAgentRuntime) {
    elizaLogger.info('Stopping CacheService...');
    const service = runtime.getService('cache-service') as CacheService;
    if (service) {
      await service.stop();
    }
  }

  async start(): Promise<void> {
    this.contextLogger.info('CacheService starting...');
    await this.initializeRedis();
    this.startCleanupInterval();
  }

  async init() {
    this.contextLogger.info('CacheService initialized');
  }

  async stop() {
    this.contextLogger.info('CacheService stopping...');
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): CacheConfig {
    return {
      defaultTtl: 300000, // 5 minutes
      maxSize: 1000,
      cleanupInterval: 600000, // 10 minutes
      enableRedis: false,
      redisUrl: this.getSetting('REDIS_URL'),
      redisPassword: this.getSetting('REDIS_PASSWORD'),
      redisDb: parseInt(this.getSetting('REDIS_DB', '0')),
      compressionEnabled: true,
      compressionThreshold: 1024 // 1KB
    };
  }

  /**
   * Initialize Redis connection
   */
  private async initializeRedis(): Promise<void> {
    if (!this.config.enableRedis || !this.config.redisUrl) {
      return;
    }

    try {
      const Redis = await import('ioredis');
      this.redisClient = new Redis.default({
        host: new URL(this.config.redisUrl).hostname,
        port: parseInt(new URL(this.config.redisUrl).port) || 6379,
        password: this.config.redisPassword,
        db: this.config.redisDb,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      });

      await this.redisClient.connect();
      this.contextLogger.info('Redis connection established');
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Redis connection failed'),
        {
          correlationId: this.correlationId,
          component: 'CacheService',
          operation: 'initializeRedis'
        }
      );
      
      this.contextLogger.warn('Failed to connect to Redis, using memory cache only', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.config.enableRedis = false;
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTtl,
        metadata: {
          size: this.getObjectSize(value)
        }
      };

      // Set in memory cache
      this.setInMemory(key, entry);

      // Set in Redis if available
      if (this.redisClient && this.config.enableRedis) {
        await this.setInRedis(key, entry);
      }
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Cache set failed'),
        {
          correlationId: this.correlationId,
          component: 'CacheService',
          operation: 'set',
          params: { key, ttl }
        }
      );
      
      this.contextLogger.error('Failed to set cache entry', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try memory cache first
      const memoryEntry = this.getFromMemory<T>(key);
      if (memoryEntry) {
        this.stats.hitCount++;
        return memoryEntry.value;
      }

      // Try Redis if available
      if (this.redisClient && this.config.enableRedis) {
        const redisEntry = await this.getFromRedis<T>(key);
        if (redisEntry) {
          // Update memory cache
          this.setInMemory(key, redisEntry);
          this.stats.hitCount++;
          return redisEntry.value;
        }
      }

      this.stats.missCount++;
      return null;
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Cache get failed'),
        {
          correlationId: this.correlationId,
          component: 'CacheService',
          operation: 'get',
          params: { key }
        }
      );
      
      this.contextLogger.error('Failed to get cache entry', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      let deleted = false;

      // Delete from memory cache
      if (this.memoryCache.delete(key)) {
        deleted = true;
      }

      // Delete from Redis if available
      if (this.redisClient && this.config.enableRedis) {
        const redisDeleted = await this.redisClient.del(key);
        if (redisDeleted > 0) {
          deleted = true;
        }
      }

      return deleted;
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Cache delete failed'),
        {
          correlationId: this.correlationId,
          component: 'CacheService',
          operation: 'delete',
          params: { key }
        }
      );
      
      this.contextLogger.error('Failed to delete cache entry', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      this.stats.totalSize = 0;

      // Clear Redis if available
      if (this.redisClient && this.config.enableRedis) {
        await this.redisClient.flushdb();
      }

      this.contextLogger.info('Cache cleared');
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Cache clear failed'),
        {
          correlationId: this.correlationId,
          component: 'CacheService',
          operation: 'clear'
        }
      );
      
      this.contextLogger.error('Failed to clear cache', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalEntries = this.memoryCache.size;
    const hitRate = this.stats.hitCount + this.stats.missCount > 0 
      ? this.stats.hitCount / (this.stats.hitCount + this.stats.missCount) 
      : 0;

    return {
      totalEntries,
      totalSize: this.stats.totalSize,
      hitCount: this.stats.hitCount,
      missCount: this.stats.missCount,
      hitRate,
      evictionCount: this.stats.evictionCount,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  /**
   * Set value in memory cache
   */
  private setInMemory<T>(key: string, entry: CacheEntry<T>): void {
    // Check if we need to evict entries
    if (this.memoryCache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.memoryCache.set(key, entry);
    this.stats.totalSize += entry.metadata?.size || 0;
  }

  /**
   * Get value from memory cache
   */
  private getFromMemory<T>(key: string): CacheEntry<T> | null {
    const entry = this.memoryCache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      this.stats.totalSize -= entry.metadata?.size || 0;
      return null;
    }

    return entry;
  }

  /**
   * Set value in Redis
   */
  private async setInRedis<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    const serialized = JSON.stringify(entry);
    const compressed = this.config.compressionEnabled && serialized.length > this.config.compressionThreshold
      ? await this.compress(serialized)
      : serialized;

    await this.redisClient.setex(key, Math.ceil(entry.ttl / 1000), compressed);
  }

  /**
   * Get value from Redis
   */
  private async getFromRedis<T>(key: string): Promise<CacheEntry<T> | null> {
    const compressed = await this.redisClient.get(key);
    
    if (!compressed) {
      return null;
    }

    const serialized = this.config.compressionEnabled && compressed.length > this.config.compressionThreshold
      ? await this.decompress(compressed)
      : compressed;

    const entry: CacheEntry<T> = JSON.parse(serialized);
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      await this.redisClient.del(key);
      return null;
    }

    return entry;
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.memoryCache.get(oldestKey);
      if (entry) {
        this.stats.totalSize -= entry.metadata?.size || 0;
      }
      this.memoryCache.delete(oldestKey);
      this.stats.evictionCount++;
    }
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.memoryCache.delete(key);
        this.stats.totalSize -= entry.metadata?.size || 0;
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.contextLogger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Get object size in bytes
   */
  private getObjectSize(obj: any): number {
    try {
      return JSON.stringify(obj).length;
    } catch {
      return 0;
    }
  }

  /**
   * Compress data
   */
  private async compress(data: string): Promise<string> {
    try {
      const { gzip } = await import('zlib');
      const { promisify } = await import('util');
      const gzipAsync = promisify(gzip);
      
      const buffer = await gzipAsync(Buffer.from(data, 'utf8'));
      return buffer.toString('base64');
    } catch {
      return data;
    }
  }

  /**
   * Decompress data
   */
  private async decompress(data: string): Promise<string> {
    try {
      const { gunzip } = await import('zlib');
      const { promisify } = await import('util');
      const gunzipAsync = promisify(gunzip);
      
      const buffer = Buffer.from(data, 'base64');
      const decompressed = await gunzipAsync(buffer);
      return decompressed.toString('utf8');
    } catch {
      return data;
    }
  }

  /**
   * Get cache keys matching pattern
   */
  async getKeys(pattern: string = '*'): Promise<string[]> {
    try {
      const keys: string[] = [];

      // Get from memory cache
      for (const key of this.memoryCache.keys()) {
        if (this.matchesPattern(key, pattern)) {
          keys.push(key);
        }
      }

      // Get from Redis if available
      if (this.redisClient && this.config.enableRedis) {
        const redisKeys = await this.redisClient.keys(pattern);
        keys.push(...redisKeys);
      }

      return [...new Set(keys)]; // Remove duplicates
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Get keys failed'),
        {
          correlationId: this.correlationId,
          component: 'CacheService',
          operation: 'getKeys',
          params: { pattern }
        }
      );
      
      return [];
    }
  }

  /**
   * Check if key matches pattern
   */
  private matchesPattern(key: string, pattern: string): boolean {
    if (pattern === '*') return true;
    
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(key);
  }

  /**
   * Invalidate cache entries matching pattern
   */
  async invalidate(pattern: string): Promise<number> {
    try {
      let invalidatedCount = 0;

      // Invalidate from memory cache
      for (const key of this.memoryCache.keys()) {
        if (this.matchesPattern(key, pattern)) {
          const entry = this.memoryCache.get(key);
          if (entry) {
            this.stats.totalSize -= entry.metadata?.size || 0;
          }
          this.memoryCache.delete(key);
          invalidatedCount++;
        }
      }

      // Invalidate from Redis if available
      if (this.redisClient && this.config.enableRedis) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
          invalidatedCount += keys.length;
        }
      }

      this.contextLogger.info(`Invalidated ${invalidatedCount} cache entries matching pattern: ${pattern}`);
      return invalidatedCount;
    } catch (error) {
      await handleError(
        error instanceof Error ? error : new Error('Cache invalidation failed'),
        {
          correlationId: this.correlationId,
          component: 'CacheService',
          operation: 'invalidate',
          params: { pattern }
        }
      );
      
      this.contextLogger.error('Failed to invalidate cache entries', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  async updateData(): Promise<void> {
    // Cache service doesn't need regular updates
  }

  async forceUpdate(): Promise<any> {
    return this.getStats();
  }
} 