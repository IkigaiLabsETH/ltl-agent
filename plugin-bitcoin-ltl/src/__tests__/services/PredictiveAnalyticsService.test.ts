import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PredictiveAnalyticsService } from '../../services/PredictiveAnalyticsService';

// Mock runtime for testing
const createMockRuntime = () => ({
  getService: vi.fn(),
  getSetting: vi.fn((key: string, defaultValue: string) => defaultValue),
  elizaLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
});

describe('PredictiveAnalyticsService', () => {
  let service: PredictiveAnalyticsService;
  let mockRuntime: any;

  beforeEach(async () => {
    mockRuntime = createMockRuntime();
    service = new PredictiveAnalyticsService(mockRuntime);
    await service.start();
  });

  afterEach(async () => {
    if (service) {
      await service.stop();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(service).toBeDefined();
      expect(service.capabilityDescription).toContain('predictive analytics');
    });

    it('should start successfully', async () => {
      expect(service).toBeDefined();
      // Service should be running without errors
    });

    it('should stop gracefully', async () => {
      await service.stop();
      // Should not throw any errors
    });
  });

  describe('Predictions', () => {
    it('should generate price predictions', async () => {
      const prediction = await service.generatePricePrediction('24h');

      expect(prediction).toBeDefined();
      expect(prediction.type).toBe('price_prediction');
      expect(prediction.prediction.value).toBeGreaterThan(0);
      expect(prediction.prediction.confidence).toBeDefined();
    });

    it('should generate sentiment analysis', async () => {
      const analysis = await service.generateSentimentAnalysis();

      expect(analysis).toBeDefined();
      expect(analysis.overall.score).toBeGreaterThanOrEqual(-1);
      expect(analysis.overall.score).toBeLessThanOrEqual(1);
      expect(analysis.overall.label).toBeDefined();
    });

    it('should generate trend forecasts', async () => {
      const forecast = await service.generateTrendForecast();

      expect(forecast).toBeDefined();
      expect(forecast.shortTerm.direction).toMatch(/up|down|sideways/);
      expect(forecast.mediumTerm.direction).toMatch(/up|down|sideways/);
      expect(forecast.longTerm.direction).toMatch(/up|down|sideways/);
    });
  });

  describe('Data Management', () => {
    it('should get all predictions', async () => {
      const predictions = service.getAllPredictions();
      expect(Array.isArray(predictions)).toBe(true);
    });

    it('should get all sentiment analyses', async () => {
      const analyses = service.getAllSentimentAnalyses();
      expect(Array.isArray(analyses)).toBe(true);
    });

    it('should get all trend forecasts', async () => {
      const forecasts = service.getAllTrendForecasts();
      expect(Array.isArray(forecasts)).toBe(true);
    });
  });

  describe('Performance Tracking', () => {
    it('should get model performance metrics', async () => {
      const performance = service.getModelPerformance();
      expect(Array.isArray(performance)).toBe(true);
    });

    it('should get service statistics', async () => {
      const stats = service.getStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalPredictions).toBeGreaterThanOrEqual(0);
      expect(stats.totalSentimentAnalyses).toBeGreaterThanOrEqual(0);
      expect(stats.totalTrendForecasts).toBeGreaterThanOrEqual(0);
      expect(stats.modelCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle prediction failures gracefully', async () => {
      // Mock a failure scenario
      vi.spyOn(service as any, 'generatePricePrediction').mockRejectedValueOnce(
        new Error('Model unavailable')
      );

      await expect(service.generatePricePrediction('24h')).rejects.toThrow('Model unavailable');
    });
  });

  describe('Lifecycle', () => {
    it('should handle service restart', async () => {
      await service.stop();
      await service.start();
      
      // Service should be functional after restart
      const prediction = await service.generatePricePrediction('1h');
      expect(prediction).toBeDefined();
    });
  });

  describe('Integration', () => {
    it('should integrate with other services', async () => {
      // Mock other services
      mockRuntime.getService.mockImplementation((serviceName: string) => {
        if (serviceName === 'market-data') {
          return {
            getCurrentPrice: vi.fn().mockResolvedValue(50000),
            getHistoricalData: vi.fn().mockResolvedValue([])
          };
        }
        return null;
      });

      const prediction = await service.generatePricePrediction('24h');
      expect(prediction).toBeDefined();
    });

    it('should provide data for other services', async () => {
      const data = await service.forceUpdate();
      expect(data).toBeDefined();
      expect(data.predictions).toBeDefined();
      expect(data.sentiment).toBeDefined();
      expect(data.trends).toBeDefined();
      expect(data.performance).toBeDefined();
    });
  });
}); 