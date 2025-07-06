import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SocialSentimentService } from '../../services/SocialSentimentService';
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

describe('SocialSentimentService', () => {
  let service: SocialSentimentService;
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
        'services.socialSentiment.updateInterval': 300000,
        'apis.twitter.apiKey': 'test-twitter-key',
        'apis.telegram.apiKey': 'test-telegram-key',
        'apis.discord.apiKey': 'test-discord-key'
      };
      return configMap[path] || defaultValue;
    });

    service = new SocialSentimentService(mockRuntime);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct service type', () => {
      expect(SocialSentimentService.serviceType).toBe('social-sentiment');
    });

    it('should have correct capability description', () => {
      expect(service.capabilityDescription).toContain('social media sentiment');
    });

    it('should initialize with dependencies', () => {
      expect(mockRuntime.getService).toHaveBeenCalledWith('centralized-config');
      expect(mockRuntime.getService).toHaveBeenCalledWith('comprehensive-error-handler');
    });

    it('should have correct social platforms', () => {
      const platforms = (service as any).socialPlatforms;
      expect(platforms).toHaveLength(3);
      expect(platforms[0].name).toBe('Twitter');
      expect(platforms[0].enabled).toBe(true);
    });
  });

  describe('Static Methods', () => {
    it('should start service correctly', async () => {
      const startSpy = vi.spyOn(service, 'init');
      
      await SocialSentimentService.start(mockRuntime);
      
      expect(startSpy).toHaveBeenCalled();
    });

    it('should stop service correctly', async () => {
      mockRuntime.getService.mockReturnValue(service);
      const stopSpy = vi.spyOn(service, 'stop');
      
      await SocialSentimentService.stop(mockRuntime);
      
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
    it('should update social sentiment data successfully', async () => {
      const updateSentimentSpy = vi.spyOn(service as any, 'updateSocialSentiment');
      
      await service.updateData();
      
      expect(updateSentimentSpy).toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      const error = new Error('Update failed');
      vi.spyOn(service as any, 'updateSocialSentiment').mockRejectedValue(error);
      
      await service.updateData();
      
      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        { component: 'SocialSentimentService', operation: 'updateData' }
      );
    });

    it('should force update data', async () => {
      const updateDataSpy = vi.spyOn(service, 'updateData');
      
      await service.forceUpdate();
      
      expect(updateDataSpy).toHaveBeenCalled();
    });
  });

  describe('Social Media Integration', () => {
    it('should fetch Twitter sentiment successfully', async () => {
      const mockTweets = [
        { text: 'Bitcoin is amazing! 🚀', sentiment: 0.8 },
        { text: 'Bitcoin will moon soon', sentiment: 0.6 }
      ];

      const { default: axios } = await import('axios');
      (axios.get as any).mockResolvedValue({
        data: { tweets: mockTweets }
      });

      const result = await (service as any).fetchTwitterSentiment('BTC');
      
      expect(result).toBeDefined();
      expect(result.platform).toBe('Twitter');
      expect(result.symbol).toBe('BTC');
      expect(result.sentiment).toBeGreaterThan(0);
    });

    it('should handle Twitter API key missing', async () => {
      mockConfigService.get.mockReturnValue(''); // No API key
      
      const result = await (service as any).fetchTwitterSentiment('BTC');
      
      expect(result).toBeDefined();
      expect(result.platform).toBe('Twitter');
      expect(result.sentiment).toBe(0); // Neutral sentiment
    });

    it('should fetch Telegram sentiment successfully', async () => {
      const mockMessages = [
        { text: 'Bitcoin looking bullish', sentiment: 0.7 },
        { text: 'BTC to the moon', sentiment: 0.9 }
      ];

      const { default: axios } = await import('axios');
      (axios.get as any).mockResolvedValue({
        data: { messages: mockMessages }
      });

      const result = await (service as any).fetchTelegramSentiment('BTC');
      
      expect(result).toBeDefined();
      expect(result.platform).toBe('Telegram');
      expect(result.symbol).toBe('BTC');
      expect(result.sentiment).toBeGreaterThan(0);
    });

    it('should fetch Discord sentiment successfully', async () => {
      const mockMessages = [
        { content: 'Bitcoin is the future', sentiment: 0.8 },
        { content: 'HODL Bitcoin', sentiment: 0.6 }
      ];

      const { default: axios } = await import('axios');
      (axios.get as any).mockResolvedValue({
        data: { messages: mockMessages }
      });

      const result = await (service as any).fetchDiscordSentiment('BTC');
      
      expect(result).toBeDefined();
      expect(result.platform).toBe('Discord');
      expect(result.symbol).toBe('BTC');
      expect(result.sentiment).toBeGreaterThan(0);
    });
  });

  describe('Sentiment Analysis', () => {
    it('should analyze positive sentiment correctly', () => {
      const text = 'Bitcoin is amazing and will moon soon! 🚀';
      const result = (service as any).analyzeSentiment(text);
      
      expect(result).toBeGreaterThan(0.5);
    });

    it('should analyze negative sentiment correctly', () => {
      const text = 'Bitcoin is crashing and will go to zero! 😱';
      const result = (service as any).analyzeSentiment(text);
      
      expect(result).toBeLessThan(-0.5);
    });

    it('should analyze neutral sentiment correctly', () => {
      const text = 'Bitcoin price is stable today';
      const result = (service as any).analyzeSentiment(text);
      
      expect(result).toBeGreaterThan(-0.3);
      expect(result).toBeLessThan(0.3);
    });

    it('should handle emojis in sentiment analysis', () => {
      const bullishText = 'Bitcoin 🚀🚀🚀 to the moon!';
      const bearishText = 'Bitcoin 📉📉📉 going down!';
      
      const bullishResult = (service as any).analyzeSentiment(bullishText);
      const bearishResult = (service as any).analyzeSentiment(bearishText);
      
      expect(bullishResult).toBeGreaterThan(bearishResult);
    });

    it('should handle crypto-specific terminology', () => {
      const hodlText = 'HODL Bitcoin! Diamond hands! 💎🙌';
      const fudText = 'FUD everywhere, Bitcoin is dead!';
      
      const hodlResult = (service as any).analyzeSentiment(hodlText);
      const fudResult = (service as any).analyzeSentiment(fudText);
      
      expect(hodlResult).toBeGreaterThan(fudResult);
    });
  });

  describe('Trending Keywords Extraction', () => {
    it('should extract trending keywords correctly', () => {
      const messages = [
        'Bitcoin is going to the moon! 🚀',
        'HODL Bitcoin, diamond hands! 💎🙌',
        'Bitcoin will reach $100k soon',
        'BTC is the future of money'
      ];
      
      const result = (service as any).extractTrendingKeywords(messages);
      
      expect(result).toContain('bitcoin');
      expect(result).toContain('btc');
      expect(result).toContain('moon');
      expect(result).toContain('hodl');
    });

    it('should filter out common words', () => {
      const messages = [
        'The Bitcoin price is going up',
        'I think Bitcoin will moon',
        'Bitcoin is the best cryptocurrency'
      ];
      
      const result = (service as any).extractTrendingKeywords(messages);
      
      expect(result).not.toContain('the');
      expect(result).not.toContain('is');
      expect(result).not.toContain('going');
    });

    it('should handle empty messages', () => {
      const result = (service as any).extractTrendingKeywords([]);
      
      expect(result).toHaveLength(0);
    });

    it('should limit keywords to top results', () => {
      const messages = Array(100).fill(null).map((_, i) => `Keyword${i} Bitcoin`);
      
      const result = (service as any).extractTrendingKeywords(messages);
      
      expect(result.length).toBeLessThanOrEqual(20); // Limited to top 20
    });
  });

  describe('Mention Counting', () => {
    it('should count mentions correctly', () => {
      const messages = [
        'Bitcoin is amazing',
        'BTC to the moon',
        'Bitcoin will reach new highs',
        'I love Bitcoin',
        'Bitcoin is the future'
      ];
      
      const result = (service as any).countMentions(messages, ['bitcoin', 'btc']);
      
      expect(result).toBe(5);
    });

    it('should handle case insensitive mentions', () => {
      const messages = [
        'Bitcoin is great',
        'bitcoin will moon',
        'BTC is amazing',
        'btc to the moon'
      ];
      
      const result = (service as any).countMentions(messages, ['bitcoin', 'btc']);
      
      expect(result).toBe(4);
    });

    it('should handle multiple symbols', () => {
      const messages = [
        'Bitcoin and Ethereum are great',
        'BTC and ETH to the moon',
        'I love both Bitcoin and ETH'
      ];
      
      const result = (service as any).countMentions(messages, ['bitcoin', 'btc', 'ethereum', 'eth']);
      
      expect(result).toBe(6);
    });
  });

  describe('Aggregate Sentiment Calculation', () => {
    it('should calculate aggregate sentiment correctly', () => {
      const sentiments = [0.8, 0.6, -0.2, 0.4, -0.1];
      
      const result = (service as any).calculateAggregateSentiment(sentiments);
      
      expect(result).toBeCloseTo(0.3, 1); // Average of sentiments
    });

    it('should handle empty sentiments array', () => {
      const result = (service as any).calculateAggregateSentiment([]);
      
      expect(result).toBe(0);
    });

    it('should handle extreme sentiments', () => {
      const sentiments = [1.0, -1.0, 0.9, -0.9];
      
      const result = (service as any).calculateAggregateSentiment(sentiments);
      
      expect(result).toBeCloseTo(0, 1); // Should average to near zero
    });
  });

  describe('Sentiment Summary Calculation', () => {
    it('should calculate sentiment summary correctly', () => {
      const socialSentiment = [
        { platform: 'Twitter', sentiment: 0.8, mentions: 1000 },
        { platform: 'Telegram', sentiment: 0.6, mentions: 500 },
        { platform: 'Discord', sentiment: -0.2, mentions: 200 }
      ];
      
      const result = (service as any).calculateSentimentSummary(socialSentiment);
      
      expect(result.totalMentions).toBe(1700);
      expect(result.averageSentiment).toBeCloseTo(0.4, 1);
      expect(result.mostPositivePlatform).toBe('Twitter');
      expect(result.mostNegativePlatform).toBe('Discord');
      expect(result.trendingKeywords).toBeDefined();
    });

    it('should handle empty sentiment data', () => {
      const result = (service as any).calculateSentimentSummary([]);
      
      expect(result.totalMentions).toBe(0);
      expect(result.averageSentiment).toBe(0);
      expect(result.mostPositivePlatform).toBe('None');
      expect(result.mostNegativePlatform).toBe('None');
    });
  });

  describe('Public API Methods', () => {
    beforeEach(() => {
      (service as any).socialSentiment = [
        { platform: 'Twitter', sentiment: 0.8, mentions: 1000, symbol: 'BTC' },
        { platform: 'Telegram', sentiment: 0.6, mentions: 500, symbol: 'BTC' }
      ];
      (service as any).sentimentSummary = {
        totalMentions: 1500,
        averageSentiment: 0.7,
        mostPositivePlatform: 'Twitter',
        mostNegativePlatform: 'None',
        trendingKeywords: ['bitcoin', 'moon', 'hodl'],
        lastUpdated: new Date()
      };
    });

    it('should get all social sentiment data', () => {
      const result = service.getSocialSentiment();
      
      expect(result).toHaveLength(2);
      expect(result[0].platform).toBe('Twitter');
      expect(result[0].sentiment).toBe(0.8);
    });

    it('should get sentiment summary', () => {
      const result = service.getSentimentSummary();
      
      expect(result).toBeDefined();
      expect(result?.totalMentions).toBe(1500);
      expect(result?.overallSentiment).toBe(0.7);
      expect(result?.platformBreakdown).toBeDefined();
    });

    it('should get sentiment by platform', () => {
      const twitterSentiment = service.getSentimentByPlatform('Twitter');
      const telegramSentiment = service.getSentimentByPlatform('Telegram');
      
      expect(twitterSentiment).toBeDefined();
      expect(Array.isArray(twitterSentiment)).toBe(true);
      expect(telegramSentiment).toBeDefined();
      expect(Array.isArray(telegramSentiment)).toBe(true);
    });

    it('should get sentiment by symbol', () => {
      const btcSentiment = service.getSentimentBySymbol('BTC');
      
      expect(btcSentiment).toHaveLength(2);
      expect(btcSentiment[0].symbol).toBe('BTC');
    });

    it('should get sentiment summary trending keywords', () => {
      const result = service.getSentimentSummary();
      
      expect(result?.trendingKeywords).toContain('bitcoin');
      expect(result?.trendingKeywords).toContain('moon');
      expect(result?.trendingKeywords).toContain('hodl');
    });

    it('should get service statistics', () => {
      const result = service.getStats();
      
      expect(result).toBeDefined();
      expect(result.totalMentions).toBe(1500);
      expect(result.overallSentiment).toBe(0.7);
      expect(result.totalRecords).toBe(2);
      expect(result.platformsCount).toBe(2);
      expect(result.symbolsCount).toBe(1);
    });
  });

  describe('Fallback Data', () => {
    it('should provide fallback social sentiment data', () => {
      const result = (service as any).getFallbackSocialSentiment();
      
      expect(result).toHaveLength(3); // Twitter, Telegram, Discord
      expect(result[0].platform).toBe('Twitter');
      expect(result[0].sentiment).toBe(0);
      expect(result[0].mentions).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      vi.spyOn(service as any, 'fetchSocialSentiment').mockRejectedValue(error);
      
      await (service as any).updateSocialSentiment();
      
      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        { component: 'SocialSentimentService', operation: 'updateSocialSentiment' }
      );
    });

    it('should handle individual platform fetch errors', async () => {
      const error = new Error('Twitter API failed');
      const { default: axios } = await import('axios');
      (axios.get as any).mockRejectedValue(error);
      
      const result = await (service as any).fetchTwitterSentiment('BTC');
      
      expect(result).toBeDefined();
      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        { component: 'SocialSentimentService', operation: 'fetchTwitterSentiment' }
      );
    });

    it('should handle sentiment analysis errors', () => {
      const invalidText = null;
      
      const result = (service as any).analyzeSentiment(invalidText);
      
      expect(result).toBe(0); // Default to neutral
    });
  });

  describe('Configuration Integration', () => {
    it('should use centralized configuration for API keys', () => {
      (service as any).fetchTwitterSentiment('BTC');
      
      expect(mockConfigService.get).toHaveBeenCalledWith('apis.twitter.apiKey', '');
    });

    it('should use centralized configuration for update intervals', () => {
      (service as any).startRealTimeUpdates();
      
      expect(mockConfigService.get).toHaveBeenCalledWith('services.socialSentiment.updateInterval', 300000);
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
      
      expect(mockConfigService.get).toHaveBeenCalledWith('services.socialSentiment.updateInterval', 300000);
    });

    it('should handle large message volumes', () => {
      const largeMessages = Array(10000).fill(null).map((_, i) => `Message ${i} Bitcoin`);
      
      const result = (service as any).extractTrendingKeywords(largeMessages);
      
      expect(result.length).toBeLessThanOrEqual(20); // Limited to prevent performance issues
    });
  });
}); 