import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BTCPerformanceService } from '../services/btc-performance.service';
import { 
  calculateBTCRelativePerformance,
  calculateVolatility,
  calculateCorrelation,
  rankAssetsByPerformance,
  aggregateAssetClassPerformance,
  generateMarketIntelligence,
  generateNarrative
} from '../utils/btc-performance.utils';
import type { 
  BTCRelativePerformance,
  AssetClass,
  KeyAsset,
  HistoricalPerformance,
  BenchmarkResponse
} from '../types/btc-performance.types';

// Mock the dependencies
vi.mock('../services/bitcoin-intelligence.service');
vi.mock('../services/stock-data.service');
vi.mock('../services/altcoin-data.service');
vi.mock('../services/commodity-data.service');
vi.mock('../services/index-data.service');

describe('BTC Performance Utilities', () => {
  describe('calculateBTCRelativePerformance', () => {
    it('should calculate BTC-relative performance correctly', () => {
      const assetPrice = 100;
      const btcPrice = 50000;
      const assetPrice24h = 95;
      const btcPrice24h = 48000;

      const result = calculateBTCRelativePerformance(
        assetPrice,
        btcPrice,
        assetPrice24h,
        btcPrice24h
      );

      expect(result.assetReturn).toBeCloseTo(5.26, 2);
      expect(result.btcReturn).toBeCloseTo(4.17, 2);
      expect(result.relativePerformance).toBeCloseTo(1.09, 2);
      expect(result.outperformance).toBeCloseTo(1.09, 2);
    });

    it('should handle negative returns correctly', () => {
      const assetPrice = 90;
      const btcPrice = 48000;
      const assetPrice24h = 100;
      const btcPrice24h = 50000;

      const result = calculateBTCRelativePerformance(
        assetPrice,
        btcPrice,
        assetPrice24h,
        btcPrice24h
      );

      expect(result.assetReturn).toBeCloseTo(-10, 2);
      expect(result.btcReturn).toBeCloseTo(-4, 2);
      expect(result.relativePerformance).toBeCloseTo(-6.25, 2);
      expect(result.outperformance).toBeCloseTo(-6.25, 2);
    });
  });

  describe('calculateVolatility', () => {
    it('should calculate volatility correctly', () => {
      const prices = [100, 105, 98, 110, 102];
      const result = calculateVolatility(prices);
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    it('should handle single price point', () => {
      const prices = [100];
      const result = calculateVolatility(prices);
      expect(result).toBe(0);
    });
  });

  describe('calculateCorrelation', () => {
    it('should calculate correlation correctly', () => {
      const assetPrices = [100, 105, 98, 110, 102];
      const btcPrices = [50000, 51000, 49000, 52000, 50500];
      const result = calculateCorrelation(assetPrices, btcPrices);
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('rankAssetsByPerformance', () => {
    it('should rank assets by performance correctly', () => {
      const assets: KeyAsset[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 150, price24h: 140, assetClass: 'STOCK' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 200, price24h: 180, assetClass: 'STOCK' },
        { symbol: 'ETH', name: 'Ethereum', price: 3000, price24h: 2800, assetClass: 'ALTCOIN' }
      ];

      const btcPrice = 50000;
      const btcPrice24h = 48000;

      const result = rankAssetsByPerformance(assets, btcPrice, btcPrice24h);

      expect(result.length).toBe(3);
      expect(result[0].relativePerformance).toBeGreaterThanOrEqual(result[1].relativePerformance);
      expect(result[1].relativePerformance).toBeGreaterThanOrEqual(result[2].relativePerformance);
    });
  });

  describe('aggregateAssetClassPerformance', () => {
    it('should aggregate asset class performance correctly', () => {
      const assets: KeyAsset[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 150, price24h: 140, assetClass: 'STOCK' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 200, price24h: 180, assetClass: 'STOCK' },
        { symbol: 'ETH', name: 'Ethereum', price: 3000, price24h: 2800, assetClass: 'ALTCOIN' }
      ];

      const btcPrice = 50000;
      const btcPrice24h = 48000;

      const result = aggregateAssetClassPerformance(assets, btcPrice, btcPrice24h);

      expect(result.STOCK).toBeDefined();
      expect(result.ALTCOIN).toBeDefined();
      expect(result.STOCK.avgRelativePerformance).toBeGreaterThan(0);
    });
  });

  describe('generateMarketIntelligence', () => {
    it('should generate market intelligence insights', () => {
      const assets: KeyAsset[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 150, price24h: 140, assetClass: 'STOCK' },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 200, price24h: 180, assetClass: 'STOCK' }
      ];

      const btcPrice = 50000;
      const btcPrice24h = 48000;

      const result = generateMarketIntelligence(assets, btcPrice, btcPrice24h);

      expect(result.overallSentiment).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.opportunities).toBeDefined();
      expect(result.risks).toBeDefined();
    });
  });

  describe('generateNarrative', () => {
    it('should generate narrative based on performance data', () => {
      const assets: KeyAsset[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 150, price24h: 140, assetClass: 'STOCK' }
      ];

      const btcPrice = 50000;
      const btcPrice24h = 48000;

      const result = generateNarrative(assets, btcPrice, btcPrice24h);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

describe('BTCPerformanceService', () => {
  let service: BTCPerformanceService;

  beforeEach(() => {
    service = new BTCPerformanceService();
  });

  it('should be instantiated correctly', () => {
    expect(service).toBeInstanceOf(BTCPerformanceService);
  });

  it('should have required methods', () => {
    expect(typeof service.getBTCBenchmark).toBe('function');
    expect(typeof service.getAssetPerformance).toBe('function');
    expect(typeof service.getAssetClassPerformance).toBe('function');
    expect(typeof service.getTopPerformers).toBe('function');
    expect(typeof service.getUnderperformers).toBe('function');
  });
}); 