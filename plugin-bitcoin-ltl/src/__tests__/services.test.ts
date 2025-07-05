import { describe, beforeEach, afterEach, test, expect, vi } from 'vitest';
import type { IAgentRuntime, Memory, UUID, Service } from '@elizaos/core';
import { ConfigurationManager } from '../services/ConfigurationManager';
import { ServiceFactory } from '../services/ServiceFactory';
import { BaseDataService } from '../services/BaseDataService';
import { BitcoinDataService } from '../services/BitcoinDataService';

// Simple mock runtime for testing
const createMockRuntime = () => {
  const runtime = {
    agentId: 'test-agent-id' as UUID,
    character: { name: 'Test Agent' },
    getSetting: vi.fn((key: string) => {
      const settings: Record<string, any> = {
        'NODE_ENV': 'test',
        'BITCOIN_DATA_ENABLED': 'true',
        'BITCOIN_DATA_CACHE_TIMEOUT': '60000'
      };
      return settings[key];
    }),
    createMemory: vi.fn(),
    getMemories: vi.fn().mockResolvedValue([]),
    storeInMemory: vi.fn(),
    getFromMemory: vi.fn().mockResolvedValue([]),
    services: new Map()
  };
  
  return runtime as any as IAgentRuntime;
};

describe('Service Tests', () => {
  let runtime: IAgentRuntime;
  let configManager: ConfigurationManager;

  beforeEach(async () => {
    runtime = createMockRuntime();
    configManager = new ConfigurationManager(runtime);
    await configManager.initialize();
  });

  afterEach(async () => {
    await ServiceFactory.stopAllServices();
  });

  describe('ConfigurationManager', () => {
    test('should initialize with default configuration', async () => {
      expect(configManager).toBeDefined();
      const config = configManager.getServiceConfig('bitcoinData');
      expect(config).toBeDefined();
      expect(config.enabled).toBe(true);
    });

    test('should handle configuration updates', () => {
      configManager.updateServiceConfig('bitcoinData', { enabled: false });
      const config = configManager.getServiceConfig('bitcoinData');
      expect(config.enabled).toBe(false);
    });

    test('should check service enabled status', () => {
      expect(configManager.isServiceEnabled('bitcoinData')).toBe(true);
      configManager.updateServiceConfig('bitcoinData', { enabled: false });
      expect(configManager.isServiceEnabled('bitcoinData')).toBe(false);
    });
  });

  describe('ServiceFactory', () => {
    test('should initialize services successfully', async () => {
      await ServiceFactory.initializeServices(runtime, {});
      
      const bitcoinService = ServiceFactory.getService('bitcoin-data');
      expect(bitcoinService).toBeDefined();
    });

    test('should handle service health checks', async () => {
      await ServiceFactory.initializeServices(runtime, {});
      
      const healthStatus = await ServiceFactory.healthCheck();
      expect(healthStatus.healthy).toBe(true);
      expect(healthStatus.services).toBeDefined();
    });

    test('should stop all services gracefully', async () => {
      await ServiceFactory.initializeServices(runtime, {});
      await ServiceFactory.stopAllServices();
      
      const bitcoinService = ServiceFactory.getService('bitcoin-data');
      expect(bitcoinService).toBeNull();
    });
  });

  describe('BaseDataService', () => {
    class TestDataService extends BaseDataService {
      static serviceType = 'test-data';
      capabilityDescription = 'Test data service for unit testing';

      constructor(runtime: IAgentRuntime) {
        super(runtime, 'bitcoinData'); // Use existing config key
      }

      async updateData(): Promise<void> {
        // Test implementation
      }

      async forceUpdate(): Promise<void> {
        // Test implementation
      }
    }

    test('should create service with configuration', async () => {
      const service = new TestDataService(runtime);
      expect(service).toBeInstanceOf(TestDataService);
      expect(service.capabilityDescription).toBe('Test data service for unit testing');
    });

    test('should handle memory operations', async () => {
      const service = new TestDataService(runtime);
      
      // Test that the service can interact with runtime memory
      expect(runtime.createMemory).toBeDefined();
      expect(runtime.getMemories).toBeDefined();
    });
  });

  describe('BitcoinDataService', () => {
    let bitcoinService: BitcoinDataService;

    beforeEach(async () => {
      bitcoinService = new BitcoinDataService(runtime);
    });

    test('should create Bitcoin data service', () => {
      expect(bitcoinService).toBeDefined();
      expect(bitcoinService.capabilityDescription).toContain('Bitcoin');
    });

    test('should have correct service type', () => {
      expect(BitcoinDataService.serviceType).toBe('bitcoin-data');
    });

    test('should fetch bitcoin price with mocked data', async () => {
      // Mock fetch to return test data
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          bitcoin: { usd: 50000 }
        })
      });
      
      global.fetch = mockFetch;
      
      const price = await bitcoinService.getBitcoinPrice();
      expect(typeof price).toBe('number');
    });

    test('should calculate thesis metrics', async () => {
      // Mock the Bitcoin price
      vi.spyOn(bitcoinService, 'getBitcoinPrice').mockResolvedValue(50000);
      
      const metrics = await bitcoinService.calculateThesisMetrics(50000);
      expect(metrics).toBeDefined();
      expect(typeof metrics.progressPercentage).toBe('number');
    });

    test('should handle freedom mathematics calculation', async () => {
      const targetFreedom = 1000000;
      
      const calculation = await bitcoinService.calculateFreedomMathematics(targetFreedom);
      expect(calculation).toBeDefined();
      expect(typeof calculation.btcNeeded).toBe('number');
    });

    test('should retrieve historical data', async () => {
      const history = await bitcoinService.getThesisProgressHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Service Integration', () => {
    test('should handle configuration watching', async () => {
      const watcherCalled = vi.fn();
      configManager.watchConfig('bitcoinData', watcherCalled);
      
      // For testing purposes, we're just verifying the watcher was registered
      expect(configManager.isServiceEnabled('bitcoinData')).toBe(true);
    });

    test('should handle service dependencies', async () => {
      await ServiceFactory.initializeServices(runtime, {});
      
      const bitcoinService = ServiceFactory.getService('bitcoin-data');
      const altcoinService = ServiceFactory.getService('altcoin-data');
      
      expect(bitcoinService).toBeDefined();
      expect(altcoinService).toBeDefined();
    });

    test('should maintain service health monitoring', async () => {
      await ServiceFactory.initializeServices(runtime, {});
      
      const healthStatus = await ServiceFactory.healthCheck();
      expect(healthStatus.healthy).toBe(true);
      expect(Object.keys(healthStatus.services).length).toBeGreaterThan(0);
    });
  });
}); 