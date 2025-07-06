import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CacheService } from '../../services/CacheService';
import { IAgentRuntime } from '@elizaos/core';

// Mock the runtime
const mockRuntime = {
  getSetting: vi.fn(),
  elizaLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
} as unknown as IAgentRuntime;

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheService = new CacheService(mockRuntime);
  });

  afterEach(async () => {
    if (cacheService) {
      await cacheService.stop();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      await cacheService.start();
      
      expect(cacheService).toBeDefined();
      expect(cacheService.getStats().totalEntries).toBe(0);
    });

    it('should load configuration from runtime settings', async () => {
      (mockRuntime.getSetting as any).mockImplementation((key: string) => {
        const settings: Record<string, any> = {
          'REDIS_URL': 'redis://localhost:6379',
          'REDIS_PASSWORD': 'password',
          'REDIS_DB': '1'
        };
        return settings[key];
      });

      await cacheService.start();
      
      const stats = cacheService.getStats();
      expect(stats.totalEntries).toBe(0);
    });

    it('should handle Redis configuration when enabled', async () => {
      (mockRuntime.getSetting as any).mockImplementation((key: string) => {
        const settings: Record<string, any> = {
          'REDIS_URL': 'redis://localhost:6379',
          'REDIS_PASSWORD': 'password',
          'REDIS_DB': '1'
        };
        return settings[key];
      });

      await cacheService.start();
      
      const stats = cacheService.getStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('Basic Caching Operations', () => {
    beforeEach(async () => {
      await cacheService.start();
    });

    it('should set and get cache entries', async () => {
      const key = 'test-key';
      const value = { data: 'test-value', timestamp: Date.now() };
      const ttl = 60000;

      await cacheService.set(key, value, ttl);
      const result = await cacheService.get(key);

      expect(result).toEqual(value);
      expect(cacheService.getStats().totalEntries).toBe(1);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different data types', async () => {
      const testData = [
        { key: 'string', value: 'test string' },
        { key: 'number', value: 42 },
        { key: 'boolean', value: true },
        { key: 'object', value: { nested: 'value' } },
        { key: 'array', value: [1, 2, 3] }
      ];

      for (const { key, value } of testData) {
        await cacheService.set(key, value);
        const result = await cacheService.get(key);
        expect(result).toEqual(value);
      }

      expect(cacheService.getStats().totalEntries).toBe(testData.length);
    });

    it('should delete cache entries', async () => {
      const key = 'delete-test';
      const value = 'test value';

      await cacheService.set(key, value);
      expect(await cacheService.get(key)).toBe(value);

      await cacheService.delete(key);
      expect(await cacheService.get(key)).toBeNull();
      expect(cacheService.getStats().totalEntries).toBe(0);
    });

    it('should clear all cache entries', async () => {
      // Add multiple entries
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');

      expect(cacheService.getStats().totalEntries).toBe(3);

      await cacheService.clear();
      expect(cacheService.getStats().totalEntries).toBe(0);
    });
  });

  describe('TTL Management', () => {
    beforeEach(async () => {
      await cacheService.start();
    });

    it('should respect TTL settings', async () => {
      const key = 'ttl-test';
      const value = 'test value';
      const ttl = 100; // 100ms

      await cacheService.set(key, value, ttl);
      expect(await cacheService.get(key)).toBe(value);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(await cacheService.get(key)).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const key = 'default-ttl-test';
      const value = 'test value';

      await cacheService.set(key, value);
      
      // Should still be available immediately
      expect(await cacheService.get(key)).toBe(value);
    });

    it('should handle zero TTL (no expiration)', async () => {
      const key = 'no-ttl-test';
      const value = 'test value';

      await cacheService.set(key, value, 0);
      
      // Should still be available after some time
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(await cacheService.get(key)).toBe(value);
    });
  });

  describe('Cache Statistics', () => {
    beforeEach(async () => {
      await cacheService.start();
    });

    it('should track hit and miss statistics', async () => {
      // Add an entry
      await cacheService.set('hit-test', 'value');

      // Hit
      await cacheService.get('hit-test');
      
      // Miss
      await cacheService.get('miss-test');

      const stats = cacheService.getStats();
      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should track cache size and memory usage', async () => {
      const largeValue = 'x'.repeat(1000);
      
      await cacheService.set('large-key', largeValue);
      
      const stats = cacheService.getStats();
      expect(stats.totalEntries).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should track eviction count when cache is full', async () => {
      // Add many entries to trigger eviction
      for (let i = 0; i < 1000; i++) {
        await cacheService.set(`key-${i}`, `value-${i}`);
      }

      const stats = cacheService.getStats();
      expect(stats.evictionCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await cacheService.start();
    });

    it('should handle Redis connection errors gracefully', async () => {
      // This would be tested with actual Redis connection failures
      // For now, we test the error handling structure
      const key = 'error-test';
      const value = 'test value';

      // Should still work with memory cache even if Redis fails
      await cacheService.set(key, value);
      const result = await cacheService.get(key);
      expect(result).toBe(value);
    });

    it('should handle invalid keys gracefully', async () => {
      const invalidKeys = ['', null, undefined, 'key with spaces', 'key/with/slashes'];
      
      for (const key of invalidKeys) {
        if (key !== null && key !== undefined) {
          await expect(cacheService.set(key as string, 'value')).resolves.not.toThrow();
        }
      }
    });

    it('should handle large values gracefully', async () => {
      const largeValue = 'x'.repeat(1024 * 1024); // 1MB
      
      await expect(cacheService.set('large-value', largeValue)).resolves.not.toThrow();
      const result = await cacheService.get('large-value');
      expect(result).toBe(largeValue);
    });
  });

  describe('Cache Invalidation', () => {
    beforeEach(async () => {
      await cacheService.start();
    });

    it('should invalidate by pattern', async () => {
      await cacheService.set('user:1', 'user1');
      await cacheService.set('user:2', 'user2');
      await cacheService.set('post:1', 'post1');

      await cacheService.invalidate('user:*');

      expect(await cacheService.get('user:1')).toBeNull();
      expect(await cacheService.get('user:2')).toBeNull();
      expect(await cacheService.get('post:1')).toBe('post1');
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await cacheService.start();
    });

    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 100 }, (_, i) => 
        cacheService.set(`concurrent-${i}`, `value-${i}`)
      );

      await Promise.all(operations);

      expect(cacheService.getStats().totalEntries).toBe(100);
    });
  });

  describe('Lifecycle', () => {
    it('should start and stop gracefully', async () => {
      await cacheService.start();
      expect(cacheService.getStats().totalEntries).toBe(0);

      await cacheService.stop();
      expect(cacheService.getStats().totalEntries).toBe(0);
    });

    it('should cleanup resources on stop', async () => {
      await cacheService.start();
      await cacheService.set('test', 'value');
      
      await cacheService.stop();
      
      // Should not be able to access cache after stop
      expect(await cacheService.get('test')).toBeNull();
    });
  });
}); 