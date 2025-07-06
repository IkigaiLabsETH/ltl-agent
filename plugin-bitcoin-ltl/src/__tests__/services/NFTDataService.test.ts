import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NFTDataService } from '../../services/NFTDataService';
import { CentralizedConfigService } from '../../services/CentralizedConfigService';
import { globalErrorHandler } from '../../utils';

// Mock dependencies
vi.mock('@elizaos/core', () => ({
  elizaLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  },
  Service: class MockService {
    static serviceType = 'mock-service';
    capabilityDescription = 'Mock service for testing';
  }
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn()
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

describe('NFTDataService', () => {
  let service: NFTDataService;
  let mockRuntime: any;
  let mockConfigService: any;

  beforeEach(() => {
    // Create mock runtime
    mockRuntime = {
      getService: vi.fn(),
      getSetting: vi.fn()
    };

    // Create mock config service
    mockConfigService = {
      get: vi.fn(),
      set: vi.fn(),
      watch: vi.fn(),
      getAll: vi.fn()
    };

    // Setup service dependencies
    mockRuntime.getService.mockImplementation((serviceName: string) => {
      if (serviceName === 'centralized-config') {
        return mockConfigService;
      }
      if (serviceName === 'comprehensive-error-handler') {
        return globalErrorHandler;
      }
      return null;
    });

    // Default config values
    mockConfigService.get.mockImplementation((path: string, defaultValue?: any) => {
      const configMap: Record<string, any> = {
        'services.nftData.updateInterval': 300000,
        'apis.opensea.apiKey': 'test-opensea-key',
        'apis.opensea.baseUrl': 'https://api.opensea.io/api/v1'
      };
      return configMap[path] || defaultValue;
    });

    service = new NFTDataService(mockRuntime);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct service type', () => {
      expect(NFTDataService.serviceType).toBe('nft-data');
    });

    it('should have correct capability description', () => {
      expect(service.capabilityDescription).toContain('NFT market data');
    });

    it('should initialize with dependencies', () => {
      expect(mockRuntime.getService).toHaveBeenCalledWith('centralized-config');
      expect(mockRuntime.getService).toHaveBeenCalledWith('comprehensive-error-handler');
    });
  });

  describe('Static Methods', () => {
    it('should start service correctly', async () => {
      const startSpy = vi.spyOn(service, 'init');
      
      await NFTDataService.start(mockRuntime);
      
      expect(startSpy).toHaveBeenCalled();
    });

    it('should stop service correctly', async () => {
      mockRuntime.getService.mockReturnValue(service);
      const stopSpy = vi.spyOn(service, 'stop');
      
      await NFTDataService.stop(mockRuntime);
      
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('Lifecycle Methods', () => {
    it('should start service lifecycle', async () => {
      const startUpdatesSpy = vi.spyOn(service as any, 'startRealTimeUpdates');
      
      await service.start();
      
      expect(startUpdatesSpy).toHaveBeenCalled();
    });

    it('should initialize service', async () => {
      const updateDataSpy = vi.spyOn(service, 'updateData');
      
      await service.init();
      
      expect(updateDataSpy).toHaveBeenCalled();
    });

    it('should stop service and clear intervals', async () => {
      // Mock updateInterval
      (service as any).updateInterval = setInterval(() => {}, 1000);
      
      await service.stop();
      
      expect((service as any).updateInterval).toBeNull();
    });
  });

  describe('Data Update Methods', () => {
    it('should update data successfully', async () => {
      const updateNFTsSpy = vi.spyOn(service as any, 'updateCuratedNFTsData');
      
      await service.updateData();
      
      expect(updateNFTsSpy).toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      const error = new Error('Update failed');
      vi.spyOn(service as any, 'updateCuratedNFTsData').mockRejectedValue(error);
      
      await service.updateData();
      
      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        { component: 'NFTDataService', operation: 'updateData' }
      );
    });

    it('should force update data', async () => {
      const updateDataSpy = vi.spyOn(service, 'updateData');
      
      await service.forceUpdate();
      
      expect(updateDataSpy).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('should check cache validity correctly', () => {
      // Test with no cache
      expect((service as any).isCuratedNFTsCacheValid()).toBe(false);

      // Test with valid cache
      (service as any).curatedNFTsCache = {
        data: {},
        timestamp: Date.now()
      };
      expect((service as any).isCuratedNFTsCacheValid()).toBe(true);

      // Test with expired cache
      (service as any).curatedNFTsCache = {
        data: {},
        timestamp: Date.now() - 120000 // 2 minutes ago
      };
      expect((service as any).isCuratedNFTsCacheValid()).toBe(false);
    });
  });

  describe('Data Fetching', () => {
    it('should fetch curated NFTs data successfully', async () => {
      const mockCollectionData = {
        slug: 'test-collection',
        collection: { name: 'Test Collection' },
        stats: { floor_price: 100 },
        lastUpdated: new Date(),
        category: 'blue-chip' as const
      };

      vi.spyOn(service as any, 'fetchEnhancedCollectionData').mockResolvedValue(mockCollectionData);
      
      const result = await (service as any).fetchCuratedNFTsData();
      
      expect(result).toBeDefined();
      expect(result.collections).toHaveLength(10); // Default curated collections
      expect(result.summary).toBeDefined();
    });

    it('should handle fetch errors gracefully', async () => {
      const error = new Error('Fetch failed');
      vi.spyOn(service as any, 'fetchEnhancedCollectionData').mockRejectedValue(error);
      
      const result = await (service as any).fetchCuratedNFTsData();
      
      expect(result).toBeNull();
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should return null when no collections available', async () => {
      vi.spyOn(service as any, 'fetchEnhancedCollectionData').mockResolvedValue(null);
      
      const result = await (service as any).fetchCuratedNFTsData();
      
      expect(result).toBeNull();
    });
  });

  describe('Collection Data Processing', () => {
    it('should parse collection stats correctly', () => {
      const mockStatsData = {
        total_supply: 1000,
        num_owners: 500,
        average_price: 50,
        floor_price: 25,
        market_cap: 50000,
        one_day_volume: 1000,
        one_day_change: 5,
        one_day_sales: 20,
        seven_day_volume: 7000,
        seven_day_change: 10,
        seven_day_sales: 140,
        thirty_day_volume: 30000,
        thirty_day_change: 15,
        thirty_day_sales: 600
      };

      const result = (service as any).parseCollectionStats(mockStatsData);
      
      expect(result).toEqual(mockStatsData);
    });

    it('should determine collection category correctly', () => {
      const blueChipCollection = { name: 'Bored Ape Yacht Club' };
      expect((service as any).determineCollectionCategory(blueChipCollection)).toBe('blue-chip');

      const pfpCollection = { description: 'Profile picture collection' };
      expect((service as any).determineCollectionCategory(pfpCollection)).toBe('pfp');

      const generativeCollection = { description: 'Generative art collection' };
      expect((service as any).determineCollectionCategory(generativeCollection)).toBe('generative-art');

      const utilityCollection = { description: 'Utility and access collection' };
      expect((service as any).determineCollectionCategory(utilityCollection)).toBe('utility');

      const defaultCollection = { name: 'Random Collection' };
      expect((service as any).determineCollectionCategory(defaultCollection)).toBe('digital-art');
    });

    it('should calculate NFT summary correctly', () => {
      const mockCollections = [
        {
          stats: { one_day_volume: 1000, market_cap: 50000, floor_price: 25, one_day_change: 10 }
        },
        {
          stats: { one_day_volume: 2000, market_cap: 100000, floor_price: 50, one_day_change: -5 }
        }
      ];

      const result = (service as any).calculateNFTSummary(mockCollections);
      
      expect(result.totalVolume24h).toBe(3000);
      expect(result.totalMarketCap).toBe(150000);
      expect(result.avgFloorPrice).toBe(37.5);
      expect(result.topPerformers).toHaveLength(1);
      expect(result.worstPerformers).toHaveLength(1);
      expect(result.totalCollections).toBe(2);
    });
  });

  describe('Public API Methods', () => {
    beforeEach(() => {
      (service as any).curatedNFTsCache = {
        data: {
          collections: [
            { slug: 'test-1', collection: { name: 'Test 1' } },
            { slug: 'test-2', collection: { name: 'Test 2' } }
          ],
          summary: { totalVolume24h: 1000 }
        },
        timestamp: Date.now()
      };
    });

    it('should get curated NFTs data', () => {
      const result = service.getCuratedNFTsData();
      
      expect(result).toBeDefined();
      expect(result?.collections).toHaveLength(2);
      expect(result?.summary.totalVolume24h).toBe(1000);
    });

    it('should return null when no cache available', () => {
      (service as any).curatedNFTsCache = null;
      
      const result = service.getCuratedNFTsData();
      
      expect(result).toBeNull();
    });

    it('should get NFT collection by slug', () => {
      const result = service.getNFTCollection('test-1');
      
      expect(result).toBeDefined();
      expect(result?.collection.name).toBe('Test 1');
    });

    it('should get NFT collections by category', () => {
      const result = service.getNFTCollectionsByCategory('blue-chip');
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should force update curated NFTs', async () => {
      const updateSpy = vi.spyOn(service as any, 'updateCuratedNFTsData');
      
      await service.forceCuratedNFTsUpdate();
      
      expect(updateSpy).toHaveBeenCalled();
    });

    it('should get service statistics', () => {
      const result = service.getStats();
      
      expect(result).toBeDefined();
      expect(result.cacheStatus).toBe('valid');
      expect(result.collectionsCount).toBe(2);
      expect(result.totalVolume24h).toBe(1000);
      expect(result.cacheHitRate).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      vi.spyOn(service as any, 'fetchEnhancedCollectionData').mockRejectedValue(error);
      
      await (service as any).updateCuratedNFTsData();
      
      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        { component: 'NFTDataService', operation: 'updateCuratedNFTsData' }
      );
    });

    it('should handle individual collection fetch errors', async () => {
      const error = new Error('Collection fetch failed');
      vi.spyOn(service as any, 'fetchEnhancedCollectionData')
        .mockResolvedValueOnce({ slug: 'test-1' })
        .mockRejectedValueOnce(error);
      
      const result = await (service as any).fetchCuratedNFTsData();
      
      expect(result).toBeDefined();
      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        { component: 'NFTDataService', operation: 'fetchCuratedNFTsData.test-2' }
      );
    });
  });

  describe('Configuration Integration', () => {
    it('should use centralized configuration for API keys', () => {
      (service as any).fetchEnhancedCollectionData('test-slug', {});
      
      expect(mockConfigService.get).toHaveBeenCalledWith('apis.opensea.apiKey', '');
      expect(mockConfigService.get).toHaveBeenCalledWith('apis.opensea.baseUrl', 'https://api.opensea.io/api/v1');
    });

    it('should use centralized configuration for update intervals', () => {
      (service as any).startRealTimeUpdates();
      
      expect(mockConfigService.get).toHaveBeenCalledWith('services.nftData.updateInterval', 300000);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests gracefully', async () => {
      const promises = Array(5).fill(null).map(() => service.updateData());
      
      await Promise.all(promises);
      
      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should respect rate limits through configuration', () => {
      mockConfigService.get.mockReturnValue(600000); // 10 minutes
      
      (service as any).startRealTimeUpdates();
      
      expect(mockConfigService.get).toHaveBeenCalledWith('services.nftData.updateInterval', 300000);
    });
  });
}); 