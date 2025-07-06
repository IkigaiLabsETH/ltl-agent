import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BitcoinNetworkService } from '../../services/BitcoinNetworkService';
import { IAgentRuntime } from '@elizaos/core';

// Mock the runtime
const mockRuntime = {
  getSetting: vi.fn((key: string, defaultValue?: string) => {
    const settings: Record<string, string> = {
      'BLOCKCHAIN_API_URL': 'https://api.blockchain.info',
      'MEMPOOL_API_URL': 'https://mempool.space/api',
      'COINGECKO_API_URL': 'https://api.coingecko.com/api/v3',
      'ALTERNATIVE_API_URL': 'https://api.alternative.me'
    };
    return settings[key] || defaultValue;
  }),
  getService: vi.fn(),
  elizaLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
} as unknown as IAgentRuntime;

// Mock fetch globally
global.fetch = vi.fn();

describe('BitcoinNetworkService', () => {
  let service: BitcoinNetworkService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BitcoinNetworkService(mockRuntime);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(service).toBeInstanceOf(BitcoinNetworkService);
      expect(service.capabilityDescription).toBe(
        'Provides comprehensive Bitcoin network data including hash rate, difficulty, mempool, and sentiment analysis'
      );
    });

    it('should have correct service type', () => {
      expect(BitcoinNetworkService.serviceType).toBe('bitcoin-network');
    });
  });

  describe('Static Methods', () => {
    it('should start service correctly', async () => {
      const startedService = await BitcoinNetworkService.start(mockRuntime);
      expect(startedService).toBeInstanceOf(BitcoinNetworkService);
    });

    it('should stop service correctly', async () => {
      // Mock the service retrieval
      (mockRuntime.getService as any).mockReturnValue(service);
      
      await BitcoinNetworkService.stop(mockRuntime);
      expect(mockRuntime.getService).toHaveBeenCalledWith('bitcoin-network');
    });
  });

  describe('Data Fetching', () => {
    it('should fetch Bitcoin price data successfully', async () => {
      const mockResponse = {
        bitcoin: {
          usd: 50000,
          usd_24h_change: 2.5
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service['fetchBitcoinPriceData']();
      
      expect(result).toEqual({
        usd: 50000,
        change24h: 2.5
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
        { timeout: 10000 }
      );
    });

    it('should handle Bitcoin price data fetch failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      const result = await service['fetchBitcoinPriceData']();
      
      expect(result).toBeNull();
    });

    it('should fetch blockchain info data successfully', async () => {
      const mockResponse = {
        hash_rate: 500000000000,
        difficulty: 20000000000,
        latest_height: 800000,
        unconfirmed_count: 15000
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service['fetchBlockchainInfoData']();
      
      expect(result).toEqual({
        hashRate: 500000000000,
        difficulty: 20000000000,
        blockHeight: 800000,
        mempoolSize: 15000
      });
    });

    it('should fetch mempool network data successfully', async () => {
      const mockResponse = {
        count: 15000,
        vsize: 50000000,
        total_fee: 1000000
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service['fetchMempoolNetworkData']();
      
      expect(result).toEqual({
        mempoolSize: 15000,
        mempoolTxs: 15000
      });
    });

    it('should fetch Bitcoin sentiment data successfully', async () => {
      const mockResponse = {
        data: [
          {
            value: '75',
            classification: 'Greed',
            timestamp: '2024-01-01T00:00:00Z'
          }
        ]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service['fetchBitcoinSentimentData']();
      
      expect(result).toEqual({
        fearGreedIndex: 75,
        fearGreedValue: 'Greed'
      });
    });
  });

  describe('Data Updates', () => {
    it('should update comprehensive Bitcoin data successfully', async () => {
      const mockPriceData = { usd: 50000, change24h: 2.5 };
      const mockNetworkData = {
        hashRate: 500000000000,
        difficulty: 20000000000,
        blockHeight: 800000,
        mempoolSize: 15000
      };
      const mockSentimentData = {
        fearGreedIndex: 75,
        fearGreedValue: 'Greed'
      };

      // Mock all fetch calls
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ bitcoin: { usd: 50000, usd_24h_change: 2.5 } }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hash_rate: 500000000000, difficulty: 20000000000, latest_height: 800000, unconfirmed_count: 15000 }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [{ value: '75', classification: 'Greed' }] }) });

      await service['updateBitcoinData']();

      const data = service.getComprehensiveBitcoinData();
      expect(data).toBeDefined();
      expect(data?.price.usd).toBe(50000);
      expect(data?.network.hashRate).toBe(500000000000);
      expect(data?.sentiment.fearGreedIndex).toBe(75);
    });

    it('should handle update failures gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await service['updateBitcoinData']();

      const data = service.getComprehensiveBitcoinData();
      expect(data).toBeDefined();
      // Should have fallback data
      expect(data?.price.usd).toBeNull();
    });
  });

  describe('Public Methods', () => {
    beforeEach(async () => {
      // Setup some test data
      const mockPriceData = { usd: 50000, change24h: 2.5 };
      const mockNetworkData = {
        hashRate: 500000000000,
        difficulty: 20000000000,
        blockHeight: 800000,
        mempoolSize: 15000
      };
      const mockSentimentData = {
        fearGreedIndex: 75,
        fearGreedValue: 'Greed'
      };

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ bitcoin: { usd: 50000, usd_24h_change: 2.5 } }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hash_rate: 500000000000, difficulty: 20000000000, latest_height: 800000, unconfirmed_count: 15000 }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [{ value: '75', classification: 'Greed' }] }) });

      await service['updateBitcoinData']();
    });

    it('should return comprehensive Bitcoin data', () => {
      const data = service.getComprehensiveBitcoinData();
      expect(data).toBeDefined();
      expect(data?.price).toBeDefined();
      expect(data?.network).toBeDefined();
      expect(data?.sentiment).toBeDefined();
      expect(data?.lastUpdated).toBeInstanceOf(Date);
    });

    it('should return network data', () => {
      const data = service.getNetworkData();
      expect(data).toBeDefined();
      expect(data?.hashRate).toBe(500000000000);
      expect(data?.blockHeight).toBe(800000);
    });

    it('should return sentiment data', () => {
      const data = service.getSentimentData();
      expect(data).toBeDefined();
      expect(data?.fearGreedIndex).toBe(75);
      expect(data?.fearGreedValue).toBe('Greed');
    });

    it('should return price data', () => {
      const data = service.getPriceData();
      expect(data).toBeDefined();
      expect(data?.usd).toBe(50000);
      expect(data?.change24h).toBe(2.5);
    });

    it('should check if data is fresh', () => {
      const isFresh = service.isDataFresh();
      expect(typeof isFresh).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await service['fetchBitcoinPriceData']();
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await service['fetchBitcoinPriceData']();
      expect(result).toBeNull();
    });

    it('should handle malformed JSON responses', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      const result = await service['fetchBitcoinPriceData']();
      expect(result).toBeNull();
    });
  });

  describe('Fallback Data', () => {
    it('should provide fallback network data', () => {
      const fallbackData = service['getFallbackNetworkData']();
      expect(fallbackData).toBeDefined();
      expect(fallbackData.hashRate).toBeNull();
      expect(fallbackData.difficulty).toBeNull();
      expect(fallbackData.blockHeight).toBeNull();
    });
  });

  describe('Utility Methods', () => {
    it('should calculate next halving date correctly', () => {
      const currentHeight = 800000;
      const halvingDate = service['calculateNextHalvingDate'](currentHeight);
      expect(typeof halvingDate).toBe('string');
      expect(halvingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle fetch with timeout', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve({}) };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const response = await service['fetchWithTimeout']('https://example.com', { timeout: 5000 });
      expect(response).toBe(mockResponse);
    });

    it('should handle fetch timeout', async () => {
      (global.fetch as any).mockImplementation(() => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('AbortError')), 100);
      }));

      await expect(service['fetchWithTimeout']('https://example.com', { timeout: 50 }))
        .rejects.toThrow('Request timeout after 50ms');
    });
  });

  describe('Service Lifecycle', () => {
    it('should start and stop correctly', async () => {
      await service.start();
      expect(service['updateInterval']).toBeDefined();

      await service.stop();
      expect(service['updateInterval']).toBeNull();
    });

    it('should handle force update', async () => {
      const mockPriceData = { usd: 50000, change24h: 2.5 };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bitcoin: { usd: 50000, usd_24h_change: 2.5 } })
      });

      await service.forceUpdate();
      
      const data = service.getPriceData();
      expect(data?.usd).toBe(50000);
    });
  });
}); 