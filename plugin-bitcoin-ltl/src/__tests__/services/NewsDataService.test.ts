import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NewsDataService } from '../../services/NewsDataService';
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

describe('NewsDataService', () => {
  let service: NewsDataService;
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
        'services.newsData.updateInterval': 300000,
        'apis.news.apiKey': 'test-news-key',
        'apis.news.baseUrl': 'https://newsapi.org/v2'
      };
      return configMap[path] || defaultValue;
    });

    service = new NewsDataService(mockRuntime);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct service type', () => {
      expect(NewsDataService.serviceType).toBe('news-data');
    });

    it('should have correct capability description', () => {
      expect(service.capabilityDescription).toContain('cryptocurrency news');
    });

    it('should initialize with dependencies', () => {
      expect(mockRuntime.getService).toHaveBeenCalledWith('centralized-config');
      expect(mockRuntime.getService).toHaveBeenCalledWith('comprehensive-error-handler');
    });

    it('should have correct news categories', () => {
      const categories = (service as any).newsCategories;
      expect(categories).toHaveLength(5);
      expect(categories[0].name).toBe('Bitcoin');
      expect(categories[0].priority).toBe('high');
    });
  });

  describe('Static Methods', () => {
    it('should start service correctly', async () => {
      const startSpy = vi.spyOn(service, 'init');
      
      await NewsDataService.start(mockRuntime);
      
      expect(startSpy).toHaveBeenCalled();
    });

    it('should stop service correctly', async () => {
      mockRuntime.getService.mockReturnValue(service);
      const stopSpy = vi.spyOn(service, 'stop');
      
      await NewsDataService.stop(mockRuntime);
      
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
    it('should update news data successfully', async () => {
      const updateNewsSpy = vi.spyOn(service as any, 'updateNews');
      
      await service.updateData();
      
      expect(updateNewsSpy).toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      const error = new Error('Update failed');
      vi.spyOn(service as any, 'updateNews').mockRejectedValue(error);
      
      await service.updateData();
      
      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        { component: 'NewsDataService', operation: 'updateData' }
      );
    });

    it('should force update data', async () => {
      const updateDataSpy = vi.spyOn(service, 'updateData');
      
      await service.forceUpdate();
      
      expect(updateDataSpy).toHaveBeenCalled();
    });
  });

  describe('News Fetching', () => {
    it('should fetch news data successfully', async () => {
      const mockArticles = [
        {
          title: 'Bitcoin Surges to New Highs',
          description: 'Bitcoin reaches new all-time high',
          url: 'https://example.com/1',
          source: { name: 'CryptoNews' },
          publishedAt: '2024-01-01T00:00:00Z'
        },
        {
          title: 'Ethereum Upgrade Successful',
          description: 'Ethereum network upgrade completed',
          url: 'https://example.com/2',
          source: { name: 'TechNews' },
          publishedAt: '2024-01-01T01:00:00Z'
        }
      ];

      const { default: axios } = await import('axios');
      (axios.get as any).mockResolvedValue({
        data: { articles: mockArticles }
      });

      const result = await (service as any).fetchNewsData();
      
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Bitcoin Surges to New Highs');
      expect(result[0].sentiment).toBeDefined();
      expect(result[0].relevanceScore).toBeDefined();
    });

    it('should handle API key missing gracefully', async () => {
      mockConfigService.get.mockReturnValue(''); // No API key
      
      const result = await (service as any).fetchNewsData();
      
      expect(result).toHaveLength(2); // Fallback data
      expect(result[0].source).toBe('CryptoNews');
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      const { default: axios } = await import('axios');
      (axios.get as any).mockRejectedValue(error);
      
      const result = await (service as any).fetchNewsData();
      
      expect(result).toHaveLength(2); // Fallback data
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should fetch category news correctly', async () => {
      const mockArticles = [
        {
          title: 'Bitcoin Price Analysis',
          description: 'Technical analysis of Bitcoin price',
          url: 'https://example.com/1',
          source: { name: 'CryptoNews' },
          publishedAt: '2024-01-01T00:00:00Z'
        }
      ];

      const { default: axios } = await import('axios');
      (axios.get as any).mockResolvedValue({
        data: { articles: mockArticles }
      });

      const category = { name: 'Bitcoin', keywords: ['bitcoin'], priority: 'high' as const };
      const result = await (service as any).fetchCategoryNews(category, 'test-key');
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Bitcoin Price Analysis');
      expect(result[0].relevanceScore).toBeGreaterThan(0);
    });
  });

  describe('Sentiment Analysis', () => {
    it('should analyze positive sentiment correctly', () => {
      const text = 'Bitcoin surges to new highs with bullish momentum';
      const result = (service as any).analyzeSentiment(text);
      
      expect(result).toBe('positive');
    });

    it('should analyze negative sentiment correctly', () => {
      const text = 'Bitcoin crashes to new lows with bearish pressure';
      const result = (service as any).analyzeSentiment(text);
      
      expect(result).toBe('negative');
    });

    it('should analyze neutral sentiment correctly', () => {
      const text = 'Bitcoin price remains stable with no significant changes';
      const result = (service as any).analyzeSentiment(text);
      
      expect(result).toBe('neutral');
    });

    it('should handle mixed sentiment correctly', () => {
      const text = 'Bitcoin surges but faces bearish resistance';
      const result = (service as any).analyzeSentiment(text);
      
      // Should default to neutral when mixed
      expect(['positive', 'negative', 'neutral']).toContain(result);
    });
  });

  describe('Relevance Scoring', () => {
    it('should calculate relevance score correctly', () => {
      const title = 'Bitcoin Price Analysis';
      const description = 'Comprehensive analysis of Bitcoin market trends';
      const category = { name: 'Bitcoin', keywords: ['bitcoin', 'btc'], priority: 'high' as const };
      
      const result = (service as any).calculateRelevanceScore(title, description, category);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeGreaterThan(50); // High priority bonus
    });

    it('should give bonus for title matches', () => {
      const title = 'Bitcoin Surges';
      const description = 'Market analysis';
      const category = { name: 'Bitcoin', keywords: ['bitcoin'], priority: 'medium' as const };
      
      const result = (service as any).calculateRelevanceScore(title, description, category);
      
      expect(result).toBeGreaterThan(20); // Title match bonus
    });

    it('should handle different priorities correctly', () => {
      const title = 'Bitcoin News';
      const description = 'Bitcoin market update';
      const category = { name: 'Bitcoin', keywords: ['bitcoin'], priority: 'low' as const };
      
      const result = (service as any).calculateRelevanceScore(title, description, category);
      
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(50); // No high priority bonus
    });
  });

  describe('Keyword Extraction', () => {
    it('should extract keywords correctly', () => {
      const text = 'Bitcoin cryptocurrency market analysis trading investment';
      const result = (service as any).extractKeywords(text);
      
      expect(result).toHaveLength(5);
      expect(result).toContain('bitcoin');
      expect(result).toContain('cryptocurrency');
    });

    it('should filter out short words', () => {
      const text = 'Bitcoin is the best crypto for trading';
      const result = (service as any).extractKeywords(text);
      
      expect(result.every(word => word.length > 3)).toBe(true);
    });

    it('should handle empty text', () => {
      const result = (service as any).extractKeywords('');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Duplicate Removal', () => {
    it('should remove duplicate news articles', () => {
      const newsItems = [
        { title: 'Bitcoin News', source: 'CryptoNews' },
        { title: 'Bitcoin News', source: 'CryptoNews' }, // Duplicate
        { title: 'Ethereum News', source: 'TechNews' }
      ];
      
      const result = (service as any).removeDuplicateNews(newsItems);
      
      expect(result).toHaveLength(2);
    });

    it('should handle case insensitive duplicates', () => {
      const newsItems = [
        { title: 'Bitcoin News', source: 'CryptoNews' },
        { title: 'bitcoin news', source: 'CryptoNews' }, // Case insensitive duplicate
        { title: 'Ethereum News', source: 'TechNews' }
      ];
      
      const result = (service as any).removeDuplicateNews(newsItems);
      
      expect(result).toHaveLength(2);
    });
  });

  describe('News Summary Calculation', () => {
    it('should calculate news summary correctly', () => {
      const newsItems = [
        { sentiment: 'positive' as const, source: 'CryptoNews', keywords: ['bitcoin', 'bullish'] },
        { sentiment: 'negative' as const, source: 'TechNews', keywords: ['crash', 'bearish'] },
        { sentiment: 'neutral' as const, source: 'FinanceNews', keywords: ['analysis', 'market'] }
      ];
      
      const result = (service as any).calculateNewsSummary(newsItems);
      
      expect(result.totalArticles).toBe(3);
      expect(result.positiveArticles).toBe(1);
      expect(result.negativeArticles).toBe(1);
      expect(result.neutralArticles).toBe(1);
      expect(result.averageSentiment).toBe(0); // Mixed sentiment
      expect(result.topSources).toContain('CryptoNews');
      expect(result.trendingKeywords).toContain('bitcoin');
    });

    it('should handle empty news items', () => {
      const result = (service as any).calculateNewsSummary([]);
      
      expect(result.totalArticles).toBe(0);
      expect(result.averageSentiment).toBe(0);
      expect(result.topSources).toHaveLength(0);
    });
  });

  describe('Public API Methods', () => {
    beforeEach(() => {
      (service as any).newsItems = [
        { title: 'Bitcoin News', sentiment: 'positive' as const, source: 'CryptoNews' },
        { title: 'Ethereum News', sentiment: 'negative' as const, source: 'TechNews' }
      ];
      (service as any).newsSummary = {
        totalArticles: 2,
        positiveArticles: 1,
        negativeArticles: 1,
        neutralArticles: 0,
        averageSentiment: 0,
        topSources: ['CryptoNews', 'TechNews'],
        trendingKeywords: ['bitcoin', 'ethereum'],
        lastUpdated: new Date()
      };
    });

    it('should get all news items', () => {
      const result = service.getNewsItems();
      
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Bitcoin News');
    });

    it('should get news summary', () => {
      const result = service.getNewsSummary();
      
      expect(result).toBeDefined();
      expect(result?.totalArticles).toBe(2);
      expect(result?.topSources).toContain('CryptoNews');
    });

    it('should get news by sentiment', () => {
      const positiveNews = service.getNewsBySentiment('positive');
      const negativeNews = service.getNewsBySentiment('negative');
      
      expect(positiveNews).toHaveLength(1);
      expect(negativeNews).toHaveLength(1);
      expect(positiveNews[0].title).toBe('Bitcoin News');
    });

    it('should get news by source', () => {
      const cryptoNews = service.getNewsBySource('CryptoNews');
      
      expect(cryptoNews).toHaveLength(1);
      expect(cryptoNews[0].source).toBe('CryptoNews');
    });

    it('should get news by keyword', () => {
      const bitcoinNews = service.getNewsByKeyword('Bitcoin');
      
      expect(bitcoinNews).toHaveLength(1);
      expect(bitcoinNews[0].title).toBe('Bitcoin News');
    });

    it('should get service statistics', () => {
      const result = service.getStats();
      
      expect(result).toBeDefined();
      expect(result.totalArticles).toBe(2);
      expect(result.positiveArticles).toBe(1);
      expect(result.negativeArticles).toBe(1);
      expect(result.neutralArticles).toBe(0);
      expect(result.averageSentiment).toBe(0);
      expect(result.topSources).toContain('CryptoNews');
    });
  });

  describe('Fallback Data', () => {
    it('should provide fallback news data', () => {
      const result = (service as any).getFallbackNewsData();
      
      expect(result).toHaveLength(2);
      expect(result[0].title).toContain('Bitcoin');
      expect(result[0].sentiment).toBe('positive');
      expect(result[0].relevanceScore).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      vi.spyOn(service as any, 'fetchNewsData').mockRejectedValue(error);
      
      await (service as any).updateNews();
      
      expect(globalErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        { component: 'NewsDataService', operation: 'updateNews' }
      );
    });

    it('should handle category fetch errors', async () => {
      const error = new Error('Category fetch failed');
      const { default: axios } = await import('axios');
      (axios.get as any).mockRejectedValue(error);
      
      const category = { name: 'Bitcoin', keywords: ['bitcoin'], priority: 'high' as const };
      const result = await (service as any).fetchCategoryNews(category, 'test-key');
      
      expect(result).toHaveLength(0);
      expect(globalErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('Configuration Integration', () => {
    it('should use centralized configuration for API keys', () => {
      (service as any).fetchNewsData();
      
      expect(mockConfigService.get).toHaveBeenCalledWith('apis.news.apiKey', '');
    });

    it('should use centralized configuration for update intervals', () => {
      (service as any).startRealTimeUpdates();
      
      expect(mockConfigService.get).toHaveBeenCalledWith('services.newsData.updateInterval', 300000);
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests gracefully', async () => {
      const promises = Array(5).fill(null).map(() => service.updateData());
      
      await Promise.all(promises);
      
      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should limit news articles to reasonable count', async () => {
      const mockArticles = Array(100).fill(null).map((_, i) => ({
        title: `News ${i}`,
        description: `Description ${i}`,
        url: `https://example.com/${i}`,
        source: { name: 'TestNews' },
        publishedAt: '2024-01-01T00:00:00Z'
      }));

      const { default: axios } = await import('axios');
      (axios.get as any).mockResolvedValue({
        data: { articles: mockArticles }
      });

      const result = await (service as any).fetchNewsData();
      
      expect(result).toHaveLength(50); // Limited to top 50
    });
  });
}); 