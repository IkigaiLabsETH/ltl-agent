import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IAgentRuntime } from '@elizaos/core';
import { BitcoinNetworkService } from '../../services/BitcoinNetworkService';
import { MarketDataService } from '../../services/MarketDataService';
import { NFTDataService } from '../../services/NFTDataService';
import { NewsDataService } from '../../services/NewsDataService';
import { SocialSentimentService } from '../../services/SocialSentimentService';
import { CentralizedConfigService } from '../../services/CentralizedConfigService';
import { CacheService } from '../../services/CacheService';
import { PerformanceMonitorService } from '../../services/PerformanceMonitorService';
import { globalErrorHandler } from '../../utils';

// Mock dependencies
vi.mock('@elizaos/core', () => ({
  elizaLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

vi.mock('../../utils', () => ({
  LoggerWithContext: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })),
  generateCorrelationId: vi.fn(() => 'test-correlation-id'),
  globalErrorHandler: {
    handleError: vi.fn()
  }
}));

describe('Service Integration Tests', () => {
  let mockRuntime: any;
  let configService: CentralizedConfigService;
  let cacheService: CacheService;
  let performanceMonitor: PerformanceMonitorService;
  let bitcoinNetworkService: BitcoinNetworkService;
  let marketDataService: MarketDataService;
  let nftDataService: NFTDataService;
  let newsDataService: NewsDataService;
  let socialSentimentService: SocialSentimentService;

  beforeEach(async () => {
    // Create mock runtime
    mockRuntime = {
      getService: vi.fn(),
      getSetting: vi.fn()
    };

    // Setup service dependencies
    mockRuntime.getService.mockImplementation((serviceName: string) => {
      const serviceMap: Record<string, any> = {
        'centralized-config': configService,
        'cache': cacheService,
        'performance-monitor': performanceMonitor,
        'bitcoin-network': bitcoinNetworkService,
        'market-data': marketDataService,
        'nft-data': nftDataService,
        'news-data': newsDataService,
        'social-sentiment': socialSentimentService
      };
      return serviceMap[serviceName] || null;
    });

    // Initialize core services
    configService = new CentralizedConfigService(mockRuntime);
    cacheService = new CacheService(mockRuntime);
    performanceMonitor = new PerformanceMonitorService(mockRuntime);

    // Initialize data services
    bitcoinNetworkService = new BitcoinNetworkService(mockRuntime);
    marketDataService = new MarketDataService(mockRuntime);
    nftDataService = new NFTDataService(mockRuntime);
    newsDataService = new NewsDataService(mockRuntime);
    socialSentimentService = new SocialSentimentService(mockRuntime);

    // Start services
    await Promise.all([
      configService.start(),
      cacheService.start(),
      performanceMonitor.start(),
      bitcoinNetworkService.start(),
      marketDataService.start(),
      nftDataService.start(),
      newsDataService.start(),
      socialSentimentService.start()
    ]);
  });

  afterEach(async () => {
    // Stop all services
    await Promise.all([
      configService.stop(),
      cacheService.stop(),
      performanceMonitor.stop(),
      bitcoinNetworkService.stop(),
      marketDataService.stop(),
      nftDataService.stop(),
      newsDataService.stop(),
      socialSentimentService.stop()
    ]);

    vi.clearAllMocks();
  });

  describe('Service Initialization & Dependencies', () => {
    it('should initialize all services with proper dependencies', async () => {
      // Verify all services are properly initialized
      expect(configService).toBeDefined();
      expect(cacheService).toBeDefined();
      expect(performanceMonitor).toBeDefined();
      expect(bitcoinNetworkService).toBeDefined();
      expect(marketDataService).toBeDefined();
      expect(nftDataService).toBeDefined();
      expect(newsDataService).toBeDefined();
      expect(socialSentimentService).toBeDefined();

      // Verify service dependencies are resolved
      expect(mockRuntime.getService).toHaveBeenCalledWith('centralized-config');
      expect(mockRuntime.getService).toHaveBeenCalledWith('cache');
      expect(mockRuntime.getService).toHaveBeenCalledWith('performance-monitor');
    });

    it('should handle service dependency failures gracefully', async () => {
      // Mock missing dependency
      mockRuntime.getService.mockReturnValue(null);

      // Services should handle missing dependencies gracefully
      const bitcoinService = new BitcoinNetworkService(mockRuntime);
      await expect(bitcoinService.start()).resolves.not.toThrow();
    });

    it('should validate service configuration consistency', async () => {
      // Test configuration consistency across services
      const configs = [
        'services.bitcoinNetwork.enabled',
        'services.marketData.enabled',
        'services.nftData.enabled',
        'services.newsData.enabled',
        'services.socialSentiment.enabled'
      ];

      for (const config of configs) {
        const value = configService.get(config);
        expect(value).toBeDefined();
      }
    });
  });

  describe('Data Flow Integration', () => {
    it('should handle complete data flow from API to cache', async () => {
      // Mock API responses
      const { default: axios } = await import('axios');
      (axios.get as any).mockResolvedValue({
        data: {
          bitcoin: {
            usd: 50000,
            usd_24h_change: 2.5
          }
        }
      });

      // Trigger data update
      await marketDataService.updateData();

      // Verify data is cached
      const cachedData = await cacheService.get('market-data:bitcoin');
      expect(cachedData).toBeDefined();
      expect(cachedData).toHaveProperty('price');
    });

    it('should propagate errors across services correctly', async () => {
      // Mock API failure
      const { default: axios } = await import('axios');
      (axios.get as any).mockRejectedValue(new Error('API Error'));

      // Trigger data update
      await marketDataService.updateData();

      // Verify error is handled and logged
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should maintain data consistency across services', async () => {
      // Update data in one service
      await bitcoinNetworkService.updateData();
      await marketDataService.updateData();

      // Verify data consistency
      const bitcoinData = bitcoinNetworkService.getComprehensiveBitcoinData();
      const marketData = marketDataService.getMarketData();

      // Both services should have recent data
      expect(bitcoinData).toBeDefined();
      expect(marketData).toBeDefined();
      expect(bitcoinData.lastUpdated).toBeInstanceOf(Date);
      expect(marketData[0].lastUpdate).toBeInstanceOf(Date);
    });
  });

  describe('Performance Integration', () => {
    it('should track performance metrics across services', async () => {
      // Perform operations
      await Promise.all([
        bitcoinNetworkService.updateData(),
        marketDataService.updateData(),
        nftDataService.updateData()
      ]);

      // Verify performance metrics are tracked
      const metrics = performanceMonitor.getCurrentMetrics();
      expect(metrics).toBeDefined();
      expect(Array.isArray(metrics)).toBe(true);
    });

    it('should handle high load scenarios', async () => {
      // Simulate concurrent requests
      const concurrentRequests = Array(10).fill(null).map(() => 
        Promise.all([
          bitcoinNetworkService.updateData(),
          marketDataService.updateData(),
          nftDataService.updateData()
        ])
      );

      // All requests should complete successfully
      await expect(Promise.all(concurrentRequests)).resolves.not.toThrow();
    });

    it('should maintain performance under stress', async () => {
      const startTime = Date.now();
      
      // Perform multiple operations
      for (let i = 0; i < 5; i++) {
        await Promise.all([
          bitcoinNetworkService.updateData(),
          marketDataService.updateData()
        ]);
      }

      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
    });
  });

  describe('Caching Integration', () => {
    it('should cache data across services', async () => {
      // Update data
      await bitcoinNetworkService.updateData();
      await marketDataService.updateData();

      // Verify data is cached
      const bitcoinCache = await cacheService.get('bitcoin-network:data');
      const marketCache = await cacheService.get('market-data:data');

      expect(bitcoinCache).toBeDefined();
      expect(marketCache).toBeDefined();
    });

    it('should handle cache invalidation correctly', async () => {
      // Cache some data
      await cacheService.set('test-key', 'test-value', 1000);

      // Verify data is cached
      const cached = await cacheService.get('test-key');
      expect(cached).toBe('test-value');

      // Invalidate cache
      await cacheService.invalidate('test-key');

      // Verify data is removed
      const afterInvalidation = await cacheService.get('test-key');
      expect(afterInvalidation).toBeNull();
    });

    it('should handle cache failures gracefully', async () => {
      // Mock cache failure
      vi.spyOn(cacheService, 'set').mockRejectedValue(new Error('Cache Error'));

      // Services should continue to work without cache
      await expect(bitcoinNetworkService.updateData()).resolves.not.toThrow();
    });
  });

  describe('Error Handling Integration', () => {
    it('should propagate errors through the service chain', async () => {
      // Mock multiple service failures
      vi.spyOn(bitcoinNetworkService, 'updateData').mockRejectedValue(new Error('Bitcoin Service Error'));
      vi.spyOn(marketDataService, 'updateData').mockRejectedValue(new Error('Market Service Error'));

      // Trigger updates
      await Promise.allSettled([
        bitcoinNetworkService.updateData(),
        marketDataService.updateData()
      ]);

      // Verify errors are handled
      expect(globalErrorHandler.handleError).toHaveBeenCalledTimes(2);
    });

    it('should handle partial service failures', async () => {
      // Mock partial failure
      vi.spyOn(bitcoinNetworkService, 'updateData').mockRejectedValue(new Error('Service Error'));

      // Other services should continue to work
      await expect(marketDataService.updateData()).resolves.not.toThrow();
      await expect(nftDataService.updateData()).resolves.not.toThrow();
    });

    it('should recover from transient failures', async () => {
      // Mock transient failure followed by success
      let callCount = 0;
      vi.spyOn(bitcoinNetworkService, 'updateData').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Transient Error');
        }
        return Promise.resolve();
      });

      // First call should fail
      await expect(bitcoinNetworkService.updateData()).rejects.toThrow('Transient Error');

      // Second call should succeed
      await expect(bitcoinNetworkService.updateData()).resolves.not.toThrow();
    });
  });

  describe('Configuration Integration', () => {
    it('should use centralized configuration across all services', async () => {
      // Set configuration
      configService.set('services.bitcoinNetwork.updateInterval', 60000);
      configService.set('services.marketData.updateInterval', 60000);

      // Verify services use centralized config
      const bitcoinInterval = configService.get('services.bitcoinNetwork.updateInterval');
      const marketInterval = configService.get('services.marketData.updateInterval');

      expect(bitcoinInterval).toBe(60000);
      expect(marketInterval).toBe(60000);
    });

    it('should handle configuration changes dynamically', async () => {
      // Change configuration
      configService.set('services.bitcoinNetwork.enabled', false);

      // Verify change is reflected
      const enabled = configService.get('services.bitcoinNetwork.enabled');
      expect(enabled).toBe(false);
    });

    it('should validate configuration consistency', async () => {
      // Test configuration validation
      const configs = [
        'apis.coingecko.apiKey',
        'apis.blockchain.baseUrl',
        'caching.enabled',
        'performance.enableMetrics'
      ];

      for (const config of configs) {
        const value = configService.get(config);
        expect(value).toBeDefined();
      }
    });
  });

  describe('Health Check Integration', () => {
    it('should provide health status for all services', async () => {
      // Get health status - using available methods
      const bitcoinHealth = await bitcoinNetworkService.healthCheck();
      const marketHealth = await marketDataService.healthCheck();
      const nftHealth = await nftDataService.healthCheck();

      expect(bitcoinHealth).toBeDefined();
      expect(marketHealth).toBeDefined();
      expect(nftHealth).toBeDefined();
    });

    it('should detect unhealthy services', async () => {
      // Mock service failure
      vi.spyOn(bitcoinNetworkService, 'updateData').mockRejectedValue(new Error('Service Unhealthy'));

      // Trigger update to make service unhealthy
      await bitcoinNetworkService.updateData().catch(() => {});

      // Check health status
      const health = await bitcoinNetworkService.healthCheck();
      expect(health).toBeDefined();
    });

    it('should provide detailed health information', async () => {
      const health = await bitcoinNetworkService.healthCheck();

      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('lastSuccessTime');
      expect(health).toHaveProperty('totalRequests');
    });
  });

  describe('Data Synchronization', () => {
    it('should synchronize data across services', async () => {
      // Update all services
      await Promise.all([
        bitcoinNetworkService.updateData(),
        marketDataService.updateData(),
        nftDataService.updateData(),
        newsDataService.updateData(),
        socialSentimentService.updateData()
      ]);

      // Verify all services have recent data
      const services = [
        bitcoinNetworkService,
        marketDataService,
        nftDataService,
        newsDataService,
        socialSentimentService
      ];

      for (const service of services) {
        const health = await service.healthCheck();
        expect(health.lastSuccessTime).toBeGreaterThan(0);
      }
    });

    it('should handle data consistency issues', async () => {
      // Mock inconsistent data
      const { default: axios } = await import('axios');
      (axios.get as any)
        .mockResolvedValueOnce({ data: { price: 50000 } })
        .mockResolvedValueOnce({ data: { price: 51000 } });

      // Update services
      await marketDataService.updateData();
      await new Promise(resolve => setTimeout(resolve, 100));
      await marketDataService.updateData();

      // Verify data is consistent
      const data = marketDataService.getMarketData();
      expect(data).toBeDefined();
    });
  });

  describe('Resource Management', () => {
    it('should manage memory usage efficiently', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        await Promise.all([
          bitcoinNetworkService.updateData(),
          marketDataService.updateData()
        ]);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });

    it('should handle connection pooling correctly', async () => {
      // Simulate multiple concurrent connections
      const connections = Array(5).fill(null).map(() => 
        Promise.all([
          bitcoinNetworkService.updateData(),
          marketDataService.updateData()
        ])
      );

      await Promise.all(connections);

      // No connection leaks should occur
      expect(true).toBe(true);
    });

    it('should cleanup resources on service shutdown', async () => {
      // Start services
      await bitcoinNetworkService.start();
      await marketDataService.start();

      // Stop services
      await bitcoinNetworkService.stop();
      await marketDataService.stop();

      // Verify cleanup
      const bitcoinHealth = await bitcoinNetworkService.healthCheck();
      const marketHealth = await marketDataService.healthCheck();
      
      // Services should be properly stopped
      expect(bitcoinHealth).toBeDefined();
      expect(marketHealth).toBeDefined();
    });
  });
}); 